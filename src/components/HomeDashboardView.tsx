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
} from 'lucide-react';
import { CustomTaskRule, DailyLogEntry, UserSettings } from '../types';
import { formatDateRu, getDayOfWeekRu } from '../utils/dqsEngine';
import { QuickAddWorkoutModal } from './QuickAddWorkoutModal';
import { ExportDailyReportModal } from './ExportDailyReportModal';

interface HomeDashboardViewProps {
  currentLog: DailyLogEntry;
  allLogs: DailyLogEntry[];
  userSettings: UserSettings;
  onUpdateLog: (updated: DailyLogEntry) => void;
  onNavigateTab: (tab: any) => void;
  onOpenQuickMealModal: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  currentLog,
  allLogs,
  userSettings,
  onUpdateLog,
  onNavigateTab,
  onOpenQuickMealModal,
}) => {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
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

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
              {userSettings.userName ? `Привет, ${userSettings.userName}!` : 'Главная панель дня'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg">
              Быстрый трекинг приемов пищи, задач по расписанию и дневных показателей.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
            <button
              onClick={onOpenQuickMealModal}
              className="px-4 sm:px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>+ Приём пищи</span>
            </button>

            <button
              onClick={() => setIsWorkoutModalOpen(true)}
              className="px-4 sm:px-5 py-3 bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Dumbbell className="w-4 h-4 text-black fill-black" />
              <span>+ Тренировка</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 sm:px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span>📸 Отчёт за день</span>
            </button>

            <button
              onClick={() => onNavigateTab('log')}
              className="px-4 py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-200 font-semibold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all cursor-pointer"
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
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isDone
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-400 line-through'
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
                        <div className="font-medium text-xs sm:text-sm">{task.title}</div>
                        <div className="text-[10px] text-zinc-500">
                          {task.timeOfDay === 'morning' ? '🌅 Утро' : task.timeOfDay === 'evening' ? '🌙 Вечер' : '⏱ В течение дня'}
                        </div>
                      </div>
                    </div>

                    {task.type === 'measurement' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateTab('settings');
                        }}
                        className="px-2.5 py-1 bg-white/10 hover:bg-emerald-500 hover:text-black text-[11px] font-semibold rounded-lg transition-colors shrink-0"
                      >
                        Замеры →
                      </button>
                    )}

                    {task.type === 'weekly_report' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateTab('weekly_report');
                        }}
                        className="px-2.5 py-1 bg-purple-500 text-white text-[11px] font-semibold rounded-lg hover:bg-purple-400 transition-colors shrink-0"
                      >
                        Отчет →
                      </button>
                    )}
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
                onClick={onOpenQuickMealModal}
                className="text-emerald-400 hover:underline text-[11px]"
              >
                + Загрузить
              </button>
            </div>

            {currentLog.photos.length === 0 ? (
              <div
                onClick={onOpenQuickMealModal}
                className="p-4 bg-white/[0.02] border border-dashed border-white/10 rounded-xl text-center space-y-1 cursor-pointer hover:border-emerald-500/40 transition-all"
              >
                <Camera className="w-5 h-5 text-zinc-500 mx-auto" />
                <p className="text-xs text-zinc-400">Нет сохраненных фото тарелок</p>
                <span className="text-[10px] text-emerald-400 font-medium">Нажмите, чтобы сделать снимки</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {currentLog.photos.map((photo) => (
                  <div key={photo.id} className="relative rounded-lg overflow-hidden border border-white/10 group aspect-square">
                    <img src={photo.dataUrl} alt={photo.caption} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-1 flex items-end">
                      <span className="text-[9px] font-mono font-bold text-white truncate">{photo.timestamp}</span>
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
      />
    </div>
  );
};
