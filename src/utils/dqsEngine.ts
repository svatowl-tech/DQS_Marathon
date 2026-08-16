import { CategoryId, DQSCategoryInfo, DailyLogEntry, UserSettings, WeeklySundayReport } from '../types';
import { getFormattedLocalDate, parseLocalDate } from './timeZoneService';

export const DQS_CATEGORIES: DQSCategoryInfo[] = [
  {
    id: 'fruits',
    nameRu: '🍏 Фрукты',
    group: 'positive',
    iconName: 'Apple',
    description: 'Все фрукты и ягоды (120г; арбуз 250г). Исключения: банан, авокадо, сухофрукты, соки и фреши',
    portionExample: '120г (1 среднее яблоко / апельсин) / 250г арбуз',
    scoring: [2, 2, 2, 1, 0, 0, 0, -1],
  },
  {
    id: 'vegetables',
    nameRu: '🍆 Овощи',
    group: 'positive',
    iconName: 'Salad',
    description: 'Грибы и все овощи, включая квашеные и маринованные. Исключения: картофель, бобовые, зелень',
    portionExample: '120г сырых/тушёных (2 огурца / 1 томат / горсть)',
    scoring: [2, 2, 2, 1, 0, 0, 0, -1],
  },
  {
    id: 'greens',
    nameRu: '🌿 Зелень',
    group: 'positive',
    iconName: 'Leaf',
    description: 'Свежая зелень, листовые салаты, чеснок, имбирь, пряности. Руккола/шпинат 30г, укроп/чеснок 10г',
    portionExample: '10–30г (руккола 30г, укроп/чеснок 10г)',
    scoring: [2, 2, 2, 1, 0, 0, 0, -1],
  },
  {
    id: 'meat',
    nameRu: '🥩 Мясо и белок',
    group: 'positive',
    iconName: 'Fish',
    description: 'Цельные источники белка и тофу: мясо, птица, субпродукты, яйца (2шт = 1п), икра (60г), рыба, морепродукты',
    portionExample: '120г / 2 яйца / 60г икры / тофу',
    scoring: [2, 2, 1, 0, 0, -1, -2, -2],
  },
  {
    id: 'dairy',
    nameRu: '🥛 Диет. молочка',
    group: 'positive',
    iconName: 'Milk',
    description: 'Творог, скир, греческий йогурт, молоко, кефир, ряженка без сахара, протеин, белковые сырники',
    portionExample: 'Густая 120г / Жидкая 250мл',
    scoring: [2, 2, 1, 0, -1, -2, -2, -2],
  },
  {
    id: 'nuts',
    nameRu: '🥜 Орехи и семена',
    group: 'positive',
    iconName: 'Nut',
    description: 'Орехи (миндаль, грецкие, кешью) и семена (лен, чиа, тыквенные), чистая ореховая паста без сахара',
    portionExample: '10г (горсть орехов / 1 ст.л.)',
    scoring: [2, 0, -1, -2, -2, -2, -2, -2],
  },
  {
    id: 'whole_grains',
    nameRu: '🌽 Цельные злаки',
    group: 'positive',
    iconName: 'Wheat',
    description: 'Овёс, гречка, киноа, булгур, перловка, бурый рис, полба, 100% ЦЗ макароны, 100% ЦЗ хлеб (80г)',
    portionExample: '50–60г сухих / 120–180г готовых / 80г ЦЗ хлеба',
    scoring: [2, 2, 1, 0, -1, -1, -1, -2],
  },
  {
    id: 'legumes',
    nameRu: '🌱 Бобовые',
    group: 'positive',
    iconName: 'Sprout',
    description: 'Фасоль, нут, чечевица, горох, маш, эдамаме, кукуруза в любом виде',
    portionExample: '50–60г сухих / 170–220г готовых',
    scoring: [2, 2, 1, 0, -1, -1, -1, -2],
  },
  {
    id: 'cheese',
    nameRu: '🧀 Сыры и жирная молочка',
    group: 'limited',
    iconName: 'Cheese',
    description: 'Твёрдые сыры (15г), мягкие (30г моцарелла/фета), рассольные (45г брынза), сметана и сливки (30г), раф',
    portionExample: '15г твёрдого / 30г мягкого, сметаны / 45г брынзы',
    scoring: [2, 0, -1, -2, -2, -2, -2, -2],
  },
  {
    id: 'oils',
    nameRu: '🧈 Масло и жиры',
    group: 'limited',
    iconName: 'Droplet',
    description: 'Растительные масла, сливочное и топленое масло, гхи, сало, майонез (5г), авокадо (0.5 плода)',
    portionExample: '3г масла / 5г майонеза / 0.5 авокадо',
    scoring: [1, 0, 0, -1, -2, -2, -2, -2],
  },
  {
    id: 'potatoes',
    nameRu: '🥔 Картофель и батат',
    group: 'limited',
    iconName: 'CookingPot',
    description: 'Отварной, запечённый картофель, батат, пюре (без обжарки во фритюре)',
    portionExample: '200–300г готового картофеля',
    scoring: [2, 1, 0, -1, -2, -2, -2, -2],
  },
  {
    id: 'other_grains',
    nameRu: '🍞 Другие гарниры',
    group: 'neutral',
    iconName: 'Croissant',
    description: 'Белый рис, макароны В/С, белый хлеб, лаваш, хлебцы, банан без кожуры (120г), сухофрукты (80г)',
    portionExample: '50–60г сухих / 170–220г готовых / 80г хлеба / 120г банан',
    scoring: [0, -1, -2, -2, -2, -2, -2, -2],
  },
  {
    id: 'sweets',
    nameRu: '🍰 Сладости',
    group: 'negative',
    iconName: 'Candy',
    description: 'Всё с добавленным сахаром/медом/сиропом: шоколад, конфеты, печенье, торты, мороженое, сладости',
    portionExample: '30г концентрированного / 60г выпечки / 120г десерта',
    scoring: [-1, -2, -2, -2, -2, -2, -2, -2],
  },
  {
    id: 'sugary_drinks',
    nameRu: '🥤 Сладкие напитки',
    group: 'negative',
    iconName: 'GlassWater',
    description: 'Сладкая газировка, соки, нектары, энергетики, квас, морсы, кофе с сиропами, безалкогольное пиво',
    portionExample: '240мл (35–40 ккал/100мл) / 500мл (15–20 ккал/100мл)',
    scoring: [-1, -2, -2, -2, -2, -2, -2, -2],
  },
  {
    id: 'alcohol',
    nameRu: '🍾 Алкоголь',
    group: 'negative',
    iconName: 'Wine',
    description: 'Пиво/сидр 5% (250мл), сухое вино (150мл), крепленое вино (70мл), крепкий алкоголь 40% (30мл). 1п = ~10мл этанола',
    portionExample: '250мл пива / 150мл вина / 30мл крепкого',
    scoring: [-1, -2, -2, -2, -2, -2, -2, -2],
  },
  {
    id: 'fried_food',
    nameRu: '🍟 Жаренное во фритюре',
    group: 'negative',
    iconName: 'Flame',
    description: 'Картофель фри, чипсы, наггетсы, стрипсы, крылья в панировке, шницели, рыба в кляре, чебуреки, беляши',
    portionExample: '120г блюда / 60г сухих снеков',
    scoring: [-1, -2, -2, -2, -2, -2, -2, -2],
  },
  {
    id: 'processed_meat',
    nameRu: '🌭 Переработанное мясо',
    group: 'negative',
    iconName: 'Beef',
    description: 'Сосиски, колбасы, ветчина, бекон, готовые покупные котлеты, полуфабрикаты, рыбные палочки',
    portionExample: '120г готовых продуктов / 60г сушеного мяса/рыбы',
    scoring: [-1, -2, -2, -2, -2, -2, -2, -2],
  },
];

