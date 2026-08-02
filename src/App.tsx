/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { ActiveTab, DailyLogEntry, UserSettings, WeeklySundayReport } from './types';
import {
  loadDailyLogs,
  loadSettings,
  loadSundayReports,
  saveDailyLogs,
  saveSettings,
  saveSundayReports,
  generateSampleData,
} from './utils/storage';
import { calculateDailyDQS, getInitialDiversity, getInitialServings } from './utils/dqsEngine';
import { Navbar } from './components/Navbar';
import { HomeDashboardView } from './components/HomeDashboardView';
import { QuickAddMealModal } from './components/QuickAddMealModal';
import { DailyLogView } from './components/DailyLogView';
import { DQSTableSheet } from './components/DQSTableSheet';
import { DQSGuideView } from './components/DQSGuideView';
import { WeeklyReportView } from './components/WeeklyReportView';
import { AnalyticsView } from './components/AnalyticsView';
import { PrintView } from './components/PrintView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [logs, setLogs] = useState<DailyLogEntry[]>(() => loadDailyLogs());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [reports, setReports] = useState<WeeklySundayReport[]>(() => loadSundayReports());
  const [isQuickMealModalOpen, setIsQuickMealModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

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
    if (confirm('Вы уверены, что хотите сбросить дневник к начальным демо-данным?')) {
      const samples = generateSampleData();
      setLogs(samples);
      setReports([]);
      alert('Данные сброшены к начальному состоянию!');
    }
  };

  const currentLog = getSelectedLog();

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Navbar & Mobile Bottom Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} todayLog={currentLog} />

      {/* Main Content View with Mobile Safe Padding */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 pb-24 sm:pb-8">
        {activeTab === 'home' && (
          <HomeDashboardView
            currentLog={currentLog}
            allLogs={logs}
            userSettings={settings}
            onUpdateLog={handleUpdateLog}
            onNavigateTab={setActiveTab}
            onOpenQuickMealModal={() => setIsQuickMealModalOpen(true)}
          />
        )}

        {activeTab === 'log' && (
          <DailyLogView
            log={currentLog}
            onUpdateLog={handleUpdateLog}
            onSelectDate={setSelectedDate}
            settings={settings}
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
          />
        )}

        {activeTab === 'charts' && <AnalyticsView logs={logs} />}

        {activeTab === 'print' && (
          <PrintView logs={logs} settings={settings} selectedDate={selectedDate} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={() => setIsQuickMealModalOpen(true)}
        className="sm:hidden fixed bottom-16 right-4 z-30 p-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer min-h-[48px]"
        aria-label="Добавить приём пищи"
      >
        <Zap className="w-5 h-5 fill-black shrink-0" />
        <span className="text-xs font-extrabold pr-1">+ Еда</span>
      </button>

      {/* Global Quick Add Meal Modal */}
      <QuickAddMealModal
        isOpen={isQuickMealModalOpen}
        onClose={() => setIsQuickMealModalOpen(false)}
        log={currentLog}
        onUpdateLog={handleUpdateLog}
        settings={settings}
        onUpdateSettings={setSettings}
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

