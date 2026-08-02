import React from 'react';
import { Globe, RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { NetworkTimeInfo, formatFullRuDate } from '../utils/timeZoneService';

interface TimeSyncBarProps {
  netTimeInfo: NetworkTimeInfo;
  isSyncing: boolean;
  onManualSync: () => void;
  dayChangeAlert?: string | null;
  onDismissAlert?: () => void;
}

export const TimeSyncBar: React.FC<TimeSyncBarProps> = ({
  netTimeInfo,
  isSyncing,
  onManualSync,
  dayChangeAlert,
  onDismissAlert,
}) => {
  return (
    <div className="space-y-2 mb-4">
      {/* Auto Day Change Alert Banner if midnight rollover occurred */}
      {dayChangeAlert && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-300 animate-fade-in shadow-lg shadow-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Автоматическая смена дня!</p>
              <p className="text-[11px] text-emerald-200/90">{dayChangeAlert}</p>
            </div>
          </div>
          {onDismissAlert && (
            <button
              onClick={onDismissAlert}
              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-semibold text-[11px] transition-all cursor-pointer"
            >
              Понятно
            </button>
          )}
        </div>
      )}

      {/* Subtle Timezone & Internet Time Bar */}
      <div className="bg-[#111115] border border-white/[0.08] rounded-2xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium text-zinc-200">
            <Globe className={`w-3.5 h-3.5 ${netTimeInfo.isInternetSynced ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="font-semibold text-white">{netTimeInfo.timeZone}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
              UTC{netTimeInfo.utcOffset}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>{netTimeInfo.timeStr}</span>
            <span>•</span>
            <span className="text-zinc-300">{formatFullRuDate(netTimeInfo.dateStr)}</span>
          </div>

          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Автосмена дня активна
          </span>
        </div>

        <button
          onClick={onManualSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 px-2.5 py-1 rounded-xl border border-white/10 transition-all cursor-pointer disabled:opacity-50"
          title="Синхронизировать точное время и таймзону из интернета"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{isSyncing ? 'Синхронизация...' : 'Обновить время'}</span>
        </button>
      </div>
    </div>
  );
};
