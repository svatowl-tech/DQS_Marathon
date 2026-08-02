import React, { useState } from 'react';
import { Ruler, X, Check, Calendar, Sparkles } from 'lucide-react';
import { BodyMeasurements, DailyLogEntry, UserSettings, WeeklySundayReport } from '../types';
import { formatDateRu, getSundayOfDate } from '../utils/dqsEngine';

interface QuickMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLog: DailyLogEntry;
  userSettings: UserSettings;
  reports?: WeeklySundayReport[];
  onSave: (updatedLog: DailyLogEntry, updatedReport?: WeeklySundayReport) => void;
}

export const QuickMeasurementModal: React.FC<QuickMeasurementModalProps> = ({
  isOpen,
  onClose,
  currentLog,
  userSettings,
  reports = [],
  onSave,
}) => {
  if (!isOpen) return null;

  const initialMeas = currentLog.measurements || userSettings.startMeasurements || {};

  const [chest, setChest] = useState<string>(initialMeas.chest ? String(initialMeas.chest) : '');
  const [waist, setWaist] = useState<string>(initialMeas.waist ? String(initialMeas.waist) : '');
  const [hips, setHips] = useState<string>(initialMeas.hips ? String(initialMeas.hips) : '');
  const [thigh, setThigh] = useState<string>(initialMeas.thigh ? String(initialMeas.thigh) : '');
  const [arm, setArm] = useState<string>(initialMeas.arm ? String(initialMeas.arm) : '');

  const isSunday = new Date(currentLog.date).getDay() === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const measurements: BodyMeasurements = {
      chest: chest ? parseFloat(chest) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
      hips: hips ? parseFloat(hips) : undefined,
      thigh: thigh ? parseFloat(thigh) : undefined,
      arm: arm ? parseFloat(arm) : undefined,
    };

    const updatedLog: DailyLogEntry = {
      ...currentLog,
      measurements,
    };

    let updatedReport: WeeklySundayReport | undefined = undefined;

    // If it's Sunday, also fix into weekly report as measurementsCurrent
    if (isSunday || true) {
      const sundayDate = getSundayOfDate(currentLog.date);
      const existingReport = reports.find((r) => r.weekEndDate === sundayDate);

      if (existingReport) {
        updatedReport = {
          ...existingReport,
          measurementsCurrent: measurements,
        };
      } else {
        // Create new report shell for Sunday with current measurements
        updatedReport = {
          id: `report_${sundayDate}`,
          weekStartDate: currentLog.date,
          weekEndDate: sundayDate,
          avgDqs: currentLog.calculatedScore,
          greenDaysCount: currentLog.calculatedScore >= 18 ? 1 : 0,
          weightStart: userSettings.startWeight,
          weightCurrentWeekAvg: currentLog.weight || userSettings.startWeight,
          weightChangeTotalPct: 0,
          weightChangeWeekPct: 0,
          measurementsStart: userSettings.startMeasurements,
          measurementsCurrent: measurements,
          whatWentWell: '',
          whatWasDifficult: '',
          insights: '',
          nextWeekFocus: '',
          createdAt: new Date().toISOString(),
        };
      }
    }

    onSave(updatedLog, updatedReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#141417] border border-amber-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 relative overflow-hidden text-zinc-100">
        {/* Header Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-1.5">
                <span>Фиксация Замеров Тела</span>
              </h3>
              <p className="text-xs text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatDateRu(currentLog.date)} {isSunday ? '(Воскресные финальные замеры)' : ''}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSunday && (
          <div className="p-3 bg-purple-500/15 border border-purple-500/30 rounded-2xl text-xs text-purple-300 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              Воскресные замеры автоматически зафиксируются в итоговом недельном отчете DQS!
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Waist */}
            <div className="space-y-1 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
              <label className="text-xs font-bold text-amber-300 block">Талия (см)</label>
              <input
                type="number"
                step="0.5"
                placeholder="75.0"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                autoFocus
              />
              {userSettings.startMeasurements?.waist && (
                <span className="text-[10px] text-zinc-400 block">
                  Старт: {userSettings.startMeasurements.waist} см
                </span>
              )}
            </div>

            {/* Hips */}
            <div className="space-y-1 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
              <label className="text-xs font-bold text-amber-300 block">Бёдра (см)</label>
              <input
                type="number"
                step="0.5"
                placeholder="95.0"
                value={hips}
                onChange={(e) => setHips(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-400"
              />
              {userSettings.startMeasurements?.hips && (
                <span className="text-[10px] text-zinc-400 block">
                  Старт: {userSettings.startMeasurements.hips} см
                </span>
              )}
            </div>

            {/* Chest */}
            <div className="space-y-1 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
              <label className="text-xs font-bold text-amber-300 block">Грудь (см)</label>
              <input
                type="number"
                step="0.5"
                placeholder="90.0"
                value={chest}
                onChange={(e) => setChest(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-400"
              />
              {userSettings.startMeasurements?.chest && (
                <span className="text-[10px] text-zinc-400 block">
                  Старт: {userSettings.startMeasurements.chest} см
                </span>
              )}
            </div>

            {/* Thigh */}
            <div className="space-y-1 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
              <label className="text-xs font-bold text-amber-300 block">Бедро / Обхват (см)</label>
              <input
                type="number"
                step="0.5"
                placeholder="55.0"
                value={thigh}
                onChange={(e) => setThigh(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-400"
              />
              {userSettings.startMeasurements?.thigh && (
                <span className="text-[10px] text-zinc-400 block">
                  Старт: {userSettings.startMeasurements.thigh} см
                </span>
              )}
            </div>
          </div>

          {/* Arm / Biceps */}
          <div className="space-y-1 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
            <label className="text-xs font-bold text-amber-300 block">Рука / Бицепс (см)</label>
            <input
              type="number"
              step="0.5"
              placeholder="30.0"
              value={arm}
              onChange={(e) => setArm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Сохранить замеры</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
