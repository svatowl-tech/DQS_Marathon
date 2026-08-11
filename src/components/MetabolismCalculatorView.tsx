import React, { useState, useMemo } from 'react';
import {
  Flame,
  Calculator,
  Activity,
  Heart,
  TrendingDown,
  Scale,
  Sparkles,
  Info,
  CheckCircle,
  Apple,
  Dumbbell,
} from 'lucide-react';
import { UserSettings } from '../types';

interface MetabolismCalculatorViewProps {
  settings?: UserSettings;
  onUpdateSettings?: (settings: UserSettings) => void;
}

type Gender = 'female' | 'male';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'extreme';
type TargetGoal = 'fat_loss' | 'maintenance' | 'muscle_gain';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { name: string; val: number; desc: string }> = {
  sedentary: { name: 'Минимальная (сидячая работа)', val: 1.2, desc: 'Сидячая работа, нет тренировок' },
  light: { name: 'Легкая (1-3 тренировки/нед)', val: 1.375, desc: 'Легкие нагрузки, ходьба' },
  moderate: { name: 'Умеренная (3-5 тренировок/нед)', val: 1.55, desc: 'Средняя активность, спортзалы' },
  active: { name: 'Высокая (6-7 тренировок/нед)', val: 1.725, desc: 'Интенсивные ежедневные тренировки' },
  extreme: { name: 'Экстремальная (тяжелый труд/спорт)', val: 1.9, desc: 'Тяжелый физический труд' },
};

