import React, { useState } from 'react';
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
} from 'lucide-react';
import { CategoryId, DailyLogEntry, FavoriteMealTemplate, UserSettings } from '../types';
import { DQS_CATEGORIES, calculateDailyDQS } from '../utils/dqsEngine';

interface QuickAddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: DailyLogEntry;
  onUpdateLog: (updated: DailyLogEntry) => void;
  settings?: UserSettings;
  onUpdateSettings?: (settings: UserSettings) => void;
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
  const [hungerBefore, setHungerBefore] = useState<number>(log.journal.hungerBefore ?? 5);
  const [fullnessAfter, setFullnessAfter] = useState<number>(log.journal.fullnessAfter ?? 7);
  const [mood, setMood] = useState<'great' | 'good' | 'normal' | 'tired' | 'stressed' | undefined>(log.journal.mood);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [appliedTemplateName, setAppliedTemplateName] = useState<string | null>(null);

  // State for saving custom template
  const [showSaveTemplateInput, setShowSaveTemplateInput] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [templateSavedMsg, setTemplateSavedMsg] = useState(false);

  if (!isOpen) return null;

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMeal = () => {
    const updatedServings = { ...log.servings };
    Object.entries(servingsAdded).forEach(([key, count]) => {
      const catId = key as CategoryId;
      updatedServings[catId] = (updatedServings[catId] || 0) + count;
    });

    const updatedPhotos = [...log.photos];
    if (photoUrl) {
      const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      updatedPhotos.push({
        id: `p_${Date.now()}`,
        dataUrl: photoUrl,
        mealType,
        timestamp: nowFormatted,
        caption: caption || `${MEAL_TYPES.find((m) => m.id === mealType)?.label}`,
        hungerBefore,
        fullnessAfter,
        mood,
      });
    }

    const newScore = calculateDailyDQS(updatedServings, log.diversity);

    onUpdateLog({
      ...log,
      servings: updatedServings,
      photos: updatedPhotos,
      calculatedScore: newScore,
      journal: {
        ...log.journal,
        hungerBefore: hungerBefore ?? log.journal.hungerBefore,
        fullnessAfter: fullnessAfter ?? log.journal.fullnessAfter,
        mood: mood ?? log.journal.mood,
      },
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
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
                Запись Приёма Пищи
              </h2>
              <p className="text-[11px] text-zinc-400">
                Быстрый ввод порций и любимых шаблонов за {log.date}
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

            {/* Save Button */}
            <div className="pt-2">
              <button
                onClick={handleSaveMeal}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>Сохранить прием пищи ({totalAddedCount} порций)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
