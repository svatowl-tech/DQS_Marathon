import { DailyLogEntry, UserSettings, WeeklySundayReport } from '../types';
import {
  calculateDailyDQS,
  getInitialDiversity,
  getInitialServings,
} from './dqsEngine';
import { logger } from './logger';

const STORAGE_KEY_SETTINGS = 'dqs_diary_settings_v3';
const STORAGE_KEY_LOGS = 'dqs_diary_logs_v3';
const STORAGE_KEY_REPORTS = 'dqs_diary_reports_v3';
const STORAGE_KEY_BACKUP = 'dqs_diary_auto_backup_v3';

const DB_NAME = 'dqs_nutrition_db_v3';
const DB_VERSION = 1;

// ---------------------------------------------------------------------------
// 1. INDEXEDDB PERSISTENCE ENGINE (Unlimited storage for years of logs & photos)
// ---------------------------------------------------------------------------

let dbInstance: IDBDatabase | null = null;
let isIDBSupported = typeof window !== 'undefined' && 'indexedDB' in window;

// In-Memory Singletons & Cache for Ultra-Stable Session State
let memoryLogsCache: DailyLogEntry[] | null = null;
let memorySettingsCache: UserSettings | null = null;
let memoryReportsCache: WeeklySundayReport[] | null = null;
let isHydratedFlag = false;

export function isAppStorageHydrated(): boolean {
  return isHydratedFlag;
}

if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && dbInstance) {
      try {
        dbInstance.close();
      } catch (e) {
        // Ignore
      }
      dbInstance = null;
    }
  });
}

function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (!isIDBSupported) {
      logger.warn('Storage', 'IndexedDB not supported on this browser or platform');
      reject(new Error('IndexedDB not supported on this device'));
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        logger.info('Storage', 'IndexedDB database upgrade triggered', { version: DB_VERSION });
        const db = request.result;
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('logs')) {
          db.createObjectStore('logs', { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'weekEndDate' });
        }
        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups', { keyPath: 'timestamp' });
        }
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        dbInstance.onclose = () => {
          logger.warn('Storage', 'IndexedDB connection closed unexpectedly, resetting instance handle');
          dbInstance = null;
        };
        dbInstance.onversionchange = () => {
          logger.warn('Storage', 'IndexedDB versionchange triggered, closing connection');
          if (dbInstance) {
            try { dbInstance.close(); } catch (e) {}
            dbInstance = null;
          }
        };
        dbInstance.onerror = (err) => {
          logger.error('Storage', 'IndexedDB handle error', err);
          dbInstance = null;
        };
        logger.info('Storage', 'IndexedDB connection established successfully');
        resolve(dbInstance);
      };

      request.onerror = (e) => {
        logger.error('Storage', 'IndexedDB failed to open, falling back to LocalStorage', { error: request.error });
        dbInstance = null;
        reject(request.error);
      };
    } catch (err) {
      logger.error('Storage', 'IndexedDB initialization error', err);
      dbInstance = null;
      reject(err);
    }
  });
}

async function idbGet<T>(storeName: string, key?: string): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const db = await getDB();
      const result = await new Promise<T | null>((resolve, reject) => {
        try {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = key ? store.get(key) : store.getAll();

          req.onsuccess = () => resolve((req.result as T) || null);
          req.onerror = () => reject(req.error || new Error('IDB get request error'));
          tx.onabort = () => reject(new Error('Transaction aborted'));
          tx.onerror = () => reject(tx.error || new Error('Transaction error'));
        } catch (err) {
          reject(err);
        }
      });
      return result;
    } catch (e) {
      logger.warn('Storage', `idbGet attempt ${attempt + 1} failed, resetting dbInstance`, { error: String(e) });
      dbInstance = null;
      if (attempt === 1) return null;
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  return null;
}

