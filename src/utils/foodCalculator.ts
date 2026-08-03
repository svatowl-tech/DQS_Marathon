import { CategoryId } from '../types';
import { DQS_CATEGORIES } from './dqsEngine';
import { FOOD_DICTIONARY, FoodItem } from '../data/foodDictionary';

export interface CalculatedFoodPortion {
  item: FoodItem;
  amount: number; // e.g. 150
  unit: string;   // e.g. 'г'
  ratio: number;  // e.g. 150 / 250 = 0.6
  servings: Partial<Record<CategoryId, number>>;
  summaryText: string;
}

/**
 * Scale the DQS category servings of a food item proportionally to the given amount.
 */
export function calculatePortion(item: FoodItem, amount: number): CalculatedFoodPortion {
  const safeAmount = Math.max(1, amount);
  const ratio = safeAmount / (item.defaultAmount || 100);

  const scaledServings: Partial<Record<CategoryId, number>> = {};
  Object.entries(item.servings).forEach(([cat, val]) => {
    if (val && val > 0) {
      // Round to nearest 0.1 for clean numbers
      scaledServings[cat as CategoryId] = Math.round(val * ratio * 10) / 10;
    }
  });

  // Generate readable summary text e.g. "+1.5 Овощи, +0.5 Белок"
  const summaryParts: string[] = [];
  Object.entries(scaledServings).forEach(([catId, val]) => {
    if (val && val > 0) {
      const catInfo = DQS_CATEGORIES.find((c) => c.id === catId);
      if (catInfo) {
        summaryParts.push(`+${val} ${catInfo.nameRu}`);
      }
    }
  });

  return {
    item,
    amount: safeAmount,
    unit: item.unit,
    ratio,
    servings: scaledServings,
    summaryText: summaryParts.join(', ') || 'Без порций DQS',
  };
}

/**
 * Smart Search Engine: Matches user queries against food titles, keywords and extracts numbers (amounts in grams/ml) if typed.
 * E.g., user types "борщ 150" or "борщ 200г" or "шаурма" or "цезарь 250 мл"
 */
export function searchFoodDictionary(
  query: string,
  customFoods: FoodItem[] = []
): {
  results: FoodItem[];
  detectedAmount?: number;
} {
  const dictionary = customFoods.length > 0 ? [...customFoods, ...FOOD_DICTIONARY] : FOOD_DICTIONARY;
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return { results: dictionary };
  }

  // Extract trailing or embedded numbers e.g. "борщ 150" or "150г борщ"
  const numberMatch = trimmed.match(/(\d+)\s*(г|мл|g|ml|порция|шт)?/i);
  let detectedAmount: number | undefined;

  if (numberMatch && numberMatch[1]) {
    const parsed = parseInt(numberMatch[1], 10);
    if (parsed > 0 && parsed < 5000) {
      detectedAmount = parsed;
    }
  }

  // Remove numbers and weight unit tokens from the search string to get pure food query
  const cleanSearchText = trimmed
    .replace(/\d+/g, '')
    .replace(/(г|мл|g|ml|порция|шт|порций)/gi, '')
    .trim();

  if (!cleanSearchText) {
    return {
      results: dictionary,
      detectedAmount,
    };
  }

  const matches = dictionary.filter((item) => {
    const titleLower = item.title.toLowerCase();
    const descLower = item.description.toLowerCase();

    if (titleLower.includes(cleanSearchText) || descLower.includes(cleanSearchText)) {
      return true;
    }

    return item.keywords.some((kw) => kw.toLowerCase().includes(cleanSearchText));
  });

  return {
    results: matches,
    detectedAmount,
  };
}
