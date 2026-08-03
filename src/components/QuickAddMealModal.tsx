import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Plus,
  Zap,
  Upload,
  CheckCircle2,
  Bookmark,
  Star,
  Check,
  Search,
  BookOpen,
  Utensils,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { CategoryId, DailyLogEntry, FavoriteMealTemplate, PhotoEntry, UserSettings } from '../types';
import { DQS_CATEGORIES, calculateDailyDQS } from '../utils/dqsEngine';
import { compressImage } from '../utils/imageCompressor';
import { searchFoodDictionary, calculatePortion } from '../utils/foodCalculator';

interface QuickAddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: DailyLogEntry;
  onUpdateLog: (updated: DailyLogEntry) => void;
  settings?: UserSettings;
  onUpdateSettings?: (settings: UserSettings) => void;
  initialMealToEdit?: PhotoEntry | null;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_TYPES: { id: MealType; label: string; icon: string }[] = [
  { id: 'breakfast', label: 'Завтрак', icon: '🥞' },
  { id: 'lunch', label: 'Обед', icon: '🥗' },
  { id: 'dinner', label: 'Ужин', icon: '🍗' },
  { id: 'snack', label: 'Перекус', icon: '🍏' },
];

export const QuickAddMealModal: React.FC<QuickAddMealModalProps> = ({
  isOpen,
  onClose,
  log,
  onUpdateLog,
  settings,
  onUpdateSettings,
  initialMealToEdit,
}) => {
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [categoryTab, setCategoryTab] = useState<'healthy' | 'restricted'>('healthy');
  const [servingsAdded, setServingsAdded] = useState<Record<CategoryId, number>>({
    vegetables: 0,
    fruits: 0,
    nuts_seeds: 0,
    whole_grains: 0,
    lean_proteins: 0,
    dairy: 0,
    oils_fats: 0,
    healthy_drinks: 0,
    refined_grains: 0,
    sweets: 0,
    processed_meats: 0,
    sugary_drinks_alcohol: 0,
  });

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [hungerBefore, setHungerBefore] = useState<number>(log.journal?.hungerBefore ?? 5);
  const [fullnessAfter, setFullnessAfter] = useState<number>(log.journal?.fullnessAfter ?? 7);
  const [mood, setMood] = useState<'great' | 'good' | 'normal' | 'tired' | 'stressed' | undefined>(log.journal?.mood);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [appliedTemplateName, setAppliedTemplateName] = useState<string | null>(null);

  // State for saving custom template
  const [showSaveTemplateInput, setShowSaveTemplateInput] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [templateSavedMsg, setTemplateSavedMsg] = useState(false);

  // Smart Food Dictionary Search State
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [autoCategoryNotice, setAutoCategoryNotice] = useState<string | null>(null);

  // Selected Dish Quantity Config State
  const [selectedFoodItem, setSelectedFoodItem] = useState<any | null>(null);
  const [foodPortionAmount, setFoodPortionAmount] = useState<number>(200);
  const [foodMultiplier, setFoodMultiplier] = useState<number>(1.0);

  // Reset or populate form data every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      if (initialMealToEdit) {
        setMealType(initialMealToEdit.mealType);
        setPhotoUrl(initialMealToEdit.dataUrl || null);
        setCaption(initialMealToEdit.caption || '');
        setHungerBefore(initialMealToEdit.hungerBefore ?? 5);
        setFullnessAfter(initialMealToEdit.fullnessAfter ?? 7);
        setMood(initialMealToEdit.mood);
        setServingsAdded({
          vegetables: 0,
          fruits: 0,
          nuts_seeds: 0,
          whole_grains: 0,
          lean_proteins: 0,
          dairy: 0,
          oils_fats: 0,
          healthy_drinks: 0,
          refined_grains: 0,
          sweets: 0,
          processed_meats: 0,
          sugary_drinks_alcohol: 0,
          ...(initialMealToEdit.servingsAdded || {}),
        });
      } else {
        setMealType('lunch');
        setServingsAdded({
          vegetables: 0,
          fruits: 0,
          nuts_seeds: 0,
          whole_grains: 0,
          lean_proteins: 0,
          dairy: 0,
          oils_fats: 0,
          healthy_drinks: 0,
          refined_grains: 0,
          sweets: 0,
          processed_meats: 0,
          sugary_drinks_alcohol: 0,
        });
        setPhotoUrl(null);
        setCaption('');
        setHungerBefore(log.journal?.hungerBefore ?? 5);
        setFullnessAfter(log.journal?.fullnessAfter ?? 7);
        setMood(log.journal?.mood);
      }
      setSavedSuccess(false);
      setAppliedTemplateName(null);
      setShowSaveTemplateInput(false);
      setNewTemplateTitle('');
      setTemplateSavedMsg(false);
      setFoodSearchQuery('');
      setAutoCategoryNotice(null);
      setSelectedFoodItem(null);
      setFoodPortionAmount(200);
      setFoodMultiplier(1.0);
    }
  }, [isOpen, initialMealToEdit]);

  if (!isOpen) return null;

  const searchResults = searchFoodDictionary(foodSearchQuery);

  const handleSelectDictionaryFood = (item: any, directAdd: boolean = false) => {
    const initialAmount = searchResults.detectedAmount || item.defaultAmount || 200;
    
    if (directAdd) {
      // Direct add standard portion
      const calc = calculatePortion(item, initialAmount);
      setServingsAdded((prev) => {
        const updated = { ...prev };
        Object.entries(calc.servings).forEach(([catId, val]) => {
          const key = catId as CategoryId;
          updated[key] = Math.round(((updated[key] || 0) + (val || 0)) * 10) / 10;
        });
        return updated;
      });

      setCaption((prev) => {
        const newText = `${item.title} (${initialAmount}${item.unit})`;
        return prev ? `${prev}, ${newText}` : newText;
      });

      setAutoCategoryNotice(`Авто-распределено: ${item.title} (${calc.summaryText})`);
      setFoodSearchQuery('');
      setTimeout(() => setAutoCategoryNotice(null), 3000);
    } else {
      // Open portion quantity adjuster panel
      setSelectedFoodItem(item);
      setFoodPortionAmount(initialAmount);
      setFoodMultiplier(1.0);
      setFoodSearchQuery('');
    }
  };

  const handleMultiplierChange = (mult: number) => {
    const clampedMult = Math.max(0.1, Math.min(5, Math.round(mult * 100) / 100));
    setFoodMultiplier(clampedMult);
    if (selectedFoodItem) {
      const baseAmt = selectedFoodItem.defaultAmount || 200;
      setFoodPortionAmount(Math.round(baseAmt * clampedMult));
    }
  };

  const handlePortionAmountChange = (amt: number) => {
    const clampedAmt = Math.max(10, amt);
    setFoodPortionAmount(clampedAmt);
    if (selectedFoodItem && selectedFoodItem.defaultAmount) {
      setFoodMultiplier(Math.round((clampedAmt / selectedFoodItem.defaultAmount) * 100) / 100);
    }
  };

  const handleConfirmAddConfiguredFood = () => {
    if (!selectedFoodItem) return;
    const calc = calculatePortion(selectedFoodItem, foodPortionAmount);

    setServingsAdded((prev) => {
      const updated = { ...prev };
      Object.entries(calc.servings).forEach(([catId, val]) => {
        const key = catId as CategoryId;
        updated[key] = Math.round(((updated[key] || 0) + (val || 0)) * 10) / 10;
      });
      return updated;
    });

    const descText = foodMultiplier !== 1.0
      ? `${selectedFoodItem.title} (${foodPortionAmount}${selectedFoodItem.unit}, ${foodMultiplier}x порции)`
      : `${selectedFoodItem.title} (${foodPortionAmount}${selectedFoodItem.unit})`;

    setCaption((prev) => (prev ? `${prev}, ${descText}` : descText));

    setAutoCategoryNotice(`Добавлено: ${selectedFoodItem.title} (${calc.summaryText})`);
    setSelectedFoodItem(null);
    setTimeout(() => setAutoCategoryNotice(null), 3000);
  };

  const favoriteMeals: FavoriteMealTemplate[] = settings?.favoriteMeals || [];

  const handleApplyTemplate = (tpl: FavoriteMealTemplate) => {
    setMealType(tpl.mealType);
    const newServings = {
      vegetables: 0,
      fruits: 0,
      nuts_seeds: 0,
      whole_grains: 0,
      lean_proteins: 0,
      dairy: 0,
      oils_fats: 0,
      healthy_drinks: 0,
      refined_grains: 0,
      sweets: 0,
      processed_meats: 0,
      sugary_drinks_alcohol: 0,
      ...tpl.servings,
    };
    setServingsAdded(newServings);
    if (tpl.hungerBefore) setHungerBefore(tpl.hungerBefore);
    if (tpl.fullnessAfter) setFullnessAfter(tpl.fullnessAfter);

    setAppliedTemplateName(tpl.title);
    setTimeout(() => setAppliedTemplateName(null), 2000);
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!newTemplateTitle.trim() || !settings || !onUpdateSettings) return;

    // Filter only non-zero servings
    const nonZeroServings: Partial<Record<CategoryId, number>> = {};
    Object.entries(servingsAdded).forEach(([key, val]) => {
      const count = Number(val);
      if (count > 0) nonZeroServings[key as CategoryId] = count;
    });

    const newTpl: FavoriteMealTemplate = {
      id: `fav_${Date.now()}`,
      title: newTemplateTitle.trim(),
      mealType,
      servings: nonZeroServings,
      hungerBefore,
      fullnessAfter,
    };

    onUpdateSettings({
      ...settings,
      favoriteMeals: [...favoriteMeals, newTpl],
    });

    setNewTemplateTitle('');
    setShowSaveTemplateInput(false);
    setTemplateSavedMsg(true);
    setTimeout(() => setTemplateSavedMsg(false), 2000);
  };

  const handleServingChange = (catId: CategoryId, delta: number) => {
    setServingsAdded((prev) => ({
      ...prev,
      [catId]: Math.max(0, (prev[catId] || 0) + delta),
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1000, 0.75);
        setPhotoUrl(compressed);
      } catch (err) {
        console.error('Photo compression failed', err);
      }
    }
  };

  const handleSaveMeal = () => {
    const updatedServings = { ...log.servings };

    if (initialMealToEdit) {
      // Subtract old servings of this meal
      if (initialMealToEdit.servingsAdded) {
        Object.entries(initialMealToEdit.servingsAdded).forEach(([key, count]) => {
          const catId = key as CategoryId;
          const oldVal = Number(count) || 0;
          updatedServings[catId] = Math.max(0, Math.round(((updatedServings[catId] || 0) - oldVal) * 10) / 10);
        });
      }
      // Add new servings of this meal
      Object.entries(servingsAdded).forEach(([key, count]) => {
        const catId = key as CategoryId;
        const newVal = Number(count) || 0;
        updatedServings[catId] = Math.round(((updatedServings[catId] || 0) + newVal) * 10) / 10;
      });

      const updatedPhotos = log.photos.map((p) => {
        if (p.id === initialMealToEdit.id) {
          return {
            ...p,
            mealType,
            dataUrl: photoUrl || undefined,
            caption: caption || `${MEAL_TYPES.find((m) => m.id === mealType)?.label}`,
            hungerBefore,
            fullnessAfter,
            mood,
            servingsAdded: { ...servingsAdded },
          };
        }
        return p;
      });

      const newScore = calculateDailyDQS(updatedServings, log.diversity);

      onUpdateLog({
        ...log,
        servings: updatedServings,
        photos: updatedPhotos,
        calculatedScore: newScore,
        journal: {
          ...log.journal,
          hungerBefore: hungerBefore ?? log.journal?.hungerBefore,
          fullnessAfter: fullnessAfter ?? log.journal?.fullnessAfter,
          mood: mood ?? log.journal?.mood,
        },
      });
    } else {
      // Add new meal entry
      Object.entries(servingsAdded).forEach(([key, count]) => {
        const catId = key as CategoryId;
        const newVal = Number(count) || 0;
        updatedServings[catId] = Math.round(((updatedServings[catId] || 0) + newVal) * 10) / 10;
      });

      const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMeal: PhotoEntry = {
        id: `meal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        dataUrl: photoUrl || undefined,
        mealType,
        timestamp: nowFormatted,
        caption: caption || `${MEAL_TYPES.find((m) => m.id === mealType)?.label}`,
        hungerBefore,
        fullnessAfter,
        mood,
        servingsAdded: { ...servingsAdded },
      };

      const updatedPhotos = [...log.photos, newMeal];
      const newScore = calculateDailyDQS(updatedServings, log.diversity);

      onUpdateLog({
        ...log,
        servings: updatedServings,
        photos: updatedPhotos,
        calculatedScore: newScore,
        journal: {
          ...log.journal,
          hungerBefore: hungerBefore ?? log.journal?.hungerBefore,
          fullnessAfter: fullnessAfter ?? log.journal?.fullnessAfter,
          mood: mood ?? log.journal?.mood,
        },
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleDeleteThisMeal = () => {
    if (!initialMealToEdit) return;
    if (confirm('Вы уверены, что хотите удалить этот приём пищи? Начисленные порции будут отменены.')) {
      const updatedServings = { ...log.servings };
      if (initialMealToEdit.servingsAdded) {
        Object.entries(initialMealToEdit.servingsAdded).forEach(([key, count]) => {
          const catId = key as CategoryId;
          const num = Number(count) || 0;
          updatedServings[catId] = Math.max(0, Math.round(((updatedServings[catId] || 0) - num) * 10) / 10);
        });
      }
      const updatedPhotos = log.photos.filter((p) => p.id !== initialMealToEdit.id);
      const newScore = calculateDailyDQS(updatedServings, log.diversity);

      onUpdateLog({
        ...log,
        servings: updatedServings,
        photos: updatedPhotos,
        calculatedScore: newScore,
      });
      onClose();
    }
  };

  const healthyCategories = DQS_CATEGORIES.filter((c) => c.group === 'positive');
  const restrictedCategories = DQS_CATEGORIES.filter((c) => c.group === 'negative');

  const activeCategories = categoryTab === 'healthy' ? healthyCategories : restrictedCategories;

  // Calculate total added in current session
  const totalAddedCount: number = Object.values(servingsAdded).reduce<number>((a, b) => a + (Number(b) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-zinc-100 relative my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {initialMealToEdit ? 'Редактирование приёма пищи' : 'Запись приёма пищи'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {initialMealToEdit
                  ? `Изменение порций и состава блюда (${initialMealToEdit.timestamp})`
                  : `Быстрый ввод порций и любимых шаблонов за ${log.date}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-10 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-100">Сохранено!</h3>
            <p className="text-xs text-zinc-400">Порции начислены, DQS обновлен.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
            {/* FAVORITE MEAL TEMPLATES CHIPS */}
            {favoriteMeals.length > 0 && (
              <div className="space-y-1.5 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>Быстрые любимые шаблоны:</span>
                  </span>
                  {appliedTemplateName && (
                    <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">
                      ✓ Применён: {appliedTemplateName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {favoriteMeals.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-amber-500/20 border border-white/[0.08] hover:border-amber-500/30 text-xs text-zinc-200 hover:text-amber-300 font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                    >
                      <span>{tpl.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 1. Meal Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">1. Приём пищи:</label>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMealType(m.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      mealType === m.id
                        ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-md'
                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Photo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">2. Фото тарелки (необязательно):</label>
              {photoUrl ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-emerald-500/40 group">
                  <img src={photoUrl} alt="Meal" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotoUrl(null)}
                    className="absolute top-1 right-1 bg-black/80 p-1 rounded-full text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <label className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all text-xs text-emerald-400 font-semibold">
                    <Camera className="w-4 h-4" />
                    <span>Сделать снимок</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                  </label>

                  <label className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center gap-2 cursor-pointer transition-all text-xs text-zinc-300 font-semibold">
                    <Upload className="w-4 h-4 text-zinc-400" />
                    <span>Галерея</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* 2.5 Smart Food Dictionary Search */}
            <div className="space-y-2 p-3 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Умный словарь еды (быстрый авто-расчет):</span>
                </label>
                <span className="text-[10px] text-zinc-400">Например: Борщ 200г</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={foodSearchQuery}
                  onChange={(e) => setFoodSearchQuery(e.target.value)}
                  placeholder="Введите блюдо (например: Борщ 200g, Шаурма, Цезарь)..."
                  className="w-full bg-zinc-900/90 border border-emerald-500/40 focus:border-emerald-500 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                />
                {foodSearchQuery && (
                  <button
                    onClick={() => setFoodSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Notification toast for auto categorization */}
              {autoCategoryNotice && (
                <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{autoCategoryNotice}</span>
                </div>
              )}

              {/* Search results popup dropdown */}
              {foodSearchQuery.trim().length > 0 && (
                <div className="max-h-56 overflow-y-auto space-y-1 bg-zinc-950 border border-zinc-700 rounded-xl p-1.5 shadow-2xl">
                  {searchResults.results.slice(0, 10).map((item) => {
                    const amount = searchResults.detectedAmount || item.defaultAmount;
                    const calc = calculatePortion(item, amount);

                    return (
                      <div
                        key={item.id}
                        className="p-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 transition-all flex items-center justify-between gap-2 group"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectDictionaryFood(item, false)}
                          className="text-left space-y-0.5 min-w-0 flex-1 hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          <div className="text-xs font-bold text-zinc-100 group-hover:text-emerald-300 truncate">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {calc.summaryText}
                          </div>
                        </button>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSelectDictionaryFood(item, false)}
                            title="Настроить количество еды"
                            className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-all"
                          >
                            Указать порцию
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectDictionaryFood(item, true)}
                            title="Быстро добавить 1 порцию"
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[10px] font-mono font-bold"
                          >
                            +{amount}{item.unit}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 🍲 Настройка количества съеденного (Food Quantity Adjuster) */}
              {selectedFoodItem && (
                <div className="bg-zinc-950 border border-emerald-500/50 rounded-2xl p-3.5 space-y-3 shadow-2xl animate-fade-in">
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                        <Utensils className="w-3 h-3 text-emerald-400" />
                        <span>Настройка количества еды</span>
                      </div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <span>{selectedFoodItem.title}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">{selectedFoodItem.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFoodItem(null)}
                      className="text-zinc-400 hover:text-white p-1 rounded-lg bg-zinc-900 border border-zinc-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Интерактивная строка: Количество еды */}
                  <div className="space-y-2.5 bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-200">
                        Количество еды / Съедено:
                      </label>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-emerald-400 font-bold">{foodPortionAmount} {selectedFoodItem.unit}</span>
                        <span className="text-zinc-500">({foodMultiplier}x от стандартной)</span>
                      </div>
                    </div>

                    {/* Быстрый выбор долей порции (¼, ½, ¾, 1, 1.5, 2) */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Степпер -/+ */}
                      <div className="flex items-center bg-zinc-950 border border-zinc-700 rounded-lg p-0.5 mr-1">
                        <button
                          type="button"
                          onClick={() => handleMultiplierChange(foodMultiplier - 0.25)}
                          className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-xs font-mono font-bold text-emerald-400">
                          {foodMultiplier}x
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMultiplierChange(foodMultiplier + 0.25)}
                          className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {[0.25, 0.5, 0.75, 1.0, 1.5, 2.0].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleMultiplierChange(preset)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                            Math.abs(foodMultiplier - preset) < 0.05
                              ? 'bg-emerald-500 text-black font-bold shadow-md'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                          }`}
                        >
                          {preset === 0.25 ? '¼' : preset === 0.5 ? '½' : preset === 0.75 ? '¾' : preset === 1.0 ? '1' : `${preset}`} порции
                        </button>
                      ))}
                    </div>

                    {/* Ввод точного веса и слайдер */}
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="range"
                        min={20}
                        max={Math.max(600, (selectedFoodItem.defaultAmount || 200) * 3)}
                        step={10}
                        value={foodPortionAmount}
                        onChange={(e) => handlePortionAmountChange(parseInt(e.target.value) || 20)}
                        className="flex-1 accent-emerald-500 cursor-pointer"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min={10}
                          value={foodPortionAmount}
                          onChange={(e) => handlePortionAmountChange(parseInt(e.target.value) || 10)}
                          className="w-16 bg-zinc-950 border border-emerald-500/50 rounded-lg px-2 py-1 text-right text-xs font-bold font-mono text-emerald-400 focus:outline-none"
                        />
                        <span className="text-xs text-zinc-400 font-mono">{selectedFoodItem.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* DQS Preview Breakdown */}
                  {(() => {
                    const calc = calculatePortion(selectedFoodItem, foodPortionAmount);
                    return (
                      <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl space-y-1.5 text-xs">
                        <div className="text-[11px] text-zinc-400">
                          Будет добавлено в DQS-дневник ({foodPortionAmount}{selectedFoodItem.unit}):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(calc.servings).map(([catId, val]) => {
                            const catInfo = DQS_CATEGORIES.find((c) => c.id === catId);
                            if (!catInfo || !val) return null;
                            const isPositive = catInfo.group === 'positive';
                            return (
                              <span
                                key={catId}
                                className={`px-2 py-1 rounded-md text-[11px] font-bold border ${
                                  isPositive
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                }`}
                              >
                                {catInfo.nameRu}: +{val}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Кнопка добавления */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedFoodItem(null)}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAddConfiguredFood}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Добавить {foodMultiplier} порции ({foodPortionAmount}{selectedFoodItem.unit})</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Categories with Tabs */}
            <div className="space-y-2 pt-1 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">3. Укажите порции:</label>
                <span className="text-[10px] text-zinc-500">1 кулак = 1 порция</span>
              </div>

              {/* Segmented Control */}
              <div className="grid grid-cols-2 p-1 bg-black/40 border border-white/[0.06] rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCategoryTab('healthy')}
                  className={`py-1.5 rounded-lg transition-all ${
                    categoryTab === 'healthy'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  🥗 Здоровые продукты (+)
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryTab('restricted')}
                  className={`py-1.5 rounded-lg transition-all ${
                    categoryTab === 'restricted'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  🍕 Ограничиваемые (-)
                </button>
              </div>

              {/* Active Category Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeCategories.map((cat) => {
                  const currentAdded = servingsAdded[cat.id] || 0;
                  return (
                    <div
                      key={cat.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        currentAdded > 0
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-white/[0.02] border-white/[0.06]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-zinc-200 truncate">{cat.nameRu}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{cat.portionExample}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleServingChange(cat.id, -0.5)}
                          disabled={currentAdded <= 0}
                          className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-20 text-zinc-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          -
                        </button>

                        <span className="w-7 text-center font-mono font-bold text-xs text-emerald-400">
                          {currentAdded > 0 ? `+${currentAdded}` : '0'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleServingChange(cat.id, 0.5)}
                          className="w-6 h-6 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SAVE CURRENT MEAL AS TEMPLATE OPTION */}
            {totalAddedCount > 0 && settings && onUpdateSettings && (
              <div className="pt-2">
                {!showSaveTemplateInput ? (
                  <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-xl border border-white/[0.06]">
                    <span className="text-[11px] text-zinc-400">
                      Часто едите именно такой состав?
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSaveTemplateInput(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Сохранить в шаблоны</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-amber-300 block">
                      Сохранение любимого шаблона
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Название (напр. 'Любимый завтрак')"
                        value={newTemplateTitle}
                        onChange={(e) => setNewTemplateTitle(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCurrentAsTemplate}
                        className="px-3 py-1.5 bg-amber-400 text-black font-bold text-xs rounded-lg hover:bg-amber-300 transition-all cursor-pointer"
                      >
                        Сохранить
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSaveTemplateInput(false)}
                        className="p-1.5 text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {templateSavedMsg && (
                  <div className="mt-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Шаблон сохранен! Доступен в верхней панели шаблонов.</span>
                  </div>
                )}
              </div>
            )}

            {/* 4. Hunger & Mood Sliders */}
            <div className="space-y-3 pt-2 border-t border-white/[0.08]">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-semibold">
                    <span className="text-zinc-300">🍽️ Голод ДО</span>
                    <span className="text-emerald-400 font-mono">{hungerBefore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={hungerBefore}
                    onChange={(e) => setHungerBefore(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer h-1"
                  />
                </div>

                <div className="p-2.5 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-semibold">
                    <span className="text-zinc-300">🫄 Сытость ПОСЛЕ</span>
                    <span className="text-emerald-400 font-mono">{fullnessAfter}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={fullnessAfter}
                    onChange={(e) => setFullnessAfter(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer h-1"
                  />
                </div>
              </div>

              {/* Mood selector */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-zinc-400 block">Настроение:</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: 'great', label: 'Отлично', icon: '😊' },
                    { id: 'good', label: 'Хорошо', icon: '🙂' },
                    { id: 'normal', label: 'Норма', icon: '😐' },
                    { id: 'tired', label: 'Устал', icon: '😴' },
                    { id: 'stressed', label: 'Стресс', icon: '😤' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMood(m.id as any)}
                      className={`p-1.5 rounded-lg border text-[10px] font-semibold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        mood === m.id
                          ? 'bg-emerald-500 text-black border-emerald-400 font-bold scale-105'
                          : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="text-sm">{m.icon}</span>
                      <span className="truncate w-full text-center">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save & Delete Buttons */}
            <div className="pt-2 flex items-center gap-2">
              {initialMealToEdit && (
                <button
                  type="button"
                  onClick={handleDeleteThisMeal}
                  className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  title="Удалить приём пищи"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Удалить</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveMeal}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>
                  {initialMealToEdit
                    ? `Сохранить изменения (${totalAddedCount} порций)`
                    : `Сохранить прием пищи (${totalAddedCount} порций)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
