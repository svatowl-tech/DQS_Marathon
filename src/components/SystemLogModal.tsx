import React, { useEffect, useState } from 'react';
import { logger, LogEntry, LogLevel, LogCategory } from '../utils/logger';
import { toast } from '../utils/toast';
import {
  X,
  Copy,
  Download,
  Trash2,
  Terminal,
  Search,
  Filter,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  Bug,
  HardDrive,
  Cpu,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface SystemLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemLogModal: React.FC<SystemLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const diagnostics = logger.getDiagnosticSummary();

  useEffect(() => {
    if (!isOpen) return;
    return logger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (selectedLevel !== 'all' && log.level !== selectedLevel) return false;
    if (selectedCategory !== 'all' && log.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchCat = log.category.toLowerCase().includes(q);
      const matchDet = log.details ? JSON.stringify(log.details).toLowerCase().includes(q) : false;
      return matchMsg || matchCat || matchDet;
    }
    return true;
  });

  const handleCopyReport = () => {
    const report = logger.exportDiagnosticReport();
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      toast.success('Отчёт скопирован!', 'Системный отчёт об ошибках и логах сохранён в буфер обмена.');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error('Не удалось скопировать', 'Попробуйте выгрузить файл отчёта.');
    });
  };

  const handleDownloadReport = () => {
    const report = logger.exportDiagnosticReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dqs_diagnostic_log_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Файл логов скачан!');
  };

  const handleClearLogs = () => {
    if (confirm('Очистить весь журнал логов системной диагностики?')) {
      logger.clearLogs();
      toast.info('Журнал логов очищен');
    }
  };

  const categoriesList: LogCategory[] = [
    'Storage',
    'Sync',
    'UI',
    'Image',
    'Calculation',
    'Auth',
    'System',
    'Network',
  ];

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans animate-in fade-in">
      <div className="bg-[#121215] border border-white/15 rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Журнал диагностики и ошибок
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                  {filteredLogs.length} логов
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Мониторинг работы системы, хранилища, ошибок и синхронизации
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Diagnostics Info Bar */}
        <div className="px-4 py-3 bg-zinc-900/60 border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] shrink-0 font-mono">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{diagnostics.time}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{diagnostics.storageUsage}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">{diagnostics.windowDimensions}</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-rose-400">Ошибок: {diagnostics.errorsCount}</span>
            <span className="text-amber-400 ml-1">Предупр.: {diagnostics.warningsCount}</span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-3 sm:p-4 bg-black/20 border-b border-white/10 flex flex-wrap gap-2.5 items-center justify-between shrink-0">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[160px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по сообщениям..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Filter by Level */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as LogLevel | 'all')}
              className="bg-zinc-900 border border-white/10 text-xs text-zinc-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="all">Все уровни</option>
              <option value="error">❌ Ошибки (error)</option>
              <option value="warn">⚠️ Предупреждения (warn)</option>
              <option value="info">ℹ️ Инфо (info)</option>
              <option value="debug">🔍 Отладка (debug)</option>
            </select>

            {/* Filter by Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as LogCategory | 'all')}
              className="bg-zinc-900 border border-white/10 text-xs text-zinc-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="all">Все категории</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-white/10 cursor-pointer transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано!' : 'Скопировать'}</span>
            </button>

            <button
              onClick={handleDownloadReport}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать TXT</span>
            </button>

            <button
              onClick={handleClearLogs}
              title="Очистить логи"
              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl cursor-pointer transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Logs Feed List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 bg-[#0d0d0f] font-mono">
          {filteredLogs.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <Terminal className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-500">В журнале нет подходящих записей</p>
            </div>
          ) : (
            filteredLogs.slice().reverse().map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className={`rounded-2xl p-3 border transition-all cursor-pointer ${
                    log.level === 'error'
                      ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                      : log.level === 'warn'
                      ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                      : 'bg-zinc-900/60 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      {/* Level Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase shrink-0 ${
                          log.level === 'error'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : log.level === 'warn'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : log.level === 'debug'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {log.level}
                      </span>

                      {/* Category Badge */}
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-[10px] shrink-0">
                        {log.category}
                      </span>

                      {/* Timestamp */}
                      <span className="text-zinc-500 text-[11px] shrink-0">{log.formattedTime}</span>
                    </div>

                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {isExpanded ? 'Свернуть ▲' : 'Детали ▼'}
                    </span>
                  </div>

                  {/* Main Message */}
                  <div className="mt-2 text-xs font-sans text-zinc-100 font-medium break-words leading-relaxed">
                    {log.message}
                  </div>

                  {/* Expanded Stack or Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-2 border-t border-white/10 space-y-2 text-[11px] font-mono text-zinc-300">
                      {log.details && (
                        <div>
                          <span className="text-zinc-500 block mb-0.5 font-bold">Детали события:</span>
                          <pre className="bg-black/70 p-2.5 rounded-xl border border-white/10 overflow-x-auto text-[10px] text-emerald-300 leading-normal">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.stack && (
                        <div>
                          <span className="text-rose-400 block mb-0.5 font-bold">Стек ошибки:</span>
                          <pre className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30 overflow-x-auto text-[10px] text-rose-300 leading-normal">
                            {log.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-zinc-900 border-t border-white/10 text-[11px] text-zinc-400 flex items-center justify-between">
          <span>Все ошибки автоматически фиксируются в режиме реального времени</span>
          <button
            onClick={() => {
              logger.info('System', 'Пользователь вручную обновил список логов');
              toast.info('Список обновлён');
            }}
            className="flex items-center gap-1 text-emerald-400 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Обновить</span>
          </button>
        </div>
      </div>
    </div>
  );
};
