export type CategoryId =
  | 'vegetables'
  | 'fruits'
  | 'nuts_seeds'
  | 'whole_grains'
  | 'lean_proteins'
  | 'dairy'
  | 'oils_fats'
  | 'healthy_drinks'
  | 'refined_grains'
  | 'sweets'
  | 'processed_meats'
  | 'sugary_drinks_alcohol';

export type CategoryGroup = 'positive' | 'negative';

export interface DQSCategoryInfo {
  id: CategoryId;
  nameRu: string;
  group: CategoryGroup;
  iconName: string;
  description: string;
  portionExample: string;
  scoring: number[]; // points for 1st, 2nd, 3rd, 4th, 5th+ serving
}

export interface PhotoEntry {
  id: string;
  dataUrl: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string; // ISO or formatted HH:mm
  caption?: string;
  watermarkText?: string;
  hungerBefore?: number; // 1-10
  fullnessAfter?: number; // 1-10
  mood?: 'great' | 'good' | 'normal' | 'tired' | 'stressed';
}

export interface JournalEntry {
  hungerBefore?: number; // 1-10 scale
  fullnessAfter?: number; // 1-10 scale
  mood?: 'great' | 'good' | 'normal' | 'tired' | 'stressed';
  note?: string; // контекст дня, мысли, ответы на челлендж
}

export interface OptionalTrackers {
  waterGlass?: number; // 1 glass = 250ml
  coffeeCups?: number;
  sleepHours?: number;
  alcoholUnits?: number;
}

export interface DailyLogEntry {
  date: string; // YYYY-MM-DD
  isWeekend: boolean;
  weight?: number; // kg
  steps?: number;
  measurements?: BodyMeasurements;
  workout: {
    done: boolean;
    description: string;
  };
  notOnPhoto: string;
  actualCalories?: number;
  predictedCalories?: number;
  servings: Record<CategoryId, number>;
  diversity: Record<CategoryId, boolean>; // 3+ different foods in category
  calculatedScore: number;
  photos: PhotoEntry[];
  journal: JournalEntry;
  trackers: OptionalTrackers;
}

export interface BodyMeasurements {
  chest?: number; // см
  waist?: number; // см
  hips?: number; // см
  thigh?: number; // см
  arm?: number; // см
}

export interface WeeklySundayReport {
  id: string;
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD
  avgDqs: number;
  greenDaysCount: number;
  weightStart: number;
  weightCurrentWeekAvg: number;
  weightPrevWeekAvg?: number;
  weightChangeTotalPct: number;
  weightChangeWeekPct: number;
  measurementsStart?: BodyMeasurements;
  measurementsCurrent?: BodyMeasurements;
  measurementsChangeTotalPct?: number;
  whatWentWell: string;
  whatWasDifficult: string;
  insights: string;
  nextWeekFocus: string;
  createdAt: string;
}

export interface CustomTaskRule {
  id: string;
  title: string;
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, ... 6=Saturday
  timeOfDay?: 'morning' | 'evening' | 'anytime';
  type: 'measurement' | 'weight' | 'photo_meal' | 'weekly_report' | 'custom';
}

export interface FavoriteMealTemplate {
  id: string;
  title: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: Partial<Record<CategoryId, number>>;
  hungerBefore?: number;
  fullnessAfter?: number;
}

export interface UserSettings {
  userName: string;
  userAvatarUrl?: string;
  programStartDate: string; // YYYY-MM-DD
  startWeight: number;
  startMeasurements: BodyMeasurements;
  targetDqsGreen: number; // default 18
  theme: 'light' | 'dark' | 'system';
  isStarted?: boolean;
  targetWeight?: number;
  height?: number;
  taskRules?: CustomTaskRule[];
  favoriteMeals?: FavoriteMealTemplate[];
  googleSheetId?: string;
  autoSyncGoogleSheets?: boolean;
  cloudSyncEnabled?: boolean;
  lastCloudSyncTime?: string;
}

export type ActiveTab = 'home' | 'log' | 'table' | 'weekly_report' | 'guide' | 'charts' | 'settings' | 'print';
