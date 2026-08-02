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
  DEFAULT_SETTINGS,
} from './utils/storage';
import { calculateDailyDQS, getInitialDiversity, getInitialServings } from './utils/dqsEngine';
import { Navbar } from './components/Navbar';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [logs, setLogs] = useState<DailyLogEntry[]>(() => loadDailyLogs());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [reports, setReports] = useState<WeeklySundayReport[]>(() => loadSundayReports());
  const [isQuickMealModalOpen, setIsQuickMealModalOpen] = useState(false);
  const [isStartWizardOpen, setIsStartWizardOpen] = useState(false);
  const [isExtendedPdfModalOpen, setIsExtendedPdfModalOpen] = useState(false);
  const [pdfReportType, setPdfReportType] = useState<'weekly' | 'monthly'>('weekly');

  const handleOpenPdfModal = (type: 'weekly' | 'monthly') => {
    setPdfReportType(type);
    setIsExtendedPdfModalOpen(true);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Automatically trigger wizard on first load if user hasn't started yet
  useEffect(() => {
    if (!settings.isStarted && !settings.userName && logs.length === 0) {
      // Keep modal available for user to open
    }
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
            reports={reports}
            onUpdateLog={handleUpdateLog}
            onSaveReport={handleSaveSundayReport}
            onNavigateTab={setActiveTab}
            onOpenQuickMealModal={() => setIsQuickMealModalOpen(true)}
            onOpenStartWizard={() => setIsStartWizardOpen(true)}
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

