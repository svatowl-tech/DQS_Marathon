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
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, Filter } from 'lucide-react';
import { DailyLogEntry } from '../types';
import { DQS_CATEGORIES, formatDateRu } from '../utils/dqsEngine';

interface AnalyticsViewProps {
  logs: DailyLogEntry[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ logs }) => {
  const [rangeDays, setRangeDays] = useState<number>(14);

  // Sort logs by date ascending
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const filteredLogs = sortedLogs.slice(-rangeDays);

  // Prepare Chart Data
  const chartData = filteredLogs.map((log) => {
    // Healthy categories servings sum
    const healthyCount =
      (log.servings.vegetables || 0) +
      (log.servings.fruits || 0) +
      (log.servings.nuts_seeds || 0) +
      (log.servings.whole_grains || 0) +
      (log.servings.lean_proteins || 0) +
      (log.servings.dairy || 0);

    // Unhealthy categories servings sum
    const refinedCount =
      (log.servings.refined_grains || 0) +
      (log.servings.sweets || 0) +
      (log.servings.processed_meats || 0) +
      (log.servings.sugary_drinks_alcohol || 0);

    return {
      date: log.date.substring(5), // MM-DD
      fullDate: formatDateRu(log.date),
      dqsScore: log.calculatedScore,
      weight: log.weight || null,
      steps: log.steps || 0,
      healthyServings: healthyCount,
      unhealthyServings: refinedCount,
    };
  });

  // Calculate stats
  const avgDqs = Number(
    (chartData.reduce((acc, curr) => acc + curr.dqsScore, 0) / (chartData.length || 1)).toFixed(1)
  );

  const greenDays = chartData.filter((d) => d.dqsScore >= 18).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Range Filter */}
      <div className="bg-[#111] rounded-2xl p-4 sm:p-5 shadow-lg border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" /> Аналитика и Графики Качества
          </h2>
          <p className="text-xs text-slate-400">
            Динамика индекса DQS, категории порций, веса и физической активности
          </p>
        </div>

        {/* Range Buttons */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setRangeDays(7)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              rangeDays === 7 ? 'bg-emerald-500 text-black font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            7 дней
          </button>
          <button
            onClick={() => setRangeDays(14)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              rangeDays === 14 ? 'bg-emerald-500 text-black font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            14 дней
          </button>
          <button
            onClick={() => setRangeDays(30)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              rangeDays === 30 ? 'bg-emerald-500 text-black font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            30 дней
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111] rounded-2xl p-4 border border-white/5 shadow-lg">
          <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Средний DQS за период</p>
          <p className="text-2xl font-mono font-bold text-slate-100">{avgDqs} баллов</p>
        </div>

        <div className="bg-[#111] rounded-2xl p-4 border border-white/5 shadow-lg">
          <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Зеленые дни (DQS ≥18)</p>
          <p className="text-2xl font-mono font-bold text-emerald-400">
            {greenDays} из {chartData.length} дней
          </p>
        </div>

        <div className="bg-[#111] rounded-2xl p-4 border border-white/5 shadow-lg">
          <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Средние шаги за день</p>
          <p className="text-2xl font-mono font-bold text-emerald-400">
            {Math.round(
              chartData.reduce((acc, curr) => acc + curr.steps, 0) / (chartData.length || 1)
            )}{' '}
            шагов
          </p>
        </div>
      </div>

      {/* CHART 1: DQS SCORE TREND */}
      <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm">
            1. Динамика индекса DQS (Цель: ≥18 баллов)
          </h3>
          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full">
            Зеленая линия = Зеленый день
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
              <YAxis domain={[-10, 30]} tick={{ fontSize: 11, fill: '#888' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '12px', color: '#fff' }}
                formatter={(val: any) => [`${val} баллов`, 'DQS Балл']}
                labelFormatter={(label) => `Дата: ${label}`}
              />
              <ReferenceLine y={18} stroke="#10b981" strokeDasharray="4 4" label={{ value: "Зеленый день (18)", fill: "#10b981", fontSize: 10 }} />
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

      {/* CHART 2: HEALTHY VS UNHEALTHY SERVINGS DISTRIBUTION */}
      <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-3">
        <h3 className="font-bold text-slate-100 text-sm">
          2. Соотношение порций: Здоровые продукты vs Ограничиваемые
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '12px', color: '#fff' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#ccc' }} />
              <Bar dataKey="healthyServings" name="Здоровые порции" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unhealthyServings" name="Ограничиваемые порции" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 3: WEIGHT TREND */}
      <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-3">
        <h3 className="font-bold text-slate-100 text-sm">
          3. Динамика веса (Утреннее взвешивание)
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11, fill: '#888' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '12px', color: '#fff' }} formatter={(val: any) => [`${val} кг`, 'Вес']} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#6366f1' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
