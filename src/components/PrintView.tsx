import React from 'react';
import { Printer, Calendar, Info } from 'lucide-react';
import { DailyLogEntry, UserSettings } from '../types';
import { DQS_CATEGORIES, formatDateRu, getMondayOfDate, getWeekDates } from '../utils/dqsEngine';

interface PrintViewProps {
  logs: DailyLogEntry[];
  settings: UserSettings;
  selectedDate: string;
}

export const PrintView: React.FC<PrintViewProps> = ({ logs, settings, selectedDate }) => {
  const weekMonday = getMondayOfDate(selectedDate);
  const weekDates = getWeekDates(weekMonday);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar (hidden during print) */}
      <div className="print:hidden bg-[#111] rounded-2xl p-4 sm:p-5 shadow-lg border border-white/5 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" /> Версия для печати / PDF
          </h2>
          <p className="text-xs text-slate-400">
            Готовый бланк DQS-таблицы для распечатки на принтере или экспорта в PDF
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Распечатать / Сохранить PDF</span>
        </button>
      </div>

      {/* PRINTABLE CONTAINER (Styled for screen & A4 print) */}
      <div className="bg-[#111] print:bg-white rounded-2xl p-8 shadow-lg border border-white/5 print:border-none print:shadow-none print:p-0 max-w-4xl mx-auto space-y-6 text-slate-100 print:text-slate-900">
        {/* Header Title */}
        <div className="border-b-2 border-white/10 print:border-slate-900 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100 print:text-slate-900">DQS-Таблица трекинга</h1>
            <p className="text-xs text-slate-400 print:text-slate-600 font-semibold mt-1">
              Система оценки качества питания Diet Quality Score • Без калорий
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold text-slate-200 print:text-slate-900">Участник: {settings.userName || '_________________'}</p>
            <p className="text-slate-400 print:text-slate-500">
              Неделя: {formatDateRu(weekDates[0])} — {formatDateRu(weekDates[6])}
            </p>
          </div>
        </div>

        {/* Portion Notice Banner */}
        <div className="bg-white/5 print:bg-slate-100 p-3 rounded-lg border border-white/10 print:border-slate-300 text-xs text-slate-300 print:text-slate-800">
          <b className="text-emerald-400 print:text-slate-900">⚡ ПРАВИЛО ПОРЦИИ:</b> Порция — это условная мерная единица (как кг или см), а не
          ограничение! Внесите количество порций за день и поставьте галочку «3+», если съели 3+
          разных продукта в категории.
        </div>

        {/* Printable Grid Table */}
        <table className="w-full text-left text-xs border-collapse border border-white/20 print:border-slate-900">
          <thead>
            <tr className="bg-[#0a0a0a] print:bg-slate-200 border-b border-white/20 print:border-slate-900 text-slate-200 print:text-slate-900 font-bold">
              <th className="p-2 border-r border-white/20 print:border-slate-900 w-44">Категория</th>
              <th className="p-2 border-r border-white/20 print:border-slate-900 w-40">1 Порция равна</th>
              <th className="p-2 border-r border-white/20 print:border-slate-900 text-center">Пн</th>
              <th className="p-2 border-r border-white/20 print:border-slate-900 text-center">Вт</th>
              <th className="p-2 border-r border-white/20 print:border-slate-900 text-center">Ср</th>
              <th className="p-2 border-r border-white/20 print:border-slate-900 text-center">Чт</th>
              <th className="p-2 border-r border-white/20 print:border-slate-900 text-center">Пт</th>
              <th className="p-2 border-r border-white/20 print:border-slate-900 text-center">Сб</th>
              <th className="p-2 text-center bg-amber-500/10 print:bg-amber-100">Вс</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 print:divide-slate-900">
            {/* POSITIVE */}
            <tr className="bg-emerald-500/10 print:bg-slate-100 font-bold text-emerald-400 print:text-slate-900">
              <td colSpan={9} className="p-1.5 px-2 uppercase border-b border-white/20 print:border-slate-900">
                ✔ Здоровые и нейтральные категории (Плюс / 0 баллов)
              </td>
            </tr>

            {DQS_CATEGORIES.filter((c) => c.group === 'positive').map((cat) => (
              <tr key={cat.id} className="border-b border-white/10 print:border-slate-900">
                <td className="p-2 border-r border-white/20 print:border-slate-900 font-bold text-slate-200 print:text-slate-900">{cat.nameRu}</td>
                <td className="p-2 border-r border-white/20 print:border-slate-900 text-[10px] text-slate-400 print:text-slate-700">
                  {cat.portionExample}
                </td>
                {weekDates.map((d) => (
                  <td key={d} className="p-1 border-r border-white/20 print:border-slate-900 text-center h-10">
                    <div className="w-6 h-6 border border-white/20 print:border-slate-400 rounded mx-auto"></div>
                  </td>
                ))}
              </tr>
            ))}

            {/* NEGATIVE */}
            <tr className="bg-rose-500/10 print:bg-slate-100 font-bold text-rose-400 print:text-slate-900">
              <td colSpan={9} className="p-1.5 px-2 uppercase border-b border-white/20 print:border-slate-900">
                ▲ Ограничиваемые категории (Минус баллы)
              </td>
            </tr>

            {DQS_CATEGORIES.filter((c) => c.group === 'negative').map((cat) => (
              <tr key={cat.id} className="border-b border-white/10 print:border-slate-900">
                <td className="p-2 border-r border-white/20 print:border-slate-900 font-bold text-slate-200 print:text-slate-900">{cat.nameRu}</td>
                <td className="p-2 border-r border-white/20 print:border-slate-900 text-[10px] text-slate-400 print:text-slate-700">
                  {cat.portionExample}
                </td>
                {weekDates.map((d) => (
                  <td key={d} className="p-1 border-r border-white/20 print:border-slate-900 text-center h-10">
                    <div className="w-6 h-6 border border-white/20 print:border-slate-400 rounded mx-auto"></div>
                  </td>
                ))}
              </tr>
            ))}

            {/* TOTAL SCORE ROW */}
            <tr className="bg-[#050505] print:bg-slate-900 text-white font-bold text-sm">
              <td colSpan={2} className="p-2">
                ИТОГО DQS БАЛЛОВ ЗА ДЕНЬ
              </td>
              {weekDates.map((d) => (
                <td key={d} className="p-2 text-center border-r border-white/20 print:border-slate-700"></td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Footer Notes */}
        <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-400 print:text-slate-700 pt-2 border-t border-white/10 print:border-slate-300">
          <div>
            <p className="font-bold text-slate-200 print:text-slate-900">📋 Инструкция по заполнению:</p>
            <p>1. В квадратик ставьте количество порций за день.</p>
            <p>2. Оценивайте вес 1 раз в неделю по среднему показателю.</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-200 print:text-slate-900">★ Шкала оценки дня:</p>
            <p>≥18 баллов — Зеленый день (Отлично)</p>
            <p>10–17 баллов — Желтый день (Норма)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
