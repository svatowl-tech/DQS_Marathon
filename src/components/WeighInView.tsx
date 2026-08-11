import React, { useState, useMemo } from 'react';
import {
  Scale,
  Plus,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Sparkles,
  Trash2,
  Edit2,
  ArrowUpDown,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { DailyLogEntry } from '../types';
import { formatDateRu, getDayOfWeekRu } from '../utils/dqsEngine';
import { getFormattedLocalDate } from '../utils/timeZoneService';

interface WeighInViewProps {
  logs: DailyLogEntry[];
  onUpdateLog: (entry: DailyLogEntry) => void;
}

export const WeighInView: React.FC<WeighInViewProps> = ({ logs, onUpdateLog }) => {
  const [selectedDate, setSelectedDate] = useState<string>(getFormattedLocalDate());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [morningWeight, setMorningWeight] = useState<string>('');
  const [eveningWeight, setEveningWeight] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [hips, setHips] = useState<string>('');
  const [chest, setChest] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Sorted entries with weight or measurements
  const weighLogs = useMemo(() => {
    return [...logs]
      .filter((l) => l.morningWeight || l.eveningWeight || l.waist || l.hips || l.chest)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  // Overall statistics
  const stats = useMemo(() => {
    const validMorningWeights = logs
      .filter((l) => l.morningWeight && l.morningWeight > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (validMorningWeights.length === 0) {
      return {
        startWeight: 0,
        latestWeight: 0,
        totalDiff: 0,
        avg7Days: 0,
        minWeight: 0,
        maxWeight: 0,
      };
    }

    const start = validMorningWeights[0].morningWeight || 0;
    const latest = validMorningWeights[validMorningWeights.length - 1].morningWeight || 0;
    const diff = latest - start;

    const last7 = validMorningWeights.slice(-7);
    const avg7 = last7.reduce((sum, item) => sum + (item.morningWeight || 0), 0) / last7.length;

    const allW = validMorningWeights.map((l) => l.morningWeight!);
    const minW = Math.min(...allW);
    const maxW = Math.max(...allW);

    return {
      startWeight: start,
      latestWeight: latest,
      totalDiff: diff,
      avg7Days: avg7,
      minWeight: minW,
      maxWeight: maxW,
    };
  }, [logs]);

  const openLogEditor = (dateStr: string) => {
    setSelectedDate(dateStr);
    const existing = logs.find((l) => l.date === dateStr);
    if (existing) {
      setMorningWeight(existing.morningWeight ? String(existing.morningWeight) : '');
      setEveningWeight(existing.eveningWeight ? String(existing.eveningWeight) : '');
      setWaist(existing.waist ? String(existing.waist) : '');
      setHips(existing.hips ? String(existing.hips) : '');
      setChest(existing.chest ? String(existing.chest) : '');
      setNotes(existing.notes || '');
    } else {
      setMorningWeight('');
      setEveningWeight('');
      setWaist('');
      setHips('');
      setChest('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = logs.find((l) => l.date === selectedDate) || {
      date: selectedDate,
      servings: {} as any,
      diversity: {} as any,
      calculatedScore: 0,
    };

    const mWeight = morningWeight ? parseFloat(morningWeight) : undefined;
    const eWeight = eveningWeight ? parseFloat(eveningWeight) : undefined;
    const waistVal = waist ? parseFloat(waist) : undefined;
    const hipsVal = hips ? parseFloat(hips) : undefined;
    const chestVal = chest ? parseFloat(chest) : undefined;

    const updated: DailyLogEntry = {
      ...existing,
      morningWeight: mWeight ?? existing.morningWeight,
      weight: mWeight ?? existing.weight,
      eveningWeight: eWeight ?? existing.eveningWeight,
      waist: waistVal ?? existing.waist,
      hips: hipsVal ?? existing.hips,
      chest: chestVal ?? existing.chest,
      measurements: {
        ...(existing.measurements || {}),
        waist: waistVal ?? existing.measurements?.waist,
        hips: hipsVal ?? existing.measurements?.hips,
        chest: chestVal ?? existing.measurements?.chest,
      },
      notes: notes ? notes : existing.notes,
    };

    onUpdateLog(updated);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-[1800px] mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111] rounded-2xl p-6 border border-emerald-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Дневник Взвешиваний и Замеров</h1>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Фиксируйте утренний и вечерний вес, а также параметры фигуры. Автоматический расчет скользящих средних и динамики сброса веса.
            </p>
          </div>

          <button
            onClick={() => openLogEditor(getFormattedLocalDate())}
            className="flex items-center gap-2 bg-emerald-500 text-black font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-400 transition shadow-lg whitespace-nowrap text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            <span>Внести взвешивание</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111] p-4 rounded-xl border border-white/5 shadow-md">
          <div className="text-xs font-medium text-slate-400 mb-1">Текущий вес (Утро)</div>
          <div className="text-2xl font-bold text-slate-100">
            {stats.latestWeight ? `${stats.latestWeight.toFixed(1)} кг` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Старт: {stats.startWeight ? `${stats.startWeight.toFixed(1)} кг` : '—'}
          </div>
        </div>

        <div className="bg-[#111] p-4 rounded-xl border border-white/5 shadow-md">
          <div className="text-xs font-medium text-slate-400 mb-1">Динамика веса</div>
          <div
            className={`text-2xl font-bold flex items-center gap-1 ${
              stats.totalDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.totalDiff <= 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            <span>{stats.totalDiff !== 0 ? `${stats.totalDiff > 0 ? '+' : ''}${stats.totalDiff.toFixed(1)} кг` : '0 кг'}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">За весь период</div>
        </div>

        <div className="bg-[#111] p-4 rounded-xl border border-white/5 shadow-md">
          <div className="text-xs font-medium text-slate-400 mb-1">Среднее за 7 дней</div>
          <div className="text-2xl font-bold text-teal-400">
            {stats.avg7Days ? `${stats.avg7Days.toFixed(1)} кг` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Сглаживает колебания воды</div>
        </div>

        <div className="bg-[#111] p-4 rounded-xl border border-white/5 shadow-md">
          <div className="text-xs font-medium text-slate-400 mb-1">Мин / Макс вес</div>
          <div className="text-lg font-bold text-slate-100">
            {stats.minWeight ? `${stats.minWeight.toFixed(1)}` : '—'} / {stats.maxWeight ? `${stats.maxWeight.toFixed(1)} кг` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Диапазон за период</div>
        </div>
      </div>

      {/* Main Table Container with Responsive Overflow */}
      <div className="bg-[#111] rounded-2xl border border-white/5 shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">История взвешиваний и замеров</h2>
            <p className="text-xs text-slate-400">Всего записей: {weighLogs.length}</p>
          </div>
          <button
            onClick={() => openLogEditor(getFormattedLocalDate())}
            className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Добавить сегодня
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-medium text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Дата</th>
                <th className="py-3 px-4">Утренний вес</th>
                <th className="py-3 px-4">Вечерний вес</th>
                <th className="py-3 px-4">Разница Дня</th>
                <th className="py-3 px-4">Талия (см)</th>
                <th className="py-3 px-4">Бёдра (см)</th>
                <th className="py-3 px-4">Грудь (см)</th>
                <th className="py-3 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {weighLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Scale className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                    <p className="font-medium text-slate-300">Записей взвешиваний пока нет</p>
                    <p className="text-xs text-slate-500 mt-1">Нажмите «Внести взвешивание», чтобы записать ваш вес</p>
                  </td>
                </tr>
              ) : (
                weighLogs.map((log) => {
                  const dayDiff =
                    log.morningWeight && log.eveningWeight ? log.eveningWeight - log.morningWeight : null;

                  return (
                    <tr key={log.date} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span>{formatDateRu(log.date)}</span>
                          <span className="text-xs text-slate-500">({getDayOfWeekRu(log.date).slice(0, 2)})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-400 whitespace-nowrap">
                        {log.morningWeight ? `${log.morningWeight.toFixed(1)} кг` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        {log.eveningWeight ? `${log.eveningWeight.toFixed(1)} кг` : '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {dayDiff !== null ? (
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                              dayDiff > 0
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : dayDiff < 0
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-white/10 text-slate-300 border-white/10'
                            }`}
                          >
                            {dayDiff > 0 ? `+${dayDiff.toFixed(1)}` : dayDiff.toFixed(1)} кг
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300">{log.waist ? `${log.waist} см` : '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300">{log.hips ? `${log.hips} см` : '—'}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300">{log.chest ? `${log.chest} см` : '—'}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openLogEditor(log.date)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-white/10 rounded-lg transition cursor-pointer"
                          title="Редактировать"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141417] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/10 text-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-lg">Запись взвешивания</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Дата записи</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => openLogEditor(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Утренний вес (кг)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="75.5"
                    value={morningWeight}
                    onChange={(e) => setMorningWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm text-slate-100 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Вечерний вес (кг)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="76.2"
                    value={eveningWeight}
                    onChange={(e) => setEveningWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="border-t border-white/10 pt-3">
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  Замеры объёмов тела (см)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Талия</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="78"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Бёдра</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="98"
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-100 placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Грудь</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="92"
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-100 placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Заметка или комментарий
                </label>
                <input
                  type="text"
                  placeholder="Например: После тренировки, легкий ужин"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm text-slate-100 placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:bg-white/5 rounded-xl text-sm font-medium transition cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 text-black font-bold hover:bg-emerald-400 rounded-xl text-sm shadow-md transition flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
