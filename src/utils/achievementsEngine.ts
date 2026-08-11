import { BodyMeasurements, DailyLogEntry, UserSettings, WeeklySundayReport } from '../types';

export type AchievementCategory = 'time' | 'nutrition' | 'weight_body';
export type AchievementType = 'permanent' | 'weekly';

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  type: AchievementType;
  tier?: number; // For time achievements where higher tier replaces lower tier
  unlocked: boolean;
  unlockedDate?: string;
  progressText?: string;
  badgeColor: string; // Tailwind color styling
}

export interface CalculatedAchievements {
  // Permanent achievements list
  permanent: AchievementItem[];
  // Unlocked active permanent achievements (with highest time achievement)
  unlockedPermanent: AchievementItem[];
  // Highest time achievement unlocked
  highestTimeAchievement: AchievementItem | null;
  // Weekly achievements for specified week
  weekly: AchievementItem[];
  // Unlocked weekly achievements for specified week
  unlockedWeekly: AchievementItem[];
}

/**
 * Calculates all permanent and weekly achievements for the given app state
 */
export function calculateAchievements(
  logs: DailyLogEntry[],
  settings?: UserSettings,
  reports: WeeklySundayReport[] = [],
  weekDates?: string[] // YYYY-MM-DD list for specific week evaluation
): CalculatedAchievements {
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const targetGreen = settings?.targetDqsGreen || 18;

  // --- 1. TIME IN MARATHON CALCULATIONS ---
  let daysInMarathon = sortedLogs.length;
  if (settings?.programStartDate) {
    const start = new Date(settings.programStartDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysInMarathon = Math.max(daysInMarathon, diffDays);
  }

  // Time achievement tiers
  const timeTiers: Omit<AchievementItem, 'unlocked'>[] = [
    {
      id: 'time_7d',
      title: '7 дней в марафоне',
      description: 'Успешное участие в марафоне на протяжении 1 недели',
      icon: '🔥',
      category: 'time',
      type: 'permanent',
      tier: 1,
      progressText: `${Math.min(daysInMarathon, 7)} / 7 дней`,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'time_14d',
      title: '14 дней дисциплины',
      description: '2 недели непрерывного соблюдения DQS-рациона',
      icon: '⚡',
      category: 'time',
      type: 'permanent',
      tier: 2,
      progressText: `${Math.min(daysInMarathon, 14)} / 14 дней`,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'time_30d',
      title: '30 дней марафона',
      description: 'Целый месяц здоровых привычек и регулярного учёта',
      icon: '🌟',
      category: 'time',
      type: 'permanent',
      tier: 3,
      progressText: `${Math.min(daysInMarathon, 30)} / 30 дней`,
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'time_60d',
      title: '60 дней трансформации',
      description: '2 месяца глубокой работы над телом и самочувствием',
      icon: '👑',
      category: 'time',
      type: 'permanent',
      tier: 4,
      progressText: `${Math.min(daysInMarathon, 60)} / 60 дней`,
      badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    },
    {
      id: 'time_100d',
      title: '100 дней легенды',
      description: 'Стодневный рубеж здорового и полноценного питания',
      icon: '💎',
      category: 'time',
      type: 'permanent',
      tier: 5,
      progressText: `${Math.min(daysInMarathon, 100)} / 100 дней`,
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      id: 'time_180d',
      title: 'Полгода в марафоне',
      description: '6 месяцев железной дисциплины и правильного питания',
      icon: '🥇',
      category: 'time',
      type: 'permanent',
      tier: 6,
      progressText: `${Math.min(daysInMarathon, 180)} / 180 дней`,
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      id: 'time_365d',
      title: 'Год легендарного DQS',
      description: 'Целый год преданности здоровью, форме и идеальному рациону',
      icon: '👑',
      category: 'time',
      type: 'permanent',
      tier: 7,
      progressText: `${Math.min(daysInMarathon, 365)} / 365 дней`,
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    },
  ];

  const evaluatedTimeAchievements: AchievementItem[] = timeTiers.map((t) => {
    const requiredDays =
      t.tier === 1
        ? 7
        : t.tier === 2
        ? 14
        : t.tier === 3
        ? 30
        : t.tier === 4
        ? 60
        : t.tier === 5
        ? 100
        : t.tier === 6
        ? 180
        : 365;
    const isUnlocked = daysInMarathon >= requiredDays;
    return {
      ...t,
      unlocked: isUnlocked,
    };
  });

  const unlockedTimeAchievements = evaluatedTimeAchievements.filter((a) => a.unlocked);
  const highestTimeAchievement = unlockedTimeAchievements.length > 0
    ? unlockedTimeAchievements[unlockedTimeAchievements.length - 1]
    : null;

  // --- 2. NUTRITION QUALITY PERMANENT ACHIEVEMENTS ---
  const greenDaysCount = sortedLogs.filter((l) => l.calculatedScore >= targetGreen).length;

  // Max consecutive green days
  let maxGreenStreak = 0;
  let currentStreak = 0;
  sortedLogs.forEach((l) => {
    if (l.calculatedScore >= targetGreen) {
      currentStreak++;
      if (currentStreak > maxGreenStreak) maxGreenStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  });

  const maxDqsScore = sortedLogs.length > 0 ? Math.max(...sortedLogs.map((l) => l.calculatedScore)) : 0;
  const maxVeggieServings = sortedLogs.length > 0
    ? Math.max(...sortedLogs.map((l) => l.servings.vegetables || 0))
    : 0;

  const maxFruitBerryServings = sortedLogs.length > 0
    ? Math.max(...sortedLogs.map((l) => l.servings.fruits || 0))
    : 0;

  const maxProteinServings = sortedLogs.length > 0
    ? Math.max(
        ...sortedLogs.map(
          (l) =>
            (l.servings.meat || 0) +
            (l.servings.dairy || 0) +
            (l.servings.cheese || 0) +
            (l.servings.legumes || 0) +
            ((l.servings as any).lean_proteins || 0)
        )
      )
    : 0;

  let maxNoSweetsStreak = 0;
  let currentSweetsStreak = 0;
  sortedLogs.forEach((l) => {
    const sweets = (l.servings.sweets || 0) + (l.servings.sugary_drinks || 0);
    if (sweets === 0 && l.calculatedScore > 0) {
      currentSweetsStreak++;
      if (currentSweetsStreak > maxNoSweetsStreak) maxNoSweetsStreak = currentSweetsStreak;
    } else {
      currentSweetsStreak = 0;
    }
  });

  const totalFoodPhotos = sortedLogs.reduce(
    (acc, l) => acc + (l.photos?.length || 0) + (l.meals?.length || 0),
    0
  );
  const diversityDaysCount = sortedLogs.filter(
    (l) => l.diversity && Object.values(l.diversity).some(Boolean)
  ).length;
  const totalWorkouts = sortedLogs.filter((l) => l.workout?.done).length;

  const stepsList = sortedLogs.map((l) => l.steps || 0);
  const maxSteps = stepsList.length > 0 ? Math.max(...stepsList) : 0;
  const daysWith10kSteps = stepsList.filter((s) => s >= 10000).length;

  let maxWeightStreak = 0;
  let currWeightStreak = 0;
  sortedLogs.forEach((l) => {
    if (typeof l.weight === 'number' && l.weight > 0) {
      currWeightStreak++;
      if (currWeightStreak > maxWeightStreak) maxWeightStreak = currWeightStreak;
    } else {
      currWeightStreak = 0;
    }
  });

  const zeroJunkDays = sortedLogs.filter((l) => {
    const junk =
      (l.servings.other_grains || (l.servings as any).refined_grains || 0) +
      (l.servings.sweets || 0) +
      (l.servings.sugary_drinks || 0) +
      (l.servings.alcohol || 0) +
      (l.servings.fried_food || 0) +
      (l.servings.processed_meat || (l.servings as any).processed_meats || 0) +
      ((l.servings as any).sugary_drinks_alcohol || 0);
    return junk === 0 && l.calculatedScore > 0;
  }).length;

  const waterMetDays = sortedLogs.filter((l) => (l.trackers?.waterGlass || 0) >= 8).length;

  const permanentNutrition: AchievementItem[] = [
    {
      id: 'nut_first_log',
      title: 'Первый шаг к цели',
      description: 'Заполнен самый первый дневник питания в DQS',
      icon: '🚀',
      category: 'nutrition',
      type: 'permanent',
      unlocked: sortedLogs.length >= 1,
      progressText: `${Math.min(sortedLogs.length, 1)} / 1 дневник`,
      badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    },
    {
      id: 'nut_green_first',
      title: 'Первый зелёный день',
      description: 'Достигнута зелёная зона DQS (≥ 18 баллов) за день',
      icon: '🌱',
      category: 'nutrition',
      type: 'permanent',
      unlocked: greenDaysCount >= 1,
      progressText: `${Math.min(greenDaysCount, 1)} / 1`,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'nut_green_streak3',
      title: 'Серия из 3 зелёных дней',
      description: '3 дня подряд с DQS в зелёной зоне',
      icon: '🌿',
      category: 'nutrition',
      type: 'permanent',
      unlocked: maxGreenStreak >= 3,
      progressText: `Серия: ${maxGreenStreak} / 3 дн.`,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'nut_green_streak7',
      title: 'Зелёный марафон (7 дней)',
      description: 'Целая неделя подряд с DQS в зелёной зоне',
      icon: '🔥',
      category: 'nutrition',
      type: 'permanent',
      unlocked: maxGreenStreak >= 7,
      progressText: `Серия: ${maxGreenStreak} / 7 дн.`,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'nut_green_10d',
      title: '10 дней в зелёной зоне',
      description: 'Суммарно 10 дней отличного качества рациона',
      icon: '🌳',
      category: 'nutrition',
      type: 'permanent',
      unlocked: greenDaysCount >= 10,
      progressText: `${Math.min(greenDaysCount, 10)} / 10 дн.`,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'nut_green_30d',
      title: 'Мастер рациона (30 зелёных дней)',
      description: 'Суммарно 30 дней с зелёным качеством DQS',
      icon: '🌲',
      category: 'nutrition',
      type: 'permanent',
      unlocked: greenDaysCount >= 30,
      progressText: `${Math.min(greenDaysCount, 30)} / 30 дн.`,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'nut_dqs_25',
      title: 'Мастер DQS (+25 б.)',
      description: 'День с рекордным показателем DQS ≥ 25 баллов',
      icon: '🎯',
      category: 'nutrition',
      type: 'permanent',
      unlocked: maxDqsScore >= 25,
      progressText: `Рекорд: ${maxDqsScore} / 25 б.`,
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      id: 'nut_veggie_champ',
      title: 'Овощной чемпион',
      description: 'Съедено 5 и более порций овощей за один день',
      icon: '🥦',
      category: 'nutrition',
      type: 'permanent',
      unlocked: maxVeggieServings >= 5,
      progressText: `Макс: ${maxVeggieServings} / 5 порц.`,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'nut_berry_guru',
      title: 'Ягодный & Фруктовый Гуру',
      description: 'Съедено 3+ порций ягод или фруктов за один день',
      icon: '🍓',
      category: 'nutrition',
      type: 'permanent',
      unlocked: maxFruitBerryServings >= 3,
      progressText: `Макс: ${maxFruitBerryServings} / 3 порц.`,
      badgeColor: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    },
    {
      id: 'nut_protein_pro',
      title: 'Белковый баланс',
      description: '5+ порций полноценного белка (птица, рыба, яйца, бобовые) за день',
      icon: '🥩',
      category: 'nutrition',
      type: 'permanent',
      unlocked: maxProteinServings >= 5,
      progressText: `Макс: ${maxProteinServings} / 5 порц.`,
      badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
    {
      id: 'nut_no_sweets_3d',
      title: 'Сахарный детокс',
      description: '3 дня подряд без сладостей и сладких напитков',
      icon: '🍯',
      category: 'nutrition',
      type: 'permanent',
      unlocked: maxNoSweetsStreak >= 3,
      progressText: `Серия: ${maxNoSweetsStreak} / 3 дн.`,
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      id: 'nut_zero_junk',
      title: 'Чистый рацион',
      description: 'Полное отсутствие рафинированных и вредных продуктов за день',
      icon: '🥗',
      category: 'nutrition',
      type: 'permanent',
      unlocked: zeroJunkDays >= 1,
      progressText: `${zeroJunkDays} чистого дня`,
      badgeColor: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    },
    {
      id: 'nut_food_photos_10',
      title: 'Фото-фудблогер (10+ фото)',
      description: 'Загружено 10 и более фотографий ваших приёмов пищи',
      icon: '📸',
      category: 'nutrition',
      type: 'permanent',
      unlocked: totalFoodPhotos >= 10,
      progressText: `${totalFoodPhotos} / 10 фото`,
      badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    },
    {
      id: 'nut_diversity_master',
      title: 'Радуга на тарелке',
      description: '10 дней активного отслеживания разнообразия продуктов',
      icon: '🎨',
      category: 'nutrition',
      type: 'permanent',
      unlocked: diversityDaysCount >= 10,
      progressText: `${diversityDaysCount} / 10 дней`,
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'nut_water_master',
      title: 'Водная привычка',
      description: '10 дней выполнения нормы гидратации (8+ стаканов)',
      icon: '💧',
      category: 'nutrition',
      type: 'permanent',
      unlocked: waterMetDays >= 10,
      progressText: `${waterMetDays} / 10 дней`,
      badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    },
    {
      id: 'nut_water_20d',
      title: 'Океан гидратации (20 дней)',
      description: '20 дней выпивалось по 8+ стаканов чистой воды',
      icon: '🌊',
      category: 'nutrition',
      type: 'permanent',
      unlocked: waterMetDays >= 20,
      progressText: `${waterMetDays} / 20 дней`,
      badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    },
    {
      id: 'sport_first',
      title: 'Заряд энергии',
      description: 'Отмечена первая спортивная тренировка в дневнике',
      icon: '🏋️‍♂️',
      category: 'nutrition',
      type: 'permanent',
      unlocked: totalWorkouts >= 1,
      progressText: `${totalWorkouts} / 1 тр.`,
      badgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    },
    {
      id: 'sport_10_workouts',
      title: 'Железный спортсмен',
      description: 'Выполнено 10 и более тренировок',
      icon: '⚡',
      category: 'nutrition',
      type: 'permanent',
      unlocked: totalWorkouts >= 10,
      progressText: `${totalWorkouts} / 10 тр.`,
      badgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    },
    {
      id: 'sport_steps_10k',
      title: 'Шаговый марафон (10k)',
      description: 'Пройдено 10 000+ шагов за один день',
      icon: '👟',
      category: 'nutrition',
      type: 'permanent',
      unlocked: maxSteps >= 10000,
      progressText: `Рекорд: ${maxSteps.toLocaleString()} шагов`,
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      id: 'sport_steps_7d_10k',
      title: 'Победитель дивана',
      description: '5 дней с нормой 10 000+ шагов',
      icon: '🏃‍♂️',
      category: 'nutrition',
      type: 'permanent',
      unlocked: daysWith10kSteps >= 5,
      progressText: `${daysWith10kSteps} / 5 дней`,
      badgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    },
  ];

  // --- 3. WEIGHT & MEASUREMENTS PERMANENT ACHIEVEMENTS ---
  const validWeights = sortedLogs
    .map((l) => l.weight)
    .filter((w): w is number => typeof w === 'number');

  const startWeight = settings?.startWeight || validWeights[0] || 0;
  const currentWeight = validWeights.length > 0 ? validWeights[validWeights.length - 1] : startWeight;
  const totalWeightLost = Math.max(0, Number((startWeight - currentWeight).toFixed(1)));

  // Measurements lost calculations
  const startMeasurements = settings?.startMeasurements || {};
  const latestReport = reports.length > 0 ? reports[reports.length - 1] : null;
  const currentMeasurements = latestReport?.measurementsCurrent || {};

  const waistStart = startMeasurements.waist || 0;
  const waistCurr = currentMeasurements.waist || waistStart;
  const waistLost = waistStart > 0 && waistCurr > 0 ? Math.max(0, waistStart - waistCurr) : 0;

  let totalCmLost = 0;
  const keys: (keyof BodyMeasurements)[] = ['chest', 'waist', 'hips', 'thigh', 'arm'];
  keys.forEach((k) => {
    const s = startMeasurements[k] || 0;
    const c = currentMeasurements[k] || s;
    if (s > 0 && c > 0 && s > c) {
      totalCmLost += s - c;
    }
  });
  totalCmLost = Number(totalCmLost.toFixed(1));

  const permanentWeightBody: AchievementItem[] = [
    {
      id: 'body_first_weight',
      title: 'Точка отсчёта',
      description: 'Зафиксирован первый замер веса в системе',
      icon: '⚖️',
      category: 'weight_body',
      type: 'permanent',
      unlocked: validWeights.length >= 1,
      progressText: `${validWeights.length} / 1 замер`,
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'body_weight_streak7',
      title: 'Дисциплина взвешиваний',
      description: '7 дней подряд ежедневной фиксации утреннего веса',
      icon: '📅',
      category: 'weight_body',
      type: 'permanent',
      unlocked: maxWeightStreak >= 7,
      progressText: `Серия: ${maxWeightStreak} / 7 дн.`,
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'body_w_minus1',
      title: 'Старт дан (-1 кг)',
      description: 'Сброшен 1 килограмм от начального веса',
      icon: '📉',
      category: 'weight_body',
      type: 'permanent',
      unlocked: totalWeightLost >= 1,
      progressText: `${totalWeightLost} / 1 кг`,
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'body_w_minus3',
      title: 'Отличный прогресс (-3 кг)',
      description: 'Минус 3 кг от стартового веса',
      icon: '📉',
      category: 'weight_body',
      type: 'permanent',
      unlocked: totalWeightLost >= 3,
      progressText: `${totalWeightLost} / 3 кг`,
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'body_w_minus5',
      title: 'Легкость (-5 кг)',
      description: 'Сброшено 5 килограммов',
      icon: '🏆',
      category: 'weight_body',
      type: 'permanent',
      unlocked: totalWeightLost >= 5,
      progressText: `${totalWeightLost} / 5 кг`,
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      id: 'body_w_minus7',
      title: 'Мощный результат (-7 кг)',
      description: 'Сброшено 7 килограммов от начального веса',
      icon: '🚀',
      category: 'weight_body',
      type: 'permanent',
      unlocked: totalWeightLost >= 7,
      progressText: `${totalWeightLost} / 7 кг`,
      badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    },
    {
      id: 'body_w_minus10',
      title: 'Трансформация (-10 кг)',
      description: '10 сброшенных килограммов жировой массы',
      icon: '⚡',
      category: 'weight_body',
      type: 'permanent',
      unlocked: totalWeightLost >= 10,
      progressText: `${totalWeightLost} / 10 кг`,
      badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    },
    {
      id: 'body_target_reached',
      title: 'Цель достигнута!',
      description: 'Текущий вес равен или меньше вашей целевой планки',
      icon: '🎯',
      category: 'weight_body',
      type: 'permanent',
      unlocked: settings?.targetWeight ? currentWeight <= settings.targetWeight && validWeights.length > 0 : false,
      progressText: `Вес: ${currentWeight} кг (Цель: ${settings?.targetWeight || '—'} кг)`,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'body_m_waist2',
      title: 'Талия (-2 см)',
      description: 'Ушло 2 и более сантиметра в объёме талии',
      icon: '📏',
      category: 'weight_body',
      type: 'permanent',
      unlocked: waistLost >= 2,
      progressText: `${waistLost} / 2 см`,
      badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
    {
      id: 'body_m_total5',
      title: 'Минус 5 см в объемах',
      description: 'Суммарно ушло 5 см по всем параметрам тела',
      icon: '✨',
      category: 'weight_body',
      type: 'permanent',
      unlocked: totalCmLost >= 5,
      progressText: `${totalCmLost} / 5 см`,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'body_m_total10',
      title: 'Минус 10 см в объемах',
      description: 'Заметное уменьшение объемов на 10 см',
      icon: '🎖️',
      category: 'weight_body',
      type: 'permanent',
      unlocked: totalCmLost >= 10,
      progressText: `${totalCmLost} / 10 см`,
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'body_m_total15',
      title: 'Минус 15 см в объемах',
      description: 'Впечатляющий минус 15 см по всем замеряемым параметрам',
      icon: '💃',
      category: 'weight_body',
      type: 'permanent',
      unlocked: totalCmLost >= 15,
      progressText: `${totalCmLost} / 15 см`,
      badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    },
  ];

  // Combine all permanent achievements
  const allPermanent: AchievementItem[] = [
    ...evaluatedTimeAchievements,
    ...permanentNutrition,
    ...permanentWeightBody,
  ];

  // Filter unlocked permanent achievements
  // CRITICAL REQUIREMENT: "ачивка времени обновляется на новую при достижении"
  // So among time achievements, we ONLY include the highest time achievement unlocked!
  const unlockedPermanentWithoutTime = allPermanent.filter(
    (a) => a.unlocked && a.category !== 'time'
  );

  const unlockedPermanent: AchievementItem[] = [
    ...(highestTimeAchievement ? [highestTimeAchievement] : []),
    ...unlockedPermanentWithoutTime,
  ];

  // --- 4. WEEKLY ACHIEVEMENTS EVALUATION ---
  // If weekDates is passed, evaluate for those dates, otherwise evaluate for latest 7 days
  let currentWeekDates = weekDates;
  if (!currentWeekDates || currentWeekDates.length === 0) {
    if (sortedLogs.length >= 7) {
      currentWeekDates = sortedLogs.slice(-7).map((l) => l.date);
    } else {
      currentWeekDates = sortedLogs.map((l) => l.date);
    }
  }

  const weekLogs = currentWeekDates.map((d) => sortedLogs.find((l) => l.date === d) || null);
  const weekGreenDays = weekLogs.filter((l) => (l?.calculatedScore ?? 0) >= targetGreen).length;
  const weekMaxDqs = Math.max(0, ...weekLogs.map((l) => l?.calculatedScore ?? 0));
  const weekWorkouts = weekLogs.filter((l) => l?.workout?.done).length;
  const weekWaterDays = weekLogs.filter((l) => (l?.trackers?.waterGlass || 0) >= 8).length;
  const weekDiversityDays = weekLogs.filter((l) => l && Object.values(l.diversity || {}).some(Boolean)).length;
  const weekPhotoDays = weekLogs.filter(
    (l) => l && ((l.photos?.length || 0) > 0 || (l.meals?.length || 0) > 0)
  ).length;
  const weekTotalSteps = weekLogs.reduce((acc, l) => acc + (l?.steps || 0), 0);

  const weekJunkCount = weekLogs.reduce((acc, l) => {
    if (!l) return acc;
    return (
      acc +
      (l.servings.other_grains || (l.servings as any).refined_grains || 0) +
      (l.servings.sweets || 0) +
      (l.servings.sugary_drinks || 0) +
      (l.servings.alcohol || 0) +
      (l.servings.fried_food || 0) +
      (l.servings.processed_meat || (l.servings as any).processed_meats || 0) +
      ((l.servings as any).sugary_drinks_alcohol || 0)
    );
  }, 0);

  // Weight change for week
  const weekValidWeights = weekLogs
    .map((l) => l?.weight)
    .filter((w): w is number => typeof w === 'number');
  
  let weekWeightLost = 0;
  if (weekValidWeights.length >= 2) {
    weekWeightLost = Number((weekValidWeights[0] - weekValidWeights[weekValidWeights.length - 1]).toFixed(1));
  }

  // Weekly Report check for measurements in that week
  const matchedReport = reports.find(
    (r) => r.weekEndDate === currentWeekDates![currentWeekDates!.length - 1]
  );
  let weekCmLost = 0;
  if (matchedReport?.measurementsStart && matchedReport?.measurementsCurrent) {
    keys.forEach((k) => {
      const s = matchedReport.measurementsStart![k] || 0;
      const c = matchedReport.measurementsCurrent![k] || s;
      if (s > 0 && c > 0 && s > c) {
        weekCmLost += s - c;
      }
    });
  }

  const weeklyAchievementsList: AchievementItem[] = [
    {
      id: 'week_green_5d',
      title: 'Зелёная неделя',
      description: '5 и более дней в зелёной зоне DQS за эту неделю',
      icon: '🟢',
      category: 'nutrition',
      type: 'weekly',
      unlocked: weekGreenDays >= 5,
      progressText: `${weekGreenDays} / 5 зеленых дней`,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'week_top_dqs',
      title: 'Звёздный день недели',
      description: 'Достигнут DQS ≥ 22 баллов в один из дней этой недели',
      icon: '⭐',
      category: 'nutrition',
      type: 'weekly',
      unlocked: weekMaxDqs >= 22,
      progressText: `Рекорд недели: ${weekMaxDqs} б.`,
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      id: 'week_sport_3x',
      title: 'Спортивная неделя',
      description: 'Проведено 3 и более тренировок за 7 дней',
      icon: '💪',
      category: 'nutrition',
      type: 'weekly',
      unlocked: weekWorkouts >= 3,
      progressText: `${weekWorkouts} / 3 тренировок`,
      badgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    },
    {
      id: 'week_weight_minus1',
      title: 'Минус 1 кг за неделю',
      description: 'Снижение веса более чем на 1 кг за эту неделю',
      icon: '📉',
      category: 'weight_body',
      type: 'weekly',
      unlocked: weekWeightLost >= 1,
      progressText: `${weekWeightLost} / 1 кг`,
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'week_cm_minus1',
      title: 'Ушедшие сантиметры недели',
      description: 'Уменьшение суммарных объемов за неделю на 1+ см',
      icon: '📏',
      category: 'weight_body',
      type: 'weekly',
      unlocked: weekCmLost >= 1,
      progressText: `${weekCmLost} / 1 см`,
      badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
    {
      id: 'week_water_5d',
      title: 'Гидратация недели',
      description: '5+ дней выполнения норматива по воде за неделю',
      icon: '💧',
      category: 'nutrition',
      type: 'weekly',
      unlocked: weekWaterDays >= 5,
      progressText: `${weekWaterDays} / 5 дней`,
      badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    },
    {
      id: 'week_diversity_3d',
      title: 'Разнообразие вкуса',
      description: '3+ дня отмечалось продуктовое разнообразие DQS',
      icon: '🍎',
      category: 'nutrition',
      type: 'weekly',
      unlocked: weekDiversityDays >= 3,
      progressText: `${weekDiversityDays} / 3 дня`,
      badgeColor: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    },
    {
      id: 'week_photos_4d',
      title: 'Фотохроника недели',
      description: 'Фотографии блюд загружались 4+ дня за эту неделю',
      icon: '📷',
      category: 'nutrition',
      type: 'weekly',
      unlocked: weekPhotoDays >= 4,
      progressText: `${weekPhotoDays} / 4 дней`,
      badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    },
    {
      id: 'week_steps_35k',
      title: '35 000 шагов за неделю',
      description: 'Суммарно пройдено более 35 000 шагов за 7 дней',
      icon: '🚶',
      category: 'nutrition',
      type: 'weekly',
      unlocked: weekTotalSteps >= 35000,
      progressText: `${weekTotalSteps.toLocaleString()} / 35 000 шагов`,
      badgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    },
    {
      id: 'week_no_junk',
      title: 'Неделя без фастфуда',
      description: 'За всю неделю 0 порций жареного, сладостей и вредностей',
      icon: '🛑',
      category: 'nutrition',
      type: 'weekly',
      unlocked: weekJunkCount === 0 && weekLogs.filter(Boolean).length >= 5,
      progressText: `Вредности: ${weekJunkCount} порц.`,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'week_report_done',
      title: 'Воскресный супер-отчёт',
      description: 'Заполнен и сохранен недельный воскресный отчёт',
      icon: '📋',
      category: 'nutrition',
      type: 'weekly',
      unlocked: !!matchedReport,
      progressText: matchedReport ? 'Отчёт сдан!' : 'Не сдан',
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
  ];

  const unlockedWeekly = weeklyAchievementsList.filter((a) => a.unlocked);

  return {
    permanent: allPermanent,
    unlockedPermanent,
    highestTimeAchievement,
    weekly: weeklyAchievementsList,
    unlockedWeekly,
  };
}