export const CATEGORY_AVG_CALORIES: Partial<Record<CategoryId, number>> = {
  fruits: 60,
  vegetables: 40,
  greens: 15,
  meat: 180,
  dairy: 90,
  cheese: 110,
  nuts: 180,
  oils: 90,
  whole_grains: 180,
  legumes: 180,
  potatoes: 160,
  other_grains: 200,
  sweets: 300,
  sugary_drinks: 110,
  alcohol: 150,
  fried_food: 350,
  processed_meat: 300,
};

export function isHealthyCategory(catId: CategoryId): boolean {
  return ['fruits', 'vegetables', 'greens', 'meat', 'dairy', 'nuts', 'whole_grains', 'legumes'].includes(catId);
}

export function isLimitedCategory(catId: CategoryId): boolean {
  return ['cheese', 'oils', 'potatoes'].includes(catId);
}

export function isNeutralCategory(catId: CategoryId): boolean {
  return catId === 'other_grains';
}

export function isRestrictedCategory(catId: CategoryId): boolean {
  return ['sweets', 'sugary_drinks', 'alcohol', 'fried_food', 'processed_meat'].includes(catId);
}

export function calculatePredictedCalories(servings: Record<CategoryId, number>): number {
  let total = 0;
  (Object.keys(servings) as CategoryId[]).forEach((catId) => {
    const count = servings[catId] || 0;
    const kcal = CATEGORY_AVG_CALORIES[catId] || 0;
    total += count * kcal;
  });
  return Math.round(total);
}

