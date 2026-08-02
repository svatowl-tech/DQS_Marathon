import React, { useState } from 'react';
import { Award, X, Sparkles, CheckCircle2, Lock, Flame, Shield, Trophy } from 'lucide-react';
import { DailyLogEntry, UserSettings, WeeklySundayReport } from '../types';
import { calculateAchievements, AchievementItem } from '../utils/achievementsEngine';

interface AchievementsModalProps {
  logs: DailyLogEntry[];
  settings?: UserSettings;
  reports?: WeeklySundayReport[];
  isOpen: boolean;
  onClose: () => void;
}

type TabFilter = 'all' | 'permanent' | 'weekly' | 'unlocked';

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  logs,
  settings,
  reports = [],
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  if (!isOpen) return null;

  const data = calculateAchievements(logs, settings, reports);

  const totalPermanentCount = data.permanent.length;
  const totalWeeklyCount = data.weekly.length;
  const unlockedPermanentCount = data.unlockedPermanent.length;
  const unlockedWeeklyCount = data.unlockedWeekly.length;

  const getFilteredItems = () => {
    if (activeTab === 'permanent') return data.permanent;
    if (activeTab === 'weekly') return data.weekly;
    if (activeTab === 'unlocked') {
      return [
        ...data.permanent.filter((a) => a.unlocked),
        ...data.weekly.filter((a) => a.unlocked),
      ];
    }
    return [...data.permanent, ...data.weekly];
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-zinc-100 relative my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-zinc-100 flex items-center gap-2">
                Ачивки и Достижения
              </h2>
              <p className="text-xs text-zinc-400">
                За качество питания, время в марафоне, тренировки и динамику параметров
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border border-amber-500/20 shrink-0 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs text-amber-300 font-extrabold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Текущий статус вашей награды
              </span>
              <h3 className="text-base font-black text-zinc-100">
                {data.highestTimeAchievement
                  ? `Уровень: ${data.highestTimeAchievement.title}`
                  : 'Новичок марафона'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
                Постоянные: {unlockedPermanentCount} / {totalPermanentCount}
              </div>
              <div className="px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                Недельные: {unlockedWeeklyCount} / {totalWeeklyCount}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            Все ачивки
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('permanent')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'permanent'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            Постоянные (Во всех отчётах)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'weekly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            Недельные (За текущую неделю)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unlocked')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'unlocked'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            Открытые ({unlockedPermanentCount + unlockedWeeklyCount})
          </button>
        </div>

        {/* Achievements Grid List */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 relative overflow-hidden ${
                  item.unlocked
                    ? 'bg-black/40 border-white/15'
                    : 'bg-zinc-900/30 border-white/5 opacity-60'
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl text-xl shrink-0 flex items-center justify-center border ${
                    item.unlocked
                      ? item.badgeColor
                      : 'bg-zinc-900 text-zinc-600 border-zinc-800'
                  }`}
                >
                  {item.icon}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-zinc-100 flex items-center gap-1.5 truncate">
                      <span>{item.title}</span>
                    </h4>
                    {item.unlocked ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase shrink-0 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Получено
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase shrink-0 border border-zinc-700 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Заблокировано
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-tight">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-zinc-500 font-mono">
                      {item.type === 'permanent' ? '📌 Постоянная' : '📅 Недельная'}
                    </span>
                    {item.progressText && (
                      <span className="font-extrabold font-mono text-amber-400">
                        {item.progressText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
