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
import { DailyLogEntry, UserSettings } from '../types';
import { DQS_CATEGORIES, formatDateRu, getDayOfWeekRu, calculateDailyDQS } from '../utils/dqsEngine';

interface ExportDailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: DailyLogEntry;
  settings?: UserSettings;
}

export const ExportDailyReportModal: React.FC<ExportDailyReportModalProps> = ({
  isOpen,
  onClose,
  log,
  settings,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [cardTheme, setCardTheme] = useState<'emerald' | 'obsidian' | 'sunset'>('emerald');
  const [aspectRatio, setAspectRatio] = useState<'story' | 'square'>('story'); // 9:16 vs 1:1

  if (!isOpen) return null;

  const score = calculateDailyDQS(log.servings, log.diversity);
  const isGreenZone = score >= (settings?.targetDqsGreen || 18);

  const mealTypeLabels: Record<string, string> = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
    snack: 'Перекус',
  };

  // Group non-zero categories
  const activeHealthyServings = DQS_CATEGORIES.filter(
    (c) => c.group === 'positive' && (log.servings[c.id] || 0) > 0
  );
  const activeRestrictedServings = DQS_CATEGORIES.filter(
    (c) => c.group === 'negative' && (log.servings[c.id] || 0) > 0
  );

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // High resolution for crisp export
      });

      const link = document.createElement('a');
      link.download = `dqs-report-${log.date}.png`;
      link.href = dataUrl;
      link.click();
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
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
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
        return 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-zinc-100 border-zinc-800';
      case 'sunset':
        return 'bg-gradient-to-br from-slate-950 via-amber-950/40 to-zinc-950 text-zinc-100 border-amber-900/40';
      case 'emerald':
      default:
        return 'bg-gradient-to-br from-[#0c1813] via-[#10221a] to-[#08100d] text-zinc-100 border-emerald-900/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-zinc-100 relative my-auto">
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
        <div className="flex justify-center max-h-[55vh] overflow-y-auto p-2 bg-black/40 rounded-xl border border-white/5 no-scrollbar">
          <div
            ref={cardRef}
            className={`w-full max-w-md p-5 sm:p-6 rounded-3xl border shadow-2xl relative flex flex-col justify-between ${getThemeBg()} ${
              aspectRatio === 'story' ? 'min-h-[580px]' : 'min-h-[480px]'
            }`}
          >
            {/* Header branding */}
            <div className="space-y-3 border-b border-white/10 pb-4">
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

            {/* Photos Grid if any */}
            {log.photos && log.photos.length > 0 && (
              <div className="my-3 space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  📸 Тарелки дня ({log.photos.length}):
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
                  {log.photos.slice(0, 3).map((photo) => (
                    <div
                      key={photo.id}
                      className="relative rounded-xl overflow-hidden border border-white/15 aspect-square bg-black/60 shadow-md group"
                    >
                      <img
                        src={photo.dataUrl}
                        alt="Тарелка"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] text-white font-semibold">
                        {mealTypeLabels[photo.mealType] || 'Приём пищи'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Servings Breakdown */}
            <div className="my-3 space-y-2">
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
              <div className="my-2 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-2.5">
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
            <div className="my-2 grid grid-cols-3 gap-2 text-center text-xs">
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

            {/* Footer Watermark */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
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