async function idbSet(storeName: string, value: any, key?: string): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const db = await getDB();
      const success = await new Promise<boolean>((resolve, reject) => {
        try {
          const tx = db.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);

          if (Array.isArray(value) && store.keyPath) {
            const clearReq = store.clear();
            clearReq.onsuccess = () => {
              let pending = value.length;
              if (pending === 0) resolve(true);

              for (const item of value) {
                const putReq = store.put(item);
                putReq.onsuccess = () => {
                  pending--;
                  if (pending === 0) resolve(true);
                };
                putReq.onerror = () => {
                  pending--;
                  if (pending === 0) resolve(true);
                };
              }
            };
            clearReq.onerror = () => reject(clearReq.error || new Error('Clear store error'));
          } else {
            const req = key ? store.put(value, key) : store.put(value);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error || new Error('Put store error'));
          }

          tx.onabort = () => reject(new Error('Transaction aborted'));
          tx.onerror = () => reject(tx.error || new Error('Transaction error'));
        } catch (err) {
          reject(err);
        }
      });
      if (success) return true;
    } catch (e) {
      logger.warn('Storage', `idbSet attempt ${attempt + 1} failed, resetting dbInstance`, { error: String(e) });
      dbInstance = null;
      if (attempt === 1) return false;
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// DEFAULT APP SETTINGS & DATA SCHEMAS
// ---------------------------------------------------------------------------

export const DEFAULT_SETTINGS: UserSettings = {
  userName: '',
  programStartDate: '',
  startWeight: 0,
  startMeasurements: {
    chest: undefined,
    waist: undefined,
    hips: undefined,
    thigh: undefined,
    arm: undefined,
  },
  targetDqsGreen: 18,
  theme: 'dark',
  isStarted: false,
  taskRules: [
    {
      id: 't_mon_meas',
      title: '📏 Замеры тела (грудь, талия, бёдра, бедро, бицепс)',
      daysOfWeek: [1], // Monday
      timeOfDay: 'morning',
      type: 'measurement',
    },
    {
      id: 't_mon_weight',
      title: '⚖️ Контрольное утреннее взвешивание недели',
      daysOfWeek: [1], // Monday
      timeOfDay: 'morning',
      type: 'weight',
    },
    {
      id: 't_daily_weight',
      title: '⚖️ Взвешивание и фиксация веса за день',
      daysOfWeek: [0, 2, 3, 4, 5, 6], // Tue-Sun
      timeOfDay: 'morning',
      type: 'weight',
    },
    {
      id: 't_meal_logging',
      title: '📸 Зафиксировать все приёмы пищи в дневнике',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Daily
      timeOfDay: 'anytime',
      type: 'photo_meal',
    },
    {
      id: 't_sun_meas',
      title: '📏 Итоговые замеры тела перед отчетом',
      daysOfWeek: [0], // Sunday
      timeOfDay: 'evening',
      type: 'measurement',
    },
    {
      id: 't_sun_report',
      title: '📋 Сформировать и отправить Воскресный Отчет DQS',
      daysOfWeek: [0], // Sunday
      timeOfDay: 'evening',
      type: 'weekly_report',
    },
  ],
  favoriteMeals: [
    {
      id: 'fav_oatmeal',
      title: '🥣 Овсянка + Ягоды + Орехи',
      mealType: 'breakfast',
      servings: { whole_grains: 1, fruits: 1, nuts_seeds: 1 },
      hungerBefore: 6,
      fullnessAfter: 7,
    },
    {
      id: 'fav_lunch_standard',
      title: '🥗 Курица + Гречка + Салат',
      mealType: 'lunch',
      servings: { lean_proteins: 1, whole_grains: 1, vegetables: 2, oils_fats: 1 },
      hungerBefore: 7,
      fullnessAfter: 8,
    },
    {
      id: 'fav_fish_dinner',
      title: '🐟 Рыба + Овощи гриль',
      mealType: 'dinner',
      servings: { lean_proteins: 1, vegetables: 2, oils_fats: 1 },
      hungerBefore: 6,
      fullnessAfter: 7,
    },
    {
      id: 'fav_apple_snack',
      title: '🍏 Яблоко + Миндаль',
      mealType: 'snack',
      servings: { fruits: 1, nuts_seeds: 1 },
      hungerBefore: 4,
      fullnessAfter: 6,
    },
  ],
};

export function generateSampleData(): DailyLogEntry[] {
  return [];
}

// ---------------------------------------------------------------------------
// 2. SYNCHRONOUS & ASYNCHRONOUS STORAGE ACCESSORS
// ---------------------------------------------------------------------------

// SETTINGS
export function loadSettings(): UserSettings {
  if (memorySettingsCache) {
    return memorySettingsCache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS) || localStorage.getItem('dqs_diary_settings_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const loaded = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          startMeasurements: {
            ...DEFAULT_SETTINGS.startMeasurements,
            ...(parsed.startMeasurements || {}),
          },
          favoriteMeals: Array.isArray(parsed.favoriteMeals) ? parsed.favoriteMeals : DEFAULT_SETTINGS.favoriteMeals,
          taskRules: Array.isArray(parsed.taskRules) ? parsed.taskRules : DEFAULT_SETTINGS.taskRules,
        };
        memorySettingsCache = loaded;
        return loaded;
      }
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  memorySettingsCache = DEFAULT_SETTINGS;
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserSettings): void {
  memorySettingsCache = settings;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('LocalStorage full or restricted on saveSettings', e);
  }
  // Also save asynchronously to IndexedDB
  idbSet('settings', settings, 'userSettings');
}

