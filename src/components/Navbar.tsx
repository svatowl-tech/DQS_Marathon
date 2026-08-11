import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Table,
  BarChart3,
  Award,
  Printer,
  Settings,
  Download,
  Sparkles,
  FileText,
  MoreHorizontal,
  X,
  Utensils,
  Scale,
  Heart,
  TrendingDown,
} from 'lucide-react';
import { ActiveTab, DailyLogEntry } from '../types';
import { formatDateRu } from '../utils/dqsEngine';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  todayLog: DailyLogEntry;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, todayLog }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      });
    } else {
      alert(
        'Чтобы установить веб-приложение:\n• iOS (Safari): нажмите «Поделиться» -> «На экран «Домой»»\n• Android (Chrome): нажмите меню (3 точки) -> «Добавить на гл. экран»'
      );
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 15) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (score >= 8) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (score >= -2) return 'bg-zinc-800/80 text-zinc-400 border-zinc-700';
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  };

  const primaryMobileTabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Главная', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'log', label: 'Дневник', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'dictionary', label: 'Словарь', icon: <Utensils className="w-5 h-5" /> },
    { id: 'weigh_in', label: 'Замеры', icon: <Scale className="w-5 h-5" /> },
    { id: 'table', label: 'Таблица', icon: <Table className="w-5 h-5" /> },
  ];

  const allNavItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    { id: 'home', label: 'Главная', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'log', label: 'Дневник', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'dictionary', label: 'Словарь еды', icon: <Utensils className="w-4 h-4" /> },
    { id: 'weigh_in', label: 'Взвешивания', icon: <Scale className="w-4 h-4" /> },
    { id: 'metabolism', label: 'Метаболизм', icon: <Heart className="w-4 h-4" /> },
    { id: 'weight_loss_analysis', label: 'Анализ похудения', icon: <TrendingDown className="w-4 h-4" /> },
    { id: 'table', label: 'DQS-Таблица', icon: <Table className="w-4 h-4" /> },
    { id: 'guide', label: 'Гайды DQS', icon: <FileText className="w-4 h-4" /> },
    { id: 'weekly_report', label: 'Отчет недели', icon: <Award className="w-4 h-4" />, badge: true },
    { id: 'charts', label: 'Графики', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'print', label: 'Печать', icon: <Printer className="w-4 h-4" /> },
    { id: 'settings', label: 'Настройки', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 italic">
                DQS
              </div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-zinc-100 text-sm sm:text-base leading-tight">
                  Diet Quality Score
                </h1>
                <span className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                  QUALITY OVER CALORIES
                </span>
              </div>
            </div>

            {/* Score & PWA CTA */}
            <div className="flex items-center gap-2">
              <div
                onClick={() => setActiveTab('log')}
                className="flex items-center gap-2 bg-white/[0.03] active:bg-white/[0.08] transition-all py-1 px-2.5 rounded-xl cursor-pointer border border-white/[0.08]"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[9px] text-zinc-400 font-mono uppercase">DQS Сегодня</p>
                  <p className="text-[11px] font-medium text-zinc-200">{formatDateRu(todayLog.date)}</p>
                </div>
                <div className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold border ${getScoreBadge(todayLog.calculatedScore)}`}>
                  {todayLog.calculatedScore > 0 ? `+${todayLog.calculatedScore}` : todayLog.calculatedScore} б.
                </div>
              </div>

              {!isInstalled && (
                <button
                  onClick={handleInstallClick}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all cursor-pointer min-h-[36px]"
                  title="Установить как приложение"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Установить</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Tab Navigation */}
          <nav className="hidden sm:flex space-x-1 overflow-x-auto no-scrollbar py-1.5 border-t border-white/[0.05]">
            {allNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer min-h-[36px] ${
                    isActive
                      ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Thumb Friendly) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0c0c0e]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1 flex items-center justify-around shadow-2xl">
        {primaryMobileTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsMoreMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer min-h-[48px] min-w-[56px] active:scale-95 ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-500/15' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[10px] mt-0.5 leading-none">{tab.label}</span>
            </button>
          );
        })}

        {/* More Tab Button for Mobile */}
        <button
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer min-h-[48px] min-w-[56px] active:scale-95 ${
            ['guide', 'charts', 'print', 'settings'].includes(activeTab) || isMoreMenuOpen
              ? 'text-emerald-400 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${['guide', 'charts', 'print', 'settings'].includes(activeTab) ? 'bg-emerald-500/15' : ''}`}>
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">Ещё</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer / Popover */}
      {isMoreMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end animate-fadeIn">
          <div className="bg-[#121215] border-t border-white/10 rounded-t-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-sm font-bold text-zinc-100">Все разделы</span>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {allNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMoreMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium transition-all active:scale-95 min-h-[44px] ${
                    activeTab === item.id
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-200 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="text-emerald-400">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {!isInstalled && (
              <button
                onClick={() => {
                  handleInstallClick();
                  setIsMoreMenuOpen(false);
                }}
                className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Установить приложение на экран</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

