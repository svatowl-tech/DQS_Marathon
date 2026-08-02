import { DailyLogEntry, UserSettings, WeeklySundayReport } from '../types';
import {
  calculateDailyDQS,
  getInitialDiversity,
  getInitialServings,
  getMondayOfDate,
  getSundayOfDate,
} from './dqsEngine';

const STORAGE_KEY_SETTINGS = 'dqs_diary_settings_v1';
const STORAGE_KEY_LOGS = 'dqs_diary_logs_v1';
const STORAGE_KEY_REPORTS = 'dqs_diary_reports_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Участник DQS Марафона',
  programStartDate: '2026-08-03',
  startWeight: 72.5,
  startMeasurements: {
    chest: 94,
    waist: 76,
    hips: 101,
    thigh: 58,
    arm: 29,
  },
  targetDqsGreen: 18,
  theme: 'dark',
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

// Default sample log data for initial app launch
export function generateSampleData(): DailyLogEntry[] {
  const dates = [
    '2026-08-03',
    '2026-08-04',
    '2026-08-05',
    '2026-08-06',
    '2026-08-07',
    '2026-08-08',
    '2026-08-09',
  ];

  const sampleServings = [
    {
      vegetables: 3,
      fruits: 2,
      nuts_seeds: 1,
      whole_grains: 2,
      lean_proteins: 2,
      dairy: 1,
      refined_grains: 0,
      sweets: 0,
      processed_meats: 0,
      sugary_drinks_alcohol: 0,
    },
    {
      vegetables: 4,
      fruits: 2,
      nuts_seeds: 1,
      whole_grains: 2,
      lean_proteins: 3,
      dairy: 1,
      refined_grains: 1,
      sweets: 0,
      processed_meats: 0,
      sugary_drinks_alcohol: 0,
    },
    {
      vegetables: 2,
      fruits: 1,
      nuts_seeds: 1,
      whole_grains: 1,
      lean_proteins: 2,
      dairy: 1,
      refined_grains: 1,
      sweets: 1,
      processed_meats: 0,
      sugary_drinks_alcohol: 0,
    },
    {
      vegetables: 4,
      fruits: 3,
      nuts_seeds: 1,
      whole_grains: 2,
      lean_proteins: 2,
      dairy: 2,
      refined_grains: 0,
      sweets: 0,
      processed_meats: 0,
      sugary_drinks_alcohol: 0,
    },
    {
      vegetables: 3,
      fruits: 2,
      nuts_seeds: 2,
      whole_grains: 2,
      lean_proteins: 2,
      dairy: 1,
      refined_grains: 0,
      sweets: 0,
      processed_meats: 0,
      sugary_drinks_alcohol: 0,
    },
    {
      vegetables: 2,
      fruits: 1,
      nuts_seeds: 0,
      whole_grains: 1,
      lean_proteins: 2,
      dairy: 1,
      refined_grains: 2,
      sweets: 2,
      processed_meats: 1,
      sugary_drinks_alcohol: 1,
    },
    {
      vegetables: 3,
      fruits: 2,
      nuts_seeds: 1,
      whole_grains: 2,
      lean_proteins: 2,
      dairy: 1,
      refined_grains: 0,
      sweets: 0,
      processed_meats: 0,
      sugary_drinks_alcohol: 0,
    },
  ];

  const sampleDiversities = [
    { vegetables: true, fruits: true, nuts_seeds: false, whole_grains: false, lean_proteins: true, dairy: false, refined_grains: false, sweets: false, processed_meats: false, sugary_drinks_alcohol: false },
    { vegetables: true, fruits: true, nuts_seeds: false, whole_grains: true, lean_proteins: true, dairy: false, refined_grains: false, sweets: false, processed_meats: false, sugary_drinks_alcohol: false },
    { vegetables: false, fruits: false, nuts_seeds: false, whole_grains: false, lean_proteins: true, dairy: false, refined_grains: false, sweets: false, processed_meats: false, sugary_drinks_alcohol: false },
    { vegetables: true, fruits: true, nuts_seeds: false, whole_grains: true, lean_proteins: true, dairy: true, refined_grains: false, sweets: false, processed_meats: false, sugary_drinks_alcohol: false },
    { vegetables: true, fruits: true, nuts_seeds: true, whole_grains: false, lean_proteins: true, dairy: false, refined_grains: false, sweets: false, processed_meats: false, sugary_drinks_alcohol: false },
    { vegetables: false, fruits: false, nuts_seeds: false, whole_grains: false, lean_proteins: false, dairy: false, refined_grains: false, sweets: false, processed_meats: false, sugary_drinks_alcohol: false },
    { vegetables: true, fruits: true, nuts_seeds: false, whole_grains: true, lean_proteins: true, dairy: false, refined_grains: false, sweets: false, processed_meats: false, sugary_drinks_alcohol: false },
  ];

  const sampleWeights = [72.5, 72.3, 72.6, 72.1, 71.9, 72.4, 71.8];
  const sampleSteps = [9200, 10500, 8400, 11200, 12000, 6500, 9800];

  return dates.map((date, idx) => {
    const isWeekend = idx >= 5;
    const servings = sampleServings[idx] as any;
    const diversity = sampleDiversities[idx] as any;
    const score = calculateDailyDQS(servings, diversity);

    return {
      date,
      isWeekend,
      weight: sampleWeights[idx],
      steps: sampleSteps[idx],
      workout: {
        done: idx % 2 === 0,
        description: idx % 2 === 0 ? 'Силовая + кардио 45 мин' : 'Отдых',
      },
      notOnPhoto: idx === 5 ? 'Кусок торта на дне рождения друга' : 'Горсть миндаля в машине',
      servings,
      diversity,
      calculatedScore: score,
      photos: [],
      journal: {
        hungerBefore: 3,
        fullnessAfter: 8,
        mood: idx === 5 ? 'stressed' : 'great',
        note: `Заметка за ${date}: Питание по тарелке DQS, чувство энергии на высоте!`,
      },
      trackers: {
        waterGlass: 8,
        coffeeCups: 2,
        sleepHours: 7.5,
      },
    };
  });
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
  // Initialize with sample data if empty
  const samples = generateSampleData();
  saveDailyLogs(samples);
  return samples;
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
