import { CategoryId } from '../types';
import { SOUPS_FOOD_ITEMS } from './food/soups';
import { MAINS_FOOD_ITEMS } from './food/mains';
import { GARNISHES_FOOD_ITEMS } from './food/garnishes';
import { SALADS_FOOD_ITEMS } from './food/salads';
import { FASTFOOD_FOOD_ITEMS } from './food/fastfood';
import { PIZZA_PASTA_FOOD_ITEMS } from './food/pizza_pasta';
import { ASIAN_FOOD_ITEMS } from './food/asian';
import { DAIRY_EGGS_FOOD_ITEMS } from './food/dairy_eggs';
import { PASTRY_SWEETS_FOOD_ITEMS } from './food/pastry_sweets';
import { FRUITS_NUTS_FOOD_ITEMS } from './food/fruits_nuts';
import { VEGETABLES_FOOD_ITEMS } from './food/vegetables';
import { DRINKS_FOOD_ITEMS } from './food/drinks';
import { SNACKS_FOOD_ITEMS } from './food/snacks';
import { READY_MEALS_FOOD_ITEMS } from './food/ready_meals';

export interface FoodItem {
  id: string;
  title: string;
  categoryGroup: 
    | 'soups'
    | 'mains'
    | 'garnishes'
    | 'salads'
    | 'fastfood'
    | 'pizza_pasta'
    | 'asian'
    | 'dairy_eggs'
    | 'pastry_sweets'
    | 'fruits_nuts'
    | 'vegetables'
    | 'drinks'
    | 'snacks'
    | 'ready_meals';
  defaultAmount: number; // e.g. 250
  unit: 'г' | 'мл' | 'шт' | 'порция';
  servings: Partial<Record<CategoryId, number>>;
  description: string;
  keywords: string[];
  isCustom?: boolean;
}

export const FOOD_CATEGORY_GROUPS: {
  id: FoodItem['categoryGroup'];
  title: string;
  icon: string;
}[] = [
  { id: 'soups', title: 'Супы и Первые блюда', icon: '🍲' },
  { id: 'mains', title: 'Мясо, Птица и Рыба', icon: '🍗' },
  { id: 'garnishes', title: 'Гарниры и Каши', icon: '🍚' },
  { id: 'salads', title: 'Салаты и Закуски', icon: '🥗' },
  { id: 'ready_meals', title: 'Готовая еда и Кулинария', icon: '🍱' },
  { id: 'snacks', title: 'Снеки, Чипсы и Перекусы', icon: '🥨' },
  { id: 'fastfood', title: 'Фастфуд и Шаурма', icon: '🍔' },
  { id: 'pizza_pasta', title: 'Пицца и Паста', icon: '🍕' },
  { id: 'asian', title: 'Суши и Азиатская кухня', icon: '🍣' },
  { id: 'dairy_eggs', title: 'Молочное, Яйца и Сырники', icon: '🥛' },
  { id: 'pastry_sweets', title: 'Выпечка и Десерты', icon: '🥐' },
  { id: 'fruits_nuts', title: 'Фрукты, Ягоды и Орехи', icon: '🍏' },
  { id: 'vegetables', title: 'Овощи и Зелень', icon: '🥦' },
  { id: 'drinks', title: 'Напитки и Кофе', icon: '☕️' },
];

export const FOOD_DICTIONARY: FoodItem[] = [
  ...SOUPS_FOOD_ITEMS,
  ...MAINS_FOOD_ITEMS,
  ...GARNISHES_FOOD_ITEMS,
  ...SALADS_FOOD_ITEMS,
  ...READY_MEALS_FOOD_ITEMS,
  ...SNACKS_FOOD_ITEMS,
  ...FASTFOOD_FOOD_ITEMS,
  ...PIZZA_PASTA_FOOD_ITEMS,
  ...ASIAN_FOOD_ITEMS,
  ...DAIRY_EGGS_FOOD_ITEMS,
  ...PASTRY_SWEETS_FOOD_ITEMS,
  ...FRUITS_NUTS_FOOD_ITEMS,
  ...VEGETABLES_FOOD_ITEMS,
  ...DRINKS_FOOD_ITEMS,
];
