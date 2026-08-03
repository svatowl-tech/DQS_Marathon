import { FoodItem } from '../data/foodDictionary';

const STORAGE_KEY_CUSTOM_FOODS = 'dqs_custom_foods_v1';

export function loadCustomFoods(): FoodItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_FOODS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({ ...item, isCustom: true }));
      }
    }
  } catch (e) {
    console.error('Failed to load custom foods from localStorage', e);
  }
  return [];
}

export function saveCustomFoods(foods: FoodItem[]): void {
  try {
    const customOnly = foods.filter((f) => f.isCustom);
    localStorage.setItem(STORAGE_KEY_CUSTOM_FOODS, JSON.stringify(customOnly));
  } catch (e) {
    console.warn('Failed to save custom foods to localStorage', e);
  }
}

export function addCustomFood(food: FoodItem): FoodItem[] {
  const current = loadCustomFoods();
  const newItem: FoodItem = {
    ...food,
    id: food.id || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    isCustom: true,
  };
  const updated = [newItem, ...current];
  saveCustomFoods(updated);
  return updated;
}

export function deleteCustomFood(id: string): FoodItem[] {
  const current = loadCustomFoods();
  const updated = current.filter((f) => f.id !== id);
  saveCustomFoods(updated);
  return updated;
}

export function updateCustomFood(food: FoodItem): FoodItem[] {
  const current = loadCustomFoods();
  const updated = current.map((f) => (f.id === food.id ? { ...food, isCustom: true } : f));
  saveCustomFoods(updated);
  return updated;
}
