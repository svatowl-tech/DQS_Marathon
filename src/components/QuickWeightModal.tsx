import React, { useState } from 'react';
import { Scale, X, Check, Calendar } from 'lucide-react';
import { DailyLogEntry, UserSettings, WeeklySundayReport } from '../types';
import { formatDateRu, getSundayOfDate } from '../utils/dqsEngine';

interface QuickWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLog: DailyLogEntry;
  userSettings: UserSettings;
  reports?: WeeklySundayReport[];
  onSave: (updatedLog: DailyLogEntry, updatedReport?: WeeklySundayReport) => void;
}

export const QuickWeightModal: React.FC<QuickWeightModalProps> = ({
  isOpen,
  onClose,
  currentLog,
  userSettings,
  reports = [],
  onSave,
}) => {
  if (!isOpen) return null;

  const [weight, setWeight] = useState<string>(
    currentLog.weight ? String(currentLog.weight) : userSettings.startWeight ? String(userSettings.startWeight) : ''
  );

  const isSunday = new Date(currentLog.date).getDay() === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) return;

    const updatedLog: DailyLogEntry = {
      ...currentLog,
      weight: parsedWeight,
    };

    let updatedReport: WeeklySundayReport | undefined = undefined;

    if (isSunday) {
      const sundayDate = getSundayOfDate(currentLog.date);
      const existingReport = reports.find((r) => r.weekEndDate === sundayDate);
      if (existingReport) {
        updatedReport = {
          ...existingReport,
          weightCurrentWeekAvg: parsedWeight,
        };
      }
    }

    onSave(updatedLog, updatedReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#141417] border border-indigo-500/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5 relative overflow-hidden text-zinc-100">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Внести Вес Тела</h3>
              <p className="text-xs text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatDateRu(currentLog.date)}</span>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 bg-white/[0.03] p-4 rounded-2xl border border-white/[0.06] text-center">
            <label className="text-xs font-bold text-indigo-300 block">Утренний вес (кг)</label>
            <div className="flex items-center justify-center gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="70.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-36 bg-black/60 border border-indigo-500/40 rounded-xl px-3 py-2 text-center text-2xl font-mono font-black text-white focus:outline-none focus:border-indigo-400"
                autoFocus
                required
              />
              <span className="text-sm font-bold text-zinc-400">кг</span>
            </div>

            {userSettings.startWeight > 0 && (
              <p className="text-[11px] text-zinc-400 pt-1">
                Стартовый вес: <span className="text-zinc-200 font-bold">{userSettings.startWeight} кг</span>
                {parseFloat(weight) > 0 && (
                  <span className="ml-2 font-bold text-emerald-400">
                    ({(parseFloat(weight) - userSettings.startWeight).toFixed(1)} кг)
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Сохранить вес</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