// DAILY LOGS
export function loadDailyLogs(): DailyLogEntry[] {
  if (memoryLogsCache && memoryLogsCache.length > 0) {
    return memoryLogsCache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS) || localStorage.getItem('dqs_diary_logs_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const initialServings = getInitialServings();
        const initialDiversity = getInitialDiversity();

        const loaded = parsed
          .filter((item) => item && typeof item === 'object' && item.date)
          .map((item: DailyLogEntry) => ({
            ...item,
            servings: { ...initialServings, ...(item.servings || {}) },
            diversity: { ...initialDiversity, ...(item.diversity || {}) },
            workout: item.workout || { done: false, description: '' },
            journal: item.journal || { hungerBefore: 5, fullnessAfter: 7, mood: 'great', note: '' },
            trackers: item.trackers || { waterGlass: 0, coffeeCups: 0, sleepHours: 7 },
            photos: Array.isArray(item.photos) ? item.photos : [],
          }));
        memoryLogsCache = loaded;
        return loaded;
      }
    }
  } catch (e) {
    console.error('Failed to load logs from localStorage', e);
  }
  return memoryLogsCache || [];
}

export function saveDailyLogs(logs: DailyLogEntry[], isExplicitUserReset = false): void {
  // Anti-wipe guard: if logs is empty, but we have cached logs or hydration hasn't run, prevent accidental wipe unless explicitly requested
  if ((!logs || logs.length === 0) && !isExplicitUserReset) {
    if (memoryLogsCache && memoryLogsCache.length > 0) {
      logger.warn('Storage', 'Blocked accidental empty daily logs wipe during state update');
      return;
    }
  }

  memoryLogsCache = logs;

  // Save to IndexedDB first (no 5MB limit)
  idbSet('logs', logs).then((ok) => {
    if (!ok) {
      logger.warn('Storage', 'idbSet failed for daily logs');
    }
  });

  // Also write to LocalStorage with fallback safety if quota permits
  try {
    const jsonStr = JSON.stringify(logs);
    localStorage.setItem(STORAGE_KEY_LOGS, jsonStr);
    logger.debug('Storage', `Saved ${logs.length} daily log entries to LocalStorage`, { bytes: jsonStr.length });
  } catch (e) {
    logger.warn('Storage', 'LocalStorage quota exceeded! Preserving data in IndexedDB', e);
    // If quota exceeded in localStorage, save a stripped lightweight version to LocalStorage without heavy photos
    try {
      const lightweightLogs = logs.map((l) => ({
        ...l,
        photos: Array.isArray(l.photos) ? l.photos.map((p) => ({ ...p, dataUrl: '' })) : [], // preserve photo metadata without base64 blob
      }));
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(lightweightLogs));
    } catch (err) {
      logger.error('Storage', 'Failed to write lightweight logs to LocalStorage', err);
    }
  }
}

