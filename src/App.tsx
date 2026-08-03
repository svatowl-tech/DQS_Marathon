/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { ActiveTab, DailyLogEntry, PhotoEntry, UserSettings, WeeklySundayReport } from './types';
import {
  loadDailyLogs,
  loadSettings,
  loadSundayReports,
  saveDailyLogs,
  saveSettings,
  saveSundayReports,
  hydrateFromIndexedDB,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { calculateDailyDQS, getInitialDiversity, getInitialServings } from './utils/dqsEngine';
import {
  fetchInternetTimeAndZone,
  getFormattedLocalDate,
  NetworkTimeInfo,
  parseLocalDate,
} from './utils/timeZoneService';
import { Navbar } from './components/Navbar';
import { TimeSyncBar } from './components/TimeSyncBar';
import { HomeDashboardView } from './components/HomeDashboardView';
import { QuickAddMealModal } from './components/QuickAddMealModal';
import { StartWizardModal } from './components/StartWizardModal';
import { ExtendedPdfReportModal } from './components/ExtendedPdfReportModal';
import { DailyLogView } from './components/DailyLogView';
import { DQSTableSheet } from './components/DQSTableSheet';
import { DQSGuideView } from './components/DQSGuideView';
import { WeeklyReportView } from './components/WeeklyReportView';
import { AnalyticsView } from './components/AnalyticsView';
import { PrintView } from './components/PrintView';
import { SettingsView } from './components/SettingsView';
import { FoodDictionaryView } from './components/FoodDictionaryView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [logs, setLogs] = useState<DailyLogEntry[]>(() => loadDailyLogs());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [reports, setReports] = useState<WeeklySundayReport[]>(() => loadSundayReports());
  const [isQuickMealModalOpen, setIsQuickMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<PhotoEntry | null>(null);
  const [isStartWizardOpen, setIsStartWizardOpen] = useState(false);
  const [isExtendedPdfModalOpen, setIsExtendedPdfModalOpen] = useState(false);
  const [pdfReportType, setPdfReportType] = useState<'weekly' | 'monthly'>('weekly');

  const handleOpenQuickMealModal = (meal?: PhotoEntry) => {
    setEditingMeal(meal || null);
    setIsQuickMealModalOpen(true);
  };

  // Time & Timezone State
  const initialLocalDate = getFormattedLocalDate(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(initialLocalDate);
  const [todayStr, setTodayStr] = useState<string>(initialLocalDate);
  const [isSyncingTime, setIsSyncingTime] = useState(false);
  const [dayChangeAlert, setDayChangeAlert] = useState<string | null>(null);
  const [netTimeInfo, setNetTimeInfo] = useState<NetworkTimeInfo>({
    dateStr: initialLocalDate,
    timeStr: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    utcOffset: '+03:00',
    isInternetSynced: false,
    lastSyncedAt: new Date(),
  });

  const prevTodayRef = useRef<string>(initialLocalDate);

  // Time Sync & Day Rollover Check Routine
  const syncTimeAndCheckDayChange = useCallback(async () => {
    setIsSyncingTime(true);
    const info = await fetchInternetTimeAndZone();
    setNetTimeInfo(info);
    setIsSyncingTime(false);

    const detectedToday = info.dateStr;
    const previousToday = prevTodayRef.current;

    // Detect if day changed (midnight rollover)
    if (previousToday && previousToday !== detectedToday) {
      prevTodayRef.current = detectedToday;
      setTodayStr(detectedToday);

      // Automatically advance selectedDate if user was on the previous today
      setSelectedDate((currSelected) => {
        if (currSelected === previousToday) {
          return detectedToday;
        }
        return currSelected;
      });

      setDayChangeAlert(`Автоматически зафиксирована смена дня! Дата обновлена на ${info.dateStr}.`);
    } else {
      prevTodayRef.current = detectedToday;
      setTodayStr(detectedToday);
    }
  }, []);

  // Theme Switching Effect (Light vs Dark vs System)
  useEffect(() => {
    const root = document.documentElement;
    const currentTheme = settings.theme || 'dark';

    let effectiveTheme = currentTheme;
    if (currentTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }

    if (effectiveTheme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    }
  }, [settings.theme]);

  // Periodic Auto-Sync & Lifecycle Events
  useEffect(() => {
    // Initial Sync
    syncTimeAndCheckDayChange();

    // Poll every 15 seconds to catch midnight rollover promptly
    const timer = setInterval(() => {
      syncTimeAndCheckDayChange();
    }, 15000);

    // Sync when tab gets focus or network reconnects
    const handleFocus = () => syncTimeAndCheckDayChange();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        syncTimeAndCheckDayChange();
      }
    });

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
    };
  }, [syncTimeAndCheckDayChange]);

  const handleOpenPdfModal = (type: 'weekly' | 'monthly') => {
    setPdfReportType(type);
    setIsExtendedPdfModalOpen(true);
  };

  // Hydrate state asynchronously from IndexedDB engine on startup
  useEffect(() => {
    async function initIndexedDBHydration() {
      const hydrated = await hydrateFromIndexedDB();
      if (hydrated.logs && hydrated.logs.length > 0) {
        setLogs(hydrated.logs);
      }
      if (hydrated.settings) {
        setSettings(hydrated.settings);
      }
      if (hydrated.reports && hydrated.reports.length > 0) {
        setReports(hydrated.reports);
      }
    }
    initIndexedDBHydration();
  }, []);

  const handleStartApp = (newSettings: UserSettings) => {
    setSettings(newSettings);
    const startDate = newSettings.programStartDate || todayStr;
    setSelectedDate(startDate);

    // Initialize initial daily log entry for program start date
    setLogs((prev) => {
      const existing = prev.find((l) => l.date === startDate);
      if (existing) {
        return prev.map((l) =>
          l.date === startDate
            ? { ...l, weight: newSettings.startWeight || l.weight }
            : l
        );
      }
      const initialServings = getInitialServings();
      const initialDiversity = getInitialDiversity();
      const isWeekend = new Date(startDate).getDay() === 0 || new Date(startDate).getDay() === 6;
      const startLog: DailyLogEntry = {
        date: startDate,
        isWeekend,
        weight: newSettings.startWeight,
        workout: { done: false, description: '' },
        notOnPhoto: '',
        servings: initialServings,
        diversity: initialDiversity,
        calculatedScore: calculateDailyDQS(initialServings, initialDiversity),
        photos: [],
        journal: {
          note: '🚀 День 1 марафона DQS! Отличный старт!',
        },
        trackers: {
          waterGlass: 0,
        },
      };
      return [startLog, ...prev];
    });
  };

  // Save to LocalStorage on updates
  useEffect(() => {
    saveDailyLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveSundayReports(reports);
  }, [reports]);

  // Find or construct entry for current selected date
  const getSelectedLog = (): DailyLogEntry => {
    const found = logs.find((l) => l.date === selectedDate);
    if (found) return found;

    // Return clean initial entry
    const initialServings = getInitialServings();
    const initialDiversity = getInitialDiversity();
    const isWeekend = new Date(selectedDate).getDay() === 0 || new Date(selectedDate).getDay() === 6;

    return {
      date: selectedDate,
      isWeekend,
      workout: { done: false, description: '' },
      notOnPhoto: '',
      servings: initialServings,
      diversity: initialDiversity,
      calculatedScore: calculateDailyDQS(initialServings, initialDiversity),
      photos: [],
      journal: {},
      trackers: {},
    };
  };

  const handleUpdateLog = (updatedLog: DailyLogEntry) => {
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.date === updatedLog.date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedLog;
        return copy;
      } else {
        return [...prev, updatedLog];
      }
    });
  };

  const handleSaveSundayReport = (newReport: WeeklySundayReport) => {
    setReports((prev) => {
      const idx = prev.findIndex((r) => r.weekEndDate === newReport.weekEndDate);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newReport;
        return copy;
      }
      return [...prev, newReport];
    });
  };

  const handleResetData = () => {
    if (confirm('Вы уверены, что хотите полностью очистить все данные дневника и начать заново?')) {
      setLogs([]);
      setReports([]);
      setSettings(DEFAULT_SETTINGS);
      saveDailyLogs([]);
      saveSundayReports([]);
      saveSettings(DEFAULT_SETTINGS);
      alert('Все данные дневника сброшены!');
    }
  };

  const handleReloadAppData = async () => {
    const hydrated = await hydrateFromIndexedDB();
    if (hydrated.logs && hydrated.logs.length > 0) {
      setLogs(hydrated.logs);
    }
    if (hydrated.settings) {
      setSettings(hydrated.settings);
    }
    if (hydrated.reports && hydrated.reports.length > 0) {
      setReports(hydrated.reports);
    }
  };

  const currentLog = getSelectedLog();

  const getTodayLog = (): DailyLogEntry => {
    const found = logs.find((l) => l.date === todayStr);
    if (found) return found;

    const initialServings = getInitialServings();
    const initialDiversity = getInitialDiversity();
    const isWeekend = parseLocalDate(todayStr).getDay() === 0 || parseLocalDate(todayStr).getDay() === 6;

    return {
      date: todayStr,
      isWeekend,
      workout: { done: false, description: '' },
      notOnPhoto: '',
      servings: initialServings,
      diversity: initialDiversity,
      calculatedScore: calculateDailyDQS(initialServings, initialDiversity),
      photos: [],
      journal: {},
      trackers: {},
    };
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-sans selection:bg-emerald-500 selection:text-black app-main-wrapper">
      {/* Navbar & Mobile Bottom Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} todayLog={getTodayLog()} />

      {/* Main Content View with Mobile Safe Padding */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 pb-24 sm:pb-8">
        <TimeSyncBar
          netTimeInfo={netTimeInfo}
          isSyncing={isSyncingTime}
          onManualSync={() => syncTimeAndCheckDayChange()}
          dayChangeAlert={dayChangeAlert}
          onDismissAlert={() => setDayChangeAlert(null)}
        />

        {activeTab === 'home' && (
          <HomeDashboardView
            currentLog={currentLog}
            allLogs={logs}
            userSettings={settings}
            reports={reports}
            onUpdateLog={handleUpdateLog}
            onSaveReport={handleSaveSundayReport}
            onNavigateTab={setActiveTab}
            onOpenQuickMealModal={handleOpenQuickMealModal}
            onOpenStartWizard={() => setIsStartWizardOpen(true)}
          />
        )}

        {activeTab === 'log' && (
          <DailyLogView
            log={currentLog}
            onUpdateLog={handleUpdateLog}
            onSelectDate={setSelectedDate}
            settings={settings}
            onOpenQuickMealModal={handleOpenQuickMealModal}
          />
        )}

        {activeTab === 'dictionary' && (
          <FoodDictionaryView
            todayLog={currentLog}
            onUpdateLog={handleUpdateLog}
            onNavigateToLog={() => setActiveTab('log')}
          />
        )}

        {activeTab === 'table' && (
          <DQSTableSheet
            logs={logs}
            onUpdateLog={handleUpdateLog}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'guide' && <DQSGuideView />}

        {activeTab === 'weekly_report' && (
          <WeeklyReportView
            logs={logs}
            settings={settings}
            reports={reports}
            onSaveReport={handleSaveSundayReport}
            onOpenExtendedPdfModal={handleOpenPdfModal}
          />
        )}

        {activeTab === 'charts' && (
          <AnalyticsView logs={logs} settings={settings} reports={reports} />
        )}

        {activeTab === 'print' && (
          <PrintView logs={logs} settings={settings} selectedDate={selectedDate} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            logs={logs}
            reports={reports}
            onUpdateSettings={setSettings}
            onResetData={handleResetData}
            onReloadAppData={handleReloadAppData}
          />
        )}
      </main>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={() => handleOpenQuickMealModal()}
        className="sm:hidden fixed bottom-16 right-4 z-30 p-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer min-h-[48px]"
        aria-label="Добавить приём пищи"
      >
        <Zap className="w-5 h-5 fill-black shrink-0" />
        <span className="text-xs font-extrabold pr-1">+ Еда</span>
      </button>

      {/* Global Quick Add Meal Modal */}
      <QuickAddMealModal
        isOpen={isQuickMealModalOpen}
        onClose={() => {
          setIsQuickMealModalOpen(false);
          setEditingMeal(null);
        }}
        log={currentLog}
        onUpdateLog={handleUpdateLog}
        settings={settings}
        onUpdateSettings={setSettings}
        initialMealToEdit={editingMeal}
      />

      {/* Start Marathon Wizard Modal */}
      <StartWizardModal
        isOpen={isStartWizardOpen}
        onClose={() => setIsStartWizardOpen(false)}
        settings={settings}
        onStart={handleStartApp}
      />

      {/* Extended PDF Report Generator Modal */}
      <ExtendedPdfReportModal
        isOpen={isExtendedPdfModalOpen}
        onClose={() => setIsExtendedPdfModalOpen(false)}
        logs={logs}
        settings={settings}
        reports={reports}
        initialType={pdfReportType}
      />

      {/* Footer */}
      <footer className="hidden sm:flex border-t border-white/5 bg-[#0a0a0a] py-5 px-6 text-center text-xs text-slate-500 font-mono flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>DQS JOURNAL // ELEGANT MOBILE ENGINE</span>
        </div>
        <p className="text-slate-400 font-sans">
          ★ Diet Quality Score • Осознанное питание • Оценка качества и разнообразия
        </p>
        <span className="text-emerald-500/80">Локальное хранение (Offline First)</span>
      </footer>
    </div>
  );
}