export const MetabolismCalculatorView: React.FC<MetabolismCalculatorViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [gender, setGender] = useState<Gender>((settings?.gender as Gender) || 'female');
  const [age, setAge] = useState<number>(settings?.age || 30);
  const [height, setHeight] = useState<number>(settings?.heightCm || settings?.height || 168);
  const [weight, setWeight] = useState<number>(settings?.weightKg || settings?.startWeight || 68);
  const [bodyFat, setBodyFat] = useState<number>(settings?.bodyFatPct || 22);
  const [activity, setActivity] = useState<ActivityLevel>((settings?.activityLevel as ActivityLevel) || 'moderate');
  const [goal, setGoal] = useState<TargetGoal>((settings?.metabolismGoal as TargetGoal) || 'fat_loss');
  const [deficitPct, setDeficitPct] = useState<number>(settings?.deficitPct || 15);

  // Sync inputs to UserSettings for persistent state
  React.useEffect(() => {
    if (onUpdateSettings && settings) {
      onUpdateSettings({
        ...settings,
        gender,
        age,
        heightCm: height,
        height,
        weightKg: weight,
        bodyFatPct: bodyFat,
        activityLevel: activity,
        metabolismGoal: goal,
        deficitPct,
      });
    }
  }, [gender, age, height, weight, bodyFat, activity, goal, deficitPct]);

  // Formulas calculations
  const mifflinBMR = useMemo(() => {
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  }, [gender, weight, height, age]);

  const harrisBMR = useMemo(() => {
    if (gender === 'male') {
      return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    } else {
      return 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
    }
  }, [gender, weight, height, age]);

  const katchBMR = useMemo(() => {
    if (!bodyFat || bodyFat <= 0) return null;
    const lbm = weight * (1 - bodyFat / 100);
    return 370 + 21.6 * lbm;
  }, [weight, bodyFat]);

  const activityMultiplier = ACTIVITY_MULTIPLIERS[activity].val;
  const tdee = Math.round(mifflinBMR * activityMultiplier);

  // Target Caloric Intake
  const targetCalories = useMemo(() => {
    if (goal === 'fat_loss') {
      return Math.round(tdee * (1 - deficitPct / 100));
    } else if (goal === 'muscle_gain') {
      return Math.round(tdee * 1.1);
    }
    return tdee;
  }, [tdee, goal, deficitPct]);

  // Macronutrient calculation (P/F/C)
  const macros = useMemo(() => {
    // Protein: 1.8g / kg
    const pGrams = Math.round(weight * 1.8);
    const pKcal = pGrams * 4;

    // Fat: 0.9g / kg
    const fGrams = Math.round(weight * 0.9);
    const fKcal = fGrams * 9;

    // Carbs: Rest of calories
    const remainingKcal = Math.max(0, targetCalories - pKcal - fKcal);
    const cGrams = Math.round(remainingKcal / 4);

    return {
      proteinGrams: pGrams,
      proteinKcal: pKcal,
      fatGrams: fGrams,
      fatKcal: fKcal,
      carbGrams: cGrams,
      carbKcal: remainingKcal,
    };
  }, [weight, targetCalories]);

  return (
    <div className="space-y-6 pb-12 w-full max-w-[1800px] mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111] rounded-2xl p-6 border border-rose-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-6 h-6 text-rose-400 fill-rose-400/20" />
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Калькулятор Метаболизма</h1>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Точный расчет базового обмена веществ (BMR) по научным формулам Миффлина-Сан Жеора, Харриса-Бенедикта и Кетча-Макардла, а также индивидуальный норматив БЖУ.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Panel */}
        <div className="lg:col-span-5 bg-[#111] p-6 rounded-2xl border border-white/5 shadow-md space-y-5">
          <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-rose-400" />
            <span>Параметры тела</span>
          </h2>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Пол</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  gender === 'female'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                👩 Женский
              </button>
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  gender === 'male'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                👨 Мужской
              </button>
            </div>
          </div>

          {/* Age, Height, Weight */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Возраст</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Рост (см)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Вес (кг)</label>
              <input
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm text-slate-100"
              />
            </div>
          </div>

          {/* Body Fat (Optional) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-400">
                Процент жира (%) <span className="text-slate-500 font-normal">(опционально)</span>
              </label>
              <span className="text-xs font-bold text-slate-200">{bodyFat}%</span>
            </div>
            <input
              type="range"
              min="8"
              max="50"
              value={bodyFat}
              onChange={(e) => setBodyFat(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Уровень активности</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm text-slate-100 cursor-pointer"
            >
              {Object.entries(ACTIVITY_MULTIPLIERS).map(([key, item]) => (
                <option key={key} value={key} className="bg-[#1a1a1e] text-slate-100">
                  {item.name} (×{item.val})
                </option>
              ))}
            </select>
          </div>

          {/* Goal selection */}
          <div className="border-t border-white/10 pt-4">
            <label className="block text-xs font-semibold text-slate-400 mb-2">Цель питания</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setGoal('fat_loss')}
                className={`p-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                  goal === 'fat_loss'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                Похудение
              </button>
              <button
                type="button"
                onClick={() => setGoal('maintenance')}
                className={`p-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                  goal === 'maintenance'
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                Баланс
              </button>
              <button
                type="button"
                onClick={() => setGoal('muscle_gain')}
                className={`p-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                  goal === 'muscle_gain'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                Набор массы
              </button>
            </div>
          </div>

          {goal === 'fat_loss' && (
            <div>
              <div className="flex justify-between text-xs mb-1 font-semibold text-slate-400">
                <span>Процент дефицита</span>
                <span className="text-rose-400 font-bold">{deficitPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="25"
                step="1"
                value={deficitPct}
                onChange={(e) => setDeficitPct(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Right Calculation Results Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main TDEE & Target Box */}
          <div className="bg-[#111] rounded-2xl p-6 border border-rose-500/20 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1">
                <Flame className="w-4 h-4 text-rose-400" /> Целевая калорийность суточного рациона
              </span>
              <span className="bg-rose-500/20 text-rose-300 text-xs px-2.5 py-1 rounded-full font-bold border border-rose-500/30">
                {goal === 'fat_loss'
                  ? `Дефицит -${deficitPct}%`
                  : goal === 'muscle_gain'
                  ? 'Профицит +10%'
                  : 'Поддержание'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl md:text-5xl font-black text-slate-100">{targetCalories}</span>
              <span className="text-xl text-slate-400 font-medium">ккал / день</span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div>
                <span className="text-xs text-slate-400 block">Базовый метаболизм (BMR):</span>
                <span className="text-lg font-bold text-slate-200">{Math.round(mifflinBMR)} ккал</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Суточный расход (TDEE):</span>
                <span className="text-lg font-bold text-slate-200">{tdee} ккал</span>
              </div>
            </div>
          </div>

          {/* Formulas Comparison Table */}
          <div className="bg-[#111] p-6 rounded-2xl border border-white/5 shadow-md">
            <h3 className="font-bold text-slate-100 text-base mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Сравнение формул BMR</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <div className="font-semibold text-slate-200 text-sm">Миффлина-Сан Жеора (Золотой стандарт)</div>
                  <div className="text-xs text-slate-400">Самая точная для современного человека</div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-slate-100">{Math.round(mifflinBMR)}</span>
                  <span className="text-xs text-slate-400 block">ккал</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <div className="font-semibold text-slate-200 text-sm">Харриса-Бенедикта (Классическая)</div>
                  <div className="text-xs text-slate-400">Основана на антропометрии</div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-slate-100">{Math.round(harrisBMR)}</span>
                  <span className="text-xs text-slate-400 block">ккал</span>
                </div>
              </div>

              {katchBMR && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <div className="font-semibold text-slate-200 text-sm">Кетча-Макардла (по сухой массе)</div>
                    <div className="text-xs text-slate-400">Учитывает {bodyFat}% жира тела</div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-slate-100">{Math.round(katchBMR)}</span>
                    <span className="text-xs text-slate-400 block">ккал</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recommended Macros Breakdown (БЖУ) */}
          <div className="bg-[#111] p-6 rounded-2xl border border-white/5 shadow-md">
            <h3 className="font-bold text-slate-100 text-base mb-4 flex items-center gap-2">
              <Apple className="w-5 h-5 text-emerald-400" />
              <span>Рекомендуемое распределение БЖУ</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                <span className="text-xs font-semibold text-indigo-400 uppercase block mb-1">Белки</span>
                <span className="text-2xl font-black text-indigo-300">{macros.proteinGrams}г</span>
                <span className="text-xs text-indigo-400/80 block mt-1">{macros.proteinKcal} ккал</span>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-xs font-semibold text-amber-400 uppercase block mb-1">Жиры</span>
                <span className="text-2xl font-black text-amber-300">{macros.fatGrams}г</span>
                <span className="text-xs text-amber-400/80 block mt-1">{macros.fatKcal} ккал</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-xs font-semibold text-emerald-400 uppercase block mb-1">Углеводы</span>
                <span className="text-2xl font-black text-emerald-300">{macros.carbGrams}г</span>
                <span className="text-xs text-emerald-400/80 block mt-1">{macros.carbKcal} ккал</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
