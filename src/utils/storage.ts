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

function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

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
        logger.info('Storage', 'IndexedDB connection established successfully');
        resolve(dbInstance);
      };

      request.onerror = (e) => {
        logger.error('Storage', 'IndexedDB failed to open, falling back to LocalStorage', { error: request.error });
        reject(request.error);
      };
    } catch (err) {
      logger.error('Storage', 'IndexedDB initialization error', err);
      reject(err);
    }
  });
}

async function idbGet<T>(storeName: string, key?: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = key ? store.get(key) : store.getAll();

      req.onsuccess = () => {
        resolve(req.result as T || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function idbSet(storeName: string, value: any, key?: string): Promise<boolean> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      if (Array.isArray(value) && store.keyPath) {
        // Clear store first, then put all array items
        const clearReq = store.clear();
        clearReq.onsuccess = () => {
          let pending = value.length;
          if (pending === 0) resolve(true);

          for (const item of value) {
            const putReq = store.put(item);
            putReq.onsuccess = putReq.onerror = () => {
              pending--;
              if (pending === 0) resolve(true);
            };
          }
        };
        clearReq.onerror = () => resolve(false);
      } else {
        const req = key ? store.put(value, key) : store.put(value);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      }
    });
  } catch (e) {
    return false;
  }
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS) || localStorage.getItem('dqs_diary_settings_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          startMeasurements: {
            ...DEFAULT_SETTINGS.startMeasurements,
            ...(parsed.startMeasurements || {}),
          },
          favoriteMeals: Array.isArray(parsed.favoriteMeals) ? parsed.favoriteMeals : DEFAULT_SETTINGS.favoriteMeals,
          taskRules: Array.isArray(parsed.taskRules) ? parsed.taskRules : DEFAULT_SETTINGS.taskRules,
        };
      }
    }
  } catch (e) {
    console.error('Failed to load settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserSettings): void {
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
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS) || localStorage.getItem('dqs_diary_logs_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const initialServings = getInitialServings();
        const initialDiversity = getInitialDiversity();

        return parsed
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
      }
    }
  } catch (e) {
    console.error('Failed to load logs from localStorage', e);
  }
  return [];
}

export function saveDailyLogs(logs: DailyLogEntry[]): void {
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
        photos: l.photos.map((p) => ({ ...p, dataUrl: '' })), // preserve photo metadata without base64 blob
      }));
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(lightweightLogs));
    } catch (err) {
      logger.error('Storage', 'Failed to write lightweight logs to LocalStorage', err);
    }
  }
}

// SUNDAY REPORTS
export function loadSundayReports(): WeeklySundayReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS) || localStorage.getItem('dqs_diary_reports_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((r) => r && typeof r === 'object' && r.weekEndDate);
      }
    }
  } catch (e) {
    console.error('Failed to load reports from localStorage', e);
  }
  return [];
}

export function saveSundayReports(reports: WeeklySundayReport[]): void {
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

    // Migrate LocalStorage to IndexedDB if IndexedDB is currently empty
    if ((!idbLogs || idbLogs.length === 0) && lsLogs.length > 0) {
      await idbSet('logs', lsLogs);
      logger.info('Storage', 'Migrated LocalStorage daily logs into IndexedDB');
    }
    if (!idbSettings && lsSettings.isStarted) {
      await idbSet('settings', lsSettings, 'userSettings');
      logger.info('Storage', 'Migrated LocalStorage user settings into IndexedDB');
    }
    if ((!idbReports || idbReports.length === 0) && lsReports.length > 0) {
      await idbSet('reports', lsReports);
      logger.info('Storage', 'Migrated LocalStorage reports into IndexedDB');
    }

    // Determine richest source (IDB vs LocalStorage)
    const finalLogs = (idbLogs && idbLogs.length >= lsLogs.length) ? idbLogs : lsLogs;
    const finalSettings = idbSettings || lsSettings;
    const finalReports = (idbReports && idbReports.length >= lsReports.length) ? idbReports : lsReports;

    logger.info('Storage', 'Hydration completed from persistent storage', {
      totalLogs: finalLogs.length,
      hasSettings: !!finalSettings,
      totalReports: finalReports.length,
    });

    return {
      settings: finalSettings,
      logs: finalLogs,
      reports: finalReports,
    };
  } catch (err) {
    logger.warn('Storage', 'Hydration from IndexedDB skipped, falling back to LocalStorage', err);
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
