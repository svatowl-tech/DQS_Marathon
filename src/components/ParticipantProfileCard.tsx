import React, { useRef, useState } from 'react';
import {
  User,
  Camera,
  Award,
  Sparkles,
  Download,
  Share2,
  CheckCircle2,
  Flame,
  Scale,
  Ruler,
  Dumbbell,
  Calendar,
  ShieldCheck,
  Zap,
  Trash2,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { DailyLogEntry, UserSettings, WeeklySundayReport } from '../types';
import { calculateAchievements } from '../utils/achievementsEngine';
import { AchievementsBadgeList } from './AchievementsBadgeList';

interface ParticipantProfileCardProps {
  settings: UserSettings;
  logs: DailyLogEntry[];
  reports?: WeeklySundayReport[];
  onUpdateSettings: (updated: UserSettings) => void;
}

export const ParticipantProfileCard: React.FC<ParticipantProfileCardProps> = ({
  settings,
  logs,
  reports = [],
  onUpdateSettings,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Calculate stats
  const achievementsData = calculateAchievements(logs, settings, reports);

  // Days in marathon
  let daysInMarathon = logs.length;
  if (settings.programStartDate) {
    const start = new Date(settings.programStartDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    daysInMarathon = Math.max(daysInMarathon, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Weight calculations
  const validWeights = logs
    .map((l) => l.weight)
    .filter((w): w is number => typeof w === 'number');
  const startWeight = settings.startWeight || validWeights[0] || 0;
  const currentWeight = validWeights.length > 0 ? validWeights[validWeights.length - 1] : startWeight;
  const weightChange = Number((currentWeight - startWeight).toFixed(1));

  // Average DQS
  const totalLogs = logs.length;
  const avgDqs = totalLogs > 0
    ? (logs.reduce((acc, l) => acc + l.calculatedScore, 0) / totalLogs).toFixed(1)
    : '0';

  const greenDaysCount = logs.filter((l) => l.calculatedScore >= (settings.targetDqsGreen || 18)).length;
  const greenPct = totalLogs > 0 ? Math.round((greenDaysCount / totalLogs) * 100) : 0;

  // Workouts
  const totalWorkouts = logs.filter((l) => l.workout?.done).length;

  // Waist measurement
  const waistStart = settings.startMeasurements?.waist || 0;
  const latestReport = reports.length > 0 ? reports[reports.length - 1] : null;
  const waistCurrent = latestReport?.measurementsCurrent?.waist || waistStart;
  const waistChange = waistStart > 0 && waistCurrent > 0 ? Number((waistCurrent - waistStart).toFixed(1)) : 0;

  // Handle Avatar Upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateSettings({ ...settings, userAvatarUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    onUpdateSettings({ ...settings, userAvatarUrl: undefined });
  };

  // Handle Image Export
  const handleExportCard = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
        },
      });

      const fileName = `dqs_profile_${settings.userName || 'participant'}_${new Date().toISOString().split('T')[0]}.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export profile image', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 p-4 rounded-2xl border border-amber-500/20">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Профиль Участника Марафона
          </h3>
          <p className="text-xs text-zinc-400">
            Загрузите фото, просмотрите прогресс и экспортируйте карточку для соцсетей
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-zinc-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Загрузить фото</span>
          </button>

          <button
            type="button"
            onClick={handleExportCard}
            disabled={isExporting}
            className="flex-1 sm:flex-initial px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <span>Генерация...</span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Скачать карточку (PNG)</span>
              </>
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>

      {exportSuccess && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Карточка профиля успешно сохранена на ваше устройство!</span>
        </div>
      )}

      {/* EXPORTABLE PROFILE CARD CONTAINER */}
      <div
        ref={cardRef}
        className="bg-gradient-to-b from-[#18181c] via-[#121215] to-[#0d0d10] border border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden space-y-6 text-zinc-100"
      >
        {/* Subtle Background Glow Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header: Avatar & Main Identity */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b border-white/[0.08] pb-5 relative z-10 text-center sm:text-left">
          {/* Avatar Container with glowing border */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-tr from-amber-500 via-emerald-400 to-indigo-500 shadow-xl shadow-amber-500/10 flex items-center justify-center">
              <div className="w-full h-full rounded-[22px] bg-zinc-900 overflow-hidden relative flex items-center justify-center">
                {settings.userAvatarUrl ? (
                  <img
                    src={settings.userAvatarUrl}
                    alt={settings.userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-zinc-600" />
                )}

                {/* Hover overlay to change avatar */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                  title="Изменить фото"
                >
                  <Camera className="w-4 h-4" />
                  <span>Фото</span>
                </button>
              </div>
            </div>

            {/* Status Badge Over Avatar */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider shadow-md whitespace-nowrap flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 fill-black" />
              <span>DQS Участник</span>
            </div>
          </div>

          {/* User Details & Marathon Status */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
                  <span>{settings.userName || 'Участник Марафона'}</span>
                  {settings.userAvatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Удалить аватарку"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </h2>
                <p className="text-xs text-amber-300 font-semibold flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>
                    {achievementsData.highestTimeAchievement
                      ? achievementsData.highestTimeAchievement.title
                      : `${daysInMarathon} дней в марафоне`}
                  </span>
                </p>
              </div>

              {/* Start Date Badge */}
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-zinc-300 inline-flex items-center gap-1.5 self-center sm:self-start">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Старт: {settings.programStartDate || '—'}</span>
              </div>
            </div>

            {/* Quick Status Tag Pill */}
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              Участник программы здорового питания DQS (Daily Quality Score). Ежедневный учёт плотности нутриентов, активности и трансформации тела.
            </p>
          </div>
        </div>

        {/* STATS METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          {/* Metric 1: Average DQS */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
              <span>Средний DQS</span>
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {avgDqs} <span className="text-xs font-normal text-zinc-400">б.</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold">
              {greenPct}% дней в зелёной зоне
            </div>
          </div>

          {/* Metric 2: Weight Progress */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300">
              <span>Динамика Веса</span>
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {currentWeight || startWeight || '—'}{' '}
              <span className="text-xs font-normal text-zinc-400">кг</span>
            </div>
            <div className="text-[10px] font-bold">
              {weightChange < 0 ? (
                <span className="text-emerald-400">Сброшено: {Math.abs(weightChange)} кг</span>
              ) : weightChange > 0 ? (
                <span className="text-amber-400">Набрано: +{weightChange} кг</span>
              ) : (
                <span className="text-zinc-400">Без изменений</span>
              )}
            </div>
          </div>

          {/* Metric 3: Waist Measurement */}
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-300">
              <span>Объём Талии</span>
              <Ruler className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {waistCurrent || waistStart || '—'}{' '}
              <span className="text-xs font-normal text-zinc-400">см</span>
            </div>
            <div className="text-[10px] font-bold">
              {waistChange < 0 ? (
                <span className="text-emerald-400">Минус {Math.abs(waistChange)} см</span>
              ) : (
                <span className="text-zinc-400">Старт: {waistStart || '—'} см</span>
              )}
            </div>
          </div>

          {/* Metric 4: Workouts */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
              <span>Тренировки</span>
              <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {totalWorkouts}{' '}
              <span className="text-xs font-normal text-zinc-400">сессий</span>
            </div>
            <div className="text-[10px] text-amber-400 font-semibold">
              За время марафона
            </div>
          </div>
        </div>

        {/* UNLOCKED ACHIEVEMENTS DISPLAY */}
        <div className="space-y-2.5 relative z-10 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Достижения и Ачивки ({achievementsData.unlockedPermanent.length + achievementsData.unlockedWeekly.length})
            </h4>
            <span className="text-[10px] text-zinc-400">
              Разблокировано в марафоне
            </span>
          </div>

          <AchievementsBadgeList
            permanentAchievements={achievementsData.unlockedPermanent}
            weeklyAchievements={achievementsData.unlockedWeekly}
            showCategoryHeaders={false}
          />
        </div>

        {/* CARD FOOTER WATERMARK FOR SOCIAL MEDIA */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[10px] text-zinc-400 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-black text-xs shadow-sm">
              D
            </div>
            <div>
              <span className="font-extrabold text-zinc-200 block">DQS NUTRITION MARATHON</span>
              <span className="text-zinc-500 text-[9px]">Daily Quality Score • Health & Balance</span>
            </div>
          </div>

          <div className="text-right">
            <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-amber-400 font-mono font-bold">
              #DQSMarathon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
