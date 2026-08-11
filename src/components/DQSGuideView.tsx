import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Utensils,
  Flame,
  Scale,
  ShieldCheck,
  Info,
  ChevronRight,
  HelpCircle,
  Clock,
  Droplet,
  Coffee,
  PieChart,
} from 'lucide-react';
import { DQS_CATEGORIES } from '../utils/dqsEngine';

// Non-obvious foods cheat sheet dataset according to official PDF guide (11.08.2026)
const NON_OBVIOUS_FOODS = [
  { food: 'Банан, сухофрукты', realCategory: 'Другие гарниры (нейтральная)', note: 'Относительно много углеводов/калорий при небольшом объеме. 120г банан без кожуры = 1п; 80г сухофрукты = 1п.', group: 'neutral' },
  { food: 'Авокадо', realCategory: 'Масло и добавленные жиры', note: 'Преимущественно источник жиров. Половина плода = 1 порция.', group: 'limited' },
  { food: 'Картофель, батат', realCategory: 'Картофель и батат (отдельная)', note: 'Отварной/запеченный картофель хорошо насыщает. Фри и чипсы переходят в «Жареное во фритюре».', group: 'limited' },
  { food: 'Зелень, чеснок, имбирь', realCategory: 'Зелень и пряные растения', note: 'Отдельная категория! Если зелень — основа салата (100–200г), записывайте как Овощи. Сухие специи = 0.5п/день.', group: 'healthy' },
  { food: 'Маслины, квашеная капуста, маринованные огурцы', realCategory: 'Овощи', note: 'Остаются в категории «Овощи» (несмотря на соль/ферментацию).', group: 'healthy' },
  { food: 'Хумус', realCategory: 'Бобовые + Масло', note: 'Хумус — это нут плюс жиры. Не приравнивайте большую порцию хумуса к чистым бобовым.', group: 'combo' },
  { food: 'Тофу', realCategory: 'Мясо и белок', note: 'Учитывается как источник белка (в группе Мясо/Птица/Рыба/Яйца).', group: 'healthy' },
  { food: 'Кукуруза, горошек', realCategory: 'Бобовые', note: 'Кукуруза и горох в любом виде относятся к категории Бобовые.', group: 'healthy' },
  { food: 'Сыры, сметана, сливки', realCategory: 'Сыры и жирная молочка', note: 'Преимущественно источники жиров. 15г твердый сыр, 30г мягкий/сметана, 45г брынза.', group: 'limited' },
  { food: 'Кофе с сиропом, 3 в 1, морсы, квас', realCategory: 'Сладкие напитки', note: 'Калорийные напитки, не являющиеся цельным продуктом.', group: 'restricted' },
  { food: 'Раф-кофе', realCategory: 'Сыры и жирная молочка (сливки)', note: 'Учитывайте как сливки (источник жиров).', group: 'limited' },
  { food: 'Капучино / Латте без сахара', realCategory: 'Диетическая молочка', note: 'Записывается в молочку, если молока не меньше половины порции (от 125 мл).', group: 'healthy' },
  { food: 'Домашний фреш / смузи', realCategory: '50% Фрукты/Овощи + 50% Напитки', note: 'Наполовину во фрукты или овощи, наполовину в калорийные напитки. Магазинный сок = 100% Сладкие напитки.', group: 'combo' },
  { food: 'Напитки на подсластителях (Zero)', realCategory: 'Не учитываются в DQS (0 баллов)', note: 'Не дают плюсов и не снимают баллы DQS.', group: 'zero' },
  { food: 'Продукты на подсластителях без сахара', realCategory: 'По основе (Молочка / Гарнир)', note: 'Сладкий йогурт без сахара остаётся молочкой, протеиновое печенье -> Другие гарниры.', group: 'healthy' },
  { food: 'Спортивное питание при тренировке >60 мин', realCategory: 'Калории да, Сладкое нет', note: 'При интенсивной тренировке быстрые углеводы можно не относить к сладкому.', group: 'sport' },
  { food: 'Шаверма / Бургер хорошего качества', realCategory: 'Разложить на компоненты', note: 'Мясо (Мясо) + Овощи (Овощи) + Соус (Масло) + Булка/Лаваш (Другие гарниры).', group: 'combo' },
  { food: 'Наггетсы, шницели во фритюре', realCategory: 'Жареное во фритюре + Переработанное мясо', note: 'При толстой панировке/фритюре — Жареное; как промышленный полуфабрикат — Переработанное мясо.', group: 'restricted' },
];