export function getCategoryPoints(catId: CategoryId, servingsCount: number): number {
  if (servingsCount <= 0) return 0;
  const cat = DQS_CATEGORIES.find((c) => c.id === catId);
  if (!cat) return 0;

  let total = 0;
  const fullServings = Math.floor(servingsCount);
  const fraction = servingsCount - fullServings;

  for (let i = 0; i < fullServings; i++) {
    const scoreIndex = Math.min(i, cat.scoring.length - 1);
    total += cat.scoring[scoreIndex];
  }

  if (fraction > 0) {
    const scoreIndex = Math.min(fullServings, cat.scoring.length - 1);
    total += fraction * cat.scoring[scoreIndex];
  }

  return Math.round(total * 10) / 10;
}

export function calculateDailyDQS(
  servings: Record<CategoryId, number>,
  diversity: Record<CategoryId, boolean>
): number {
  let score = 0;

  DQS_CATEGORIES.forEach((cat) => {
    const count = servings[cat.id] || 0;
    score += getCategoryPoints(cat.id, count);

    // Diversity bonus: +1 point if 3+ different foods in category checked
    // PDF Guide 11.08.2026 page 2: "Разнообразие учитывается только внутри полезных категорий. Это даст 1 балл."
    if (isHealthyCategory(cat.id) && diversity[cat.id] && count >= 1) {
      score += 1;
    }
  });

  return Math.round(score * 10) / 10;
}

export function getInitialServings(): Record<CategoryId, number> {
  return {
    fruits: 0,
    vegetables: 0,
    greens: 0,
    meat: 0,
    dairy: 0,
    cheese: 0,
    nuts: 0,
    oils: 0,
    whole_grains: 0,
    legumes: 0,
    potatoes: 0,
    other_grains: 0,
    sweets: 0,
    sugary_drinks: 0,
    alcohol: 0,
    fried_food: 0,
    processed_meat: 0,
  } as Record<CategoryId, number>;
}

export function getInitialDiversity(): Record<CategoryId, boolean> {
  return {
    fruits: false,
    vegetables: false,
    greens: false,
    meat: false,
    dairy: false,
    cheese: false,
    nuts: false,
    oils: false,
    whole_grains: false,
    legumes: false,
    potatoes: false,
    other_grains: false,
    sweets: false,
    sugary_drinks: false,
    alcohol: false,
    fried_food: false,
    processed_meat: false,
  } as Record<CategoryId, boolean>;
}

