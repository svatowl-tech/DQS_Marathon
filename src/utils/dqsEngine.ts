import { CategoryId, DQSCategoryInfo, DailyLogEntry, UserSettings, WeeklySundayReport } from '../types';

export const DQS_CATEGORIES: DQSCategoryInfo[] = [
  {
    id: 'vegetables',
    nameRu: 'Растения (Овощи, ягоды, зелень)',
    group: 'positive',
    iconName: 'Salad',
    description: 'Овощи (все кроме картофеля), ягоды (горсть 60г = 0.5п), зелень (жменя 10-30г = 1п), грибы, чеснок, имбирь',
    portionExample: '120г сырого / 1 кулак / 1 плод / авокадо 1/2 плода (80г)',
    scoring: [2, 2, 2, 1, 0, 0],
  },
  {
    id: 'fruits',
    nameRu: 'Фрукты',
    group: 'positive',
    iconName: 'Apple',
    description: 'Свежие фрукты (все кроме банана, арбуза, сухофруктов). Персик, яблоко, груша, цитрусы',
    portionExample: '120г / 1 средний плод (персик 200г = 1.5п)',
    scoring: [2, 2, 2, 1, 0, 0],
  },
  {
    id: 'nuts_seeds',
    nameRu: 'Орехи и семечки',
    group: 'positive',
    iconName: 'Nut',
    description: 'Все орехи и семечки в цельном виде без обжарки, соли, сахара. Арахисовое масло без сахара',
    portionExample: '10г (маленькая горсть) / 1 ч.л. арахисовой пасты',
    scoring: [2, 0, -1, -2],
  },
  {
    id: 'whole_grains',
    nameRu: 'Гарниры ЦЗ и Бобовые',
    group: 'positive',
    iconName: 'Wheat',
    description: 'Овёс, гречка, киноа, булгур, перловка, дикий рис + бобовые (горох, нут, фасоль, чечевица, кукуруза) + ЦЗ макароны',
    portionExample: '60г сухого → ~120г готовой крупы / ~180г бобовых',
    scoring: [2, 2, 1, 0, -1],
  },
  {
    id: 'lean_proteins',
    nameRu: 'Мясо, Птица, Яйца, Рыба',
    group: 'positive',
    iconName: 'Fish',
    description: 'Цельные источники белка: красное мясо, птица, субпродукты, яйца (1шт=0.5п), рыба, морепродукты',
    portionExample: '120г сырого / половина куриного филе (160-240г = 1.5-2п)',
    scoring: [2, 2, 1, 0, 0, -1],
  },
  {
    id: 'dairy',
    nameRu: 'Молочные продукты',
    group: 'positive',
    iconName: 'Milk',
    description: 'Жидкое (120г молоко/кефир/йогурт без сахара), Твердое белое (60г творог/фета/моцарелла), Желтое (10-20g сыр/сметана)',
    portionExample: '120г молоко или 60г творог или 15-20г желтый сыр',
    scoring: [2, 2, 1, 0, -1, -2],
  },
  {
    id: 'healthy_drinks',
    nameRu: 'Полезные напитки (без калорий)',
    group: 'positive',
    iconName: 'Coffee',
    description: 'Кофе свежемолотый, чай без сахара, минералка, арбуз',
    portionExample: '120-240мл / 1 чашка или бокал (Вода обычная не учитывается)',
    scoring: [1, 1, 0, -1, -1, -2],
  },
  {
    id: 'oils_fats',
    nameRu: 'Масла и жиры',
    group: 'positive',
    iconName: 'Droplet',
    description: 'Сливочное масло, растительные масла (оливковое и др.), гхи, рыбий жир. (До 10г/день = лекарство, далее = яд)',
    portionExample: '5г (1 порция). Учитываем впитывание при жарке (мясо 50%, картофель/фарш/овощи 100%)',
    scoring: [1, 1, -1, -2],
  },
  {
    id: 'refined_grains',
    nameRu: 'Гарнир обычный (бесполезный)',
    group: 'negative',
    iconName: 'Croissant',
    description: 'Хлеб, обычные макароны, обычный рис, картофель, бананы, сухофрукты, хлебцы/снеки без сахара',
    portionExample: '60г сухого / 120г готового / картофель 120г / бананы 60г',
    scoring: [0, -1, -2],
  },
  {
    id: 'sweets',
    nameRu: 'Сладкое и десерты',
    group: 'negative',
    iconName: 'Candy',
    description: 'Всё с добавленным сахаром: печенье, торты, шоколад, мёд, мороженое, сладкие йогурты, макадамия в сиропе',
    portionExample: '60г для всего (Сникерс 85г = 1.5п, Чизкейк 120г = 2п)',
    scoring: [-2, -2, -2, -2, -2],
  },
  {
    id: 'processed_meats',
    nameRu: 'Ультра-обработанная еда',
    group: 'negative',
    iconName: 'Beef',
    description: 'Полуфабрикаты (котлеты, наггетсы, пельмени, колбасы), чипсы, фастфуд, ресторанные сложные блюда',
    portionExample: '120г / снеки 60г (Каждая порция -2б)',
    scoring: [-2, -2, -2, -2, -2],
  },
  {
    id: 'sugary_drinks_alcohol',
    nameRu: 'Нездоровые напитки и алкоголь',
    group: 'negative',
    iconName: 'GlassWater',
    description: 'Газировки с сахаром, соки, энергетики, сладкий кофе/какао, алкоголь, пиво',
    portionExample: '240мл (200-300мл = 1 порция = -2б)',
    scoring: [-2, -2, -2, -2, -2],
  },
];

