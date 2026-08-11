import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Check, Award, AlertCircle } from 'lucide-react';
import { CategoryId, DailyLogEntry } from '../types';
import {
  DQS_CATEGORIES,
  calculateDailyDQS,
  formatDateRu,
  getCategoryPoints,
  getDayOfWeekRu,
  getMondayOfDate,
  getWeekDates,
  getInitialServings,
  getInitialDiversity,
  isHealthyCategory,
} from '../utils/dqsEngine';

interface DQSTableSheetProps {
  logs: DailyLogEntry[];
  onUpdateLog: (log: DailyLogEntry) => void;
  selectedDate: string;
}

export const DQSTableSheet: React.FC<DQSTableSheetProps> = ({
  logs,
  onUpdateLog,
  selectedDate,
}) => {
  const [currentMonday, setCurrentMonday] = useState<string>(() =>
    getMondayOfDate(selectedDate)
  );

  const weekDates = getWeekDates(currentMonday);

  const handlePrevWeek = () => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() - 7);
    setCurrentMonday(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + 7);
    setCurrentMonday(d.toISOString().split('T')[0]);
  };

  // Find or generate log entry for given date
  const getLogForDate = (dateStr: string): DailyLogEntry => {
    const found = logs.find((l) => l.date === dateStr);
    if (found) return found;

    return {
      date: dateStr,
      isWeekend: new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6,
      workout: { done: false, description: '' },
      notOnPhoto: '',
      servings: getInitialServings(),
      diversity: getInitialDiversity(),
      calculatedScore: 0,
      photos: [],
      journal: {},
      trackers: {},
    };
  };

  const weekLogs = weekDates.map((d) => getLogForDate(d));

  // Compute average weekly score
  const totalWeekScore = weekLogs.reduce((acc, l) => acc + l.calculatedScore, 0);
  const avgWeekScore = Number((totalWeekScore / 7).toFixed(1));
  const greenDaysCount = weekLogs.filter((l) => l.calculatedScore >= 18).length;

  const handleCellServingsChange = (dateStr: string, catId: CategoryId, value: number) => {
    const log = getLogForDate(dateStr);
    const newServings = { ...log.servings, [catId]: Math.max(0, value) };
    const newScore = calculateDailyDQS(newServings, log.diversity);
    onUpdateLog({ ...log, servings: newServings, calculatedScore: newScore });
  };

  const handleCellDiversityToggle = (dateStr: string, catId: CategoryId) => {
    const log = getLogForDate(dateStr);
    const newDiversity = { ...log.diversity, [catId]: !log.diversity[catId] };
    const newScore = calculateDailyDQS(log.servings, newDiversity);
    onUpdateLog({ ...log, diversity: newDiversity, calculatedScore: newScore });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Week Selector */}
      <div className="bg-[#111] rounded-2xl p-4 sm:p-5 shadow-lg border border-white/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-100 text-lg">DQS-Таблица за неделю</h2>
            <p className="text-xs text-slate-400">
              Сводная интерактивная матрица порций и показателей качества питания
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevWeek}
              className="p-2 border border-white/10 rounded-xl hover:bg-white/5 text-slate-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>
                {formatDateRu(weekDates[0])} — {formatDateRu(weekDates[6])}
              </span>
            </div>
            <button
              onClick={handleNextWeek}
              className="p-2 border border-white/10 rounded-xl hover:bg-white/5 text-slate-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111] rounded-2xl p-4 border border-white/5 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono flex items-center justify-center font-bold text-sm">
            DQS
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Средний DQS недели</p>
            <p className="text-xl font-mono font-bold text-slate-100">{avgWeekScore} б.</p>
          </div>
        </div>

        <div className="bg-[#111] rounded-2xl p-4 border border-white/5 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black font-bold flex items-center justify-center">
            ★
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Зеленые дни (DQS ≥18)</p>
            <p className="text-xl font-mono font-bold text-emerald-400">{greenDaysCount} из 7 дней</p>
          </div>
        </div>

        <div className="bg-[#111] rounded-2xl p-4 border border-white/5 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center font-bold">
            ⚖
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Средний вес недели</p>
            <p className="text-xl font-mono font-bold text-slate-100">
              {(
                weekLogs.reduce((acc, l) => acc + (l.weight || 0), 0) /
                  (weekLogs.filter((l) => l.weight).length || 1)
              ).toFixed(1)}{' '}
              кг
            </p>
          </div>
        </div>
      </div>

      {/* DQS MATRIX TABLE */}
      <div className="bg-[#111] rounded-2xl shadow-lg border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-white/10 text-slate-300 font-bold">
                <th className="p-3 w-48">Категория продуктов</th>
                {weekLogs.map((log) => {
                  const dayName = getDayOfWeekRu(log.date).substring(0, 2);
                  const isSun = new Date(log.date).getDay() === 0;
                  return (
                    <th
                      key={log.date}
                      className={`p-2 text-center border-l border-white/10 ${
                        isSun ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <div className="font-bold text-slate-100">{dayName}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal">
                        {log.date.substring(8, 10)}.{log.date.substring(5, 7)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {/* POSITIVE & LIMITED & NEUTRAL CATEGORIES HEADER */}
              <tr className="bg-emerald-500/10 font-bold text-emerald-400 text-[11px]">
                <td colSpan={8} className="p-2 px-3 uppercase tracking-wider font-mono">
                  ✔ Полезные, ограниченные и нейтральные категории
                </td>
              </tr>

              {DQS_CATEGORIES.filter((c) => c.group !== 'negative').map((cat) => (
                <tr key={cat.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-semibold text-slate-200 bg-white/2">
                    <div>{cat.nameRu}</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {cat.portionExample}
                    </div>
                  </td>
                  {weekLogs.map((log) => {
                    const count = log.servings[cat.id] || 0;
                    const hasDiv = log.diversity[cat.id] || false;
                    const points =
                      getCategoryPoints(cat.id, count) + (isHealthyCategory(cat.id) && hasDiv && count >= 1 ? 1 : 0);

                    return (
                      <td key={log.date} className="p-2 border-l border-white/5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={count}
                            onChange={(e) =>
                              handleCellServingsChange(
                                log.date,
                                cat.id,
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className={`w-10 text-center font-mono font-bold border rounded-lg py-1 text-xs focus:ring-2 focus:ring-emerald-500 ${
                              count > 0
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                : 'bg-white/5 border-white/10 text-slate-300'
                            }`}
                          />
                          {isHealthyCategory(cat.id) && (
                            <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-400">
                              <input
                                type="checkbox"
                                checked={hasDiv}
                                onChange={() => handleCellDiversityToggle(log.date, cat.id)}
                                className="w-3 h-3 text-emerald-500 bg-white/5 border-white/20 rounded accent-emerald-500"
                              />
                              <span>3+</span>
                            </label>
                          )}
                          {count > 0 && (
                            <span className="text-[10px] font-mono font-bold text-emerald-400">
                              {points > 0 ? `+${points}б` : `${points}б`}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* NEGATIVE CATEGORIES HEADER */}
              <tr className="bg-rose-500/10 font-bold text-rose-400 text-[11px]">
                <td colSpan={8} className="p-2 px-3 uppercase tracking-wider font-mono">
                  ▲ Ограничиваемые категории (Минус баллы)
                </td>
              </tr>

              {DQS_CATEGORIES.filter((c) => c.group === 'negative').map((cat) => (
                <tr key={cat.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-semibold text-slate-200 bg-white/2">
                    <div>{cat.nameRu}</div>
                  </td>
                  {weekLogs.map((log) => {
                    const count = log.servings[cat.id] || 0;
                    const points = getCategoryPoints(cat.id, count);

                    return (
                      <td key={log.date} className="p-2 border-l border-white/5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={count}
                            onChange={(e) =>
                              handleCellServingsChange(
                                log.date,
                                cat.id,
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className={`w-10 text-center font-mono font-bold border rounded-lg py-1 text-xs focus:ring-2 focus:ring-rose-500 ${
                              count > 0
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                : 'bg-white/5 border-white/10 text-slate-300'
                            }`}
                          />
                          {count > 0 && (
                            <span className="text-[10px] font-mono font-bold text-rose-400">
                              {points}б
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* DAILY SCORE TOTAL ROW */}
              <tr className="bg-[#050505] text-white font-mono font-bold text-xs">
                <td className="p-3">ИТОГО DQS ЗА ДЕНЬ</td>
                {weekLogs.map((log) => {
                  const score = log.calculatedScore;
                  return (
                    <td
                      key={log.date}
                      className={`p-3 text-center border-l border-white/10 ${
                        score >= 18 ? 'bg-emerald-500 text-black font-bold' : score >= 10 ? 'bg-amber-400 text-black font-bold' : ''
                      }`}
                    >
                      {score > 0 ? `+${score}` : score}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
