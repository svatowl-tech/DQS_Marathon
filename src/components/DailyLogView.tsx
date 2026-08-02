import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  CheckCircle2,
  Camera,
  Info,
  Flame,
  Scale,
  Footprints,
  Dumbbell,
  Smile,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
  Droplets,
  Coffee,
  Moon,
  Upload,
  X,
  Zap,
  Share2,
} from 'lucide-react';
import { CategoryId, DailyLogEntry, PhotoEntry, UserSettings } from '../types';
import {
  DQS_CATEGORIES,
  calculateDailyDQS,
  formatDateRu,
  getCategoryPoints,
  getDayOfWeekRu,
} from '../utils/dqsEngine';
import { getFormattedLocalDate, parseLocalDate } from '../utils/timeZoneService';
import { QuickMealBuilder } from './QuickMealBuilder';
import { ExportDailyReportModal } from './ExportDailyReportModal';

interface DailyLogViewProps {
  log: DailyLogEntry;
  onUpdateLog: (updated: DailyLogEntry) => void;
  onSelectDate: (dateStr: string) => void;
  settings?: UserSettings;
}

export const DailyLogView: React.FC<DailyLogViewProps> = ({
  log,
  onUpdateLog,
  onSelectDate,
  settings,
}) => {
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);
  const [showPortionInfo, setShowPortionInfo] = useState(false);
  const [showQuickBuilder, setShowQuickBuilder] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = parseLocalDate(log.date);
    d.setDate(d.getDate() - 1);
    onSelectDate(getFormattedLocalDate(d));
  };

  const handleNextDay = () => {
    const d = parseLocalDate(log.date);
    d.setDate(d.getDate() + 1);
    onSelectDate(getFormattedLocalDate(d));
  };

  const handleTodayClick = () => {
    const todayStr = getFormattedLocalDate(new Date());
    onSelectDate(todayStr);
  };

  // Servings change handler
  const handleServingsChange = (catId: CategoryId, delta: number) => {
    const current = log.servings[catId] || 0;
    const nextVal = Math.max(0, current + delta);
    const updatedServings = { ...log.servings, [catId]: nextVal };
    const updatedScore = calculateDailyDQS(updatedServings, log.diversity);

    onUpdateLog({
      ...log,
      servings: updatedServings,
      calculatedScore: updatedScore,
    });
  };

  // Diversity toggle handler
  const handleDiversityToggle = (catId: CategoryId) => {
    const current = log.diversity[catId] || false;
    const updatedDiversity = { ...log.diversity, [catId]: !current };
    const updatedScore = calculateDailyDQS(log.servings, updatedDiversity);

    onUpdateLog({
      ...log,
      diversity: updatedDiversity,
      calculatedScore: updatedScore,
    });
  };

  // Photo upload handler with TimeMark Watermark generator
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // Draw image onto canvas to apply TimeMark timestamp watermark
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = img.width;
          canvas.height = img.height;

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Watermark styling (TimeMark Camera style)
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
            now.getMinutes()
          ).padStart(2, '0')}`;
          const dateStr = formatDateRu(log.date);

          // Bottom left overlay rectangle
          const overlayHeight = Math.max(60, canvas.height * 0.12);
          const fontSize = Math.max(24, Math.floor(canvas.height * 0.05));

          // Draw dark semi-transparent gradient
          const grad = ctx.createLinearGradient(0, canvas.height - overlayHeight, 0, canvas.height);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          grad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

          // Time text
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${fontSize * 1.4}px sans-serif`;
          ctx.fillText(timeStr, 20, canvas.height - 35);

          // Date & watermark label
          ctx.fillStyle = '#f8fafc';
          ctx.font = `${fontSize * 0.5}px sans-serif`;
          ctx.fillText(`${dateStr} | TimeMark DQS`, 20, canvas.height - 15);

          const watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          const newPhoto: PhotoEntry = {
            id: 'photo_' + Date.now() + Math.random().toString(36).substr(2, 4),
            dataUrl: watermarkedDataUrl,
            mealType: 'lunch',
            timestamp: timeStr,
            caption: '',
          };

          onUpdateLog({
            ...log,
            photos: [...log.photos, newPhoto],
          });
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeletePhoto = (id: string) => {
    onUpdateLog({
      ...log,
      photos: log.photos.filter((p) => p.id !== id),
    });
  };

  const positiveCats = DQS_CATEGORIES.filter((c) => c.group === 'positive');
  const negativeCats = DQS_CATEGORIES.filter((c) => c.group === 'negative');

  const getScoreBadge = (score: number) => {
    if (score >= 18) {
      return {
        label: 'ЗЕЛЕНЫЙ ДЕНЬ (Отлично!)',
        bg: 'bg-emerald-500 text-white border-emerald-600',
        sub: 'Высокое качество и разнообразие',
      };
    }
    if (score >= 10) {
      return {
        label: 'ЖЕЛТЫЙ ДЕНЬ (Хорошо)',
        bg: 'bg-amber-500 text-white border-amber-600',
        sub: 'Нормальный баланс рациона',
      };
    }
    return {
      label: 'КРАСНЫЙ ДЕНЬ (Фокус на огрехи)',
      bg: 'bg-rose-500 text-white border-rose-600',
      sub: 'Много рафинированных продуктов или мало овощей',
    };
  };

  const badge = getScoreBadge(log.calculatedScore);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. DATE NAVIGATOR & DAY STATUS */}
      <div className="bg-[#111] rounded-2xl p-4 sm:p-5 shadow-lg border border-white/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Date Selector Row */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-slate-300"
              title="Предыдущий день"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <input
                type="date"
                value={log.date}
                onChange={(e) => e.target.value && onSelectDate(e.target.value)}
                className="font-bold font-mono text-slate-100 bg-transparent text-sm focus:outline-none"
              />
            </div>

            <button
              onClick={handleNextDay}
              className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-slate-300"
              title="Следующий день"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleTodayClick}
              className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-semibold text-xs rounded-xl border border-emerald-500/30 transition-colors"
            >
              Сегодня
            </button>
          </div>

          {/* Quick Meal Builder Action & Workday/Weekend Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end flex-wrap">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span>📸 Экспорт отчета</span>
            </button>

            <button
              onClick={() => setShowQuickBuilder(!showQuickBuilder)}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>{showQuickBuilder ? 'Закрыть конструктор' : '⚡ Быстрый конструктор'}</span>
            </button>

            <span className="font-bold text-slate-200 text-sm hidden sm:inline">
              {getDayOfWeekRu(log.date)}
            </span>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => onUpdateLog({ ...log, isWeekend: false })}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  !log.isWeekend
                    ? 'bg-emerald-500 text-black font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Рабочий
              </button>
              <button
                onClick={() => onUpdateLog({ ...log, isWeekend: true })}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  log.isWeekend
                    ? 'bg-emerald-500 text-black font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Выходной
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK MEAL BUILDER DRAWER */}
      {showQuickBuilder && (
        <QuickMealBuilder
          log={log}
          onUpdateLog={onUpdateLog}
          onClose={() => setShowQuickBuilder(false)}
        />
      )}

      {/* 2. DQS SCORE REALTIME BANNER & IMPORTANT RULE REMINDER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Realtime DQS Score Widget */}
        <div className="lg:col-span-1 bg-[#111] text-white rounded-2xl p-5 shadow-lg border border-white/10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono font-bold">
                DQS Оценка дня
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border font-mono ${badge.bg}`}
              >
                {badge.label}
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-2">
              <span className="text-5xl font-mono font-bold text-white tracking-tight">
                {log.calculatedScore > 0 ? `+${log.calculatedScore}` : log.calculatedScore}
              </span>
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">баллов</span>
            </div>
            <p className="text-xs text-slate-300">{badge.sub}</p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Цель: ≥18 баллов</span>
            <button
              onClick={() => setShowPortionInfo(!showPortionInfo)}
              className="text-emerald-400 hover:underline flex items-center gap-1 font-sans"
            >
              <Info className="w-3.5 h-3.5" /> Что такое порция?
            </button>
          </div>
        </div>

        {/* Portion Definition Notice */}
        <div className="lg:col-span-2 bg-[#111] border border-emerald-500/20 rounded-2xl p-5 flex items-start gap-4 shadow-lg relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
              ПОРЦИЯ — ЭТО НЕ РЕКОМЕНДУЕМОЕ КОЛИЧЕСТВО ПРОДУКТА!
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              В системе DQS порция — это условная мерная единица (как килограммы или сантиметры) для удобного подсчета качества.
              Никакого подсчета калорий и взвешивания еды в граммах! Оцениваем чисто разнообразие и качество.
            </p>
          </div>
        </div>
      </div>

      {showPortionInfo && (
        <div className="bg-[#1a1a1a] border border-amber-500/30 rounded-2xl p-4 text-xs text-slate-200 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between font-bold text-amber-400">
            <span>📏 Размеры 1 порции в DQS:</span>
            <button onClick={() => setShowPortionInfo(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <li>• <b className="text-white">Овощи / Фрукты:</b> 1 средний плод, 1 кулак или 1 стакан нарезки</li>
            <li>• <b className="text-white">Орехи / Семена:</b> 1 небольшая горсть (~20–30г) или 1 ст.л.</li>
            <li>• <b className="text-white">Белок / Мясо / Рыба:</b> 1 ладонь без пальцев (~100г) или 2 яйца</li>
            <li>• <b className="text-white">Злаки / Гарнир:</b> 1/2 стакана вареной крупы или 1 ломтик ЦЗ хлеба</li>
            <li>• <b className="text-white">Молочные:</b> 150г творога / 1 стакан кефира / 30г сыра</li>
          </ul>
        </div>
      )}

      {/* 3. DQS CATEGORIES TRACKING MATRIX */}
      <div className="space-y-6">
        {/* POSITIVE CATEGORIES */}
        <div className="bg-[#111] rounded-2xl p-5 shadow-lg border border-white/5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <h2 className="font-bold text-slate-100 text-base">
                Здоровые категории (Положительные баллы)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              3+ вида в категории = Разнообразие (+2 б.)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {positiveCats.map((cat) => {
              const count = log.servings[cat.id] || 0;
              const hasDiv = log.diversity[cat.id] || false;
              const points = getCategoryPoints(cat.id, count) + (hasDiv && count >= 1 ? 2 : 0);

              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-xl border transition-all ${
                    count > 0
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        {cat.nameRu}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{cat.portionExample}</p>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                        points > 0 ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {points > 0 ? `+${points}` : points} б.
                    </span>
                  </div>

                  {/* Servings Counter & Diversity Checkbox */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-3">
                    {/* Portion Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleServingsChange(cat.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30"
                        disabled={count <= 0}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold font-mono text-slate-100 text-base">
                        {count}
                      </span>
                      <button
                        onClick={() => handleServingsChange(cat.id, 1)}
                        className="w-8 h-8 rounded-lg bg-emerald-500 border border-emerald-400 text-black flex items-center justify-center font-bold hover:bg-emerald-400 active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Diversity Bonus Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={hasDiv}
                        onChange={() => handleDiversityToggle(cat.id)}
                        className="w-4 h-4 text-emerald-500 bg-white/5 border-white/20 rounded focus:ring-emerald-500 accent-emerald-500"
                      />
                      <span>3+ различных (+2б)</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NEGATIVE CATEGORIES */}
        <div className="bg-[#111] rounded-2xl p-5 shadow-lg border border-white/5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <h2 className="font-bold text-slate-100 text-base">
                Ограничиваемые категории (Отрицательные баллы)
              </h2>
            </div>
            <span className="text-xs text-rose-400 font-mono">
              Каждая порция вычитает баллы DQS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {negativeCats.map((cat) => {
              const count = log.servings[cat.id] || 0;
              const points = getCategoryPoints(cat.id, count);

              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-xl border transition-all ${
                    count > 0
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{cat.nameRu}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{cat.portionExample}</p>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                        points < 0 ? 'bg-rose-500 text-black' : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {points} б.
                    </span>
                  </div>

                  {/* Servings Counter */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleServingsChange(cat.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-30"
                        disabled={count <= 0}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold font-mono text-slate-100 text-base">
                        {count}
                      </span>
                      <button
                        onClick={() => handleServingsChange(cat.id, 1)}
                        className="w-8 h-8 rounded-lg bg-rose-500 border border-rose-400 text-black font-bold flex items-center justify-center hover:bg-rose-400 active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400">Минимизируем по возможности</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. PHOTO JOURNAL WITH TIMEMARK CAMERA STYLE WATERMARK */}
      <div className="bg-[#111] rounded-2xl p-5 shadow-lg border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-base">Фотофиксация блюд (TimeMark style)</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-black hover:bg-emerald-400 text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all">
              <Camera className="w-4 h-4" />
              <span>Снять на камеру</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>

            <label className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-all border border-white/10">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Из файлов / галереи</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          <b>Совет из руководства:</b> Фотографируем сверху в тарелке или в руке до того, как начать есть.
          Это дает время на осознанность! Приложение автоматически добавляет штамп даты и времени на фото.
        </p>

        {/* Photo Grid */}
        {log.photos.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-slate-500 space-y-2 bg-white/5">
            <Camera className="w-8 h-8 mx-auto text-slate-500" />
            <p className="text-xs">Нажмите «Добавить фото», чтобы загрузить завтрак, обед или ужин</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {log.photos.map((p) => (
              <div
                key={p.id}
                className="relative group rounded-xl overflow-hidden border border-white/10 shadow-md aspect-square bg-[#050505]"
              >
                <img
                  src={p.dataUrl}
                  alt="Meal photo"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
                  onClick={() => setActivePhotoModal(p.dataUrl)}
                />

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 text-white pointer-events-none">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-emerald-400">{p.timestamp}</span>
                    {p.mood && (
                      <span className="text-xs">
                        {p.mood === 'great' && '😊'}
                        {p.mood === 'good' && '🙂'}
                        {p.mood === 'normal' && '😐'}
                        {p.mood === 'tired' && '😴'}
                        {p.mood === 'stressed' && '😤'}
                      </span>
                    )}
                  </div>
                  {(p.hungerBefore !== undefined || p.fullnessAfter !== undefined) && (
                    <div className="text-[9px] text-slate-300 font-mono mt-0.5 flex gap-1.5">
                      {p.hungerBefore !== undefined && <span>🍽️ Г:{p.hungerBefore}</span>}
                      {p.fullnessAfter !== undefined && <span>🫄 С:{p.fullnessAfter}</span>}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeletePhoto(p.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 text-white flex items-center justify-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                  title="Удалить фото"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. DAILY JOURNAL & METRICS */}
      <div className="bg-[#111] rounded-2xl p-5 shadow-lg border border-white/5 space-y-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Scale className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-slate-100 text-base">Метрики дня & Дневник контекста</h3>
        </div>

        {/* Weight, Steps & Workout row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Weight */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-slate-400" /> Вес утром (кг)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="Например 72.5"
              value={log.weight ?? ''}
              onChange={(e) =>
                onUpdateLog({
                  ...log,
                  weight: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-mono font-bold text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">
              Взвешиваемся утром натощак. Оцениваем по среднему за неделю!
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Footprints className="w-3.5 h-3.5 text-slate-400" /> Шаги за день
            </label>
            <input
              type="number"
              placeholder="Например 10000"
              value={log.steps ?? ''}
              onChange={(e) =>
                onUpdateLog({
                  ...log,
                  steps: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl font-mono font-bold text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Workout */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5 text-slate-400" /> Тренировка / Активность
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateLog({
                    ...log,
                    workout: { ...log.workout, done: !log.workout.done },
                  })
                }
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  log.workout.done
                    ? 'bg-emerald-500 text-black font-bold shadow-sm'
                    : 'bg-white/5 text-slate-400 border border-white/10'
                }`}
              >
                {log.workout.done ? '✓ Была' : 'Не было'}
              </button>
              <input
                type="text"
                placeholder="Какая тренировка?"
                value={log.workout.description}
                onChange={(e) =>
                  onUpdateLog({
                    ...log,
                    workout: { ...log.workout, description: e.target.value },
                  })
                }
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Not on photo field */}
        <div className="space-y-1 pt-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Нет на фото (съели, но забыли сфотографировать)
          </label>
          <input
            type="text"
            placeholder="Например: 1 конфету на работе, горсть орехов..."
            value={log.notOnPhoto}
            onChange={(e) => onUpdateLog({ ...log, notOnPhoto: e.target.value })}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Hunger / Fullness & Mood Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>Голод ДО / Сытость ПОСЛЕ (1-10)</span>
              <span className="text-emerald-400 font-mono">
                {log.journal.hungerBefore ?? 5} / {log.journal.fullnessAfter ?? 5}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400">Голод до еды</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={log.journal.hungerBefore ?? 5}
                  onChange={(e) =>
                    onUpdateLog({
                      ...log,
                      journal: { ...log.journal, hungerBefore: parseInt(e.target.value, 10) },
                    })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Сытость после еды</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={log.journal.fullnessAfter ?? 5}
                  onChange={(e) =>
                    onUpdateLog({
                      ...log,
                      journal: { ...log.journal, fullnessAfter: parseInt(e.target.value, 10) },
                    })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-slate-400" /> Настроение дня
            </label>
            <select
              value={log.journal.mood ?? 'good'}
              onChange={(e) =>
                onUpdateLog({
                  ...log,
                  journal: { ...log.journal, mood: e.target.value as any },
                })
              }
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-xs font-semibold text-slate-100 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="great">😄 Отличное / Полны энергии</option>
              <option value="good">😊 Хорошее / Спокойное</option>
              <option value="normal">😐 Обычное</option>
              <option value="tired">🥱 Усталость / Мало сна</option>
              <option value="stressed">😤 Стресс / Напряжение</option>
            </select>
          </div>
        </div>

        {/* Daily Context Note */}
        <div className="space-y-1 pt-2">
          <label className="text-xs font-bold text-slate-300">
            Заметка дня (контекст, вопросы, мысли, ответы на челлендж)
          </label>
          <textarea
            rows={3}
            placeholder="Как ощущался день? Был ли стресс, праздник, особые обстоятельств? Начнёте писать — лучше поймёте себя."
            value={log.journal.note ?? ''}
            onChange={(e) =>
              onUpdateLog({
                ...log,
                journal: { ...log.journal, note: e.target.value },
              })
            }
            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Optional Trackers: Water, Coffee, Sleep */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[10px] text-slate-400">Вода (стаканы)</p>
              <input
                type="number"
                min="0"
                value={log.trackers.waterGlass ?? 0}
                onChange={(e) =>
                  onUpdateLog({
                    ...log,
                    trackers: { ...log.trackers, waterGlass: parseInt(e.target.value, 10) || 0 },
                  })
                }
                className="w-16 bg-white/5 border border-white/10 rounded-md px-1.5 py-0.5 text-xs font-mono font-bold text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-slate-400">Кофе (чашки)</p>
              <input
                type="number"
                min="0"
                value={log.trackers.coffeeCups ?? 0}
                onChange={(e) =>
                  onUpdateLog({
                    ...log,
                    trackers: { ...log.trackers, coffeeCups: parseInt(e.target.value, 10) || 0 },
                  })
                }
                className="w-16 bg-white/5 border border-white/10 rounded-md px-1.5 py-0.5 text-xs font-mono font-bold text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-sky-400" />
            <div>
              <p className="text-[10px] text-slate-400">Сон (часов)</p>
              <input
                type="number"
                step="0.5"
                min="0"
                value={log.trackers.sleepHours ?? 0}
                onChange={(e) =>
                  onUpdateLog({
                    ...log,
                    trackers: { ...log.trackers, sleepHours: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-16 bg-white/5 border border-white/10 rounded-md px-1.5 py-0.5 text-xs font-mono font-bold text-slate-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Photo Modal Preview */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActivePhotoModal(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img src={activePhotoModal} alt="Preview" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/10" />
            <button className="absolute top-4 right-4 text-white bg-black/80 p-2 rounded-full border border-white/10">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Export Daily Report Modal */}
      <ExportDailyReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        log={log}
        settings={settings}
      />
    </div>
  );
};
