import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  BookOpen,
  Plus,
  CheckCircle2,
  Sparkles,
  Info,
  Sliders,
  Utensils,
  ChevronRight,
  ChevronLeft,
  Zap,
  Clock,
  ArrowRight,
  Flame,
  Check,
  LayoutGrid,
  ListFilter,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { DailyLogEntry, CategoryId } from '../types';
import { FOOD_DICTIONARY, FOOD_CATEGORY_GROUPS, FoodItem } from '../data/foodDictionary';
import { searchFoodDictionary, calculatePortion, CalculatedFoodPortion } from '../utils/foodCalculator';
import { DQS_CATEGORIES, calculateDailyDQS, getCategoryPoints } from '../utils/dqsEngine';
import {
  loadCustomFoods,
  addCustomFood,
  deleteCustomFood,
} from '../utils/customFoodStorage';

interface FoodDictionaryViewProps {
  todayLog: DailyLogEntry;
  onUpdateLog: (updated: DailyLogEntry) => void;
  onNavigateToLog?: () => void;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const FoodDictionaryView: React.FC<FoodDictionaryViewProps> = ({
  todayLog,
  onUpdateLog,
  onNavigateToLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');

  // Custom Foods state
  const [customFoods, setCustomFoods] = useState<FoodItem[]>(() => loadCustomFoods());

  // Category view display mode: 'grid' (shows all categories on screen) vs 'row' (horizontal scroll)
  const [categoryViewMode, setCategoryViewMode] = useState<'grid' | 'row'>('grid');
  const rowScrollRef = useRef<HTMLDivElement>(null);

  // Modal for portion adjustment
  const [selectedDish, setSelectedDish] = useState<FoodItem | null>(null);
  const [portionAmount, setPortionAmount] = useState<number>(250);
  const [addingSuccessDishId, setAddingSuccessDishId] = useState<string | null>(null);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  // Modal for creating custom food
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategoryGroup, setNewCategoryGroup] = useState<FoodItem['categoryGroup']>('mains');
  const [newDefaultAmount, setNewDefaultAmount] = useState<number>(200);
  const [newUnit, setNewUnit] = useState<'г' | 'мл' | 'шт' | 'порция'>('г');
  const [newDescription, setNewDescription] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [newServings, setNewServings] = useState<Partial<Record<CategoryId, number>>>({});

  const [visibleCount, setVisibleCount] = useState<number>(24);

  // Search execution (includes custom foods + default dictionary)
  const searchResult = useMemo(() => {
    return searchFoodDictionary(searchQuery, customFoods);
  }, [searchQuery, customFoods]);

  const categoryGroupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    searchResult.results.forEach((item) => {
      counts[item.categoryGroup] = (counts[item.categoryGroup] || 0) + 1;
    });
    return counts;
  }, [searchResult.results]);

  const filteredItems = useMemo(() => {
    let items = searchResult.results;
    if (selectedGroup === 'custom') {
      items = items.filter((item) => item.isCustom);
    } else if (selectedGroup !== 'all') {
      items = items.filter((item) => item.categoryGroup === selectedGroup);
    }
    return items;
  }, [searchResult, selectedGroup]);

  // Reset visible items count when search query or selected group changes
  React.useEffect(() => {
    setVisibleCount(24);
  }, [searchQuery, selectedGroup]);

  const displayedItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  // Quick preset chips
  const quickSearchChips = ['Борщ', 'Шаурма', 'Цезарь', 'Овсянка', 'Сырники', 'Поке', 'Пицца', 'Капучино'];

  const handleOpenDishModal = (item: FoodItem) => {
    setSelectedDish(item);
    const prefillWeight = searchResult.detectedAmount || item.defaultAmount || 200;
    setPortionAmount(prefillWeight);
  };

  const handleQuickAddDirect = (item: FoodItem, amount?: number) => {
    const finalAmount = amount || item.defaultAmount || 200;
    const calc = calculatePortion(item, finalAmount);

    const updatedServings = { ...todayLog.servings };
    Object.entries(calc.servings).forEach(([catId, val]) => {
      const key = catId as CategoryId;
      updatedServings[key] = Math.round(((updatedServings[key] || 0) + (val || 0)) * 10) / 10;
    });

    const newScore = calculateDailyDQS(updatedServings, todayLog.diversity);

    const mealLabel =
      selectedMealType === 'breakfast'
        ? 'Завтрак'
        : selectedMealType === 'lunch'
        ? 'Обед'
        : selectedMealType === 'dinner'
        ? 'Ужин'
        : 'Перекус';

    const newNote = todayLog.notOnPhoto
      ? `${todayLog.notOnPhoto}; ${mealLabel}: ${item.title} (${finalAmount}${item.unit})`
      : `${mealLabel}: ${item.title} (${finalAmount}${item.unit})`;

    onUpdateLog({
      ...todayLog,
      servings: updatedServings,
      calculatedScore: newScore,
      notOnPhoto: newNote,
    });

    setAddingSuccessDishId(item.id);
    setAddedMessage(`Добавлено: ${item.title} (${calc.summaryText})`);
    setTimeout(() => {
      setAddingSuccessDishId(null);
      setAddedMessage(null);
    }, 2500);

    if (selectedDish) {
      setSelectedDish(null);
    }
  };

  // Handle custom food creation
  const handleOpenCreateModal = (prefillTitle?: string) => {
    if (prefillTitle) {
      setNewTitle(prefillTitle);
    } else {
      setNewTitle('');
    }
    setNewCategoryGroup('mains');
    setNewDefaultAmount(200);
    setNewUnit('г');
    setNewDescription('');
    setNewKeywords('');
    setNewServings({});
    setIsCreateModalOpen(true);
  };

  const handleSaveCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const keywordsArr = newKeywords
      ? newKeywords.split(',').map((k) => k.trim()).filter(Boolean)
      : [newTitle.trim().toLowerCase()];

    const createdItem: FoodItem = {
      id: `custom_${Date.now()}`,
      title: newTitle.trim(),
      categoryGroup: newCategoryGroup,
      defaultAmount: Math.max(10, newDefaultAmount),
      unit: newUnit,
      description: newDescription.trim() || 'Пользовательское блюдо',
      keywords: keywordsArr,
      servings: newServings,
      isCustom: true,
    };

    const updated = addCustomFood(createdItem);
    setCustomFoods(updated);
    setIsCreateModalOpen(false);

    setAddedMessage(`Блюдо «${createdItem.title}» добавлено в словарь!`);
    setTimeout(() => {
      setAddedMessage(null);
    }, 3000);
  };

  const handleDeleteCustomItem = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Удалить блюдо «${title}» из ваших сохранённых блюд?`)) {
      const updated = deleteCustomFood(id);
      setCustomFoods(updated);
    }
  };

  const scrollRow = (direction: 'left' | 'right') => {
    if (rowScrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      rowScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
               Умная база блюд DQS
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Словарь готовых блюд и продуктов
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              Не нужно гадать, к какой категории относится блюдо! Выберите готовое блюдо или введите вес (например, <span className="text-emerald-400 font-medium">«Борщ 200г»</span> или <span className="text-emerald-400 font-medium">«Шаурма»</span>) — система сама разложит порции по категориям DQS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="bg-zinc-800/80 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-center">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
                Блюд в словаре
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-400">
                {FOOD_DICTIONARY.length + customFoods.length}+
              </div>
            </div>

            <button
              onClick={() => handleOpenCreateModal()}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Добавить своё блюдо</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {addedMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-black font-bold px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{addedMessage}</span>
        </div>
      )}

      {/* Meal Selection Context Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <Utensils className="w-4 h-4 text-emerald-400" />
          <span>Добавлять блюдо в прием пищи:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: 'breakfast', label: 'Завтрак', icon: '🥞' },
              { id: 'lunch', label: 'Обед', icon: '🥗' },
              { id: 'dinner', label: 'Ужин', icon: '🍗' },
              { id: 'snack', label: 'Перекус', icon: '🍏' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMealType(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedMealType === m.id
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/50'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Box */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Введите название блюда или граммы (например: Борщ 200г, Шаурма, Цезарь)..."
            className="w-full bg-zinc-900 border-2 border-emerald-500/30 focus:border-emerald-500 rounded-2xl pl-12 pr-10 py-3.5 text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all shadow-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Search Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">Быстрый поиск:</span>
          {quickSearchChips.map((chip) => (
            <button
              key={chip}
              onClick={() => setSearchQuery(chip)}
              className="px-2.5 py-1 rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/80 text-xs text-zinc-300 transition-all whitespace-nowrap hover:text-emerald-400"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Category Group Controls Header */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200 uppercase tracking-wider">
            <ListFilter className="w-4 h-4 text-emerald-400" />
            <span>Категории блюд ({FOOD_CATEGORY_GROUPS.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 hidden sm:inline">Вид:</span>
            <div className="bg-zinc-800 p-0.5 rounded-xl flex items-center border border-zinc-700/60">
              <button
                onClick={() => setCategoryViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  categoryViewMode === 'grid'
                    ? 'bg-emerald-500 text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Показать все категории сеткой на экране"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Сеткой</span>
              </button>
              <button
                onClick={() => setCategoryViewMode('row')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  categoryViewMode === 'row'
                    ? 'bg-emerald-500 text-black font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Компактная прокручиваемая строка"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>В строку</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Buttons: Grid Mode or Row Mode */}
        {categoryViewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 text-center ${
                selectedGroup === 'all'
                  ? 'bg-emerald-500 text-black shadow-lg ring-2 ring-emerald-400'
                  : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span className="text-base">✨</span>
              <span className="line-clamp-1">Все категории</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedGroup === 'all' ? 'bg-black/20 text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {searchResult.results.length}
              </span>
            </button>

            {/* Custom Foods Tab if any */}
            {customFoods.length > 0 && (
              <button
                onClick={() => setSelectedGroup('custom')}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 text-center ${
                  selectedGroup === 'custom'
                    ? 'bg-amber-400 text-black shadow-lg ring-2 ring-amber-300'
                    : 'bg-amber-950/20 text-amber-300 border border-amber-500/30 hover:bg-amber-950/40'
                }`}
              >
                <span className="text-base">⭐</span>
                <span className="line-clamp-1">Мои блюда</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedGroup === 'custom' ? 'bg-black/20 text-black font-bold' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {customFoods.length}
                </span>
              </button>
            )}

            {FOOD_CATEGORY_GROUPS.map((group) => {
              const count = categoryGroupCounts[group.id] || 0;
              const isSelected = selectedGroup === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={`p-2.5 rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-1 text-center ${
                    isSelected
                      ? 'bg-emerald-500 text-black shadow-lg font-bold ring-2 ring-emerald-400'
                      : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-base">{group.icon}</span>
                  <span className="line-clamp-1">{group.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-black/20 text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="relative flex items-center">
            <button
              onClick={() => scrollRow('left')}
              className="absolute left-0 z-10 p-1.5 rounded-full bg-zinc-800/90 text-zinc-300 hover:text-white border border-zinc-700 shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div
              ref={rowScrollRef}
              className="flex items-center gap-2 overflow-x-auto py-1 px-7 scrollbar-none w-full"
            >
              <button
                onClick={() => setSelectedGroup('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  selectedGroup === 'all'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <span>✨ Все категории</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    selectedGroup === 'all' ? 'bg-black/20 text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {searchResult.results.length}
                </span>
              </button>

              {customFoods.length > 0 && (
                <button
                  onClick={() => setSelectedGroup('custom')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                    selectedGroup === 'custom'
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'bg-amber-950/20 text-amber-300 border border-amber-500/30 hover:bg-amber-950/40'
                  }`}
                >
                  <span>⭐ Мои блюда</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      selectedGroup === 'custom' ? 'bg-black/20 text-black font-bold' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {customFoods.length}
                  </span>
                </button>
              )}

              {FOOD_CATEGORY_GROUPS.map((group) => {
                const count = categoryGroupCounts[group.id] || 0;
                return (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                      selectedGroup === group.id
                        ? 'bg-emerald-500 text-black shadow-md font-bold'
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    <span>{group.icon}</span>
                    <span>{group.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        selectedGroup === group.id ? 'bg-black/20 text-black font-bold' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => scrollRow('right')}
              className="absolute right-0 z-10 p-1.5 rounded-full bg-zinc-800/90 text-zinc-300 hover:text-white border border-zinc-700 shadow-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Food Items List / Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
          <span>
            {searchQuery
              ? `Найдено по запросу «${searchQuery}»: ${filteredItems.length}`
              : `Показано блюд: ${displayedItems.length} из ${filteredItems.length}`}
          </span>
          {searchResult.detectedAmount && (
            <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              Распознан вес: {searchResult.detectedAmount}г
            </span>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
            <div className="text-4xl">🔍</div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-zinc-200">Блюдо не найдено</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {searchQuery
                  ? `В базе нет блюда по запросу «${searchQuery}». Вы можете добавить его в свой личный словарь!`
                  : 'Попробуйте сбросить фильтры или изменить категорию.'}
              </p>
            </div>

            {searchQuery && (
              <button
                onClick={() => handleOpenCreateModal(searchQuery)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Создать блюдо «{searchQuery}»</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayedItems.map((item) => {
                const activeAmount = searchResult.detectedAmount || item.defaultAmount;
                const calc = calculatePortion(item, activeAmount);
                const isJustAdded = addingSuccessDishId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`bg-zinc-900/90 border transition-all rounded-2xl p-4 flex flex-col justify-between space-y-3 relative group hover:border-emerald-500/40 ${
                      isJustAdded ? 'border-emerald-500 bg-emerald-950/20' : 'border-zinc-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-zinc-100 group-hover:text-emerald-300 transition-colors">
                              {item.title}
                            </h3>
                            {item.isCustom && (
                              <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-300" />
                                <span>Моё</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
                            {activeAmount} {item.unit}
                          </span>
                          {item.isCustom && (
                            <button
                              onClick={(e) => handleDeleteCustomItem(e, item.id, item.title)}
                              className="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                              title="Удалить из моих блюд"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* DQS Categories Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.entries(calc.servings).map(([catId, val]) => {
                          const catInfo = DQS_CATEGORIES.find((c) => c.id === catId);
                          if (!catInfo || !val) return null;
                          const isPositive = catInfo.group === 'positive';

                          return (
                            <span
                              key={catId}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                isPositive
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              <span>{catInfo.nameRu}</span>
                              <span className="font-mono">+{val}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenDishModal(item)}
                        className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Изменить вес</span>
                      </button>

                      <button
                        onClick={() => handleQuickAddDirect(item, activeAmount)}
                        disabled={isJustAdded}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isJustAdded
                            ? 'bg-emerald-500 text-black'
                            : 'bg-emerald-500/20 hover:bg-emerald-500 hover:text-black text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Добавлено!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ В дневник</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {filteredItems.length > visibleCount && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 24)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs sm:text-sm font-bold text-zinc-200 hover:text-emerald-400 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Показать ещё (+{Math.min(24, filteredItems.length - visibleCount)})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setVisibleCount(filteredItems.length)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs sm:text-sm font-semibold text-emerald-400 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Показать все ({filteredItems.length})</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE CUSTOM FOOD MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 w-full max-w-xl space-y-5 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <Star className="w-3 h-3 fill-emerald-400" />
                <span>Ваш уникальный рецепт</span>
              </div>
              <h3 className="text-xl font-black text-white">Добавление своего блюда</h3>
              <p className="text-xs text-zinc-400">
                Введите название, укажите стандартный вес и выберите, из каких категорий DQS состоит блюдо.
              </p>
            </div>

            <form onSubmit={handleSaveCustomFood} className="space-y-4">
              {/* Title & Category Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Название блюда *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Например: Запечённая горбуша"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Категория меню</label>
                  <select
                    value={newCategoryGroup}
                    onChange={(e) => setNewCategoryGroup(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                  >
                    {FOOD_CATEGORY_GROUPS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.icon} {g.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Weight & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Стандартная порция</label>
                  <input
                    type="number"
                    min={1}
                    value={newDefaultAmount}
                    onChange={(e) => setNewDefaultAmount(parseInt(e.target.value) || 100)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Единица измерения</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none"
                  >
                    <option value="г">г (граммы)</option>
                    <option value="мл">мл (миллилитры)</option>
                    <option value="шт">шт (штуки)</option>
                    <option value="порция">порция</option>
                  </select>
                </div>
              </div>

              {/* Description / Ingredients */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Описание / Состав (необязательно)</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Состав: филе горбуши, лимон, специи, укроп"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              {/* DQS Servings Builder */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-400">
                    Состав порции по категориям DQS (на {newDefaultAmount}{newUnit}):
                  </label>
                  <span className="text-[10px] text-zinc-400">
                    Нажимайте + / - для изменения
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 bg-zinc-950/80 rounded-2xl border border-zinc-800">
                  {DQS_CATEGORIES.map((cat) => {
                    const currentVal = newServings[cat.id] || 0;
                    const isPos = cat.group === 'positive';

                    return (
                      <div
                        key={cat.id}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                          currentVal > 0
                            ? isPos
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-xs font-bold truncate">{cat.nameRu}</div>
                          <div className="text-[10px] text-zinc-500 truncate">{cat.portionExample}</div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.max(0, Math.round((currentVal - 0.5) * 10) / 10);
                              setNewServings((prev) => ({ ...prev, [cat.id]: next }));
                            }}
                            className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-white">
                            {currentVal}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = Math.round((currentVal + 0.5) * 10) / 10;
                              setNewServings((prev) => ({ ...prev, [cat.id]: next }));
                            }}
                            className="w-6 h-6 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black font-bold text-xs flex items-center justify-center border border-emerald-500/30"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit / Cancel Actions */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Сохранить в словарь</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Portion Adjuster Modal */}
      {selectedDish && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 w-full max-w-lg space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedDish(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                Настройка порции
              </span>
              <h3 className="text-lg font-bold text-white">{selectedDish.title}</h3>
              <p className="text-xs text-zinc-400">{selectedDish.description}</p>
            </div>

            {/* Slider & Input */}
            <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-200">Количество еды / размер порции:</label>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <span className="text-emerald-400 font-bold">{portionAmount} {selectedDish.unit}</span>
                  <span className="text-zinc-500">
                    ({Math.round((portionAmount / (selectedDish.defaultAmount || 200)) * 100) / 100}x порции)
                  </span>
                </div>
              </div>

              {/* Quick Portion Fraction Chips */}
              <div className="flex flex-wrap items-center gap-2">
                {[0.25, 0.5, 0.75, 1.0, 1.5, 2.0].map((fraction) => {
                  const targetGrams = Math.round((selectedDish.defaultAmount || 200) * fraction);
                  const isCurrent = Math.abs(portionAmount - targetGrams) < 10;

                  return (
                    <button
                      key={fraction}
                      type="button"
                      onClick={() => setPortionAmount(targetGrams)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                        isCurrent
                          ? 'bg-emerald-500 text-black font-bold shadow-md'
                          : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {fraction === 0.25
                        ? '¼ порции'
                        : fraction === 0.5
                        ? '½ порции'
                        : fraction === 0.75
                        ? '¾ порции'
                        : fraction === 1.0
                        ? '1 порция'
                        : `${fraction} порции`}
                    </button>
                  );
                })}
              </div>

              {/* Slider & Exact Weight Input */}
              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min={20}
                  max={Math.max(600, (selectedDish.defaultAmount || 200) * 3)}
                  step={10}
                  value={portionAmount}
                  onChange={(e) => setPortionAmount(parseInt(e.target.value) || 20)}
                  className="w-full accent-emerald-500 cursor-pointer"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400">
                    Стандартная порция: {selectedDish.defaultAmount}{selectedDish.unit}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-400">Точный вес:</span>
                    <input
                      type="number"
                      value={portionAmount}
                      onChange={(e) => setPortionAmount(Math.max(10, parseInt(e.target.value) || 0))}
                      className="w-20 bg-zinc-900 border border-emerald-500/50 rounded-lg px-2 py-1 text-right text-xs font-bold text-emerald-400 focus:outline-none font-mono"
                    />
                    <span className="text-xs text-zinc-400 font-mono">{selectedDish.unit}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Recalculated DQS Breakdown */}
            {(() => {
              const calc = calculatePortion(selectedDish, portionAmount);
              return (
                <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-2">
                  <div className="text-xs text-zinc-400 font-medium">
                    Рассчитанное распределение по DQS ({portionAmount} {selectedDish.unit}):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(calc.servings).map(([catId, val]) => {
                      const catInfo = DQS_CATEGORIES.find((c) => c.id === catId);
                      if (!catInfo || !val) return null;
                      const isPositive = catInfo.group === 'positive';

                      return (
                        <div
                          key={catId}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                            isPositive
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                              : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                          }`}
                        >
                          <span>{catInfo.nameRu}:</span>
                          <span className="font-mono text-white">+{val} порции</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedDish(null)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all"
              >
                Отмена
              </button>
              <button
                onClick={() => handleQuickAddDirect(selectedDish, portionAmount)}
                className="flex-[2] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить в {selectedMealType === 'breakfast' ? 'Завтрак' : selectedMealType === 'lunch' ? 'Обед' : selectedMealType === 'dinner' ? 'Ужин' : 'Перекус'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