export function migrateDailyLogEntry(entry: DailyLogEntry): DailyLogEntry {
  if (!entry || typeof entry !== 'object') return entry;
  const initialS = getInitialServings();
  const initialD = getInitialDiversity();

  const rawServings = (entry.servings || {}) as Record<string, any>;
  const rawDiversity = (entry.diversity || {}) as Record<string, any>;

  const servings: Record<CategoryId, number> = { ...initialS };
  const diversity: Record<CategoryId, boolean> = { ...initialD };

  // Helper map for legacy category keys -> modern CategoryId
  const legacyKeyMap: Record<string, CategoryId> = {
    nuts_seeds: 'nuts',
    lean_proteins: 'meat',
    oils_fats: 'oils',
    refined_grains: 'other_grains',
    processed_meats: 'processed_meat',
    sugary_drinks_alcohol: 'sugary_drinks',
  };

  // Process raw servings
  Object.keys(rawServings).forEach((key) => {
    const targetKey = (legacyKeyMap[key] || key) as CategoryId;
    if (initialS[targetKey] !== undefined) {
      const val = parseFloat(rawServings[key]);
      if (Number.isFinite(val) && val > 0) {
        servings[targetKey] = (servings[targetKey] || 0) + val;
      }
    }
  });

  // Process raw diversity
  Object.keys(rawDiversity).forEach((key) => {
    const targetKey = (legacyKeyMap[key] || key) as CategoryId;
    if (initialD[targetKey] !== undefined) {
      diversity[targetKey] = Boolean(rawDiversity[key]) || diversity[targetKey];
    }
  });

  // Ensure all values are finite clean numbers
  (Object.keys(servings) as CategoryId[]).forEach((catId) => {
    const v = servings[catId];
    servings[catId] = Number.isFinite(v) && v > 0 ? Math.round(v * 10) / 10 : 0;
  });

  // Migrate photos inside entry if present
  let migratedPhotos = entry.photos;
  if (Array.isArray(entry.photos)) {
    migratedPhotos = entry.photos.map((photo) => {
      if (!photo || !photo.servingsAdded) return photo;
      const mRaw = photo.servingsAdded as Record<string, any>;
      const mServings: Record<string, number> = {};
      Object.keys(mRaw).forEach((k) => {
        const targetK = legacyKeyMap[k] || k;
        const v = parseFloat(mRaw[k]);
        if (Number.isFinite(v) && v > 0) {
          mServings[targetK] = (mServings[targetK] || 0) + v;
        }
      });
      return {
        ...photo,
        servingsAdded: mServings as any,
      };
    });
  }

  const score = calculateDailyDQS(servings, diversity);

  // Sync weight & morningWeight
  const syncedWeight = entry.weight !== undefined ? entry.weight : entry.morningWeight;
  const morningWeight = syncedWeight;
  const weight = syncedWeight;

  // Sync measurements
  const waist = entry.waist ?? entry.measurements?.waist;
  const hips = entry.hips ?? entry.measurements?.hips;
  const chest = entry.chest ?? entry.measurements?.chest;
  const thigh = entry.thigh ?? entry.measurements?.thigh;
  const arm = entry.arm ?? entry.measurements?.arm;

  const measurements = {
    chest: chest ?? entry.measurements?.chest,
    waist: waist ?? entry.measurements?.waist,
    hips: hips ?? entry.measurements?.hips,
    thigh: thigh ?? entry.measurements?.thigh,
    arm: arm ?? entry.measurements?.arm,
  };

  return {
    ...entry,
    servings,
    diversity,
    calculatedScore: score,
    weight,
    morningWeight,
    waist,
    hips,
    chest,
    thigh,
    arm,
    measurements,
    completedTasks: entry.completedTasks || {},
    photos: Array.isArray(migratedPhotos) ? migratedPhotos : [],
    workout: entry.workout || { done: false, description: '' },
    journal: entry.journal || { hungerBefore: 5, fullnessAfter: 7, mood: 'great', note: '' },
    trackers: entry.trackers || { waterGlass: 0, coffeeCups: 0, sleepHours: 7 },
  };
}

