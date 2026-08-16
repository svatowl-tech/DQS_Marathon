import React, { useState, useEffect } from 'react';
import {
  Award,
  Calendar,
  Download,
  Share2,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sparkles,
  HelpCircle,
  Save,
  Image as ImageIcon,
  Ruler,
  Activity,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { BodyMeasurements, DailyLogEntry, UserSettings, WeeklySundayReport } from '../types';
import {
  calcPctChange,
  formatDateRu,
  getMondayOfDate,
  getSundayOfDate,
  getWeekDates,
} from '../utils/dqsEngine';
import { getFormattedLocalDate } from '../utils/timeZoneService';
import { generateReportCardImage, ReportCardOptions } from '../utils/reportCardCanvas';
import { calculateAchievements } from '../utils/achievementsEngine';
import { downloadOrShareImage } from '../utils/imageExportHelper';
import { AchievementsBadgeList } from './AchievementsBadgeList';

interface WeeklyReportViewProps {
  logs: DailyLogEntry[];
  settings: UserSettings;
  reports: WeeklySundayReport[];
  onSaveReport: (report: WeeklySundayReport) => void;
  onOpenExtendedPdfModal?: (type: 'weekly' | 'monthly') => void;
}

export const WeeklyReportView: React.FC<WeeklyReportViewProps> = ({
  logs,
  settings,
  reports,
  onSaveReport,
  onOpenExtendedPdfModal,
}) => {
  // Default to nearest Sunday
  const [selectedSunday, setSelectedSunday] = useState<string>(() => {
    const today = getFormattedLocalDate(new Date());
    return getSundayOfDate(today);
  });

  const weekMonday = getMondayOfDate(selectedSunday);
  const weekDates = getWeekDates(weekMonday);

  // Compute stats for current selected week
  const weekLogs = weekDates.map((d) => logs.find((l) => l.date === d) || null);

  const validScores = weekLogs.map((l) => l?.calculatedScore ?? 0);
  const avgDqs = Number((validScores.reduce((a, b) => a + b, 0) / 7).toFixed(1));
  const greenDaysCount = validScores.filter((s) => s >= 18).length;

  // Weight stats
  const validWeights = weekLogs
    .map((l) => l?.morningWeight || l?.weight)
    .filter((w): w is number => typeof w === 'number' && w > 0);

  const currentWeekAvgWeight =
    validWeights.length > 0
      ? Number((validWeights.reduce((a, b) => a + b, 0) / validWeights.length).toFixed(1))
      : settings.startWeight;

  // Compute previous week average weight
  const prevWeekMonday = new Date(weekMonday);
  prevWeekMonday.setDate(prevWeekMonday.getDate() - 7);
  const prevWeekDates = getWeekDates(prevWeekMonday.toISOString().split('T')[0]);
  const prevWeekLogs = prevWeekDates
    .map((d) => {
      const l = logs.find((entry) => entry.date === d);
      return l?.morningWeight || l?.weight;
    })
    .filter((w): w is number => typeof w === 'number' && w > 0);

  const prevWeekAvgWeight =
    prevWeekLogs.length > 0
      ? Number((prevWeekLogs.reduce((a, b) => a + b, 0) / prevWeekLogs.length).toFixed(1))
      : settings.startWeight;

  const weightChangeTotalPct = calcPctChange(currentWeekAvgWeight, settings.startWeight);
  const weightChangeWeekPct = calcPctChange(currentWeekAvgWeight, prevWeekAvgWeight);

  // Checkboxes for report options
  const [includeWeightChart, setIncludeWeightChart] = useState<boolean>(true);
  const [includeMeasurements, setIncludeMeasurements] = useState<boolean>(true);

  const includeAll = includeWeightChart && includeMeasurements;

  const handleToggleAll = (checked: boolean) => {
    setIncludeWeightChart(checked);
    setIncludeMeasurements(checked);
  };

  // Measurements state
  const [currentMeasurements, setCurrentMeasurements] = useState<BodyMeasurements>(
    settings.startMeasurements || {}
  );

  // Text fields state
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWasDifficult, setWhatWasDifficult] = useState('');
  const [insights, setInsights] = useState('');
  const [nextWeekFocus, setNextWeekFocus] = useState('');
  const [cardImage, setCardImage] = useState<string>('');

  // 7-day weight chart data for the selected week
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const weekWeightData = weekDates.map((d, idx) => {
    const l = logs.find((entry) => entry.date === d);
    const w = l?.morningWeight || l?.weight;
    return {
      dayName: dayNames[idx],
      dateStr: formatDateRu(d).slice(0, 5),
      weight: typeof w === 'number' && w > 0 ? w : undefined,
      dqs: l?.calculatedScore ?? 0,
    };
  });

  // Load existing report if available for this Sunday or pull latest measurements
  useEffect(() => {
    const existing = reports.find((r) => r.weekEndDate === selectedSunday);
    if (existing) {
      setWhatWentWell(existing.whatWentWell || '');
      setWhatWasDifficult(existing.whatWasDifficult || '');
      setInsights(existing.insights || '');
      setNextWeekFocus(existing.nextWeekFocus || '');
      if (existing.measurementsCurrent) setCurrentMeasurements(existing.measurementsCurrent);
    } else {
      setWhatWentWell('• Соблюдал рацион DQS, ел овощи с каждым приемом пищи');
      setWhatWasDifficult('• Тянуло на сладкое в четверг из-за усталости на работе');
      setInsights('• Если заранее нарезать овощи в контейнер, есть их в 2 раза проще!');
      setNextWeekFocus('• Налегать на нежирный белок и цельные злаки в обед');

      // Auto-populate latest logged measurements from logs if present
      const latestLoggedMeas = [...logs]
        .filter(
          (l) =>
            l.waist ||
            l.hips ||
            l.chest ||
            l.measurements?.waist ||
            l.measurements?.hips
        )
        .sort((a, b) => b.date.localeCompare(a.date))[0];

      if (latestLoggedMeas) {
        setCurrentMeasurements({
          waist:
            latestLoggedMeas.waist ||
            latestLoggedMeas.measurements?.waist ||
            settings.startMeasurements?.waist,
          hips:
            latestLoggedMeas.hips ||
            latestLoggedMeas.measurements?.hips ||
            settings.startMeasurements?.hips,
          chest:
            latestLoggedMeas.chest ||
            latestLoggedMeas.measurements?.chest ||
            settings.startMeasurements?.chest,
          thigh:
            latestLoggedMeas.thigh ||
            latestLoggedMeas.measurements?.thigh ||
            settings.startMeasurements?.thigh,
          arm:
            latestLoggedMeas.arm ||
            latestLoggedMeas.measurements?.arm ||
            settings.startMeasurements?.arm,
        });
      } else {
        setCurrentMeasurements(settings.startMeasurements || {});
      }
    }
  }, [selectedSunday, reports, logs, settings]);

  // Generate Card Image preview dynamically
  useEffect(() => {
    const reportObj: WeeklySundayReport = {
      id: `report_${selectedSunday}`,
      weekStartDate: weekMonday,
      weekEndDate: selectedSunday,
      avgDqs,
      greenDaysCount,
      weightStart: settings.startWeight,
      weightCurrentWeekAvg: currentWeekAvgWeight,
      weightPrevWeekAvg: prevWeekAvgWeight,
      weightChangeTotalPct,
      weightChangeWeekPct,
      measurementsStart: settings.startMeasurements,
      measurementsCurrent: currentMeasurements,
      whatWentWell,
      whatWasDifficult,
      insights,
      nextWeekFocus,
      createdAt: new Date().toISOString(),
    };

    const options: ReportCardOptions = {
      includeWeightChart,
      includeMeasurements,
    };

    const imgData = generateReportCardImage(
      reportObj,
      settings.userName,
      options,
      weekWeightData
    );
    setCardImage(imgData);
  }, [
    selectedSunday,
    weekMonday,
    avgDqs,
    greenDaysCount,
    currentWeekAvgWeight,
    prevWeekAvgWeight,
    weightChangeTotalPct,
    weightChangeWeekPct,
    whatWentWell,
    whatWasDifficult,
    insights,
    nextWeekFocus,
    currentMeasurements,
    includeWeightChart,
    includeMeasurements,
    settings,
  ]);

  const handleSave = () => {
    const reportObj: WeeklySundayReport = {
      id: `report_${selectedSunday}`,
      weekStartDate: weekMonday,
      weekEndDate: selectedSunday,
      avgDqs,
      greenDaysCount,
      weightStart: settings.startWeight,
      weightCurrentWeekAvg: currentWeekAvgWeight,
      weightPrevWeekAvg: prevWeekAvgWeight,
      weightChangeTotalPct,
      weightChangeWeekPct,
      measurementsStart: settings.startMeasurements,
      measurementsCurrent: currentMeasurements,
      whatWentWell,
      whatWasDifficult,
      insights,
      nextWeekFocus,
      createdAt: new Date().toISOString(),
    };

    onSaveReport(reportObj);
    alert('Отчет за неделю успешно сохранен!');
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadImage = async () => {
    if (!cardImage) return;
    setIsExporting(true);
    try {
      await downloadOrShareImage(cardImage, `DQS_Отчет_${selectedSunday}.png`);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Achievements for current selected week
  const achievementsData = calculateAchievements(logs, settings, reports, weekDates);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#111] via-[#1a1a1a] to-[#0a0a0a] border border-white/10 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-emerald-400" />
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400">
                Каждое Воскресенье до 22:00
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-100">
              Еженедельный Воскресный Отчет
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Анализ прогресса, графики веса, изменения замеров и генерация картинки отчёта
            </p>
          </div>

          {/* Sunday Picker */}
          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10 shrink-0">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={selectedSunday}
              onChange={(e) => e.target.value && setSelectedSunday(e.target.value)}
              className="bg-transparent font-mono font-bold text-xs text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        {/* PDF Export Action Banner */}
        {onOpenExtendedPdfModal && (
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">Скачать полный отчёт в формате PDF:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onOpenExtendedPdfModal('weekly')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>📄 Расширенный Недельный (с фото)</span>
              </button>

              <button
                onClick={() => onOpenExtendedPdfModal('monthly')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Calendar className="w-4 h-4 text-black" />
                <span>📅 Месячный PDF (Понедельный)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OPTIONS & CHECKBOXES CONTROL PANEL */}
      <div className="bg-[#111] p-5 rounded-2xl border border-white/10 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-extrabold text-slate-100 uppercase tracking-wider">
              Опции и блоки отчёта
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Включите блоки для отображения в интерфейсе и на генерируемой карточке-картинке
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap pt-1">
          {/* Checkbox: Select All */}
          <label className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 cursor-pointer bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/20 transition-all active:scale-95">
            <input
              type="checkbox"
              checked={includeAll}
              onChange={(e) => handleToggleAll(e.target.checked)}
              className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
            />
            <span>Включить всё</span>
          </label>

          {/* Checkbox: Include Weight Chart */}
          <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer bg-white/5 px-3.5 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all active:scale-95">
            <input
              type="checkbox"
              checked={includeWeightChart}
              onChange={(e) => setIncludeWeightChart(e.target.checked)}
              className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
            />
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>График веса за неделю</span>
          </label>

          {/* Checkbox: Include Measurements */}
          <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer bg-white/5 px-3.5 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all active:scale-95">
            <input
              type="checkbox"
              checked={includeMeasurements}
              onChange={(e) => setIncludeMeasurements(e.target.checked)}
              className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
            />
            <Ruler className="w-3.5 h-3.5 text-purple-400" />
            <span>Недельные изменения замеров</span>
          </label>
        </div>
      </div>

      {/* AUTO CALCULATED STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Avg DQS */}
        <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg">
          <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Средний DQS за неделю
          </p>
          <p className="text-3xl font-mono font-black text-slate-100 mt-1">{avgDqs} б.</p>
          <p className="text-xs text-emerald-400 font-medium mt-1">
            ★ {greenDaysCount} из 7 дней с высоким DQS
          </p>
        </div>

        {/* Current Avg Weight */}
        <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg">
          <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Средний вес недели
          </p>
          <p className="text-3xl font-mono font-black text-slate-100 mt-1">
            {currentWeekAvgWeight} кг
          </p>
          <p className="text-xs text-slate-400 mt-1">Старт: {settings.startWeight} кг</p>
        </div>

        {/* Weight % from start */}
        <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg">
          <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Прогресс от старта (%)
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-3xl font-mono font-black ${
                weightChangeTotalPct <= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {weightChangeTotalPct > 0 ? `+${weightChangeTotalPct}` : weightChangeTotalPct}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Абсолют: {(currentWeekAvgWeight - settings.startWeight).toFixed(1)} кг
          </p>
        </div>

        {/* Weight % for this week */}
        <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg">
          <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Прогресс за неделю (%)
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-3xl font-mono font-black ${
                weightChangeWeekPct <= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {weightChangeWeekPct > 0 ? `+${weightChangeWeekPct}` : weightChangeWeekPct}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">к пред. неделе ({prevWeekAvgWeight} кг)</p>
        </div>
      </div>

      {/* OPTIONAL BLOCK 1: WEIGHT CHART FOR THE WEEK */}
      {includeWeightChart && (
        <div className="bg-[#111] rounded-2xl p-5 border border-sky-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-100 text-sm sm:text-base">
                График веса за выбранную неделю
              </h3>
            </div>
            <span className="text-[11px] text-sky-400 font-mono font-bold">7 ДНЕЙ ПН—ВС</span>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekWeightData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="dayName" stroke="#64748b" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                <YAxis
                  stroke="#64748b"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: '#cbd5e1' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} кг`, 'Вес']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `${label} (${payload[0].payload.dateStr})`;
                    }
                    return label;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#38bdf8', strokeWidth: 2, stroke: '#111' }}
                  activeDot={{ r: 7, fill: '#38bdf8' }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table of daily weights for quick view */}
          <div className="grid grid-cols-7 gap-1.5 pt-2 border-t border-white/5">
            {weekWeightData.map((d, i) => (
              <div
                key={i}
                className="bg-white/5 rounded-xl p-2 text-center border border-white/5 space-y-0.5"
              >
                <p className="text-[10px] font-bold text-slate-400">{d.dayName}</p>
                <p className="text-[10px] font-mono text-slate-500">{d.dateStr}</p>
                <p className="text-xs font-mono font-extrabold text-slate-100">
                  {d.weight ? `${d.weight}` : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OPTIONAL BLOCK 2: MEASUREMENTS CHANGES */}
      {includeMeasurements && (
        <div className="bg-[#111] rounded-2xl p-5 border border-purple-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <Ruler className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-100 text-sm sm:text-base">
                Недельные изменения замеров тела (в см)
              </h3>
            </div>
            <span className="text-[11px] text-purple-400 font-mono font-bold">Сравнение со стартом</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Waist */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-slate-300">Талия</span>
              <input
                type="number"
                step="0.1"
                placeholder="0 см"
                value={currentMeasurements.waist || ''}
                onChange={(e) =>
                  setCurrentMeasurements((prev) => ({
                    ...prev,
                    waist: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full p-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono font-bold text-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Старт: {settings.startMeasurements?.waist || '—'}</span>
                {currentMeasurements.waist && settings.startMeasurements?.waist && (
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                      currentMeasurements.waist <= settings.startMeasurements.waist
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {(currentMeasurements.waist - settings.startMeasurements.waist).toFixed(1)} см
                  </span>
                )}
              </div>
            </div>

            {/* Hips */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-slate-300">Бёдра</span>
              <input
                type="number"
                step="0.1"
                placeholder="0 см"
                value={currentMeasurements.hips || ''}
                onChange={(e) =>
                  setCurrentMeasurements((prev) => ({
                    ...prev,
                    hips: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full p-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono font-bold text-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Старт: {settings.startMeasurements?.hips || '—'}</span>
                {currentMeasurements.hips && settings.startMeasurements?.hips && (
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                      currentMeasurements.hips <= settings.startMeasurements.hips
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {(currentMeasurements.hips - settings.startMeasurements.hips).toFixed(1)} см
                  </span>
                )}
              </div>
            </div>

            {/* Chest */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-slate-300">Грудь</span>
              <input
                type="number"
                step="0.1"
                placeholder="0 см"
                value={currentMeasurements.chest || ''}
                onChange={(e) =>
                  setCurrentMeasurements((prev) => ({
                    ...prev,
                    chest: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full p-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono font-bold text-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Старт: {settings.startMeasurements?.chest || '—'}</span>
                {currentMeasurements.chest && settings.startMeasurements?.chest && (
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                      currentMeasurements.chest <= settings.startMeasurements.chest
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {(currentMeasurements.chest - settings.startMeasurements.chest).toFixed(1)} см
                  </span>
                )}
              </div>
            </div>

            {/* Thigh */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-slate-300">Бедро</span>
              <input
                type="number"
                step="0.1"
                placeholder="0 см"
                value={currentMeasurements.thigh || ''}
                onChange={(e) =>
                  setCurrentMeasurements((prev) => ({
                    ...prev,
                    thigh: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full p-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono font-bold text-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Старт: {settings.startMeasurements?.thigh || '—'}</span>
                {currentMeasurements.thigh && settings.startMeasurements?.thigh && (
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                      currentMeasurements.thigh <= settings.startMeasurements.thigh
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {(currentMeasurements.thigh - settings.startMeasurements.thigh).toFixed(1)} см
                  </span>
                )}
              </div>
            </div>

            {/* Arm */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
              <span className="text-xs font-bold text-slate-300">Рука</span>
              <input
                type="number"
                step="0.1"
                placeholder="0 см"
                value={currentMeasurements.arm || ''}
                onChange={(e) =>
                  setCurrentMeasurements((prev) => ({
                    ...prev,
                    arm: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full p-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono font-bold text-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Старт: {settings.startMeasurements?.arm || '—'}</span>
                {currentMeasurements.arm && settings.startMeasurements?.arm && (
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                      currentMeasurements.arm <= settings.startMeasurements.arm
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {(currentMeasurements.arm - settings.startMeasurements.arm).toFixed(1)} см
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACHIEVEMENTS IN WEEKLY REPORT */}
      <div className="bg-[#111] rounded-2xl p-5 border border-amber-500/20 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-100 text-sm sm:text-base">
              Достижения и Награды Отчёта
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">
            Постоянные награды + Достигнутые результаты за неделю
          </span>
        </div>

        <AchievementsBadgeList
          permanentAchievements={achievementsData.unlockedPermanent}
          weeklyAchievements={achievementsData.unlockedWeekly}
          showCategoryHeaders={true}
        />
      </div>

      {/* FORM FIELDS & CANVAS PREVIEW SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Report Form Fields */}
        <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
          <h3 className="font-bold text-slate-100 text-base border-b border-white/10 pb-3">
            Заполнение разделов отчета
          </h3>

          {/* What Went Well */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1. Что получилось отлично?
            </label>
            <textarea
              rows={3}
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
              placeholder="Успехи, соблюдение рациона DQS, новые привычки..."
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* What was difficult */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <HelpCircle className="w-4 h-4 text-amber-400" /> 2. Что не получилось / главный
              паттерн сложности?
            </label>
            <textarea
              rows={3}
              value={whatWasDifficult}
              onChange={(e) => setWhatWasDifficult(e.target.value)}
              placeholder="Что мешало? Стресс, усталость, праздники, пропуски еды..."
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Insights */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-purple-400 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-purple-400" /> 3. Главный инсайт недели
            </label>
            <textarea
              rows={3}
              value={insights}
              onChange={(e) => setInsights(e.target.value)}
              placeholder="Одно главное наблюдение о своем поведении или питании..."
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Next week focus */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-sky-400 flex items-center gap-1">
              <Award className="w-4 h-4 text-sky-400" /> 4. Ваш фокус на следующую неделю
            </label>
            <textarea
              rows={2}
              value={nextWeekFocus}
              onChange={(e) => setNextWeekFocus(e.target.value)}
              placeholder="Одно главное целевое действие на следующую неделю..."
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Сохранить в историю</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Image Preview & Download Button */}
        <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" /> Автоматическая карточка-картинка
            </h3>
            <button
              onClick={handleDownloadImage}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" /> Скачать PNG
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Готовая дизайнерская карточка для кураторов или соцсетей. При включении чекбоксов
            график веса и изменения замеров включаются прямо в карточку.
          </p>

          {cardImage ? (
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-xl max-h-[580px] flex justify-center bg-[#050505] p-2">
              <img
                src={cardImage}
                alt="DQS Weekly Report Card"
                className="max-h-[560px] object-contain rounded-lg shadow-2xl"
              />
            </div>
          ) : (
            <div className="h-64 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-500 text-xs">
              Генерация картинки...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
