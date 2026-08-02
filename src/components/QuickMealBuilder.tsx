import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Check,
  Zap,
  Coffee,
  Utensils,
  Apple,
  Clock,
  Trash2,
  BookmarkPlus,
  Flame,
} from 'lucide-react';
import { CategoryId, DailyLogEntry } from '../types';
import { DQS_CATEGORIES, calculateDailyDQS, getCategoryPoints } from '../utils/dqsEngine';

interface QuickMealBuilderProps {
  log: DailyLogEntry;
  onUpdateLog: (updated: DailyLogEntry) => void;
  onClose?: () => void;
}

interface MealPresetCombo {
  id: string;
  title: string;
  category: 'breakfast' | 'main' | 'snack' | 'fastfood';
  servings: Partial<Record<CategoryId, number>>;
  description: string;
}

const PRESET_COMBOS: MealPresetCombo[] = [
  {
    id: 'b1',
    title: '🍳 Овсянка ЦЗ + 2 Яйца + Кофе',
    category: 'breakfast',
    servings: { whole_grains: 1, lean_proteins: 1, healthy_drinks: 1, dairy: 1, oils_fats: 1 },
    description: 'Классический DQS-завтрак: овсянка на молоке, 2 вареных яйца, кофе без сахара',
  },
  {
    id: 'b2',
    title: '🫐 Творог 150г + Орехи + Ягоды',
    category: 'breakfast',
    servings: { dairy: 1, nuts_seeds: 1, vegetables: 0.5, healthy_drinks: 1 },
    description: 'Белковый завтрак с полезными жирами и антиоксидантами',
  },
  {
    id: 'b3',
    title: '🥑 Яичница + Овощи + Авокадо',
    category: 'breakfast',
    servings: { lean_proteins: 1, vegetables: 1, oils_fats: 1, healthy_drinks: 1 },
    description: '2 яйца на масле, свежий огурец/томат, авокадо',
  },
  {
    id: 'm1',
    title: '🍗 Курица + Гречка ЦЗ + Салат',
    category: 'main',
    servings: { lean_proteins: 1, whole_grains: 1, vegetables: 1, oils_fats: 1 },
    description: '120г филе, 60г гречки, 120г овощей с оливковым маслом',
  },
  {
    id: 'm2',
    title: '🐟 Лосось / Рыба + Рис Бурый + Овощи',
    category: 'main',
    servings: { lean_proteins: 1, whole_grains: 1, vegetables: 1, oils_fats: 1 },
    description: '120г рыбы, бурый рис, запеченные овощи',
  },
  {
    id: 'm3',
    title: '🥩 Говядина + Овощи на гриле',
    category: 'main',
    servings: { lean_proteins: 1, vegetables: 1.5, oils_fats: 1 },
    description: '120г говядины с миксом болгарского перца и кабачков',
  },
  {
    id: 'm4',
    title: '🥙 Шаверма домашняя (хорошая)',
    category: 'main',
    servings: { vegetables: 1, lean_proteins: 1, oils_fats: 1, refined_grains: 1 },
    description: 'Свежие овощи, курица, лаваш, ложка масла',
  },
  {
    id: 'm5',
    title: '🥔 Картофель 120г + Куриное бедро',
    category: 'main',
    servings: { refined_grains: 1, lean_proteins: 1, vegetables: 1, oils_fats: 1 },
    description: 'Картофель (обычный гарнир), бедро, свежая зелень',
  },
  {
    id: 's1',
    title: '🍏 Персик / Яблоко (120г)',
    category: 'snack',
    servings: { fruits: 1 },
    description: '1 средний свежий плод',
  },
  {
    id: 's2',
    title: '🥜 Горсть орехов (10г)',
    category: 'snack',
    servings: { nuts_seeds: 1 },
    description: 'Миндаль, грецкие или фундук без соли',
  },
  {
    id: 's3',
    title: '☕️ Кофе / Чай без сахара',
    category: 'snack',
    servings: { healthy_drinks: 1 },
    description: 'Бескалорийный напиток',
  },
  {
    id: 'f1',
    title: '🍕 Пицца (2 куска ~200г)',
    category: 'fastfood',
    servings: { processed_meats: 2 },
    description: '2 порции ультра-обработанной еды (-4б)',
  },
  {
    id: 'f2',
    title: '🍫 Сникерс (60г) / Торт',
    category: 'fastfood',
    servings: { sweets: 1 },
    description: '1 порция сладостей (-2б)',
  },
  {
    id: 'f3',
    title: '🥤 Газировка с сахаром / Сок (240мл)',
    category: 'fastfood',
    servings: { sugary_drinks_alcohol: 1 },
    description: '1 порция сладких напитков (-2б)',
  },
];

