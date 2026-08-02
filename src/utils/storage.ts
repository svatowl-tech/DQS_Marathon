import { DailyLogEntry, UserSettings, WeeklySundayReport } from '../types';
import {
  calculateDailyDQS,
  getInitialDiversity,
  getInitialServings,
  getMondayOfDate,
  getSundayOfDate,
} from './dqsEngine';

const STORAGE_KEY_SETTINGS = 'dqs_diary_settings_v2';
const STORAGE_KEY_LOGS = 'dqs_diary_logs_v2';
const STORAGE_KEY_REPORTS = 'dqs_diary_reports_v2';

// Automatically clear legacy v1 test data from browser storage
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('dqs_diary_settings_v1');
    localStorage.removeItem('dqs_diary_logs_v1');
    localStorage.removeItem('dqs_diary_reports_v1');
  }
} catch (e) {
  // Ignore storage access errors
}

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
      servings: {
        whole_grains: 1,
        fruits: 1,
        nuts_seeds: 1,
      },
      hungerBefore: 6,
      fullnessAfter: 7,
    },
    {
      id: 'fav_lunch_standard',
      title: '🥗 Курица + Гречка + Салат',
      mealType: 'lunch',
      servings: {
        lean_proteins: 1,
        whole_grains: 1,
        vegetables: 2,
        oils_fats: 1,
      },
      hungerBefore: 7,
      fullnessAfter: 8,
    },
    {
      id: 'fav_fish_dinner',
      title: '🐟 Рыба + Овощи гриль',
      mealType: 'dinner',
      servings: {
        lean_proteins: 1,
        vegetables: 2,
        oils_fats: 1,
      },
      hungerBefore: 6,
      fullnessAfter: 7,
    },
    {
      id: 'fav_apple_snack',
      title: '🍏 Яблоко + Миндаль',
      mealType: 'snack',
      servings: {
        fruits: 1,
        nuts_seeds: 1,
      },
      hungerBefore: 4,
      fullnessAfter: 6,
    },
  ],
};

// Return empty array for clean app start
export function generateSampleData(): DailyLogEntry[] {
  return [];
}

// LocalStorage load and save handlers
export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        favoriteMeals: parsed.favoriteMeals || DEFAULT_SETTINGS.favoriteMeals,
        taskRules: parsed.taskRules || DEFAULT_SETTINGS.taskRules,
      };
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function loadDailyLogs(): DailyLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Safe migration for category additions
        const initialServings = getInitialServings();
        const initialDiversity = getInitialDiversity();
        return parsed.map((item: DailyLogEntry) => ({
          ...item,
          servings: { ...initialServings, ...item.servings },
          diversity: { ...initialDiversity, ...item.diversity },
        }));
      }
    }
  } catch (e) {
    console.error('Failed to load logs', e);
  }
  // Return empty array if no logs exist
  return [];
}

export function saveDailyLogs(logs: DailyLogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save logs', e);
  }
}

export function loadSundayReports(): WeeklySundayReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load reports', e);
  }
  return [];
}

export function saveSundayReports(reports: WeeklySundayReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save reports', e);
  }
}

export function exportAllDataToJson(): string {
  const data = {
    settings: loadSettings(),
    logs: loadDailyLogs(),
    reports: loadSundayReports(),
    version: '1.0',
    exportDate: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllDataFromJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.settings) saveSettings(parsed.settings);
    if (Array.isArray(parsed.logs)) saveDailyLogs(parsed.logs);
    if (Array.isArray(parsed.reports)) saveSundayReports(parsed.reports);
    return true;
  } catch (e) {
    console.error('Import failed', e);
    return false;
  }
}
