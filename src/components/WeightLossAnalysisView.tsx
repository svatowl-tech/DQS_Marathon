import React, { useMemo, useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Target,
  Sparkles,
  Calendar,
  Award,
  AlertCircle,
  Activity,
  CheckCircle,
  BarChart3,
  Flame,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { DailyLogEntry, UserSettings } from '../types';
import { formatDateRu, calculateDailyDQS } from '../utils/dqsEngine';

interface WeightLossAnalysisViewProps {
  logs: DailyLogEntry[];
  settings?: UserSettings;
}

export const WeightLossAnalysisView: React.FC<WeightLossAnalysisViewProps> = ({ logs, settings }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30); // 30, 60, 90 days

  // Weight logs sorted chronologically
  const weightEntries = useMemo(() => {
    return [...logs]
      .filter((l) => (l.morningWeight || l.weight) && (l.morningWeight || l.weight)! > 0)
      .map((l) => ({
        ...l,
        morningWeight: l.morningWeight || l.weight,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  // Target Weight
  const targetWeight = settings?.targetWeightKg || 65;
  const startWeight = weightEntries.length > 0 ? weightEntries[0].morningWeight! : settings?.weightKg || 75;
  const currentWeight =
    weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].morningWeight! : startWeight;

  const totalLost = startWeight - currentWeight;
  const totalToLose = Math.max(0, startWeight - targetWeight);
  const progressPct = totalToLose > 0 ? Math.min(100, Math.max(0, Math.round((totalLost / totalToLose) * 100))) : 0;

  // Calculate rate of weight loss over last 30 days or available period
  const weeklyRate = useMemo(() => {
    if (weightEntries.length < 2) return 0;
    const first = weightEntries[0];
    const last = weightEntries[weightEntries.length - 1];

    const d1 = new Date(first.date).getTime();
    const d2 = new Date(last.date).getTime();
    const daysDiff = Math.max(1, (d2 - d1) / (1000 * 3600 * 24));

    const totalDiff = first.morningWeight! - last.morningWeight!;
    const weeks = daysDiff / 7;
    return weeks > 0 ? totalDiff / weeks : 0;
  }, [weightEntries]);

  // Forecast date to reach target weight
  const estimatedTargetDate = useMemo(() => {
    if (weeklyRate <= 0 || currentWeight <= targetWeight) return null;
    const remainingKg = currentWeight - targetWeight;
    const weeksNeeded = remainingKg / weeklyRate;
    const daysNeeded = Math.round(weeksNeeded * 7);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysNeeded);
    return targetDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }, [currentWeight, targetWeight, weeklyRate]);

  // Weekly DQS score vs Weight Correlation Chart Data
  const chartData = useMemo(() => {
    return weightEntries.slice(-selectedPeriod).map((log) => {
      const dqs = calculateDailyDQS(log.servings || {}, log.diversity || {});
      return {
        date: formatDateRu(log.date).slice(0, 5),
        weight: log.morningWeight,
        dqsScore: dqs,
        waist: log.waist,
      };
    });
  }, [weightEntries, selectedPeriod]);

  // Average DQS in recent period
  const avgDQS = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, curr) => acc + curr.dqsScore, 0);
    return Math.round((sum / chartData.length) * 10) / 10;
  }, [chartData]);

  // Assessment of weight loss pace
  const paceAssessment = useMemo(() => {
    if (weeklyRate < 0) {
      return { text: 'Набор веса', color: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' };
    }
    if (weeklyRate >= 0.3 && weeklyRate <= 0.8) {
      return { text: 'Оптимальный темп (0.3-0.8 кг/нед)', color: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' };
    }
    if (weeklyRate > 0.8) {
      return { text: 'Быстрый темп (>0.8 кг/нед)', color: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30' };
    }
    return { text: 'Плавный / Плато', color: 'text-sky-400', badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/30' };
  }, [weeklyRate]);

  return (
    <div className="space-y-6 pb-12 w-full max-w-[1800px] mx-auto">
      {/* Banner */}
      <div className="bg-[#111] rounded-2xl p-6 border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-6 h-6 text-indigo-400" />
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Анализ Похудения и Динамика DQS</h1>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Корреляция индекса качества питания (DQS) со скоростью снижения жировой массы. Наглядный прогноз достижения целевого веса.
            </p>
          </div>
        </div>
      </div>

      {/* Main Target Progress Card */}
      <div className="bg-[#111] p-6 rounded-2xl border border-white/5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Прогресс цели</span>
            <div className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span>{startWeight} кг</span>
              <ArrowRight className="w-5 h-5 text-slate-500" />
              <span className="text-emerald-400">{currentWeight.toFixed(1)} кг</span>
              <ArrowRight className="w-5 h-5 text-slate-500" />
              <span className="text-indigo-400">{targetWeight} кг</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Выполнено</span>
            <span className="text-2xl font-black text-emerald-400">{progressPct}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>Сброшено: {totalLost > 0 ? `-${totalLost.toFixed(1)} кг` : '0 кг'}</span>
            <span>Осталось: {Math.max(0, currentWeight - targetWeight).toFixed(1)} кг</span>
          </div>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Средний темп сброса</div>
          <div className="text-2xl font-bold text-slate-100">
            {weeklyRate > 0 ? `-${weeklyRate.toFixed(2)} кг / нед` : '—'}
          </div>
          <div className="mt-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${paceAssessment.badge}`}>
              {paceAssessment.text}
            </span>
          </div>
        </div>

        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Средний балл DQS</div>
          <div className="text-2xl font-bold text-indigo-400">{avgDQS} / 32</div>
          <div className="text-xs text-slate-400 mt-2">
            {avgDQS >= 15 ? '🟢 Высокое качество рациона' : avgDQS >= 8 ? '🟡 Среднее качество' : '🔴 Требуется улучшение'}
          </div>
        </div>

        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Прогноз достижения цели</div>
          <div className="text-xl font-bold text-slate-100">
            {estimatedTargetDate ? estimatedTargetDate : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-2">При сохранении текущего темпа и DQS</div>
        </div>
      </div>

      {/* Synchronized Chart: Weight vs DQS Score */}
      <div className="bg-[#111] p-6 rounded-2xl border border-white/5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Динамика Веса и Качества Питания (DQS)</span>
            </h3>
            <p className="text-xs text-slate-400">
              График демонстрирует, как высокий балл DQS ускоряет жиросжигание
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[14, 30, 60].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedPeriod(days)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedPeriod === days
                    ? 'bg-indigo-500 text-white font-bold shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                }`}
              >
                {days} дней
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Недостаточно данных для графика. Добавьте взвешивания и записи DQS.
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#334155" />
                <YAxis yAxisId="left" domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#334155" />
                <YAxis yAxisId="right" orientation="right" domain={[-10, 32]} tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#334155" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '12px' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="weight"
                  name="Вес (кг)"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="dqsScore"
                  name="DQS Балл"
                  stroke="#34d399"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
