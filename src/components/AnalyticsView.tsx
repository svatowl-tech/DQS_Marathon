import React, { useState } from 'react';
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
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Dumbbell,
  Scale,
  Utensils,
  Droplet,
  Footprints,
  Sparkles,
  Award,
  Activity,
  CheckCircle2,
  PieChart as PieIcon,
  Zap,
  Image as ImageIcon,
  Flame,
  ArrowDownRight,
  ArrowUpRight,
  Sliders,
} from 'lucide-react';
import { DailyLogEntry, UserSettings, WeeklySundayReport, CategoryId } from '../types';
import { DQS_CATEGORIES, formatDateRu, getDayOfWeekRu } from '../utils/dqsEngine';

interface AnalyticsViewProps {
  logs: DailyLogEntry[];
  settings?: UserSettings;
  reports?: WeeklySundayReport[];
}

type PeriodPreset = '7' | '14' | '30' | '60' | 'all' | 'custom';
type AnalyticsTab = 'dqs' | 'food' | 'workouts' | 'body';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  logs,
  settings,
  reports = [],
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Range and Date filter states
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('14');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('dqs');

  // Sort logs by date ascending
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  // Filter logs based on chosen period preset
  const getFilteredLogs = (): DailyLogEntry[] => {
    if (sortedLogs.length === 0) return [];

    if (periodPreset === 'all') {
      return sortedLogs;
    }

    if (periodPreset === 'custom') {
      return sortedLogs.filter(
        (l) => l.date >= customStartDate && l.date <= customEndDate
      );
    }

    const days = parseInt(periodPreset, 10) || 14;
    return sortedLogs.slice(-days);
  };

  const filteredLogs = getFilteredLogs();

  // --- 1. COMPUTED DQS & SERVINGS DATA ---
  const chartData = filteredLogs.map((log) => {
    const healthyCount =
      (log.servings.vegetables || 0) +
      (log.servings.fruits || 0) +
      (log.servings.nuts_seeds || 0) +
      (log.servings.whole_grains || 0) +
      (log.servings.lean_proteins || 0) +
      (log.servings.dairy || 0);

    const unhealthyCount =
      (log.servings.refined_grains || 0) +
      (log.servings.sweets || 0) +
      (log.servings.processed_meats || 0) +
      (log.servings.sugary_drinks_alcohol || 0);

    return {
      date: log.date.substring(5), // MM-DD
      fullDate: formatDateRu(log.date),
      rawDate: log.date,
      dqsScore: log.calculatedScore,
      weight: log.weight || null,
      steps: log.steps || 0,
      water: log.trackers?.waterGlass || 0,
      workoutDone: log.workout?.done || false,
      workoutDesc: log.workout?.description || '',
      healthyServings: healthyCount,
      unhealthyServings: unhealthyCount,
    };
  });

  // Key KPI stats
  const totalDays = chartData.length || 1;
  const targetGreen = settings?.targetDqsGreen || 18;

  const avgDqs = Number(
    (chartData.reduce((acc, curr) => acc + curr.dqsScore, 0) / totalDays).toFixed(1)
  );

  const greenDays = chartData.filter((d) => d.dqsScore >= targetGreen).length;
  const greenDaysPct = Math.round((greenDays / totalDays) * 100);

  const totalSteps = chartData.reduce((acc, curr) => acc + curr.steps, 0);
  const avgSteps = Math.round(totalSteps / totalDays);

  const totalWater = chartData.reduce((acc, curr) => acc + curr.water, 0);
  const avgWater = Number((totalWater / totalDays).toFixed(1));

  // --- 2. WORKOUT ANALYTICS ---
  const workoutLogs = filteredLogs.filter((l) => l.workout?.done);
  const workoutCount = workoutLogs.length;

  // Classify workout types
  const workoutTypeCounts: Record<string, number> = {};
  workoutLogs.forEach((l) => {
    const desc = (l.workout.description || 'Тренировка').toLowerCase();
    let category = 'Другое';
    if (desc.includes('силов') || desc.includes('зал') || desc.includes('гантел') || desc.includes('штанг')) {
      category = 'Силовая';
    } else if (desc.includes('кардио') || desc.includes('бег') || desc.includes('дорожк')) {
      category = 'Кардио / Бег';
    } else if (desc.includes('ходьб') || desc.includes('прогулк') || desc.includes('шаг')) {
      category = 'Ходьба';
    } else if (desc.includes('йог') || desc.includes('растяжк') || desc.includes('стретчинг')) {
      category = 'Йога / Растяжка';
    } else if (desc.includes('бассейн') || desc.includes('плаван')) {
      category = 'Бассейн';
    } else if (desc.includes('вело') || desc.includes('сайкл')) {
      category = 'Велоспорт';
    } else if (desc.length > 0) {
      category = l.workout.description;
    }

    workoutTypeCounts[category] = (workoutTypeCounts[category] || 0) + 1;
  });

  const workoutTypesList = Object.entries(workoutTypeCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // --- 3. FOOD CONSUMPTION ANALYTICS (POPULAR FOODS) ---
  const categoryTotals: Record<CategoryId, number> = {
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
  };

  filteredLogs.forEach((l) => {
    Object.keys(categoryTotals).forEach((catKey) => {
      const key = catKey as CategoryId;
      categoryTotals[key] += l.servings[key] || 0;
    });
  });

  const categoryRanking = DQS_CATEGORIES.map((cat) => ({
    id: cat.id,
    nameRu: cat.nameRu,
    group: cat.group,
    totalServings: categoryTotals[cat.id] || 0,
    avgServingsPerDay: Number(((categoryTotals[cat.id] || 0) / totalDays).toFixed(1)),
  })).sort((a, b) => b.totalServings - a.totalServings);

  // Filtered photos gallery for period
  const periodPhotos = filteredLogs.flatMap((l) =>
    (l.photos || []).map((p) => ({ ...p, date: l.date }))
  );

  // --- 4. BODY WEIGHT & MEASUREMENTS ANALYTICS ---
  const validWeights = chartData
    .map((d) => d.weight)
    .filter((w): w is number => typeof w === 'number');

  const startWeight = settings?.startWeight || validWeights[0] || 0;
  const latestWeight = validWeights.length > 0 ? validWeights[validWeights.length - 1] : startWeight;
  const minWeight = validWeights.length > 0 ? Math.min(...validWeights) : startWeight;
  const maxWeight = validWeights.length > 0 ? Math.max(...validWeights) : startWeight;
  const weightChange = Number((latestWeight - startWeight).toFixed(1));

  // Latest Sunday report measurements comparison
  const latestReport = reports.length > 0 ? reports[reports.length - 1] : null;
  const initialMeasurements = settings?.startMeasurements || latestReport?.measurementsStart || {};
  const currentMeasurements = latestReport?.measurementsCurrent || {};

  const measurementLabels: { key: keyof typeof initialMeasurements; label: string }[] = [
    { key: 'chest', label: 'Грудь' },
    { key: 'waist', label: 'Талия' },
    { key: 'hips', label: 'Бёдра' },
    { key: 'thigh', label: 'Бедро' },
    { key: 'arm', label: 'Бицепс' },
  ];

  return (
    <div className="space-y-6 pb-12 text-zinc-100">
      {/* Top Header & Configurable Period Control */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-bold">
                ANALYTICS DASHBOARD
              </span>
              <span className="text-xs text-zinc-400">
                Записей в периоде: {filteredLogs.length}
              </span>
            </div>
            <h2 className="font-extrabold text-xl text-zinc-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              Аналитика и Настраиваемые Графики
            </h2>
            <p className="text-xs text-zinc-400">
              Гибкая настройка временного диапазона и глубинная аналитика питания, веса, замеров и тренировок
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-xl border border-white/[0.08] flex-wrap">
            <button
              type="button"
              onClick={() => setPeriodPreset('7')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                periodPreset === '7'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              7 дней
            </button>
            <button
              type="button"
              onClick={() => setPeriodPreset('14')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                periodPreset === '14'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              14 дней
            </button>
            <button
              type="button"
              onClick={() => setPeriodPreset('30')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                periodPreset === '30'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              30 дней
            </button>
            <button
              type="button"
              onClick={() => setPeriodPreset('60')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                periodPreset === '60'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              60 дней
            </button>
            <button
              type="button"
              onClick={() => setPeriodPreset('all')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                periodPreset === 'all'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              Вся программа
            </button>
            <button
              type="button"
              onClick={() => setPeriodPreset('custom')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                periodPreset === 'custom'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Период</span>
            </button>
          </div>
        </div>

        {/* Custom Date Inputs Range Selector */}
        {periodPreset === 'custom' && (
          <div className="p-3 bg-black/40 rounded-xl border border-indigo-500/30 flex items-center gap-3 flex-wrap text-xs">
            <span className="font-bold text-indigo-400 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Выберите диапазон дат:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-semibold">С:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-semibold">По:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <span className="text-[11px] text-zinc-400 italic ml-auto">
              Найдено записей: {filteredLogs.length}
            </span>
          </div>
        )}
      </div>

      {/* KPI Key Metric Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1 */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-3.5 space-y-1 shadow-lg">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">
            Средний DQS
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-black ${
                avgDqs >= targetGreen ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {avgDqs > 0 ? `+${avgDqs}` : avgDqs}
            </span>
            <span className="text-[10px] text-zinc-400">баллов</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-3.5 space-y-1 shadow-lg">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">
            Зелёные дни
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-400">{greenDays}</span>
            <span className="text-xs text-zinc-400 font-semibold">
              из {totalDays} ({greenDaysPct}%)
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-3.5 space-y-1 shadow-lg">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">
            Динамика веса
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-2xl font-black ${
                weightChange <= 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {weightChange > 0 ? `+${weightChange}` : weightChange}
            </span>
            <span className="text-[10px] text-zinc-400">кг</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-3.5 space-y-1 shadow-lg">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">
            Тренировки
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-orange-400">{workoutCount}</span>
            <span className="text-[10px] text-zinc-400">сессий</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-3.5 space-y-1 shadow-lg">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">
            Средние шаги
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-300">
              {avgSteps.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="bg-[#121215] border border-white/[0.08] rounded-xl p-3.5 space-y-1 shadow-lg">
          <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">
            Вода в день
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-sky-400">{avgWater}</span>
            <span className="text-[10px] text-zinc-400">стаканов</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('dqs')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'dqs'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>1. Динамика DQS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('food')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'food'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>2. Популярная еда и Категории</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workouts')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'workouts'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>3. Тренировки и Активность</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('body')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'body'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>4. Вес и Замеры тела</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: DQS & SERVINGS DYNAMICS
      ========================================================================= */}
      {activeTab === 'dqs' && (
        <div className="space-y-6">
          {/* Chart 1: DQS Score Trend */}
          <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-zinc-100 text-sm sm:text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  График Индекса DQS (Целевой порог: ≥{targetGreen} баллов)
                </h3>
                <p className="text-xs text-zinc-400">
                  Зелёная пунктирная линия — граница идеального дня
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
                Средний: +{avgDqs} б.
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis domain={[-10, 30]} tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      borderColor: '#333',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    formatter={(val: any) => [`${val} баллов`, 'DQS Балл']}
                    labelFormatter={(label) => `Дата: ${label}`}
                  />
                  <ReferenceLine
                    y={targetGreen}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{
                      value: `Зеленая зона (${targetGreen})`,
                      fill: '#10b981',
                      fontSize: 10,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dqsScore"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Healthy vs Limit Servings Distribution */}
          <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="font-extrabold text-zinc-100 text-sm sm:text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Соотношение Порций: Здоровые Продукты vs Ограничиваемые
            </h3>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      borderColor: '#333',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#ccc' }} />
                  <Bar
                    dataKey="healthyServings"
                    name="Здоровые порции (+баллы)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="unhealthyServings"
                    name="Ограничиваемые порции (-баллы)"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: POPULAR FOOD & DQS CATEGORIES RANKING
      ========================================================================= */}
      {activeTab === 'food' && (
        <div className="space-y-6">
          {/* Top Categories Ranking Bar Chart */}
          <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h3 className="font-extrabold text-zinc-100 text-sm sm:text-base flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                Рейтинг Потребления Продуктов по Категориям DQS (Самая популярная еда)
              </h3>
              <p className="text-xs text-zinc-400">
                Суммарное количество съеденных порций за выбранный период
              </p>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={categoryRanking}
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis
                    type="category"
                    dataKey="nameRu"
                    tick={{ fontSize: 10, fill: '#ccc' }}
                    width={160}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      borderColor: '#333',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    formatter={(val: any) => [`${val} порций`, 'Всего съедено']}
                  />
                  <Bar dataKey="totalServings" name="Порции" radius={[0, 4, 4, 0]}>
                    {categoryRanking.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.group === 'positive' ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Category Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryRanking.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        cat.group === 'positive' ? 'bg-emerald-400' : 'bg-rose-500'
                      }`}
                    />
                    <h4 className="font-extrabold text-xs text-zinc-100">{cat.nameRu}</h4>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Среднее в день: <b className="text-zinc-200">{cat.avgServingsPerDay}</b> порц.
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`text-base font-black ${
                      cat.group === 'positive' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {cat.totalServings}
                  </span>
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                    порций
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Photos Gallery preview if any */}
          {periodPhotos.length > 0 && (
            <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="font-extrabold text-zinc-100 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                Галерея Блюд и Тарелок за Этот Период ({periodPhotos.length} фото)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {periodPhotos.slice(0, 12).map((photo) => (
                  <div
                    key={photo.id}
                    className="relative rounded-xl overflow-hidden border border-white/10 aspect-square bg-black shadow-sm group"
                  >
                    <img
                      src={photo.dataUrl}
                      alt="Тарелка"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] text-zinc-200 font-semibold truncate">
                      {formatDateRu(photo.date)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: WORKOUTS & PHYSICAL ACTIVITY
      ========================================================================= */}
      {activeTab === 'workouts' && (
        <div className="space-y-6">
          {/* Workout Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-xl space-y-1">
              <span className="text-[11px] text-zinc-400 uppercase font-extrabold block">
                Всего тренировок в периоде
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-orange-400">{workoutCount}</span>
                <span className="text-xs text-zinc-400 font-semibold">сессий</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-xl space-y-1">
              <span className="text-[11px] text-zinc-400 uppercase font-extrabold block">
                Частота тренировок
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400">
                  {Math.round((workoutCount / totalDays) * 100)}%
                </span>
                <span className="text-xs text-zinc-400 font-semibold">дней</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-xl space-y-1">
              <span className="text-[11px] text-zinc-400 uppercase font-extrabold block">
                Средние шаги в день
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-300">
                  {avgSteps.toLocaleString()}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">шагов</span>
              </div>
            </div>
          </div>

          {/* Workout Types Breakdown */}
          {workoutTypesList.length > 0 && (
            <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="font-extrabold text-zinc-100 text-sm flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-orange-400" />
                Распределение Тренировок по Типам
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {workoutTypesList.map((wt) => (
                  <div
                    key={wt.name}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between"
                  >
                    <span className="font-bold text-xs text-zinc-200">{wt.name}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-orange-500/20 text-orange-400 font-black text-xs">
                      {wt.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Steps Chart */}
          <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-zinc-100 text-sm flex items-center gap-2">
                <Footprints className="w-4 h-4 text-amber-400" />
                Ежедневная Шаговая Активность (Цель: 8 000 шагов)
              </h3>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      borderColor: '#333',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    formatter={(val: any) => [`${val} шагов`, 'Шаги']}
                  />
                  <ReferenceLine
                    y={8000}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: 'Цель 8000 шагов', fill: '#f59e0b', fontSize: 10 }}
                  />
                  <Bar dataKey="steps" name="Шаги" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: WEIGHT DYNAMICS & BODY MEASUREMENTS
      ========================================================================= */}
      {activeTab === 'body' && (
        <div className="space-y-6">
          {/* Weight Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-xl space-y-1">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">
                Стартовый вес
              </span>
              <span className="text-2xl font-black text-zinc-200">
                {startWeight ? `${startWeight} кг` : '—'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-xl space-y-1">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">
                Текущий вес
              </span>
              <span className="text-2xl font-black text-indigo-400">
                {latestWeight ? `${latestWeight} кг` : '—'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-xl space-y-1">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">
                Общее изменение
              </span>
              <span
                className={`text-2xl font-black ${
                  weightChange <= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {weightChange > 0 ? `+${weightChange}` : weightChange} кг
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#121215] border border-white/[0.08] shadow-xl space-y-1">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider block">
                Мин / Макс в периоде
              </span>
              <span className="text-sm font-extrabold text-zinc-300 block">
                {minWeight} кг / {maxWeight} кг
              </span>
            </div>
          </div>

          {/* Weight Trend Line Chart */}
          <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="font-extrabold text-zinc-100 text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              График Изменения Веса
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tick={{ fontSize: 11, fill: '#888' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      borderColor: '#333',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    formatter={(val: any) => [`${val} кг`, 'Вес']}
                  />
                  {settings?.targetWeight && (
                    <ReferenceLine
                      y={settings.targetWeight}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{
                        value: `Целевой вес (${settings.targetWeight}кг)`,
                        fill: '#10b981',
                        fontSize: 10,
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#6366f1' }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Body Measurements Table */}
          <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="font-extrabold text-zinc-100 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Динамика Замеров Тела (Сантиметры)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-white/10">
                <thead>
                  <tr className="bg-white/5 text-zinc-300 font-bold border-b border-white/10">
                    <th className="p-3">Параметр</th>
                    <th className="p-3 text-center">Старт</th>
                    <th className="p-3 text-center">Текущий</th>
                    <th className="p-3 text-center">Изменение (см)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-zinc-200">
                  {measurementLabels.map((item) => {
                    const startVal = initialMeasurements[item.key];
                    const currVal = currentMeasurements[item.key];
                    const diff =
                      typeof startVal === 'number' && typeof currVal === 'number'
                        ? Number((currVal - startVal).toFixed(1))
                        : null;

                    return (
                      <tr key={item.key} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-bold text-zinc-100">{item.label}</td>
                        <td className="p-3 text-center font-mono">
                          {startVal ? `${startVal} см` : '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-400">
                          {currVal ? `${currVal} см` : startVal ? `${startVal} см` : '—'}
                        </td>
                        <td className="p-3 text-center font-mono">
                          {diff !== null ? (
                            <span
                              className={`px-2 py-0.5 rounded font-extrabold text-xs ${
                                diff <= 0
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {diff > 0 ? `+${diff}` : diff} см
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