export function getCategoryPoints(catId: CategoryId, servingsCount: number): number {
  if (servingsCount <= 0) return 0;
  const cat = DQS_CATEGORIES.find((c) => c.id === catId);
  if (!cat) return 0;

  let total = 0;
  for (let i = 0; i < servingsCount; i++) {
    const scoreIndex = Math.min(i, cat.scoring.length - 1);
    total += cat.scoring[scoreIndex];
  }
  return total;
}

export function calculateDailyDQS(
  servings: Record<CategoryId, number>,
  diversity: Record<CategoryId, boolean>
): number {
  let score = 0;

  DQS_CATEGORIES.forEach((cat) => {
    const count = servings[cat.id] || 0;
    score += getCategoryPoints(cat.id, count);

    // Diversity bonus: +2 if 3+ different foods in category checked
    if (diversity[cat.id] && count >= 1) {
      score += 2;
    }
  });

  return score;
}

export function getInitialServings(): Record<CategoryId, number> {
  return {
    vegetables: 0,
    fruits: 0,
    nuts_seeds: 0,
    whole_grains: 0,
    lean_proteins: 0,
    dairy: 0,
    healthy_drinks: 0,
    oils_fats: 0,
    refined_grains: 0,
    sweets: 0,
    processed_meats: 0,
    sugary_drinks_alcohol: 0,
  };
}

export function getInitialDiversity(): Record<CategoryId, boolean> {
  return {
    vegetables: false,
    fruits: false,
    nuts_seeds: false,
    whole_grains: false,
    lean_proteins: false,
    dairy: false,
    healthy_drinks: false,
    oils_fats: false,
    refined_grains: false,
    sweets: false,
    processed_meats: false,
    sugary_drinks_alcohol: false,
  };
}

export function formatDateRu(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export function getDayOfWeekRu(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  return days[date.getDay()];
}

export function isSunday(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date.getDay() === 0;
}

export function calcPctChange(current: number, base: number): number {
  if (!base || base === 0) return 0;
  return Number((((current - base) / base) * 100).toFixed(1));
}

// Get dates range array for a week (Monday to Sunday)
export function getWeekDates(mondayDateStr: string): string[] {
  const dates: string[] = [];
  const curr = new Date(mondayDateStr);
  for (let i = 0; i < 7; i++) {
    const d = new Date(curr);
    d.setDate(curr.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

// Find Monday for given date
export function getMondayOfDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0 is Sun, 1 is Mon
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Get Sunday for given date
export function getSundayOfDate(dateStr: string): string {
  const monday = new Date(getMondayOfDate(dateStr));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday.toISOString().split('T')[0];
}
