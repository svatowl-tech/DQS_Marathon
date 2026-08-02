import React, { useState, useEffect } from 'react';
import { Sparkles, User, Calendar, Scale, Ruler, CheckCircle2, X, Flag, Flame, Target } from 'lucide-react';
import { BodyMeasurements, UserSettings } from '../types';
import { getFormattedLocalDate } from '../utils/timeZoneService';

interface StartWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onStart: (updatedSettings: UserSettings) => void;
}

export const StartWizardModal: React.FC<StartWizardModalProps> = ({
  isOpen,
  onClose,
  settings,
  onStart,
}) => {
  const todayStr = getFormattedLocalDate(new Date());

  const [userName, setUserName] = useState(settings.userName || '');
  const [startDate, setStartDate] = useState(settings.programStartDate || todayStr);
  const [startWeight, setStartWeight] = useState<string>(
    settings.startWeight ? String(settings.startWeight) : ''
  );
  const [targetWeight, setTargetWeight] = useState<string>(
    settings.targetWeight ? String(settings.targetWeight) : ''
  );
  const [height, setHeight] = useState<string>(
    settings.height ? String(settings.height) : ''
  );

  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    chest: settings.startMeasurements?.chest || undefined,
    waist: settings.startMeasurements?.waist || undefined,
    hips: settings.startMeasurements?.hips || undefined,
    thigh: settings.startMeasurements?.thigh || undefined,
    arm: settings.startMeasurements?.arm || undefined,
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUserName(settings.userName || '');
      setStartDate(settings.programStartDate || todayStr);
      setStartWeight(settings.startWeight ? String(settings.startWeight) : '');
      setTargetWeight(settings.targetWeight ? String(settings.targetWeight) : '');
      setHeight(settings.height ? String(settings.height) : '');
      setMeasurements({
        chest: settings.startMeasurements?.chest || undefined,
        waist: settings.startMeasurements?.waist || undefined,
        hips: settings.startMeasurements?.hips || undefined,
        thigh: settings.startMeasurements?.thigh || undefined,
        arm: settings.startMeasurements?.arm || undefined,
      });
      setErrorMsg('');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleMeasChange = (field: keyof BodyMeasurements, valStr: string) => {
    const val = parseFloat(valStr);
    setMeasurements((prev) => ({
      ...prev,
      [field]: !isNaN(val) ? val : undefined,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setErrorMsg('Пожалуйста, введите ваш никнейм или имя');
      return;
    }

    const weightNum = parseFloat(startWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setErrorMsg('Пожалуйста, укажите ваш корректный стартовый вес');
      return;
    }

    if (!startDate) {
      setErrorMsg('Пожалуйста, выберите дату старта марафона');
      return;
    }

    const updatedSettings: UserSettings = {
      ...settings,
      userName: userName.trim(),
      programStartDate: startDate,
      startWeight: weightNum,
      targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
      height: height ? parseFloat(height) : undefined,
      startMeasurements: measurements,
      isStarted: true,
    };

    onStart(updatedSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-zinc-100 relative my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg">
              <Flag className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                🚀 Старт Марафона DQS
              </h2>
              <p className="text-xs text-zinc-400">
                Заполните ваши стартовые данные для участия и отслеживания прогресса
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

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main required parameters block */}
          <div className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4" /> Данные участника & Дата
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nickname / Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Никнейм или Имя <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: alex_dqs"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" /> День старта марафона{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Weight & Body Goals */}
          <div className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4" /> Вес и Цели
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Start Weight */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Стартовый вес (кг) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="75.0"
                  value={startWeight}
                  onChange={(e) => setStartWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              {/* Target Weight */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Целевой вес (кг)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="70.0"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              {/* Height */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300 block">Рост (см)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Measurements Block (optional/recommended) */}
          <div className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Ruler className="w-4 h-4" /> Стартовые замеры тела (см)
            </h3>
            <p className="text-[11px] text-zinc-400">
              Замеры рекомендуются для точного отслеживания сантиметров каждые 7 дней
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 block truncate">Грудь</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="см"
                  value={measurements.chest ?? ''}
                  onChange={(e) => handleMeasChange('chest', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 block truncate">Талия</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="см"
                  value={measurements.waist ?? ''}
                  onChange={(e) => handleMeasChange('waist', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 block truncate">Бёдра</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="см"
                  value={measurements.hips ?? ''}
                  onChange={(e) => handleMeasChange('hips', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 block truncate">Бедро (нога)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="см"
                  value={measurements.thigh ?? ''}
                  onChange={(e) => handleMeasChange('thigh', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 block truncate">Рука (бицепс)</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="см"
                  value={measurements.arm ?? ''}
                  onChange={(e) => handleMeasChange('arm', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-xs text-zinc-300 font-semibold cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>Сохранить и Стартовать!</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