// SUNDAY REPORTS
export function loadSundayReports(): WeeklySundayReport[] {
  if (memoryReportsCache && memoryReportsCache.length > 0) {
    return memoryReportsCache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS) || localStorage.getItem('dqs_diary_reports_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const loaded = parsed.filter((r) => r && typeof r === 'object' && r.weekEndDate);
        memoryReportsCache = loaded;
        return loaded;
      }
    }
  } catch (e) {
    console.error('Failed to load reports from localStorage', e);
  }
  return memoryReportsCache || [];
}

export function saveSundayReports(reports: WeeklySundayReport[], isExplicitUserReset = false): void {
  if ((!reports || reports.length === 0) && !isExplicitUserReset) {
    if (memoryReportsCache && memoryReportsCache.length > 0) {
      logger.warn('Storage', 'Blocked accidental empty reports wipe');
      return;
    }
  }
  memoryReportsCache = reports;
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.warn('LocalStorage full on saveSundayReports', e);
  }
  idbSet('reports', reports);
}

// ---------------------------------------------------------------------------
// 3. ASYNCHRONOUS HYDRATION & INITIALIZATION FROM INDEXEDDB
// ---------------------------------------------------------------------------

export async function hydrateFromIndexedDB(): Promise<{
  settings: UserSettings | null;
  logs: DailyLogEntry[] | null;
  reports: WeeklySundayReport[] | null;
}> {
  try {
    const [idbSettings, idbLogs, idbReports] = await Promise.all([
      idbGet<UserSettings>('settings', 'userSettings'),
      idbGet<DailyLogEntry[]>('logs'),
      idbGet<WeeklySundayReport[]>('reports'),
    ]);

    const lsLogs = loadDailyLogs();
    const lsSettings = loadSettings();
    const lsReports = loadSundayReports();

    // Comprehensive multi-source merging by date to ensure NO photos or logs are dropped
    const logMap = new Map<string, DailyLogEntry>();

    // 1. Add LocalStorage logs
    for (const l of lsLogs) {
      if (l && l.date) logMap.set(l.date, l);
    }

    // 2. Add In-Memory cached logs
    if (memoryLogsCache) {
      for (const l of memoryLogsCache) {
        if (l && l.date) logMap.set(l.date, l);
      }
    }

    // 3. Merge IDB logs (prefer entries with photos or more detail)
    if (Array.isArray(idbLogs)) {
      for (const l of idbLogs) {
        if (!l || !l.date) continue;
        const existing = logMap.get(l.date);
        if (!existing) {
          logMap.set(l.date, l);
        } else {
          const existingPhotos = Array.isArray(existing.photos) ? existing.photos.length : 0;
          const idbPhotos = Array.isArray(l.photos) ? l.photos.length : 0;
          // Keep the IDB version if it has equal or more photos or data
          if (idbPhotos >= existingPhotos) {
            logMap.set(l.date, l);
          }
        }
      }
    }

    const mergedLogs = Array.from(logMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    const finalSettings = idbSettings || lsSettings || memorySettingsCache || DEFAULT_SETTINGS;

    const reportMap = new Map<string, WeeklySundayReport>();
    for (const r of lsReports) { if (r && r.weekEndDate) reportMap.set(r.weekEndDate, r); }
    if (memoryReportsCache) { for (const r of memoryReportsCache) { if (r && r.weekEndDate) reportMap.set(r.weekEndDate, r); } }
    if (Array.isArray(idbReports)) { for (const r of idbReports) { if (r && r.weekEndDate) reportMap.set(r.weekEndDate, r); } }
    const mergedReports = Array.from(reportMap.values());

    // Update internal in-memory caches
    memoryLogsCache = mergedLogs;
    memorySettingsCache = finalSettings;
    memoryReportsCache = mergedReports;
    isHydratedFlag = true;

    // Migrate or align persistent stores with the merged truth
    if (mergedLogs.length > 0) {
      await idbSet('logs', mergedLogs);
    }
    if (finalSettings.isStarted) {
      await idbSet('settings', finalSettings, 'userSettings');
    }
    if (mergedReports.length > 0) {
      await idbSet('reports', mergedReports);
    }

    logger.info('Storage', 'Hydration completed safely from persistent storage', {
      totalLogs: mergedLogs.length,
      hasSettings: !!finalSettings,
      totalReports: mergedReports.length,
    });

    return {
      settings: finalSettings,
      logs: mergedLogs,
      reports: mergedReports,
    };
  } catch (err) {
    logger.warn('Storage', 'Hydration from IndexedDB skipped, falling back to LocalStorage', err);
    isHydratedFlag = true;
    return {
      settings: loadSettings(),
      logs: loadDailyLogs(),
      reports: loadSundayReports(),
    };
  }
}

// ---------------------------------------------------------------------------
// 4. BACKUP, EXPORT & RESTORE ENGINE (Phone Memory Backup & Download)
// ---------------------------------------------------------------------------

export interface DQSFullBackup {
  version: string;
  exportDate: string;
  app: string;
  settings: UserSettings;
  logs: DailyLogEntry[];
  reports: WeeklySundayReport[];
  stats: {
    totalDaysLogged: number;
    totalPhotosCount: number;
  };
}

export function exportAllDataToJson(): string {
  const logs = loadDailyLogs();
  const settings = loadSettings();
  const reports = loadSundayReports();

  const totalPhotosCount = logs.reduce((acc, l) => acc + (l.photos?.length || 0), 0);

  const backupObj: DQSFullBackup = {
    version: '3.0',
    app: 'DQS Nutrition Tracker',
    exportDate: new Date().toISOString(),
    settings,
    logs,
    reports,
    stats: {
      totalDaysLogged: logs.length,
      totalPhotosCount,
    },
  };

  return JSON.stringify(backupObj, null, 2);
}

export function downloadBackupFile(): void {
  const jsonStr = exportAllDataToJson();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `DQS_Backup_${dateStr}.json`;

  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importAllDataFromJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') return false;

    if (parsed.settings && typeof parsed.settings === 'object') {
      saveSettings(parsed.settings);
    }
    if (Array.isArray(parsed.logs)) {
      saveDailyLogs(parsed.logs);
    }
    if (Array.isArray(parsed.reports)) {
      saveSundayReports(parsed.reports);
    }
    return true;
  } catch (e) {
    console.error('Import backup failed', e);
    return false;
  }
}

export function getStorageStats(): {
  totalDays: number;
  totalPhotos: number;
  approxSizeMB: string;
  isIndexedDBSupported: boolean;
} {
  const logs = loadDailyLogs();
  const settings = loadSettings();
  const reports = loadSundayReports();

  const totalPhotos = logs.reduce((acc, l) => acc + (l.photos?.length || 0), 0);
  const rawJson = JSON.stringify({ logs, settings, reports });
  const bytes = new Blob([rawJson]).size;
  const mb = (bytes / (1024 * 1024)).toFixed(2);

  return {
    totalDays: logs.length,
    totalPhotos,
    approxSizeMB: mb,
    isIndexedDBSupported: isIDBSupported,
  };
}