export const QuickMealBuilder: React.FC<QuickMealBuilderProps> = ({
  log,
  onUpdateLog,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<MealPresetCombo | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'breakfast' | 'main' | 'snack' | 'fastfood'>('all');
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const filteredPresets = PRESET_COMBOS.filter(
    (p) => activeCategory === 'all' || p.category === activeCategory
  );

  const handleApplyPreset = (preset: MealPresetCombo) => {
    const updatedServings = { ...log.servings };
    Object.entries(preset.servings).forEach(([catId, count]) => {
      const key = catId as CategoryId;
      updatedServings[key] = (updatedServings[key] || 0) + (count || 0);
    });

    const updatedScore = calculateDailyDQS(updatedServings, log.diversity);

    onUpdateLog({
      ...log,
      servings: updatedServings,
      calculatedScore: updatedScore,
    });

    setAppliedNotification(`Добавлено: ${preset.title}`);
    setTimeout(() => setAppliedNotification(null), 2500);
  };

  return (
    <div className="bg-[#111] border border-emerald-500/30 rounded-2xl p-5 shadow-2xl space-y-4 text-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              ⚡ Быстрый Конструктор Питания
            </h3>
            <p className="text-xs text-slate-400">Сборка приема пищи за 1 секунду</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1 bg-white/5 rounded-lg border border-white/10"
          >
            Закрыть
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5 text-xs font-bold">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeCategory === 'all'
              ? 'bg-emerald-500 text-black font-bold shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          Все комбо
        </button>
        <button
          onClick={() => setActiveCategory('breakfast')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeCategory === 'breakfast'
              ? 'bg-emerald-500 text-black font-bold shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          🍳 Завтраки
        </button>
        <button
          onClick={() => setActiveCategory('main')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeCategory === 'main'
              ? 'bg-emerald-500 text-black font-bold shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          🥗 Обеды & Ужины
        </button>
        <button
          onClick={() => setActiveCategory('snack')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeCategory === 'snack'
              ? 'bg-emerald-500 text-black font-bold shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          🍏 Перекусы
        </button>
        <button
          onClick={() => setActiveCategory('fastfood')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            activeCategory === 'fastfood'
              ? 'bg-emerald-500 text-black font-bold shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          🍔 Десерты & Фастфуд
        </button>
      </div>

      {appliedNotification && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn">
          <span>✓ {appliedNotification}</span>
          <span className="text-[10px] font-mono text-emerald-400">Порции начислены в дневник!</span>
        </div>
      )}

      {/* Grid of Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-2 group"
          >
            <div>
              <h4 className="font-bold text-slate-100 text-xs flex items-center justify-between">
                <span>{preset.title}</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">{preset.description}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex flex-wrap gap-1">
                {Object.entries(preset.servings).map(([catId, count]) => {
                  const cat = DQS_CATEGORIES.find((c) => c.id === catId);
                  return (
                    <span
                      key={catId}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-slate-300"
                    >
                      {cat?.nameRu.split(' ')[0]}: +{count}
                    </span>
                  );
                })}
              </div>

              <button
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg flex items-center gap-1 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Внести</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
