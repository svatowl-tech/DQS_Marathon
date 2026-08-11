import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Calendar,
  User,
  CheckSquare,
  Plus,
  Trash2,
  Star,
  Bookmark,
  Utensils,
  ShieldCheck,
  HardDrive,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { BodyMeasurements, CustomTaskRule, DailyLogEntry, FavoriteMealTemplate, UserSettings, WeeklySundayReport } from '../types';
import { exportAllDataToJson, importAllDataFromJson, downloadBackupFile, getStorageStats, DEFAULT_SETTINGS } from '../utils/storage';
import { DQS_CATEGORIES } from '../utils/dqsEngine';
import { ParticipantProfileCard } from './ParticipantProfileCard';
import { GoogleSheetsSyncCard } from './GoogleSheetsSyncCard';

interface SettingsViewProps {
  settings: UserSettings;
  logs?: DailyLogEntry[];
  reports?: WeeklySundayReport[];
  onUpdateSettings: (settings: UserSettings) => void;
  onResetData: () => void;
  onReloadAppData?: () => void;
  onRecalculateAllData?: () => void;
}

const DAY_LABELS = [
  { id: 1, label: 'Пн' },
  { id: 2, label: 'Вт' },
  { id: 3, label: 'Ср' },
  { id: 4, label: 'Чт' },
  { id: 5, label: 'Пт' },
  { id: 6, label: 'Сб' },
  { id: 0, label: 'Вс' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  logs = [],
  reports = [],
  onUpdateSettings,
  onResetData,
  onReloadAppData,
  onRecalculateAllData,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const taskRules: CustomTaskRule[] = settings.taskRules || DEFAULT_SETTINGS.taskRules || [];

  const handleToggleDayForTask = (taskId: string, dayIndex: number) => {
    const updatedRules = taskRules.map((rule) => {
      if (rule.id !== taskId) return rule;
      const days = rule.daysOfWeek.includes(dayIndex)
        ? rule.daysOfWeek.filter((d) => d !== dayIndex)
        : [...rule.daysOfWeek, dayIndex];
      return { ...rule, daysOfWeek: days };
    });

    onUpdateSettings({ ...settings, taskRules: updatedRules });
  };

  const handleAddTaskRule = () => {
    if (!newTaskTitle.trim()) return;
    const newRule: CustomTaskRule = {
      id: `t_custom_${Date.now()}`,
      title: newTaskTitle.trim(),
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      timeOfDay: 'anytime',
      type: 'custom',
    };
    onUpdateSettings({ ...settings, taskRules: [...taskRules, newRule] });
    setNewTaskTitle('');
  };

  const handleDeleteTaskRule = (taskId: string) => {
    const updatedRules = taskRules.filter((r) => r.id !== taskId);
    onUpdateSettings({ ...settings, taskRules: updatedRules });
  };

  const favoriteMeals: FavoriteMealTemplate[] = settings.favoriteMeals || DEFAULT_SETTINGS.favoriteMeals || [];

  const handleDeleteFavoriteMeal = (id: string) => {
    const updated = favoriteMeals.filter((f) => f.id !== id);
    onUpdateSettings({ ...settings, favoriteMeals: updated });
  };

  const handleExportJson = () => {
    const jsonStr = exportAllDataToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dqs_diary_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAllDataFromJson(content);
      if (success) {
        setImportStatus('Успешно импортировано! Обновите страницу при необходимости.');
        window.location.reload();
      } else {
        setImportStatus('Ошибка при импорте JSON файла. Проверьте формат.');
      }
    };
    reader.readAsText(file);
  };

  const handleMeasurementChange = (key: keyof BodyMeasurements, val: string) => {
    const num = val ? parseFloat(val) : undefined;
    onUpdateSettings({
      ...settings,
      startMeasurements: {
        ...settings.startMeasurements,
        [key]: num,
      },
    });
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg">
        <h2 className="font-bold text-slate-100 text-lg flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" /> Настройки Программы & Бэкап Данных
        </h2>
        <p className="text-xs text-slate-400">
          Управление стартовыми параметрами, замерами тела и резервное копирование JSON
        </p>
      </div>

      {/* PARTICIPANT SOCIAL PROFILE CARD */}
      <ParticipantProfileCard
        settings={settings}
        logs={logs}
        reports={reports}
        onUpdateSettings={onUpdateSettings}
      />

      {/* THEME SELECTION CARD */}
      <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-3">
        <h3 className="font-bold text-slate-100 text-sm border-b border-white/10 pb-2 flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-400" /> Оформление и Тема Приложения
        </h3>
        <p className="text-xs text-slate-400">
          Выберите предпочтительную цветовую схему. Светлая тема отлично подходит для использования днём и при ярком освещении.
        </p>

        <div className="grid grid-cols-3 gap-3 pt-1">
          {/* Light Theme */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer min-h-[72px] active:scale-95 ${
              settings.theme === 'light'
                ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md ring-2 ring-amber-500/30'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Sun className="w-6 h-6 text-amber-400 shrink-0" />
            <span className="text-xs font-bold">Светлая</span>
          </button>

          {/* Dark Theme */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer min-h-[72px] active:scale-95 ${
              settings.theme === 'dark' || !settings.theme
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold shadow-md ring-2 ring-emerald-500/30'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Moon className="w-6 h-6 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">Тёмная</span>
          </button>

          {/* System Theme */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ ...settings, theme: 'system' })}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer min-h-[72px] active:scale-95 ${
              settings.theme === 'system'
                ? 'bg-sky-500/15 border-sky-500 text-sky-300 font-bold shadow-md ring-2 ring-sky-500/30'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Monitor className="w-6 h-6 text-sky-400 shrink-0" />
            <span className="text-xs font-bold">Системная</span>
          </button>
        </div>
      </div>

      {/* USER & PROGRAM PROFILE */}
      <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
        <h3 className="font-bold text-slate-100 text-sm border-b border-white/10 pb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" /> Профиль Участника
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Имя или никнейм</label>
            <input
              type="text"
              value={settings.userName}
              onChange={(e) => onUpdateSettings({ ...settings, userName: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Дата старта (например 09.08.2026)</label>
            <input
              type="date"
              value={settings.programStartDate}
              onChange={(e) => onUpdateSettings({ ...settings, programStartDate: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-medium text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Стартовый вес (кг)</label>
            <input
              type="number"
              step="0.1"
              value={settings.startWeight}
              onChange={(e) =>
                onUpdateSettings({ ...settings, startWeight: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-bold text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* START BODY MEASUREMENTS */}
        <div className="pt-2">
          <label className="text-xs font-bold text-slate-300 block mb-2">
            Стартовые замеры тела (см)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <span className="text-[10px] text-slate-400">Грудь</span>
              <input
                type="number"
                step="0.5"
                value={settings.startMeasurements?.chest ?? ''}
                onChange={(e) => handleMeasurementChange('chest', e.target.value)}
                className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono font-semibold text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-400">Талия</span>
              <input
                type="number"
                step="0.5"
                value={settings.startMeasurements?.waist ?? ''}
                onChange={(e) => handleMeasurementChange('waist', e.target.value)}
                className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono font-semibold text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-400">Бёдра</span>
              <input
                type="number"
                step="0.5"
                value={settings.startMeasurements?.hips ?? ''}
                onChange={(e) => handleMeasurementChange('hips', e.target.value)}
                className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono font-semibold text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-400">Бедро</span>
              <input
                type="number"
                step="0.5"
                value={settings.startMeasurements?.thigh ?? ''}
                onChange={(e) => handleMeasurementChange('thigh', e.target.value)}
                className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono font-semibold text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <span className="text-[10px] text-slate-400">Бицепс</span>
              <input
                type="number"
                step="0.5"
                value={settings.startMeasurements?.arm ?? ''}
                onChange={(e) => handleMeasurementChange('arm', e.target.value)}
                className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono font-semibold text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TASK RULES CONFIGURATION */}
      <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" /> Настройка Расписания Задач (Главная)
          </h3>
          <span className="text-[11px] text-slate-400">В дни недели</span>
        </div>

        <p className="text-xs text-slate-400">
          Выберите, в какие дни недели на Главной странице отображаются регулярные задачи (например, замеры в Понедельник и Воскресенье, или ежедневное взвешивание).
        </p>

        <div className="space-y-3">
          {taskRules.map((rule) => (
            <div key={rule.id} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-200">{rule.title}</span>
                <button
                  onClick={() => handleDeleteTaskRule(rule.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                  title="Удалить задачу"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-mono mr-1">Дни:</span>
                {DAY_LABELS.map((d) => {
                  const isSelected = rule.daysOfWeek.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleToggleDayForTask(rule.id, d.id)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all ${
                        isSelected
                          ? 'bg-emerald-500 text-black shadow-md'
                          : 'bg-white/5 text-slate-500 hover:bg-white/10'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add custom task */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Добавить новую задачу (напр. Выпить 2л воды)..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={handleAddTaskRule}
              className="px-3 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:bg-emerald-400 flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Добавить
            </button>
          </div>
        </div>
      </div>

      {/* FAVORITE MEAL TEMPLATES MANAGER */}
      <div className="bg-[#111] rounded-2xl p-5 border border-white/5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Любимые Приемы Пищи и Быстрые Шаблоны
          </h3>
          <span className="text-[11px] text-amber-400 font-semibold">{favoriteMeals.length} шаблонов</span>
        </div>

        <p className="text-xs text-slate-400">
          Сохраняйте блюда, которые вы едите регулярно. Нажмите на любой шаблон при добавлении приёма пищи, чтобы в 1 клик заполнить порции.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {favoriteMeals.map((tpl) => {
            const mealTypeLabels: Record<string, string> = {
              breakfast: '🥞 Завтрак',
              lunch: '🥗 Обед',
              dinner: '🍗 Ужин',
              snack: '🍏 Перекус',
            };

            const servingsList = Object.entries(tpl.servings)
              .map(([catId, count]) => {
                const cat = DQS_CATEGORIES.find((c) => c.id === catId);
                return `${cat?.nameRu || catId}: +${count}`;
              })
              .join(', ');

            return (
              <div
                key={tpl.id}
                className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-slate-100">{tpl.title}</h4>
                    <button
                      onClick={() => handleDeleteFavoriteMeal(tpl.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 shrink-0"
                      title="Удалить шаблон"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      {mealTypeLabels[tpl.mealType] || tpl.mealType}
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] text-slate-400 leading-tight">
                    <span className="font-semibold text-slate-300">Состав порций: </span>
                    {servingsList || 'Порции не указаны'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GOOGLE SHEETS INTEGRATION CARD */}
      <GoogleSheetsSyncCard
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        logs={logs || []}
        onReloadAppData={onReloadAppData}
      />

      {/* DQS V2 COMPATIBILITY & RECALCULATE CARD */}
      <div className="bg-[#111] rounded-2xl p-5 border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-400" /> Совместимость и Пересчёт DQS v2
          </h3>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            17 Категорий
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Система автоматически защищает ваши прошлые дневниковые данные при загрузке. Если вы хотите принудительно обновить все зафиксированные порции и баллы всей истории ({logs?.length || 0} дней) под обновлённый стандарт категорий DQS v2, нажмите кнопку ниже:
        </p>

        <button
          onClick={() => {
            if (onRecalculateAllData) {
              onRecalculateAllData();
              setImportStatus('✅ Все дневниковые записи успешно пересчитаны и обновлены до стандарта DQS v2!');
            }
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>🔄 Выполнить полный пересчёт всей истории (DQS v2)</span>
        </button>
      </div>

      {/* DATA SECURITY & PHONE BACKUP CARD */}
      {(() => {
        const stats = getStorageStats();
        return (
          <div className="bg-[#111] rounded-2xl p-5 border border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Защита Данных & Бэкап в Память Телефона
              </h3>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                IndexedDB + Автосжатие
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              В приложении включено двухуровневое хранилище <strong>IndexedDB Engine</strong> без жестких лимитов браузера. Фотографии автоматически сжимаются до ~80-120 КБ при загрузке, сохраняя высокое качество и экономя место. Все ваши записи и фото надежно сохраняются годами при повторных заходах.
            </p>

            {/* Storage Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-white/[0.03] rounded-xl border border-white/5 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Дней в дневнике:</span>
                <span className="font-bold text-emerald-400">{stats.totalDays}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Фото блюд:</span>
                <span className="font-bold text-emerald-400">{stats.totalPhotos}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Объем хранилища:</span>
                <span className="font-bold text-emerald-400">{stats.approxSizeMB} МБ</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Статус защиты:</span>
                <span className="font-bold text-emerald-400">100% Активно</span>
              </div>
            </div>

            {/* Phone Backup Actions */}
            <div className="pt-1 space-y-2">
              <label className="text-xs font-bold text-slate-200 block">Резервная копия на устройство:</label>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadBackupFile}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <HardDrive className="w-4 h-4 fill-black" />
                  <span>Сохранить бэкап в память телефона</span>
                </button>

                <label className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs rounded-xl border border-white/10 shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Восстановить из файла бэкапа</span>
                  <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                </label>
              </div>
            </div>

            {importStatus && (
              <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                {importStatus}
              </p>
            )}
          </div>
        );
      })()}

      {/* DANGER ZONE / RESET ALL DATA */}
      <div className="bg-[#111] rounded-2xl p-5 border border-rose-500/20 shadow-lg space-y-3">
        <h3 className="font-bold text-rose-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" /> Очистить данные и Сбросить
        </h3>
        <p className="text-xs text-slate-400">
          Полностью удалит все записи дневника, отчёты и настройки, возвращая приложение к чистому старту.
        </p>

        <button
          onClick={onResetData}
          className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          🗑️ Полностью очистить все данные
        </button>
      </div>
    </div>
  );
};
