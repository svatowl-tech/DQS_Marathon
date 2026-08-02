import React, { useState, useEffect } from 'react';
import { Dumbbell, X, Check, Flame, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { DailyLogEntry } from '../types';

interface QuickAddWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: DailyLogEntry;
  onUpdateLog: (updated: DailyLogEntry) => void;
}

const WORKOUT_PRESETS = [
  { label: 'Силовая', icon: '🏋️‍♂️' },
  { label: 'Бег / Кардио', icon: '🏃‍♂️' },
  { label: 'Велосипед', icon: '🚴‍♂️' },
  { label: 'Скейт / Ролики', icon: '🛹' },
  { label: 'Игры с мячом', icon: '⚽' },
  { label: 'Йога / Растяжка', icon: '🧘‍♀️' },
  { label: 'Зарядка / Фитнес', icon: '🤸‍♀️' },
  { label: 'Плавание', icon: '🏊‍♂️' },
  { label: 'Ходьба / Трекинг', icon: '🚶‍♂️' },
  { label: 'Единоборства', icon: '🥊' },
  { label: 'Танцы', icon: '💃' },
  { label: 'Лыжи / Сноуборд', icon: '⛷️' },
  { label: 'Другая активность', icon: '🎯' },
];

const DURATIONS = ['15 мин', '30 мин', '45 мин', '60 мин', '90 мин'];

export const QuickAddWorkoutModal: React.FC<QuickAddWorkoutModalProps> = ({
  isOpen,
  onClose,
  log,
  onUpdateLog,
}) => {
  const [selectedType, setSelectedType] = useState<string>('Силовая');
  const [selectedIcon, setSelectedIcon] = useState<string>('🏋️‍♂️');
  const [selectedDuration, setSelectedDuration] = useState<string>('45 мин');
  const [notes, setNotes] = useState<string>('');
  const [isDone, setIsDone] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (log.workout.description) {
      setNotes(log.workout.description);
    }
    setIsDone(log.workout.done ?? true);
  }, [log, isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: { label: string; icon: string }) => {
    setSelectedType(preset.label);
    setSelectedIcon(preset.icon);
  };

  const handleSave = () => {
    let formattedDesc = `${selectedIcon} ${selectedType} (${selectedDuration})`;
    if (notes.trim()) {
      formattedDesc += `: ${notes.trim()}`;
    }

    onUpdateLog({
      ...log,
      workout: {
        done: isDone,
        description: formattedDesc,
      },
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleClearWorkout = () => {
    onUpdateLog({
      ...log,
      workout: {
        done: false,
        description: '',
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-white/[0.08] rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 text-zinc-100 relative my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100">
                Добавить тренировку
              </h2>
              <p className="text-[11px] text-zinc-400">
                Фиксация физической активности за {log.date}
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

        {savedSuccess ? (
          <div className="py-10 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-zinc-100">Тренировка сохранена!</h3>
            <p className="text-xs text-zinc-400">Запись успешно обновлена в вашем дневнике</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status toggle */}
            <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" /> Статус тренировки:
              </span>
              <button
                type="button"
                onClick={() => setIsDone(!isDone)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isDone
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'bg-zinc-800 text-zinc-400 border border-white/10'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{isDone ? 'Выполнена ✓' : 'Не было'}</span>
              </button>
            </div>

            {/* Workout Type Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">Тип нагрузки:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WORKOUT_PRESETS.map((preset) => {
                  const isSelected = selectedType === preset.label;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-orange-500/15 border-orange-500/50 text-orange-300 font-bold shadow-sm'
                          : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="text-base">{preset.icon}</span>
                      <span className="truncate">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" /> Длительность:
              </label>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {DURATIONS.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSelectedDuration(dur)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all cursor-pointer ${
                      selectedDuration === dur
                        ? 'bg-orange-500 text-black border-orange-400 font-bold'
                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercises / Details Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">
                Детали (упражнения, вес, дистанция или самочувствие):
              </label>
              <textarea
                rows={2}
                placeholder="Например: Приседания 4х10, Жим 3х12, Планка 2 мин"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/[0.08]">
              {log.workout.done && (
                <button
                  type="button"
                  onClick={handleClearWorkout}
                  className="px-3 py-2 text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                >
                  Сбросить запись
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-xs text-zinc-300 font-semibold cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Dumbbell className="w-4 h-4" />
                  <span>Сохранить тренировку</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
