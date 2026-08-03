import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Key,
  PlusCircle,
  AlertCircle,
  Cloud,
  CloudUpload,
  CloudDownload,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { UserSettings, DailyLogEntry, WeeklySundayReport } from '../types';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
  createDqsGoogleSheet,
  syncLogsToGoogleSheet,
} from '../utils/googleSheetsService';
import {
  saveAppDataToDrive,
  loadAppDataFromDrive,
} from '../utils/googleDriveSyncService';
import { loadDailyLogs, loadSettings, loadSundayReports } from '../utils/storage';

interface Props {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  logs: DailyLogEntry[];
  onReloadAppData?: () => void;
}

export const GoogleSheetsSyncCard: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  logs,
  onReloadAppData,
}) => {
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [customSheetInput, setCustomSheetInput] = useState<string>(settings.googleSheetId || '');

  useEffect(() => {
    const unsubscribe = initAuth((user, accessToken) => {
      setGoogleUser(user);
      setToken(accessToken);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setStatusMessage('Авторизация через Google...');
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setToken(result.accessToken);
        setStatusMessage('Успешный вход в Google аккаунт!');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Ошибка авторизации: ${err.message || 'Сбой входа'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await googleSignOut();
      setGoogleUser(null);
      setToken(null);
      setStatusMessage('Вы вышли из Google аккаунта');
    } catch (err: any) {
      setStatusMessage(`Ошибка при выходе: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Google Drive Cloud Upload
  const handleCloudUpload = async () => {
    let currentToken = token || getAccessToken();
    if (!currentToken) {
      const res = await handleSignIn();
      currentToken = getAccessToken();
    }
    if (!currentToken) {
      setStatusMessage('Необходима авторизация Google');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('Сохранение данных и фото на Google Диск...');
      const { modifiedTime } = await saveAppDataToDrive(currentToken);
      const timeStr = new Date(modifiedTime).toLocaleString('ru-RU');
      
      onUpdateSettings({
        ...settings,
        lastCloudSyncTime: timeStr,
      });

      setStatusMessage(`Данные успешно сохранены на Google Диск! (${timeStr})`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Ошибка загрузки на Google Диск: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Google Drive Cloud Download / Restore
  const handleCloudDownload = async () => {
    let currentToken = token || getAccessToken();
    if (!currentToken) {
      await handleSignIn();
      currentToken = getAccessToken();
    }
    if (!currentToken) {
      setStatusMessage('Необходима авторизация Google');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('Загрузка данных с Google Диска...');
      const result = await loadAppDataFromDrive(currentToken);

      if (!result.success) {
        setStatusMessage('Файл бэкапа не найден в вашем Google Диске.');
        return;
      }

      const timeStr = result.modifiedTime
        ? new Date(result.modifiedTime).toLocaleString('ru-RU')
        : new Date().toLocaleString('ru-RU');

      if (onReloadAppData) {
        onReloadAppData();
      }

      setStatusMessage(`Данные успешно синхронизированы с Google Диска! (${timeStr})`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Ошибка синхронизации: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCloudSync = async (enabled: boolean) => {
    const updated = { ...settings, cloudSyncEnabled: enabled };
    onUpdateSettings(updated);

    if (enabled) {
      setStatusMessage('Облачная синхронизация включена!');
      // Trigger initial upload if token exists
      const currentToken = token || getAccessToken();
      if (currentToken) {
        handleCloudUpload();
      } else {
        handleSignIn();
      }
    } else {
      setStatusMessage('Облачная синхронизация отключена.');
    }
  };

  const handleCreateNewSheet = async () => {
    let currentToken = token || getAccessToken();
    if (!currentToken) {
      await handleSignIn();
      currentToken = getAccessToken();
    }
    if (!currentToken) {
      setStatusMessage('Сначала авторизуйтесь через Google');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('Создаём Google Таблицу DQS...');
      const { id, url } = await createDqsGoogleSheet(currentToken);

      onUpdateSettings({ ...settings, googleSheetId: id });
      setCustomSheetInput(id);

      setStatusMessage('Выполняется синхронизация записей...');
      const count = await syncLogsToGoogleSheet(id, logs, currentToken);
      setStatusMessage(`Успешно! Создана Google Таблица и выгружено ${count} дней.`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Ошибка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSheetsNow = async () => {
    const sheetId = extractSpreadsheetId(customSheetInput);
    if (!sheetId) {
      setStatusMessage('Укажите ID или ссылку на Google Таблицу');
      return;
    }

    let currentToken = token || getAccessToken();
    if (!currentToken) {
      await handleSignIn();
      currentToken = getAccessToken();
    }
    if (!currentToken) {
      setStatusMessage('Необходима авторизация Google');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('Синхронизация данных с Google Таблицей...');
      const count = await syncLogsToGoogleSheet(sheetId, logs, currentToken);

      onUpdateSettings({ ...settings, googleSheetId: sheetId });
      setStatusMessage(`Успешно выгружено ${count} дней в Google Таблицу!`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Ошибка выгрузки: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const extractSpreadsheetId = (input: string): string => {
    if (!input) return '';
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return input.trim();
  };

  const currentSheetId = extractSpreadsheetId(settings.googleSheetId || customSheetInput);
  const sheetUrl = currentSheetId ? `https://docs.google.com/spreadsheets/d/${currentSheetId}` : null;

  return (
    <div className="bg-[#111] rounded-2xl p-5 border border-emerald-500/30 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <Cloud className="w-5 h-5 text-sky-400" /> Интеграция Google (Диск & Таблицы)
        </h3>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1 font-mono">
          {googleUser ? '✓ Авторизован' : 'Google OAuth'}
        </span>
      </div>

      {/* Google User Status / Auth Button */}
      {googleUser ? (
        <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-200 font-bold block">
                {googleUser.displayName || 'Пользователь Google'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {googleUser.email}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="px-3 py-1.5 bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 font-bold rounded-lg transition-all flex items-center gap-1.5 text-[11px] cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Выйти
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs gap-3">
          <div className="flex items-center gap-2.5 text-slate-300">
            <Key className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-200 block">Подключите Google Аккаунт</span>
              <span className="text-[11px] text-slate-400">
                Для автоматической синхронизации дневника между всеми устройствами
              </span>
            </div>
          </div>
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Войти через Google
          </button>
        </div>
      )}

      {/* SECTION 1: GOOGLE DRIVE CLOUD SYNC OPTION */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-sky-400" />
            <label htmlFor="cloud-sync-toggle" className="text-xs font-bold text-slate-100 cursor-pointer">
              Опция: Облачная синхронизация (Google Диск)
            </label>
          </div>

          {/* Toggle Switch */}
          <button
            id="cloud-sync-toggle"
            role="switch"
            aria-checked={!!settings.cloudSyncEnabled}
            onClick={() => handleToggleCloudSync(!settings.cloudSyncEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
              settings.cloudSyncEnabled ? 'bg-sky-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                settings.cloudSyncEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          При включении ваш дневник, фото блюд и настройки параллельно сохраняются в закрытом файле на вашем Google Диске. При входе на другом устройстве вы можете легко загрузить данные.
        </p>

        {settings.lastCloudSyncTime && (
          <div className="text-[10px] font-mono text-sky-300 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Последняя синхронизация: {settings.lastCloudSyncTime}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={handleCloudUpload}
            disabled={loading}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <CloudUpload className="w-4 h-4" />
            <span>Сохранить на Google Диск</span>
          </button>

          <button
            onClick={handleCloudDownload}
            disabled={loading}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <CloudDownload className="w-4 h-4" />
            <span>Загрузить с Google Диска</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: GOOGLE SHEETS DQS MARATHON EXPORT */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs text-slate-200 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Экспорт в Google Таблицу (DQS Марафон)
          </h4>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] text-slate-300 block font-medium">
            Ссылка или ID Google Таблицы:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Вставьте ссылку https://docs.google.com/spreadsheets/d/..."
              value={customSheetInput}
              onChange={(e) => setCustomSheetInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-100 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-emerald-400 rounded-xl border border-white/10 flex items-center gap-1 text-xs font-bold transition-all shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Открыть
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={handleCreateNewSheet}
            disabled={loading}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4 fill-black text-emerald-500" />
            <span>Создать DQS Таблицу</span>
          </button>

          <button
            onClick={handleSyncSheetsNow}
            disabled={loading || !customSheetInput}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Выгрузить строки в Таблицу</span>
          </button>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 flex items-center gap-2 animate-fadeIn font-mono">
          <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
};

