import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Zap,
  TrendingUp,
  Scale,
  FileText,
  Sparkles,
  ArrowRight,
  Settings,
  ChevronRight,
  Utensils,
  Camera,
  Activity,
  Flame,
  Award,
  Dumbbell,
  Share2,
  Flag,
  Pencil,
} from 'lucide-react';
import { CustomTaskRule, DailyLogEntry, PhotoEntry, UserSettings, WeeklySundayReport } from '../types';
import { formatDateRu, getDayOfWeekRu } from '../utils/dqsEngine';
import { QuickAddWorkoutModal } from './QuickAddWorkoutModal';
import { ExportDailyReportModal } from './ExportDailyReportModal';
import { AchievementsModal } from './AchievementsModal';
import { AchievementsBadgeList } from './AchievementsBadgeList';
import { QuickMeasurementModal } from './QuickMeasurementModal';
import { QuickWeightModal } from './QuickWeightModal';
import { calculateAchievements } from '../utils/achievementsEngine';

interface HomeDashboardViewProps {
  currentLog: DailyLogEntry;
  allLogs: DailyLogEntry[];
  userSettings: UserSettings;
  reports?: WeeklySundayReport[];
  onUpdateLog: (updated: DailyLogEntry) => void;
  onSaveReport?: (report: WeeklySundayReport) => void;
  onNavigateTab: (tab: any) => void;
  onOpenQuickMealModal: (meal?: PhotoEntry) => void;
  onOpenStartWizard: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  currentLog,
  allLogs,
  userSettings,
  reports = [],
  onUpdateLog,
  onSaveReport,
  onNavigateTab,
  onOpenQuickMealModal,
  onOpenStartWizard,
}) => {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState<string>(
    currentLog.weight ? String(currentLog.weight) : ''
  );
  const [editingSteps, setEditingSteps] = useState<string>(
    currentLog.steps ? String(currentLog.steps) : ''
  );

  const todayDateObj = new Date(currentLog.date);
  const dayOfWeekIndex = todayDateObj.getDay();

  const activeRules: CustomTaskRule[] = (userSettings.taskRules || []).filter((rule) =>
    rule.daysOfWeek.includes(dayOfWeekIndex)
  );

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleSaveMetrics = () => {
    const parsedWeight = parseFloat(editingWeight);
    const parsedSteps = parseInt(editingSteps, 10);

    onUpdateLog({
      ...currentLog,
      weight: !isNaN(parsedWeight) ? parsedWeight : currentLog.weight,
      steps: !isNaN(parsedSteps) ? parsedSteps : currentLog.steps,
    });
  };

  const score = currentLog.calculatedScore;
  let scoreBadgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  let scoreTitle = 'Зеленый день (Отличный)';
  if (score < 8 && score >= 3) {
    scoreBadgeStyle = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    scoreTitle = 'Желтый день (Нормальный)';
  } else if (score < 3) {
    scoreBadgeStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    scoreTitle = 'Красный день (Разбор)';
  }

  const totalLogs = allLogs.length;
  const greenDays = allLogs.filter((l) => l.calculatedScore >= 15).length;
  const avgScore =
    totalLogs > 0
      ? (allLogs.reduce((acc, l) => acc + l.calculatedScore, 0) / totalLogs).toFixed(1)
      : 0;

  const achievementsData = calculateAchievements(allLogs, userSettings, reports);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Start Hero Card Banner if app is not started yet */}
      {(!userSettings.isStarted || !userSettings.userName) && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-[#121215] to-[#121215] border-2 border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Новый участник / Старт программы</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Вы ещё не зафиксировали старт марафона!
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
                Нажмите кнопку «Стартовать марафон», чтобы внести никнейм, дату начала марафона, стартовый вес и первые замеры.
              </p>
            </div>

            <button
              onClick={onOpenStartWizard}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm rounded-xl shadow-xl shadow-emerald-500/30 flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Flag className="w-5 h-5 fill-black" />
              <span>🚀 Стартовать марафон</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs font-semibold border border-emerald-500/20">
                {getDayOfWeekRu(currentLog.date)} • {formatDateRu(currentLog.date)}
              </span>
              {dayOfWeekIndex === 1 && (
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-mono text-[11px] border border-sky-500/20">
                  🌅 Понедельник — День Замеров
                </span>
              )}
              {dayOfWeekIndex === 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono text-[11px] border border-purple-500/20">
                  📊 Воскресенье — Отчет
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight break-words">
              {userSettings.userName ? `Привет, ${userSettings.userName}!` : 'Главная панель дня'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg">
              Быстрый трекинг приемов пищи, задач по расписанию и дневных показателей.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full lg:w-auto">
            <button
              onClick={onOpenStartWizard}
              className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Flag className="w-4 h-4 text-emerald-400" />
              <span>{userSettings.isStarted ? '⚙️ Старт параметры' : '🚀 Стартовать'}</span>
            </button>

            <button
              onClick={() => onOpenQuickMealModal()}
              className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>+ Приём пищи</span>
            </button>

            <button
              onClick={() => setIsWorkoutModalOpen(true)}
              className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Dumbbell className="w-4 h-4 text-black fill-black" />
              <span>+ Тренировка</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span>📸 Отчёт за день</span>
            </button>

            <button
              onClick={() => setIsAchievementsModalOpen(true)}
              className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>🏆 Ачивки ({achievementsData.unlockedPermanent.length + achievementsData.unlockedWeekly.length})</span>
            </button>

            <button
              onClick={() => onNavigateTab('log')}
              className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 font-semibold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Utensils className="w-4 h-4 text-emerald-400" />
              <span>Дневник</span>
            </button>
          </div>
        </div>
      </div>


      {/* Grid: Tasks & Metrics vs DQS Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tasks & Quick Metrics */}
        <div className="lg:col-span-7 bg-[#121215] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-zinc-100 text-sm">Задачи на сегодня</h2>
            </div>
            <button
              onClick={() => onNavigateTab('settings')}
              className="text-xs text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Настроить</span>
            </button>
          </div>

          <div className="space-y-2">
            {activeRules.length === 0 ? (
              <p className="text-xs text-zinc-500 p-4 text-center">На сегодня нет запланированных задач</p>
            ) : (
              activeRules.map((task) => {
                const isDone = completedTasks[task.id];
                const hasMeasurements = Boolean(
                  currentLog.measurements?.waist || currentLog.measurements?.chest || currentLog.measurements?.hips
                );
                const hasWeight = Boolean(currentLog.weight && currentLog.weight > 0);

                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all ${
                      isDone
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-400'
                        : 'bg-white/[0.03] border-white/[0.06] hover:border-emerald-500/40 text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-600 shrink-0" />
                      )}
                      <div>
                        <div className={`font-medium text-xs sm:text-sm ${isDone ? 'line-through text-zinc-400' : ''}`}>
                          {task.title}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {task.timeOfDay === 'morning' ? '🌅 Утро' : task.timeOfDay === 'evening' ? '🌙 Вечер' : '⏱ В течение дня'}
                        </div>
                      </div>
                    </div>

                    {/* Direct Action Button next to task */}
                    <div className="self-end sm:self-center shrink-0">
                      {task.type === 'measurement' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMeasurementModalOpen(true);
                            setCompletedTasks((prev) => ({ ...prev, [task.id]: true }));
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            hasMeasurements
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20'
                          }`}
                        >
                          {hasMeasurements ? (
                            <span>✓ Замеры ({currentLog.measurements?.waist || currentLog.measurements?.chest} см)</span>
                          ) : (
                            <span>📐 Ввести замеры</span>
                          )}
                        </button>
                      )}

                      {task.type === 'weight' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsWeightModalOpen(true);
                            setCompletedTasks((prev) => ({ ...prev, [task.id]: true }));
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            hasWeight
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/20'
                          }`}
                        >
                          {hasWeight ? (
                            <span>✓ Вес: {currentLog.weight} кг</span>
                          ) : (
                            <span>⚖️ Ввести вес</span>
                          )}
                        </button>
                      )}

                      {task.type === 'photo_meal' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenQuickMealModal();
                            setCompletedTasks((prev) => ({ ...prev, [task.id]: true }));
                          }}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        >
                          <span>🥗 Внести блюдо</span>
                        </button>
                      )}

                      {task.type === 'weekly_report' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateTab('weekly_report');
                            setCompletedTasks((prev) => ({ ...prev, [task.id]: true }));
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                        >
                          <span>📋 Заполнить отчёт</span>
                        </button>
                      )}

                      {task.type === 'custom' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTask(task.id);
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10'
                          }`}
                        >
                          {isDone ? '✓ Выполнено' : '✅ Отметить'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Metrics & Workout Row */}
          <div className="pt-3 border-t border-white/[0.08] space-y-2.5">
            <span className="text-xs font-semibold text-zinc-400 block">Параметры и активность за сегодня:</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.06] space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" /> Вес (кг)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={editingWeight}
                  onChange={(e) => setEditingWeight(e.target.value)}
                  onBlur={handleSaveMetrics}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.06] space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-sky-400" /> Шаги
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={editingSteps}
                  onChange={(e) => setEditingSteps(e.target.value)}
                  onBlur={handleSaveMetrics}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-2.5 py-1 text-sm font-mono font-bold text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Workout Status Card */}
            <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.06] flex items-center justify-between gap-3">
              <div className="space-y-0.5 overflow-hidden">
                <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5 text-orange-400" /> Тренировка дня
                </span>
                {currentLog.workout.done ? (
                  <p className="text-xs text-emerald-400 font-semibold truncate max-w-xs">
                    ✓ {currentLog.workout.description || 'Выполнена'}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500">Не отмечена</p>
                )}
              </div>

              <button
                onClick={() => setIsWorkoutModalOpen(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  currentLog.workout.done
                    ? 'bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10'
                    : 'bg-orange-500 hover:bg-orange-400 text-black shadow-md shadow-orange-500/20'
                }`}
              >
                {currentLog.workout.done ? 'Редактировать' : '+ Добавить'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: DQS Score & Photo Stream */}
        <div className="lg:col-span-5 bg-[#121215] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-zinc-100 text-sm">Качество Питания (DQS)</h2>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${scoreBadgeStyle}`}>
              {score >= 0 ? `+${score}` : score} баллов
            </span>
          </div>

          <div className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.06] text-center space-y-2">
            <div className="text-3xl font-extrabold font-mono text-emerald-400">
              {score >= 0 ? `+${score}` : score}
            </div>
            <p className="text-xs font-medium text-zinc-300">{scoreTitle}</p>

            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (score / userSettings.targetDqsGreen) * 100))}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              Целевой порог: {userSettings.targetDqsGreen}+ баллов
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
              <span>Фото приемов пищи ({currentLog.photos.length}):</span>
              <button
                onClick={() => onOpenQuickMealModal()}
                className="text-emerald-400 hover:underline text-[11px]"
              >
                + Загрузить
              </button>
            </div>

            {currentLog.photos.length === 0 ? (
              <div
                onClick={() => onOpenQuickMealModal()}
                className="p-4 bg-white/[0.02] border border-dashed border-white/10 rounded-xl text-center space-y-1 cursor-pointer hover:border-emerald-500/40 transition-all"
              >
                <Camera className="w-5 h-5 text-zinc-500 mx-auto" />
                <p className="text-xs text-zinc-400">Нет сохраненных фото тарелок</p>
                <span className="text-[10px] text-emerald-400 font-medium">Нажмите, чтобы сделать снимки</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {currentLog.photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => onOpenQuickMealModal(photo)}
                    className="relative rounded-lg overflow-hidden border border-white/10 group aspect-square cursor-pointer bg-zinc-900 flex flex-col items-center justify-center p-1"
                  >
                    {photo.dataUrl ? (
                      <img src={photo.dataUrl} alt={photo.caption} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-1 text-zinc-400">
                        <Utensils className="w-5 h-5 text-emerald-400" />
                        <span className="text-[9px] font-mono text-center truncate max-w-full px-1">
                          {photo.caption || 'Прием пищи'}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 flex flex-col justify-between text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-emerald-400">{photo.timestamp}</span>
                        <Pencil className="w-3.5 h-3.5 text-zinc-300" />
                      </div>
                      <span className="text-[9px] text-zinc-200 line-clamp-2 leading-tight font-sans">
                        {photo.caption || 'Нажмите для редактирования'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('log')}
            className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Перейти в Дневник DQS</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Weekly Report Banner */}
      <div className="bg-[#121215] border border-purple-500/20 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-100 text-sm">Недельная динамика</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Средний балл: {avgScore}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Зеленых дней: {greenDays} из {totalLogs}. Подробный воскресный отчет DQS с графиками веса и фото.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('weekly_report')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
        >
          <span>Отчет недели</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Add Workout Modal */}
      <QuickAddWorkoutModal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        log={currentLog}
        onUpdateLog={onUpdateLog}
      />

      {/* Export Daily Report Modal */}
      <ExportDailyReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        log={currentLog}
        settings={userSettings}
        allLogs={allLogs}
        reports={reports}
      />

      {/* Achievements Modal */}
      <AchievementsModal
        logs={allLogs}
        settings={userSettings}
        reports={reports}
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
      />

      {/* Quick Measurement Modal */}
      <QuickMeasurementModal
        isOpen={isMeasurementModalOpen}
        onClose={() => setIsMeasurementModalOpen(false)}
        currentLog={currentLog}
        userSettings={userSettings}
        reports={reports}
        onSave={(updatedLog, updatedReport) => {
          onUpdateLog(updatedLog);
          if (updatedReport && onSaveReport) {
            onSaveReport(updatedReport);
          }
        }}
      />

      {/* Quick Weight Modal */}
      <QuickWeightModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        currentLog={currentLog}
        userSettings={userSettings}
        reports={reports}
        onSave={(updatedLog, updatedReport) => {
          onUpdateLog(updatedLog);
          if (updatedReport && onSaveReport) {
            onSaveReport(updatedReport);
          }
        }}
      />
    </div>
  );
};