export const DQSGuideView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'cheat_sheet' | 'oil_rules' | 'sample_days' | 'targets'>('categories');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFoods = NON_OBVIOUS_FOODS.filter(
    (item) =>
      item.food.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.realCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 w-full max-w-[1800px] mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111] rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                ОФИЦИАЛЬНЫЙ ГАЙД DQS (11.08.2026)
              </span>
              <span className="text-xs text-slate-400 font-mono">Diet Quality Score v3.0</span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              Система Оценки Качества Питания DQS (17 Категорий)
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Оцениваем качество и баланс рациона по ролям продуктов в организме. Без взвешивания каждого грамма и подсчета калорий.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 shrink-0">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <div className="text-xs">
              <div className="font-bold text-slate-100">17 Категорий DQS</div>
              <div className="text-slate-400 text-[11px]">8 Полезных • 3 Ограниченно • 1 Нейтральная • 5 Ограничивать</div>
            </div>
          </div>
        </div>

        {/* Inner Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'bg-emerald-500 text-black shadow-lg font-bold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" /> 17 Категорий Продуктов
          </button>

          <button
            onClick={() => setActiveTab('cheat_sheet')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'cheat_sheet'
                ? 'bg-emerald-500 text-black shadow-lg font-bold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <Search className="w-4 h-4" /> Шпаргалка по продуктам
          </button>

          <button
            onClick={() => setActiveTab('oil_rules')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'oil_rules'
                ? 'bg-emerald-500 text-black shadow-lg font-bold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <Droplet className="w-4 h-4" /> Порции & Разнообразие
          </button>

          <button
            onClick={() => setActiveTab('sample_days')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'sample_days'
                ? 'bg-emerald-500 text-black shadow-lg font-bold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <PieChart className="w-4 h-4" /> Примеры рационов
          </button>

          <button
            onClick={() => setActiveTab('targets')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'targets'
                ? 'bg-emerald-500 text-black shadow-lg font-bold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <Scale className="w-4 h-4" /> Цели и Шкала
          </button>
        </div>
      </div>

      {/* TAB 1: 17 CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Group 1: 8 Healthy Categories */}
          <div className="bg-[#111] rounded-2xl p-5 border border-emerald-500/20 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                8 Полезных Категорий (Начисляют максимальные баллы + Разнообразие)
              </h2>
              <span className="text-xs font-mono text-emerald-400/80 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Разнообразие 3+ вида = +1 балл
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DQS_CATEGORIES.filter((c) => c.group === 'positive').map((cat) => (
                <div key={cat.id} className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-100 text-sm">{cat.nameRu}</h3>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                      Полезная
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{cat.description}</p>
                  <div className="bg-black/40 p-2 rounded-lg border border-white/5 text-xs font-mono space-y-1">
                    <div className="text-slate-400 text-[11px]"><b>1 порция:</b> {cat.portionExample}</div>
                    <div className="text-emerald-400 text-[11px]"><b>Баллы:</b> {cat.scoring.map((s, i) => `${i + 1}п: ${s > 0 ? '+' + s : s}`).join(' | ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: 3 Limited Healthy Categories */}
          <div className="bg-[#111] rounded-2xl p-5 border border-amber-500/20 shadow-lg space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                3 Ограниченно Полезных Категории (Польза зависит от размера порции)
              </h2>
              <p className="text-xs text-slate-400 mt-1">Первые порции приносят пользу, но при избытке баллы не растут или снижаются.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DQS_CATEGORIES.filter((c) => c.group === 'limited').map((cat) => (
                <div key={cat.id} className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-100 text-sm">{cat.nameRu}</h3>
                    <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      Ограниченно
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{cat.description}</p>
                  <div className="bg-black/40 p-2 rounded-lg border border-white/5 text-xs font-mono space-y-1">
                    <div className="text-slate-400 text-[11px]"><b>1 порция:</b> {cat.portionExample}</div>
                    <div className="text-amber-400 text-[11px]"><b>Баллы:</b> {cat.scoring.map((s, i) => `${i + 1}п: ${s > 0 ? '+' + s : s}`).join(' | ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group 3: 1 Neutral Category */}
          <div className="bg-[#111] rounded-2xl p-5 border border-slate-500/20 shadow-lg space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-slate-300 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-slate-400" />
                1 Нейтральная («Серая») Категория
              </h2>
              <p className="text-xs text-slate-400 mt-1">Не обязательно исключать, но лучше не строить на них весь рацион.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {DQS_CATEGORIES.filter((c) => c.group === 'neutral').map((cat) => (
                <div key={cat.id} className="p-4 rounded-xl border bg-white/5 border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-100 text-sm">{cat.nameRu}</h3>
                    <span className="text-[10px] font-mono font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded border border-white/20">
                      Нейтральная (0б)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{cat.description}</p>
                  <div className="bg-black/40 p-2 rounded-lg border border-white/5 text-xs font-mono space-y-1">
                    <div className="text-slate-400 text-[11px]"><b>1 порция:</b> {cat.portionExample}</div>
                    <div className="text-slate-300 text-[11px]"><b>Баллы:</b> {cat.scoring.map((s, i) => `${i + 1}п: ${s > 0 ? '+' + s : s}`).join(' | ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group 4: 5 Restricted Categories */}
          <div className="bg-[#111] rounded-2xl p-5 border border-rose-500/20 shadow-lg space-y-4">
            <div className="border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                5 Категорий, Которые Стоит Ограничивать (Минус-баллы DQS)
              </h2>
              <p className="text-xs text-slate-400 mt-1">Ультра-обработка, добавленный сахар и трансжиры вычитают баллы из дневного DQS.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DQS_CATEGORIES.filter((c) => c.group === 'negative').map((cat) => (
                <div key={cat.id} className="p-4 rounded-xl border bg-rose-500/5 border-rose-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-100 text-sm">{cat.nameRu}</h3>
                    <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                      Ограничивать
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{cat.description}</p>
                  <div className="bg-black/40 p-2 rounded-lg border border-white/5 text-xs font-mono space-y-1">
                    <div className="text-slate-400 text-[11px]"><b>1 порция:</b> {cat.portionExample}</div>
                    <div className="text-rose-400 text-[11px]"><b>Баллы:</b> {cat.scoring.map((s, i) => `${i + 1}п: ${s}`).join(' | ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHEAT SHEET NON-OBVIOUS FOODS */}
      {activeTab === 'cheat_sheet' && (
        <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-400" />
                Справочник «Куда на самом деле относить продукт?»
              </h2>
              <p className="text-xs text-slate-400">
                Официальные правила классификации не очевидных продуктов и напитков
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Искать (банан, авокадо, кофе...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-mono">
                  <th className="p-2.5">Продукт / Напиток / Блюдо</th>
                  <th className="p-2.5">Категория в DQS</th>
                  <th className="p-2.5">Логика DQS & Примечания</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFoods.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-2.5 font-bold text-slate-200">{item.food}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                        {item.realCategory}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-400">{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PORTIONS & DIVERSITY RULES */}
      {activeTab === 'oil_rules' && (
        <div className="space-y-6">
          <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-emerald-400" />
              Шпаргалка по Порциям & Правила Разнообразия
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                  📏 ШПАРГАЛКА ПО ПОРЦИЯМ (ОФИЦИАЛЬНЫЕ ОРИЕНТИРЫ)
                </h3>
                <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                  <li>• <b>Фрукты:</b> 120г (яблоко, апельсин, груша, 2 киви). Арбуз — 250г.</li>
                  <li>• <b>Овощи:</b> 120г (2 огурца / 1 томат / горсть).</li>
                  <li>• <b>Зелень:</b> 10–30г (руккола 30г; укроп, чеснок, имбирь 10г).</li>
                  <li>• <b>Мясо/Рыба/Яйца:</b> 120г сырого; 2 яйца = 1п (1 яйцо = 0.5п); 60г икры = 1п.</li>
                  <li>• <b>Молочка:</b> Густая 120г (творог, скир, йогурт); Жидкая 250мл (молоко, кефир).</li>
                  <li>• <b>Сыры:</b> Твердые 15г, Мягкие/сметана 30г, Рассольные 45г.</li>
                  <li>• <b>Масло:</b> 3г масло; 5г майонез; 0.5 плода авокадо.</li>
                  <li>• <b>Орехи:</b> 10г (горсть / 1 ст.л.).</li>
                  <li>• <b>Цельные злаки:</b> 50–60г сухих / 120–180г готовых; ЦЗ хлеб 80г.</li>
                  <li>• <b>Бобовые:</b> 50–60г сухих / 170–220г готовых.</li>
                  <li>• <b>Картофель:</b> 200–300г готового.</li>
                  <li>• <b>Другие гарниры:</b> 50–60г сухих / 170–220г готовых; хлеб/сухофрукты 80г; банан 120г.</li>
                  <li>• <b>Сладкое:</b> 30г концентрированного; 60г выпечки; 120г десерта.</li>
                  <li>• <b>Сладкие напитки:</b> 240мл (при 35–40 ккал/100мл).</li>
                  <li>• <b>Алкоголь:</b> 250мл пива; 150мл вина; 30мл крепкого (1п = ~10мл этанола).</li>
                  <li>• <b>Жареное во фритюре:</b> 120г блюда / 60г сухих снеков.</li>
                  <li>• <b>Переработанное мясо:</b> 120г / 60г сушеных снеков.</li>
                </ul>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <h3 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                  🌟 ПРАВИЛА РАЗНООБРАЗИЯ В DQS
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Разнообразие учитывается <b>только внутри полезных категорий</b>. Если за день в одной полезной категории набралось <b>3 разных продукта</b>, ставится отметка — это даёт <b>+1 балл</b>.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-slate-200 space-y-1">
                    <b className="text-amber-400">Исключение 1 (Гарниры):</b>
                    <p className="text-[11px] text-slate-300">Бобовые, цельные злаки и картофель считаются вместе при оценке разнообразия гарниров.</p>
                  </div>
                  <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-slate-200 space-y-1">
                    <b className="text-emerald-400">Исключение 2 (Молочка):</b>
                    <p className="text-[11px] text-slate-300">Диетическая и жирная молочка — разные категории, но разнообразие для них оценивается совместно.</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <h4 className="font-bold text-slate-200 text-xs mb-1">🍳 Учет масла при жарке:</h4>
                  <p className="text-xs text-slate-400">
                    Учитывайте только то масло, которое пошло в вашу порцию. При фритюре масло отдельно не считается — блюдо записывается в «Жареное во фритюре».
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SAMPLE DAYS */}
      {activeTab === 'sample_days' && (
        <div className="space-y-6">
          <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-400" />
              Примеры Рационов и Анализ DQS
            </h2>

            <div className="space-y-4">
              {/* High DQS Day */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-sm">🌟 ОТЛИЧНЫЙ ДЕНЬ (DQS +20)</span>
                  <span className="text-xs font-mono font-bold bg-emerald-500 text-black px-2 py-0.5 rounded">Зеленая зона</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
                  <p><b>Завтрак:</b> Овсянка ЦЗ 60г (+2) + Молоко 250мл (+2) + Яблоко 120г (+2) + Грецкие орехи 10г (+2)</p>
                  <p><b>Обед:</b> Запечённый лосось 120г (+2) + Киноа 150г (+2) + Салат из огурцов/томатов/зелени с оливковым маслом 5г (+2 овощи, +2 зелень, +1 масло)</p>
                  <p><b>Полдник:</b> Творог 120г (+2) + Голубика 120г (+2)</p>
                  <p><b>Ужин:</b> Отварной картофель 200г (+2) + Тушеная говядина 120г (+2) + Квашеная капуста 120г (+2)</p>
                  <p className="text-emerald-300 pt-1 font-mono"><b>Бонусы разнообразия:</b> Фрукты (+1), Овощи (+1), Мясо (+1). Высокий DQS балл!</p>
                </div>
              </div>

              {/* Moderate Day */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-sm">👍 ХОРОШИЙ ДЕНЬ (DQS +10)</span>
                  <span className="text-xs font-mono font-bold bg-amber-500 text-black px-2 py-0.5 rounded">Желтая зона</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
                  <p><b>Завтрак:</b> Омлет из 2 яиц с сыром 15г и белым хлебом, кофе без сахара</p>
                  <p><b>Обед:</b> Куриное филе с белым рисом, свежий огурец</p>
                  <p><b>Ужин:</b> Запеченная рыба с картофельным пюре и маслом, полоска шоколада 30г</p>
                </div>
              </div>

              {/* Red Day */}
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400 text-sm">⚠️ ДЕНЬ ДЛЯ АНАЛИЗА (DQS -2)</span>
                  <span className="text-xs font-mono font-bold bg-rose-500 text-black px-2 py-0.5 rounded">Красная зона</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
                  <p><b>Завтрак:</b> Сосиски с макаронами В/С, сладкий латте с сиропом</p>
                  <p><b>Обед:</b> Картофель фри с наггетсами во фритюре и колой</p>
                  <p><b>Ужин:</b> Пицца покупная с колбасой, бокал пива</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TARGET SCORE SCALE */}
      {activeTab === 'targets' && (
        <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            Целевые Ориентиры Шкалы DQS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-center space-y-1">
              <div className="text-2xl font-black font-mono text-emerald-400">+15 и выше</div>
              <div className="text-xs font-bold text-slate-100">Отличный день</div>
              <p className="text-[11px] text-slate-400">Превосходный баланс и высокое качество продуктов</p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-center space-y-1">
              <div className="text-2xl font-black font-mono text-amber-400">+8 ... +14</div>
              <div className="text-xs font-bold text-slate-100">Хороший день</div>
              <p className="text-[11px] text-slate-400">Здоровый рабочий рацион с умереными сладостями</p>
            </div>

            <div className="bg-sky-500/10 border border-sky-500/30 p-4 rounded-xl text-center space-y-1">
              <div className="text-2xl font-black font-mono text-sky-400">+3 ... +7</div>
              <div className="text-xs font-bold text-slate-100">Средний день</div>
              <p className="text-[11px] text-slate-400">Есть потенциал для улучшения рациона</p>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-center space-y-1">
              <div className="text-2xl font-black font-mono text-rose-400">Ниже +3</div>
              <div className="text-xs font-bold text-slate-100">День для анализа</div>
              <p className="text-[11px] text-slate-400">Преобладание ультра-обработанных продуктов</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
