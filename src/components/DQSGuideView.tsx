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

// Cheat sheet dataset from official PDF
const NON_OBVIOUS_FOODS = [
  { food: 'Банан, картофель', realCategory: 'Гарнир обычный (не ЦЗ!)', note: 'Картофель — рекордсмен по насыщению за свои калории, обязателен для худеющих', group: 'refined' },
  { food: 'Сухофрукты, овощные чипсы', realCategory: 'Гарнир обычный', note: 'Высокая плотность сахаров/углеводов', group: 'refined' },
  { food: 'Арбуз', realCategory: 'Полезные напитки (без сахара)', note: 'Считается как жидкая фаза / бескалорийные напитки', group: 'healthy' },
  { food: 'Сало, бекон', realCategory: 'Масла и жиры', note: 'Входят в категорию масел (но крайне не рекомендуются)', group: 'oils' },
  { food: 'Сливочное масло, гхи', realCategory: 'Масла и жиры', note: '1 порция = 5г. До 10г/день (2п) = лекарство, более = яд', group: 'oils' },
  { food: 'Сладкие йогурты, пудинги', realCategory: 'Сладкое и десерты', note: 'Из-за добавленного сахара вычитают -2б', group: 'sweets' },
  { food: 'Сладкий кофе / какао / сладкий чай', realCategory: 'Нездоровые напитки', note: 'Каждый стакан вычитает -2б', group: 'unhealthy_drinks' },
  { food: 'Сыр для бургеров, плавленые сырки', realCategory: 'Ультра-обработанная еда', note: 'Обработанные сырные продукты', group: 'ultra' },
  { food: 'Макадамия в сиропе', realCategory: 'Сладкое и десерты', note: 'Поскольку вымочена в сахарном сиропе', group: 'sweets' },
  { food: 'Продукты на подсластителях (без сахара)', realCategory: 'В соответствующую цельную категорию', note: 'Например протеин -> Молочка/Белок (не в сладкое)', group: 'healthy' },
  { food: 'Напитки на подсластителях (Zero)', realCategory: 'Никуда не учитываем (0 баллов)', note: 'Не дают плюсов и не снимают баллы', group: 'zero' },
  { food: 'Шаверма хорошая (не зажаренная, свежие овощи, мякоть)', realCategory: 'Разложить на компоненты', note: 'Овощи (+2) + Мясо (+2) + Масло (+1) + Лаваш (0)', group: 'combo' },
  { food: 'Шаверма плохая (кетчунез, жирный вертел, фритюр)', realCategory: '3 порции Ультра-обработки', note: 'Снимает -6 баллов DQS', group: 'ultra' },
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
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#111] rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                ОФИЦИАЛЬНЫЙ ГАЙД DQS
              </span>
              <span className="text-xs text-slate-400 font-mono">Diet Quality Score</span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              Интерактивный справочник & Правила системы
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Оцениваем качество и баланс рациона без подсчета калорий и взвешивания еды в граммах.
              Стабильные порции, наглядные примеры и быстрая классификация продуктов.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 shrink-0">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <div className="text-xs">
              <div className="font-bold text-slate-100">4 Столпа DQS</div>
              <div className="text-slate-400 text-[11px]">Категории • Разнообразие • Порции • Регулярность</div>
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
            <BookOpen className="w-4 h-4" /> Таблица 11 Категорий
          </button>

          <button
            onClick={() => setActiveTab('cheat_sheet')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'cheat_sheet'
                ? 'bg-emerald-500 text-black shadow-lg font-bold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <Search className="w-4 h-4" /> Неочевидные продукты
          </button>

          <button
            onClick={() => setActiveTab('oil_rules')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'oil_rules'
                ? 'bg-emerald-500 text-black shadow-lg font-bold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            <Droplet className="w-4 h-4" /> Порции & Впитывание масла
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
            <Scale className="w-4 h-4" /> Целевые ориентиры
          </button>
        </div>
      </div>

      {/* TAB 1: CATEGORIES TABLE */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              11 Категорий Продуктов и Их Начисление Баллов
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Каждая категория выполняет свою биологическую функцию. Чем выше качество и разнообразие в группе — тем больше баллов DQS получает день.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DQS_CATEGORIES.map((cat, idx) => (
                <div
                  key={cat.id}
                  className={`p-4 rounded-xl border space-y-3 transition-all ${
                    cat.group === 'positive'
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-rose-500/5 border-rose-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-white/10 text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h3 className="font-bold text-slate-100 text-sm">{cat.nameRu}</h3>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                        cat.group === 'positive'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {cat.group === 'positive' ? 'Здоровая (+)' : 'Ограничение (-)'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-normal">{cat.description}</p>

                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 text-xs font-mono space-y-1">
                    <div className="text-slate-400 text-[11px]">
                      <b>Размер 1 порции:</b> {cat.portionExample}
                    </div>
                    <div className="text-emerald-400 text-[11px]">
                      <b>Схема баллов:</b> {cat.scoring.map((s, i) => `${i + 1}п: ${s > 0 ? '+' + s : s}`).join(' | ')}
                    </div>
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
                Поиск по не очевидным продуктам и сложным блюдам
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Искать (банан, шаверма, сыр...)"
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
                  <th className="p-2.5">Продукт / Блюдо</th>
                  <th className="p-2.5">Куда на самом деле относится</th>
                  <th className="p-2.5">Причина и логика DQS</th>
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

      {/* TAB 3: PORTIONS & OIL ABSORPTION */}
      {activeTab === 'oil_rules' && (
        <div className="space-y-6">
          <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-emerald-400" />
              Правило Порции & Впитывание Жира При Жарке
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                  ⚡ ПРАВИЛО ПОРЦИИ
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Порция — это условная мерная единица (как килограммы или сантиметры), а не норма или ограничение!
                  Внесите количество порций за день и поставьте галочку «3+», если съели 3+ разных продукта в категории.
                </p>
                <ul className="text-xs text-slate-400 space-y-1 pt-2 font-mono">
                  <li>• <b>Мясо/Рыба:</b> 120г сырого / 1 ладонь</li>
                  <li>• <b>Злаки/Бобовые:</b> 60г сухого → ~120г готового</li>
                  <li>• <b>Овощи/Фрукты:</b> 120г / 1 кулак / 1 плод</li>
                  <li>• <b>Орехи:</b> 10г (небольшая горсть)</li>
                  <li>• <b>Масла:</b> 5г (1 ч.л.)</li>
                </ul>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                <h3 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                  🍳 ВПИТЫВАНИЕ МАСЛА ПРИ ЖАРКЕ
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  При приготовлении часть масла остается в сковороде, а часть полностью впитывается в продукт:
                </p>
                <div className="space-y-2 pt-2 text-xs">
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-slate-200">
                    <b className="text-amber-400">50% Впитывание:</b> Цельное мясо, курица, рыба, яичница (половина налитого масла уходит в блюдо).
                  </div>
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-slate-200">
                    <b className="text-rose-400">100% Впитывание:</b> Фарш, котлеты, запеченные овощи, картофель, хлеб, гренки (впитывают всё масло до капли).
                  </div>
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
              Примеры Рационов из Практики DQS
            </h2>

            <div className="space-y-4">
              {/* Day 1: High DQS */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-sm">🌟 ДЕНЬ С ВЫСОКИМ DQS (+22 балла)</span>
                  <span className="text-xs font-mono font-bold bg-emerald-500 text-black px-2 py-0.5 rounded">Зеленый день</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
                  <p><b>Завтрак:</b> Овсянка ЦЗ 65г + Молоко 145г + Творог 65г + Орехи 11г + Шоколад 11г + Кофе + Нектарин 180г</p>
                  <p><b>Обед:</b> ЦЗ Макароны 60г + Сыр Сулугуни 22г + 2 Яйца + Цветная капуста/перец 150г</p>
                  <p><b>Ужин:</b> Рис обычный 70г + Куриное филе 170г + Помидоры/зелень + Оливковое масло 10г</p>
                  <p><b>Второй ужин:</b> Персик 120г + 1 Яйцо + Баунти 30г</p>
                  <p className="text-emerald-300 pt-1 font-mono"><b>Итого:</b> Растения 5п (+10), Мясо 3п (+5), Молочка 3п (+5), ЦЗ 2п (+4), Полезные напитки 1п (+1), Орехи 1п (+2)... Галочка разнообразия!</p>
                </div>
              </div>

              {/* Day 2: Regular Day */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 text-sm">👍 ОБЫЧНЫЙ ДЕНЬ (+12 баллов)</span>
                  <span className="text-xs font-mono font-bold bg-amber-500 text-black px-2 py-0.5 rounded">Желтый день</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
                  <p><b>Завтрак:</b> Овсянка на молоке с маслом и мёдом, 2 яйца с майонезом, кофе</p>
                  <p><b>Обед:</b> Свинина с имбирём, картофель по-деревенски, салат, яблоко, кофе</p>
                  <p><b>Ужин:</b> Куриное бедро, картошка, зеленый горошек, масло</p>
                </div>
              </div>

              {/* Day 3: Ultra Processed Day */}
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400 text-sm">⚠️ ДЕНЬ С УЛЬТРА-ОБРАБОТКОЙ (-4 балла)</span>
                  <span className="text-xs font-mono font-bold bg-rose-500 text-black px-2 py-0.5 rounded">Красный день</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
                  <p><b>Завтрак:</b> Каша 4 злака (не ЦЗ), 2 яйца, Чай с сахаром 5г (-2б)</p>
                  <p><b>Обед:</b> 2 куска пиццы (-4б), Сок пакетный 200мл (-2б), Запеканка с сахаром (-2б)</p>
                  <p><b>Ужин:</b> Хумус, Бурый рис, Свекольная икра с загустителями (-2б)</p>
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
              <p className="text-[11px] text-slate-400">Идеальный баланс и высокое разнообразие</p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-center space-y-1">
              <div className="text-2xl font-black font-mono text-amber-400">+8 ... +14</div>
              <div className="text-xs font-bold text-slate-100">Хороший день</div>
              <p className="text-[11px] text-slate-400">Нормальный рабочий рацион</p>
            </div>

            <div className="bg-sky-500/10 border border-sky-500/30 p-4 rounded-xl text-center space-y-1">
              <div className="text-2xl font-black font-mono text-sky-400">+3 ... +7</div>
              <div className="text-xs font-bold text-slate-100">Средний день</div>
              <p className="text-[11px] text-slate-400">Есть небольшие огрехи в рационе</p>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-center space-y-1">
              <div className="text-2xl font-black font-mono text-rose-400">Ниже +3</div>
              <div className="text-xs font-bold text-slate-100">День для анализа</div>
              <p className="text-[11px] text-slate-400">Преобладание сладостей или обработанной еды</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
