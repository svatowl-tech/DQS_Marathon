import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Share2,
  Sparkles,
  Zap,
  Dumbbell,
  Scale,
  Footprints,
  Droplet,
  Moon,
  CheckCircle2,
  Image as ImageIcon,
  Flame,
  Layout,
  Palette,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { downloadOrShareImage } from '../utils/imageExportHelper';
import { DailyLogEntry, UserSettings, WeeklySundayReport } from '../types';
import { DQS_CATEGORIES, formatDateRu, getDayOfWeekRu, calculateDailyDQS } from '../utils/dqsEngine';
import { calculateAchievements } from '../utils/achievementsEngine';
import { AchievementsBadgeList } from './AchievementsBadgeList';

interface ExportDailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: DailyLogEntry;
  settings?: UserSettings;
  allLogs?: DailyLogEntry[];
  reports?: WeeklySundayReport[];
}

export const ExportDailyReportModal: React.FC<ExportDailyReportModalProps> = ({
  isOpen,
  onClose,
  log,
  settings,
  allLogs = [],
  reports = [],
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [cardTheme, setCardTheme] = useState<'emerald' | 'obsidian' | 'sunset'>('emerald');
  const [aspectRatio, setAspectRatio] = useState<'story' | 'square'>('story'); // 9:16 vs 1:1

  if (!isOpen) return null;

  const score = calculateDailyDQS(log.servings, log.diversity);
  const isGreenZone = score >= (settings?.targetDqsGreen || 18);

  const achievementsData = calculateAchievements(
    allLogs.length > 0 ? allLogs : [log],
    settings,
    reports
  );

  const mealTypeLabels: Record<string, string> = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    snack: 'Перекус',
  };

  // Group non-zero categories
  const activeHealthyServings = DQS_CATEGORIES.filter(
    (c) => (c.group === 'positive' || c.group === 'limited') && (log.servings[c.id] || 0) > 0
  );
  const activeRestrictedServings = DQS_CATEGORIES.filter(
    (c) => (c.group === 'negative' || c.group === 'neutral') && (log.servings[c.id] || 0) > 0
  );

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const node = cardRef.current;
      const width = node.scrollWidth || node.offsetWidth || 480;
      const height = node.scrollHeight || node.offsetHeight || 600;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2, // High resolution for crisp export
        width: width,
        height: height,
        style: {
          height: `${height}px`,
          maxHeight: 'none',
          overflow: 'visible',
          transform: 'none',
        },
      });

      await downloadOrShareImage(dataUrl, `dqs-report-${log.date}.png`);
    } catch (err) {
      console.error('Failed to export card image:', err);
      alert('Произошла ошибка при генерации изображения. Попробуйте еще раз.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const node = cardRef.current;
      const width = node.scrollWidth || node.offsetWidth || 480;
      const height = node.scrollHeight || node.offsetHeight || 600;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        width: width,
        height: height,
        style: {
          height: `${height}px`,
          maxHeight: 'none',
          overflow: 'visible',
          transform: 'none',
        },
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `dqs-report-${log.date}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Отчёт питания DQS за ${log.date}`,
          text: `Мой отчет DQS за ${log.date}: ${score} баллов!`,
        });
      } else {
        // Fallback to download
        handleDownloadImage();
      }
    } catch (err) {
      console.error('Share error:', err);
      handleDownloadImage();
    } finally {
      setIsExporting(false);
    }
  };

  // Background style classes based on theme
  const getThemeBg = () => {
    switch (cardTheme) {
      case 'obsidian':
        return 'bg-[#0e0e11] bg-gradient-to-b from-[#18181c] via-[#131317] to-[#0c0c0f] text-zinc-100 border-zinc-700/40';
      case 'sunset':
        return 'bg-[#180d09] bg-gradient-to-b from-[#2a1610] via-[#20110b] to-[#120805] text-zinc-100 border-amber-600/30';
      case 'emerald':
      default:
        return 'bg-[#091a13] bg-gradient-to-b from-[#0f2e21] via-[#0d261b] to-[#081811] text-zinc-100 border-emerald-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-zinc-100 relative my-auto max-h-[92vh] overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100">
                Экспорт Отчёта за День в Картинку
              </h2>
              <p className="text-[11px] text-zinc-400">
                Красивая открытка для соцсетей (Stories / Сообщения)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customization toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06]">
          {/* Theme selector */}
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-400">Стиль:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCardTheme('emerald')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  cardTheme === 'emerald'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Изумруд
              </button>
              <button
                onClick={() => setCardTheme('obsidian')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  cardTheme === 'obsidian'
                    ? 'bg-zinc-100 text-black font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Обсидиан
              </button>
              <button
                onClick={() => setCardTheme('sunset')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  cardTheme === 'sunset'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Закат
              </button>
            </div>
          </div>

          {/* Aspect ratio */}
          <div className="flex items-center gap-1.5">
            <Layout className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-400">Формат:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAspectRatio('story')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  aspectRatio === 'story'
                    ? 'bg-indigo-500 text-white font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Stories (9:16)
              </button>
              <button
                onClick={() => setAspectRatio('square')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  aspectRatio === 'square'
                    ? 'bg-indigo-500 text-white font-bold'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Квадрат (1:1)
              </button>
            </div>
          </div>
        </div>

        {/* Card Canvas Container to capture */}
        <div className="flex justify-center max-h-[62vh] overflow-y-auto p-2 sm:p-4 bg-black/50 rounded-2xl border border-white/5 no-scrollbar">
          <div
            ref={cardRef}
            className={`w-full max-w-lg sm:max-w-xl p-5 sm:p-6 rounded-3xl border shadow-2xl relative flex flex-col justify-between shrink-0 h-auto overflow-hidden ${getThemeBg()} ${
              aspectRatio === 'story' ? 'min-h-[580px]' : 'min-h-[480px]'
            }`}
          >
            {/* Ambient theme glow overlays */}
            {cardTheme === 'emerald' && (
              <>
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />
              </>
            )}
            {cardTheme === 'sunset' && (
              <>
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-rose-500/25 rounded-full blur-3xl pointer-events-none" />
              </>
            )}
            {cardTheme === 'obsidian' && (
              <>
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
              </>
            )}

            {/* Header branding */}
            <div className="space-y-3 border-b border-white/10 pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-black text-xs">
                    DQS
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs tracking-wider uppercase text-zinc-200">
                      Дневник Питания DQS
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-medium">
                      {settings?.userName ? `Пользователь: ${settings.userName}` : 'Дневник здоровья'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-zinc-100 block">
                    {getDayOfWeekRu(log.date)}
                  </span>
                  <span className="text-[10px] text-zinc-400">{formatDateRu(log.date)}</span>
                </div>
              </div>

              {/* Main Score Banner */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 relative overflow-hidden">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">
                    Качество Питания (DQS)
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-3xl font-black ${
                        score > 0 ? 'text-emerald-400' : score < 0 ? 'text-rose-400' : 'text-zinc-300'
                      }`}
                    >
                      {score > 0 ? `+${score}` : score}
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold">
                      / цель +{settings?.targetDqsGreen || 18}
                    </span>
                  </div>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
                    isGreenZone
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isGreenZone ? '🟢 ЗЕЛЕНАЯ ЗОНА' : '🟡 ЖЕЛТАЯ ЗОНА'}
                </div>
              </div>
            </div>

            {/* Meal Entries & Photos Grid */}
            {log.photos && log.photos.length > 0 && (
              <div className="my-3 space-y-1.5 relative z-10">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  🍽️ Приёмы пищи и фото ({log.photos.length}):
                </span>
                <div
                  className={`grid gap-2 ${
                    log.photos.length === 1
                      ? 'grid-cols-1'
                      : log.photos.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-3'
                  }`}
                >
                  {log.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative rounded-xl overflow-hidden border border-white/15 aspect-square bg-black/60 shadow-md group flex flex-col justify-between"
                    >
                      {photo.dataUrl ? (
                        <img
                          src={photo.dataUrl}
                          alt={photo.caption || 'Тарелка'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full p-2 flex flex-col items-center justify-center bg-zinc-900/90 text-center space-y-1">
                          <span className="text-base">🥗</span>
                          <span className="text-[10px] font-bold text-emerald-400 leading-tight truncate max-w-full">
                            {mealTypeLabels[photo.mealType] || 'Приём пищи'}
                          </span>
                          <span className="text-[9px] text-zinc-400 line-clamp-2 leading-tight">
                            {photo.caption || photo.timestamp}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] text-white font-semibold flex items-center gap-1 max-w-[90%] truncate">
                        <span>{mealTypeLabels[photo.mealType] || 'Приём пищи'}</span>
                        {photo.timestamp && <span className="opacity-75">• {photo.timestamp}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Servings Breakdown */}
            <div className="my-3 space-y-2 relative z-10">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                🥗 Порции полезных продуктов:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeHealthyServings.length > 0 ? (
                  activeHealthyServings.map((cat) => (
                    <span
                      key={cat.id}
                      className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <span>{cat.nameRu}</span>
                      <span className="bg-emerald-400/20 px-1 rounded text-emerald-200">
                        +{log.servings[cat.id]}
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-zinc-500">Порции полезных продуктов не отмечены</span>
                )}

                {activeRestrictedServings.map((cat) => (
                  <span
                    key={cat.id}
                    className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <span>{cat.nameRu}</span>
                    <span className="bg-rose-400/20 px-1 rounded text-rose-200">
                      -{log.servings[cat.id]}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Workout Card if exists */}
            {log.workout.done && (
              <div className="my-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-2.5 relative z-10">
                <Dumbbell className="w-4 h-4 text-orange-400 shrink-0" />
                <div className="text-xs overflow-hidden">
                  <span className="font-bold text-orange-300 block">Тренировка выполнена</span>
                  <p className="text-[11px] text-zinc-300 truncate">
                    {log.workout.description || 'Физическая активность'}
                  </p>
                </div>
              </div>
            )}

            {/* Body Metrics Grid */}
            <div className="my-2 grid grid-cols-3 gap-2 text-center text-xs relative z-10">
              {log.weight ? (
                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="text-[9px] text-zinc-400 block">Вес</span>
                  <span className="font-bold text-zinc-100">{log.weight} кг</span>
                </div>
              ) : null}

              {log.steps ? (
                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="text-[9px] text-zinc-400 block">Шаги</span>
                  <span className="font-bold text-amber-300">{log.steps.toLocaleString()}</span>
                </div>
              ) : null}

              {log.trackers?.waterGlass ? (
                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
                  <span className="text-[9px] text-zinc-400 block">Вода</span>
                  <span className="font-bold text-sky-300">{log.trackers.waterGlass} стаканов</span>
                </div>
              ) : null}
            </div>

            {/* Daily Notes / Journal if present */}
            {(log.journal?.note || log.notes) && (
              <div className="my-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1 relative z-10">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">
                  📝 Заметки дня:
                </span>
                <p className="text-[11px] text-zinc-200 leading-relaxed italic">
                  "{log.journal?.note || log.notes}"
                </p>
              </div>
            )}

            {/* Permanent & Weekly Achievements on Daily Report */}
            {(achievementsData.unlockedPermanent.length > 0 || achievementsData.unlockedWeekly.length > 0) && (
              <div className="my-2 space-y-1 relative z-10">
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
                  🏆 Достижения марафона ({achievementsData.unlockedPermanent.length + achievementsData.unlockedWeekly.length}):
                </span>
                <AchievementsBadgeList
                  permanentAchievements={achievementsData.unlockedPermanent}
                  weeklyAchievements={achievementsData.unlockedWeekly}
                  compact
                />
              </div>
            )}

            {/* Footer Watermark */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400 relative z-10">
              <span className="font-semibold text-zinc-300">DQS Health & Nutrition</span>
              <span>Создано в трекере DQS</span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-xs text-zinc-300 font-semibold cursor-pointer"
          >
            Закрыть
          </button>

          <button
            type="button"
            onClick={handleShare}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Поделиться</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Сохранение...' : 'Скачать PNG'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
