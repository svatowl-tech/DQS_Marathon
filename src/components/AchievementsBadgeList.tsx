import React from 'react';
import { AchievementItem } from '../utils/achievementsEngine';
import { Award, Lock, Sparkles, CheckCircle2, Star } from 'lucide-react';

interface AchievementsBadgeListProps {
  permanentAchievements: AchievementItem[];
  weeklyAchievements?: AchievementItem[];
  compact?: boolean;
  showCategoryHeaders?: boolean;
}

export const AchievementsBadgeList: React.FC<AchievementsBadgeListProps> = ({
  permanentAchievements,
  weeklyAchievements = [],
  compact = false,
  showCategoryHeaders = false,
}) => {
  const hasPermanent = permanentAchievements.length > 0;
  const hasWeekly = weeklyAchievements.length > 0;

  if (!hasPermanent && !hasWeekly) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-zinc-400">
        Пока нет открытых ачивок. Продолжайте марафон для получения первых достижений!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Permanent Achievements Section */}
      {hasPermanent && (
        <div className="space-y-2">
          {showCategoryHeaders && (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Award className="w-3.5 h-3.5" />
              <span>Постоянные достижения (Накопительные)</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {permanentAchievements.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-1.5 ${
                  compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
                } rounded-xl border font-semibold transition-all shadow-sm ${
                  item.unlocked
                    ? `${item.badgeColor} shadow-emerald-500/10`
                    : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 opacity-60'
                }`}
                title={item.description}
              >
                <span className={compact ? 'text-xs' : 'text-sm'}>{item.icon}</span>
                <span>{item.title}</span>
                {item.unlocked ? (
                  <CheckCircle2 className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-400 ml-0.5 shrink-0`} />
                ) : (
                  <Lock className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-zinc-600 ml-0.5 shrink-0`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Achievements Section */}
      {hasWeekly && (
        <div className="space-y-2">
          {showCategoryHeaders && (
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 pt-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Достижения за эту неделю</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {weeklyAchievements.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
                  item.unlocked
                    ? `${item.badgeColor} shadow-indigo-500/10`
                    : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 opacity-60'
                }`}
                title={item.description}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.title}</span>
                {item.unlocked ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 ml-0.5 shrink-0" />
                ) : (
                  <Lock className="w-3 h-3 text-zinc-600 ml-0.5 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