export function hasLegacyEntries(logs: DailyLogEntry[]): boolean {
  if (!Array.isArray(logs) || logs.length === 0) return false;

  const legacyKeys = ['nuts_seeds', 'lean_proteins', 'oils_fats', 'refined_grains', 'processed_meats', 'sugary_drinks_alcohol'];

  return logs.some((l) => {
    if (!l || !l.servings) return true;
    const s = l.servings as Record<string, any>;
    // Check if any legacy key exists with a value > 0
    const hasLegacyKey = legacyKeys.some((k) => s[k] !== undefined && s[k] > 0);
    if (hasLegacyKey) return true;

    // Check if score is inconsistent or undefined
    const score = calculateDailyDQS(l.servings, l.diversity || getInitialDiversity());
    if (l.calculatedScore === undefined || Math.abs((l.calculatedScore || 0) - score) > 0.1) {
      return true;
    }

    return false;
  });
}

export function migrateAllLogs(logs: DailyLogEntry[]): DailyLogEntry[] {
  if (!Array.isArray(logs)) return [];
  return logs
    .filter((l) => l && typeof l === 'object' && l.date)
    .map(migrateDailyLogEntry);
}

export function migrateUserSettings(settings: UserSettings): UserSettings {
  if (!settings || typeof settings !== 'object') return settings;

  const legacyKeyMap: Record<string, string> = {
    nuts_seeds: 'nuts',
    lean_proteins: 'meat',
    oils_fats: 'oils',
    refined_grains: 'other_grains',
    processed_meats: 'processed_meat',
    sugary_drinks_alcohol: 'sugary_drinks',
  };

  let favMeals = settings.favoriteMeals;
  if (Array.isArray(settings.favoriteMeals)) {
    favMeals = settings.favoriteMeals.map((meal) => {
      if (!meal || !meal.servings) return meal;
      const mRaw = meal.servings as Record<string, any>;
      const mServings: Record<string, number> = {};
      Object.keys(mRaw).forEach((k) => {
        const targetK = legacyKeyMap[k] || k;
        const v = parseFloat(mRaw[k]);
        if (Number.isFinite(v) && v > 0) {
          mServings[targetK] = (mServings[targetK] || 0) + v;
        }
      });
      return {
        ...meal,
        servings: mServings as any,
      };
    });
  }

  const heightCm = settings.heightCm ?? settings.height;
  const targetWeightKg = settings.targetWeightKg ?? settings.targetWeight;
  const weightKg = settings.weightKg ?? settings.startWeight;

  return {
    ...settings,
    heightCm,
    targetWeightKg,
    weightKg,
    favoriteMeals: favMeals,
  };
}

export function formatDateRu(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export function getDayOfWeekRu(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  return days[date.getDay()];
}

export function isSunday(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = parseLocalDate(dateStr);
  return date.getDay() === 0;
}

export function calcPctChange(current: number, base: number): number {
  if (!base || base === 0) return 0;
  return Number((((current - base) / base) * 100).toFixed(1));
}

// Get dates range array for a week (Monday to Sunday)
export function getWeekDates(mondayDateStr: string): string[] {
  const dates: string[] = [];
  const curr = parseLocalDate(mondayDateStr);
  for (let i = 0; i < 7; i++) {
    const d = new Date(curr);
    d.setDate(curr.getDate() + i);
    dates.push(getFormattedLocalDate(d));
  }
  return dates;
}

// Find Monday for given date
export function getMondayOfDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const day = d.getDay(); // 0 is Sun, 1 is Mon
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return getFormattedLocalDate(monday);
}

// Get Sunday for given date
export function getSundayOfDate(dateStr: string): string {
  const monday = parseLocalDate(getMondayOfDate(dateStr));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return getFormattedLocalDate(sunday);
}
