import React from 'react';
import { TransportState } from '../types';

interface TransportDeckProps {
  transport: TransportState;
  isRecording: boolean;
  onPlayPause: () => void;
  onCue: () => void;
  onToggleSync: () => void;
  onToggleQuantize: () => void;
  onToggleMasterTempo: () => void;
  onToggleRecord: () => void;
}

export const TransportDeck: React.FC<TransportDeckProps> = ({
  transport,
  isRecording,
  onPlayPause,
  onCue,
  onToggleSync,
  onToggleQuantize,
  onToggleMasterTempo,
  onToggleRecord,
}) => {
  const isPlaying = transport.playbackState === 'playing';

  return (
    <div
      id="pioneer-transport-deck"
      className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-3 bg-[#101218] border border-neutral-800 rounded-2xl shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)]"
    >
      {/* Left: Classic Pioneer Circular CUE & PLAY/PAUSE Buttons */}
      <div className="flex items-center gap-3.5">
        {/* CUE Button */}
        <button
          id="btn-transport-cue"
          type="button"
          onClick={onCue}
          className="group relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-[#22252e] to-[#12141a] border-2 border-[#ff9f0a] shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.2)] active:scale-95 active:shadow-[0_1px_4px_rgba(0,0,0,0.8),inset_0_2px_6px_rgba(0,0,0,0.8)] transition-all duration-75 cursor-pointer touch-manipulation"
        >
          <div className="absolute inset-1 rounded-full border border-amber-500/30 pointer-events-none" />
          <span className="text-xs sm:text-sm font-black tracking-widest text-[#ff9f0a] drop-shadow-[0_0_8px_rgba(255,159,10,0.8)]">
            CUE
          </span>
          <span className="text-[9px] font-mono text-neutral-400 -mt-0.5">RESET</span>
        </button>

        {/* PLAY / PAUSE Button */}
        <button
          id="btn-transport-play"
          type="button"
          onClick={onPlayPause}
          className={`group relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-[#22252e] to-[#12141a] border-2 ${
            isPlaying
              ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6),inset_0_1px_2px_rgba(255,255,255,0.3)]'
              : 'border-emerald-600/70 shadow-[0_4px_12px_rgba(0,0,0,0.6)]'
          } active:scale-95 transition-all duration-75 cursor-pointer touch-manipulation`}
        >
          <div
            className={`absolute inset-1 rounded-full border ${
              isPlaying ? 'border-emerald-400/50 animate-ping' : 'border-emerald-500/20'
            } pointer-events-none`}
          />
          <div className="flex items-center justify-center">
            {isPlaying ? (
              <span className="text-base sm:text-lg text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]">
                ❚❚
              </span>
            ) : (
              <span className="text-base sm:text-lg text-emerald-400 font-bold ml-0.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]">
                ▶
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono font-bold tracking-wider text-emerald-400 -mt-0.5">
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </span>
        </button>
      </div>

      {/* Right: DJ Utility Buttons (SYNC, QUANTIZE, MASTER TEMPO, REC) */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* SYNC Button */}
        <button
          id="btn-transport-sync"
          type="button"
          onClick={onToggleSync}
          className="flex flex-col items-center justify-center px-3.5 py-2 rounded-xl bg-[#171a22] border border-blue-500/50 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-xs font-black tracking-wider text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.8)]">
            SYNC
          </span>
          <span className="text-[9px] font-mono text-neutral-400">BEAT LOCK</span>
        </button>

        {/* QUANTIZE Button */}
        <button
          id="btn-transport-quantize"
          type="button"
          onClick={onToggleQuantize}
          className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl border transition-all cursor-pointer ${
            transport.quantize !== 'OFF'
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-[#171a22] border-neutral-700'
          } active:scale-95`}
        >
          <span
            className={`text-xs font-black tracking-wider ${
              transport.quantize !== 'OFF' ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'text-neutral-400'
            }`}
          >
            QUANTIZE
          </span>
          <span className="text-[9px] font-mono text-neutral-400">{transport.quantize}</span>
        </button>

        {/* MASTER TEMPO (Key Lock) */}
        <button
          id="btn-transport-master-tempo"
          type="button"
          onClick={onToggleMasterTempo}
          className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl border transition-all cursor-pointer ${
            transport.masterTempo
              ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : 'bg-[#171a22] border-neutral-700'
          } active:scale-95`}
        >
          <span
            className={`text-xs font-black tracking-wider ${
              transport.masterTempo ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]' : 'text-neutral-400'
            }`}
          >
            MT LOCK
          </span>
          <span className="text-[9px] font-mono text-neutral-400">PITCH LOCK</span>
        </button>

        {/* REC / LIVE OVERDUB */}
        <button
          id="btn-transport-rec"
          type="button"
          onClick={onToggleRecord}
          className={`flex flex-col items-center justify-center px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
            isRecording
              ? 'bg-red-950/60 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse'
              : 'bg-[#171a22] border-neutral-700 hover:border-red-500/50'
          } active:scale-95`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRecording ? 'bg-red-500 animate-ping' : 'bg-red-600'
              }`}
            />
            <span
              className={`text-xs font-black tracking-wider ${
                isRecording ? 'text-red-400' : 'text-neutral-300'
              }`}
            >
              REC
            </span>
          </div>
          <span className="text-[9px] font-mono text-neutral-400">OVERDUB</span>
        </button>
      </div>
    </div>
  );
};
