import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Calendar,
  Sparkles,
  Award,
  Dumbbell,
  Scale,
  Footprints,
  Droplet,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Layout,
  Filter,
} from 'lucide-react';
import { DailyLogEntry, UserSettings, WeeklySundayReport } from '../types';
import {
  DQS_CATEGORIES,
  formatDateRu,
  getDayOfWeekRu,
  getMondayOfDate,
  getSundayOfDate,
  getWeekDates,
} from '../utils/dqsEngine';
import { calculateAchievements } from '../utils/achievementsEngine';
import { AchievementsBadgeList } from './AchievementsBadgeList';

interface ExtendedPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: DailyLogEntry[];
  settings: UserSettings;
  reports?: WeeklySundayReport[];
  initialType?: 'weekly' | 'monthly';
}

export const ExtendedPdfReportModal: React.FC<ExtendedPdfReportModalProps> = ({
  isOpen,
  onClose,
  logs,
  settings,
  reports = [],
  initialType = 'weekly',
}) => {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>(initialType);

  // Selected date anchor (for weekly report, Sunday)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedSunday, setSelectedSunday] = useState<string>(() => getSundayOfDate(todayStr));

  // For monthly report, select month start
  const [selectedMonthStart, setSelectedMonthStart] = useState<string>(() => {
    return settings.programStartDate || getMondayOfDate(todayStr);
  });

  if (!isOpen) return null;

  // --- WEEKLY REPORT COMPUTATION ---
  const weekMonday = getMondayOfDate(selectedSunday);
  const weekDates = getWeekDates(weekMonday);
  const weekLogs = weekDates.map((d) => logs.find((l) => l.date === d) || null);

  const validScores = weekLogs.map((l) => l?.calculatedScore ?? 0);
  const weeklyAvgScore = Number(
    (validScores.reduce((a, b) => a + b, 0) / 7).toFixed(1)
  );

  const weekWeights = weekLogs
    .map((l) => l?.weight)
    .filter((w): w is number => typeof w === 'number');
  const weeklyAvgWeight =
    weekWeights.length > 0
      ? Number((weekWeights.reduce((a, b) => a + b, 0) / weekWeights.length).toFixed(1))
      : settings.startWeight || 0;

  const weeklyWorkoutsCount = weekLogs.filter((l) => l?.workout?.done).length;
  const weeklyGreenDays = validScores.filter((s) => s >= (settings.targetDqsGreen || 18)).length;

  // Find saved report notes if any
  const savedWeeklyReport = reports.find((r) => r.weekEndDate === selectedSunday);

  // Calculate achievements for weekly and overall monthly state
  const weeklyAchievementsData = calculateAchievements(logs, settings, reports, weekDates);
  const overallAchievementsData = calculateAchievements(logs, settings, reports);

  // --- MONTHLY REPORT COMPUTATION ---
  // Generate 4 consecutive weeks from selectedMonthStart
  const monthWeeks = [0, 1, 2, 3].map((wIdx) => {
    const startDate = new Date(selectedMonthStart);
    startDate.setDate(startDate.getDate() + wIdx * 7);
    const startStr = startDate.toISOString().split('T')[0];
    const sundayStr = getSundayOfDate(startStr);
    const dates = getWeekDates(getMondayOfDate(startStr));

    const wLogs = dates.map((d) => logs.find((l) => l.date === d) || null);
    const scores = wLogs.map((l) => l?.calculatedScore ?? 0);
    const avgDqs = Number((scores.reduce((a, b) => a + b, 0) / 7).toFixed(1));

    const weights = wLogs
      .map((l) => l?.weight)
      .filter((w): w is number => typeof w === 'number');
    const avgWeight =
      weights.length > 0
        ? Number((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1))
        : null;

    const workouts = wLogs.filter((l) => l?.workout?.done).length;
    const greenDays = scores.filter((s) => s >= (settings.targetDqsGreen || 18)).length;

    // Collect all photos in this week
    const photos = wLogs.flatMap((l) => l?.photos || []);

    return {
      weekNum: wIdx + 1,
      startStr,
      sundayStr,
      dates,
      logs: wLogs,
      avgDqs,
      avgWeight,
      workouts,
      greenDays,
      photos,
    };
  });

  const monthAvgDqs = Number(
    (monthWeeks.reduce((acc, w) => acc + w.avgDqs, 0) / 4).toFixed(1)
  );
  const validMonthWeights = monthWeeks
    .map((w) => w.avgWeight)
    .filter((w): w is number => typeof w === 'number');
  const monthStartWeight = validMonthWeights[0] ?? settings.startWeight ?? 0;
  const monthEndWeight =
    validMonthWeights[validMonthWeights.length - 1] ?? monthStartWeight;
  const monthWeightDiff = Number((monthEndWeight - monthStartWeight).toFixed(1));

  const totalMonthWorkouts = monthWeeks.reduce((acc, w) => acc + w.workouts, 0);

  const handlePrintPdf = () => {
    window.print();
  };

  const mealTypeRu: Record<string, string> = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    snack: 'Перекус',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-zinc-100 relative my-auto max-h-[92vh] flex flex-col">
        {/* Top Controls Bar (hidden during print) */}
        <div className="print:hidden flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Printer className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                📄 Генератор PDF-Отчётов
              </h2>
              <p className="text-xs text-zinc-400">
                Полный расширенный отчёт с фотографиями блюд и подробной аналитикой
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Скачать PDF / Печать</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Selector Tabs & Filter (hidden during print) */}
        <div className="print:hidden flex items-center justify-between gap-3 flex-wrap bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06] shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setReportType('weekly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
                reportType === 'weekly'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Расширенный Недельный (с фото)</span>
            </button>

            <button
              onClick={() => setReportType('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 ${
                reportType === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Месячный (Понедельная аналитика)</span>
            </button>
          </div>

          {/* Date Picker Filter */}
          {reportType === 'weekly' ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 font-semibold">Воскресенье недели:</span>
              <input
                type="date"
                value={selectedSunday}
                onChange={(e) => setSelectedSunday(getSundayOfDate(e.target.value))}
                className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 font-semibold">Старт месяца:</span>
              <input
                type="date"
                value={selectedMonthStart}
                onChange={(e) => setSelectedMonthStart(getMondayOfDate(e.target.value))}
                className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-6 print:overflow-visible print:p-0 print:m-0 no-scrollbar">
          {reportType === 'weekly' ? (
            /* =========================================================
               WEEKLY EXTENDED PDF DOCUMENT
            ========================================================= */
            <div className="bg-[#18181c] print:bg-white text-zinc-100 print:text-zinc-900 p-6 sm:p-8 rounded-2xl border border-white/10 print:border-none shadow-2xl space-y-6">
              {/* Report Header */}
              <div className="border-b-2 border-emerald-500 pb-4 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 print:bg-emerald-100 print:text-emerald-800 font-extrabold text-xs">
                      DQS FULL WEEKLY REPORT
                    </span>
                    <span className="text-xs text-zinc-400 print:text-zinc-600">
                      {formatDateRu(weekDates[0])} — {formatDateRu(weekDates[6])}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 text-zinc-100 print:text-zinc-900">
                    Расширенный Отчёт за Неделю
                  </h1>
                  <p className="text-xs text-zinc-400 print:text-zinc-600 font-semibold">
                    Полный протокол питания с фото-фиксацией тарелок и нагрузок
                  </p>
                </div>

                <div className="text-right border-l border-white/10 print:border-zinc-300 pl-4">
                  <p className="text-xs text-zinc-400 print:text-zinc-500 uppercase tracking-wider font-bold">Участник</p>
                  <p className="text-base font-extrabold text-emerald-400 print:text-emerald-700">
                    {settings.userName || 'Участник DQS'}
                  </p>
                  {settings.programStartDate && (
                    <p className="text-[11px] text-zinc-400 print:text-zinc-600">
                      Старт: {formatDateRu(settings.programStartDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* Weekly Key KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.04] print:bg-zinc-100 border border-white/10 print:border-zinc-300 space-y-1">
                  <span className="text-[10px] text-zinc-400 print:text-zinc-600 uppercase font-extrabold block">
                    Средний DQS за неделю
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-400 print:text-emerald-700">
                      +{weeklyAvgScore}
                    </span>
                    <span className="text-[10px] text-zinc-400 print:text-zinc-600">баллов/день</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] print:bg-zinc-100 border border-white/10 print:border-zinc-300 space-y-1">
                  <span className="text-[10px] text-zinc-400 print:text-zinc-600 uppercase font-extrabold block">
                    Дни в Зеленой Зоне
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-400 print:text-emerald-700">
                      {weeklyGreenDays} из 7
                    </span>
                    <span className="text-[10px] text-zinc-400 print:text-zinc-600">дней</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] print:bg-zinc-100 border border-white/10 print:border-zinc-300 space-y-1">
                  <span className="text-[10px] text-zinc-400 print:text-zinc-600 uppercase font-extrabold block">
                    Средний вес недели
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber-400 print:text-amber-700">
                      {weeklyAvgWeight > 0 ? `${weeklyAvgWeight} кг` : '—'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] print:bg-zinc-100 border border-white/10 print:border-zinc-300 space-y-1">
                  <span className="text-[10px] text-zinc-400 print:text-zinc-600 uppercase font-extrabold block">
                    Тренировки за неделю
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-indigo-400 print:text-indigo-700">
                      {weeklyWorkoutsCount}
                    </span>
                    <span className="text-[10px] text-zinc-400 print:text-zinc-600">сессий</span>
                  </div>
                </div>
              </div>

              {/* Weekly & Permanent Achievements Section in PDF */}
              <div className="p-4 rounded-xl bg-white/[0.03] print:bg-zinc-50 border border-amber-500/30 print:border-amber-600/30 space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 print:border-zinc-200 pb-2">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-400 print:text-amber-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Достижения и Награды
                  </h4>
                  <span className="text-[10px] text-zinc-400 print:text-zinc-600 font-medium">
                    Постоянные (За всё время) + Недельные
                  </span>
                </div>
                <AchievementsBadgeList
                  permanentAchievements={weeklyAchievementsData.unlockedPermanent}
                  weeklyAchievements={weeklyAchievementsData.unlockedWeekly}
                  showCategoryHeaders={true}
                />
              </div>

              {/* DETAILED DAILY FOOD LOG WITH DISH PHOTOS */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 print:text-emerald-800 flex items-center gap-2 border-b border-white/10 print:border-zinc-300 pb-2">
                  <ImageIcon className="w-4 h-4" /> Ежедневный фото-протокол рациона и нагрузок (7 дней)
                </h3>

                <div className="space-y-5">
                  {weekDates.map((dateStr, idx) => {
                    const log = weekLogs[idx];
                    const dayScore = log?.calculatedScore ?? 0;
                    const hasPhotos = log?.photos && log.photos.length > 0;

                    return (
                      <div
                        key={dateStr}
                        className="p-4 rounded-xl bg-black/40 print:bg-zinc-50 border border-white/10 print:border-zinc-300 space-y-3 print:break-inside-avoid"
                      >
                        {/* Day Header */}
                        <div className="flex items-center justify-between border-b border-white/10 print:border-zinc-200 pb-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 print:bg-emerald-200 print:text-emerald-900 font-extrabold text-xs flex items-center justify-center">
                              {getDayOfWeekRu(dateStr)}
                            </span>
                            <div>
                              <h4 className="font-extrabold text-sm text-zinc-100 print:text-zinc-900">
                                {formatDateRu(dateStr)}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            {log?.weight ? (
                              <span className="text-zinc-300 print:text-zinc-800 font-bold">
                                ⚖️ {log.weight} кг
                              </span>
                            ) : null}
                            <span
                              className={`px-2.5 py-1 rounded-lg font-black ${
                                dayScore >= (settings.targetDqsGreen || 18)
                                  ? 'bg-emerald-500/20 text-emerald-300 print:bg-emerald-100 print:text-emerald-800'
                                  : 'bg-amber-500/20 text-amber-300 print:bg-amber-100 print:text-amber-800'
                              }`}
                            >
                              DQS: {dayScore > 0 ? `+${dayScore}` : dayScore} б.
                            </span>
                          </div>
                        </div>

                        {/* Workout & Trackers row */}
                        <div className="flex items-center gap-4 text-xs flex-wrap text-zinc-300 print:text-zinc-800">
                          {log?.workout?.done ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 print:bg-orange-100 print:text-orange-900 font-bold text-[11px]">
                              🏋️‍♂️ Тренировка: {log.workout.description || 'Физическая активность'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-500 print:text-zinc-500">
                              Тренировка не отмечена
                            </span>
                          )}

                          {log?.trackers?.waterGlass ? (
                            <span className="text-[11px] text-sky-400 print:text-sky-800 font-semibold">
                              💧 Вода: {log.trackers.waterGlass} стаканов
                            </span>
                          ) : null}

                          {log?.steps ? (
                            <span className="text-[11px] text-amber-300 print:text-amber-800 font-semibold">
                              👟 Шаги: {log.steps.toLocaleString()}
                            </span>
                          ) : null}
                        </div>

                        {/* Photos Gallery for this Day */}
                        {hasPhotos ? (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 print:text-zinc-600 block">
                              📸 Фото приёмов пищи ({log!.photos.length}):
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {log!.photos.map((photo) => (
                                <div
                                  key={photo.id}
                                  className="relative rounded-lg overflow-hidden border border-white/10 print:border-zinc-400 bg-black aspect-square shadow-sm flex flex-col justify-between"
                                >
                                  {photo.dataUrl ? (
                                    <img
                                      src={photo.dataUrl}
                                      alt="Блюдо"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full p-1.5 flex flex-col items-center justify-center bg-zinc-900 text-center space-y-0.5">
                                      <span className="text-xs">🥗</span>
                                      <span className="text-[9px] font-bold text-emerald-400 truncate max-w-full">
                                        {mealTypeRu[photo.mealType] || 'Приём пищи'}
                                      </span>
                                    </div>
                                  )}
                                  <div className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-semibold flex items-center justify-between">
                                    <span>{mealTypeRu[photo.mealType] || 'Блюдо'}</span>
                                    {photo.timestamp && <span>{photo.timestamp}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] italic text-zinc-500 print:text-zinc-500">
                            Фотографии блюд за этот день не загружались
                          </p>
                        )}

                        {/* Not on photo / Journal Notes */}
                        {log?.notOnPhoto && (
                          <p className="text-[11px] text-amber-200/80 print:text-amber-900 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                            <b>Что не вошло на фото:</b> {log.notOnPhoto}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Self-Reflection Summary Notes */}
              {savedWeeklyReport && (
                <div className="space-y-3 pt-3 border-t border-white/10 print:border-zinc-300">
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 print:text-amber-800 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Итоги и Саморефлексия за Неделю
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {savedWeeklyReport.whatWentWell && (
                      <div className="p-3 rounded-xl bg-white/[0.03] print:bg-zinc-100 border border-white/10 print:border-zinc-300 space-y-1">
                        <span className="font-bold text-emerald-400 print:text-emerald-800 block">
                          ✅ Что получилось отлично:
                        </span>
                        <p className="text-zinc-300 print:text-zinc-800 whitespace-pre-line">
                          {savedWeeklyReport.whatWentWell}
                        </p>
                      </div>
                    )}

                    {savedWeeklyReport.whatWasDifficult && (
                      <div className="p-3 rounded-xl bg-white/[0.03] print:bg-zinc-100 border border-white/10 print:border-zinc-300 space-y-1">
                        <span className="font-bold text-rose-400 print:text-rose-800 block">
                          ⚠️ С какими трудностями столкнулся:
                        </span>
                        <p className="text-zinc-300 print:text-zinc-800 whitespace-pre-line">
                          {savedWeeklyReport.whatWasDifficult}
                        </p>
                      </div>
                    )}

                    {savedWeeklyReport.insights && (
                      <div className="p-3 rounded-xl bg-white/[0.03] print:bg-zinc-100 border border-white/10 print:border-zinc-300 space-y-1">
                        <span className="font-bold text-indigo-400 print:text-indigo-800 block">
                          💡 Главные инсайты:
                        </span>
                        <p className="text-zinc-300 print:text-zinc-800 whitespace-pre-line">
                          {savedWeeklyReport.insights}
                        </p>
                      </div>
                    )}

                    {savedWeeklyReport.nextWeekFocus && (
                      <div className="p-3 rounded-xl bg-white/[0.03] print:bg-zinc-100 border border-white/10 print:border-zinc-300 space-y-1">
                        <span className="font-bold text-amber-400 print:text-amber-800 block">
                          🎯 Фокус на следующую неделю:
                        </span>
                        <p className="text-zinc-300 print:text-zinc-800 whitespace-pre-line">
                          {savedWeeklyReport.nextWeekFocus}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Document Footer */}
              <div className="pt-4 border-t border-white/10 print:border-zinc-300 flex items-center justify-between text-[11px] text-zinc-400 print:text-zinc-600">
                <span>Сгенерировано в системе Diet Quality Score (DQS)</span>
                <span>Дата печати: {formatDateRu(todayStr)}</span>
              </div>
            </div>
          ) : (
            /* =========================================================
               MONTHLY PDF DOCUMENT WITH WEEK-BY-WEEK ANALYTICS
            ========================================================= */
            <div className="bg-[#18181c] print:bg-white text-zinc-100 print:text-zinc-900 p-6 sm:p-8 rounded-2xl border border-white/10 print:border-none shadow-2xl space-y-6">
              {/* Report Header */}
              <div className="border-b-2 border-indigo-500 pb-4 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 print:bg-indigo-100 print:text-indigo-800 font-extrabold text-xs">
                      MONTHLY ANALYTICS REPORT
                    </span>
                    <span className="text-xs text-zinc-400 print:text-zinc-600">
                      {formatDateRu(selectedMonthStart)} — 4 недели марафона
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 text-zinc-100 print:text-zinc-900">
                    Месячный Аналитический Отчёт
                  </h1>
                  <p className="text-xs text-zinc-400 print:text-zinc-600 font-semibold">
                    Сравнительный анализ динамики качества питания, веса и активности по неделям
                  </p>
                </div>

                <div className="text-right border-l border-white/10 print:border-zinc-300 pl-4">
                  <p className="text-xs text-zinc-400 print:text-zinc-500 uppercase tracking-wider font-bold">Участник</p>
                  <p className="text-base font-extrabold text-indigo-400 print:text-indigo-700">
                    {settings.userName || 'Участник DQS'}
                  </p>
                  {settings.programStartDate && (
                    <p className="text-[11px] text-zinc-400 print:text-zinc-600">
                      Старт марафона: {formatDateRu(settings.programStartDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* Monthly KPI Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.04] print:bg-zinc-100 border border-white/10 print:border-zinc-300 space-y-1">
                  <span className="text-[10px] text-zinc-400 print:text-zinc-600 uppercase font-extrabold block">
                    Средний DQS за месяц
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-400 print:text-emerald-700">
                      +{monthAvgDqs}
                    </span>
                    <span className="text-[10px] text-zinc-400 print:text-zinc-600">баллов/день</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] print:bg-zinc-100 border border-white/10 print:border-zinc-300 space-y-1">
                  <span className="text-[10px] text-zinc-400 print:text-zinc-600 uppercase font-extrabold block">
                    Динамика веса за месяц
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber-400 print:text-amber-700">
                      {monthWeightDiff > 0 ? `+${monthWeightDiff}` : monthWeightDiff} кг
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] print:bg-zinc-100 border border-white/10 print:border-zinc-300 space-y-1">
                  <span className="text-[10px] text-zinc-400 print:text-zinc-600 uppercase font-extrabold block">
                    Всего тренировок
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-indigo-400 print:text-indigo-700">
                      {totalMonthWorkouts}
                    </span>
                    <span className="text-[10px] text-zinc-400 print:text-zinc-600">сессий</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.04] print:bg-zinc-100 border border-white/10 print:border-zinc-300 space-y-1">
                  <span className="text-[10px] text-zinc-400 print:text-zinc-600 uppercase font-extrabold block">
                    Дней в зелёной зоне
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-400 print:text-emerald-700">
                      {monthWeeks.reduce((acc, w) => acc + w.greenDays, 0)} из 28
                    </span>
                  </div>
                </div>
              </div>

              {/* Permanent Achievements Section in Monthly PDF */}
              <div className="p-4 rounded-xl bg-white/[0.03] print:bg-zinc-50 border border-amber-500/30 print:border-amber-600/30 space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 print:border-zinc-200 pb-2">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-400 print:text-amber-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Постоянные Достижения Марафона
                  </h4>
                  <span className="text-[10px] text-zinc-400 print:text-zinc-600 font-medium">
                    Отображаются во всех отчётах
                  </span>
                </div>
                <AchievementsBadgeList
                  permanentAchievements={overallAchievementsData.unlockedPermanent}
                  showCategoryHeaders={false}
                />
              </div>

              {/* COMPARATIVE WEEK-BY-WEEK TABLE */}
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-indigo-400 print:text-indigo-800 flex items-center gap-2 border-b border-white/10 print:border-zinc-300 pb-2">
                  <Layout className="w-4 h-4" /> Понедельная Сравнительная Таблица (Недели 1 — 4)
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-white/10 print:border-zinc-400">
                    <thead>
                      <tr className="bg-white/5 print:bg-zinc-200 text-zinc-200 print:text-zinc-900 font-bold border-b border-white/10 print:border-zinc-400">
                        <th className="p-2.5 border-r border-white/10 print:border-zinc-400">Показатель / Метрика</th>
                        {monthWeeks.map((w) => (
                          <th key={w.weekNum} className="p-2.5 text-center border-r border-white/10 print:border-zinc-400">
                            Неделя {w.weekNum}
                            <span className="block text-[10px] font-normal text-zinc-400 print:text-zinc-600">
                              {formatDateRu(w.startStr)}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 print:divide-zinc-300">
                      <tr>
                        <td className="p-2.5 font-bold border-r border-white/10 print:border-zinc-400">
                          Средний DQS (баллы/день)
                        </td>
                        {monthWeeks.map((w) => (
                          <td key={w.weekNum} className="p-2.5 text-center font-extrabold text-emerald-400 print:text-emerald-800 border-r border-white/10 print:border-zinc-400">
                            +{w.avgDqs}
                          </td>
                        ))}
                      </tr>

                      <tr>
                        <td className="p-2.5 font-bold border-r border-white/10 print:border-zinc-400">
                          Средний вес недели (кг)
                        </td>
                        {monthWeeks.map((w) => (
                          <td key={w.weekNum} className="p-2.5 text-center font-bold text-amber-300 print:text-amber-800 border-r border-white/10 print:border-zinc-400">
                            {w.avgWeight ? `${w.avgWeight} кг` : '—'}
                          </td>
                        ))}
                      </tr>

                      <tr>
                        <td className="p-2.5 font-bold border-r border-white/10 print:border-zinc-400">
                          Выполнено тренировок
                        </td>
                        {monthWeeks.map((w) => (
                          <td key={w.weekNum} className="p-2.5 text-center font-bold text-indigo-300 print:text-indigo-800 border-r border-white/10 print:border-zinc-400">
                            {w.workouts} сессий
                          </td>
                        ))}
                      </tr>

                      <tr>
                        <td className="p-2.5 font-bold border-r border-white/10 print:border-zinc-400">
                          Дней в зелёной зоне (≥18)
                        </td>
                        {monthWeeks.map((w) => (
                          <td key={w.weekNum} className="p-2.5 text-center font-bold text-emerald-300 print:text-emerald-800 border-r border-white/10 print:border-zinc-400">
                            {w.greenDays} из 7
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* WEEK-BY-WEEK PHOTO HIGHLIGHTS COLLAGE */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 print:text-emerald-800 flex items-center gap-2 border-b border-white/10 print:border-zinc-300 pb-2">
                  <ImageIcon className="w-4 h-4" /> Фото-Галерея Блюд по Неделям
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {monthWeeks.map((w) => (
                    <div
                      key={w.weekNum}
                      className="p-3 rounded-xl bg-black/40 print:bg-zinc-50 border border-white/10 print:border-zinc-300 space-y-2 print:break-inside-avoid"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 print:border-zinc-200 pb-1.5">
                        <span className="font-extrabold text-xs text-zinc-200 print:text-zinc-900">
                          Неделя {w.weekNum} ({formatDateRu(w.startStr)})
                        </span>
                        <span className="text-[11px] text-emerald-400 print:text-emerald-800 font-bold">
                          DQS avg: +{w.avgDqs}
                        </span>
                      </div>

                      {w.photos.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                          {w.photos.map((photo) => (
                            <div
                              key={photo.id}
                              className="relative rounded-lg overflow-hidden border border-white/10 aspect-square bg-black shadow-sm"
                            >
                              {photo.dataUrl ? (
                                <img
                                  src={photo.dataUrl}
                                  alt="Тарелка"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400 bg-zinc-900">
                                  🥗
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] italic text-zinc-500 print:text-zinc-500 py-2">
                          В этой неделе нет загруженных фотографий
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Final Summary & Conclusion */}
              <div className="p-4 rounded-xl bg-emerald-500/10 print:bg-emerald-50 border border-emerald-500/30 print:border-emerald-200 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-400 print:text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 print:text-emerald-700" />
                  Заключение и выводы за месяц
                </h4>
                <p className="text-xs text-zinc-300 print:text-zinc-800 leading-relaxed">
                  За прошедший месяц проведено {monthWeeks.reduce((acc, w) => acc + w.greenDays, 0)} дней в целевой «Зеленой Зоне» DQS. Выполнено {totalMonthWorkouts} спортивных тренировок. Общая динамика веса составила {monthWeightDiff > 0 ? `+${monthWeightDiff}` : monthWeightDiff} кг. Программа Diet Quality Score помогла улучшить качество питания без жестких подсчетов калорий!
                </p>
              </div>

              {/* Document Footer */}
              <div className="pt-4 border-t border-white/10 print:border-zinc-300 flex items-center justify-between text-[11px] text-zinc-400 print:text-zinc-600">
                <span>Сгенерировано в системе Diet Quality Score (DQS)</span>
                <span>Дата печати: {formatDateRu(todayStr)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer (hidden during print) */}
        <div className="print:hidden pt-2 flex items-center justify-end gap-3 border-t border-white/[0.08] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-xs text-zinc-300 font-semibold cursor-pointer"
          >
            Закрыть
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Скачать PDF / Печать</span>
          </button>
        </div>
      </div>
    </div>
  );
};
