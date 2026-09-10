import React from 'react';
import { TransportState, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface TransportDeckProps {
  transport: TransportState;
  isRecording: boolean;
  lang: Language;
  onPlayPause: () => void;
  onCue: () => void;
  onToggleSync: () => void;
  onToggleQuantize: () => void;
  onToggleRecord: () => void;
}

export const TransportDeck: React.FC<TransportDeckProps> = ({
  transport,
  isRecording,
  lang,
  onPlayPause,
  onCue,
  onToggleSync,
  onToggleQuantize,
  onToggleRecord,
}) => {
  const isPlaying = transport.playbackState === 'playing';
  const t = TRANSLATIONS[lang];

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="bg-[#0B0B10] rounded-2xl p-3.5 flex flex-col gap-3 w-full border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
      {/* Primary Circular Deck Controls */}
      <div className="flex justify-around items-center px-1">
        {/* CUE Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onCue();
          }}
          className="w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-[#12121A] border-2 border-[#FF9F0A] text-[#FF9F0A] flex flex-col items-center justify-center font-space font-bold active:scale-95 transition-all text-xs tracking-wider shadow-[0_0_12px_rgba(255,159,10,0.35)] hover:bg-[#FF9F0A]/15 active:bg-[#FF9F0A] active:text-black"
          aria-label="CUE"
        >
          <span>{t.cue}</span>
        </button>

        {/* Big Main Play/Pause Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onPlayPause();
          }}
          className={`w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full flex items-center justify-center text-xl transition-all active:scale-95 select-none border-2 ${
            isPlaying
              ? 'bg-[#00FF66] text-black border-[#00FF66] shadow-[0_0_24px_rgba(0,255,102,0.7)] animate-pulse'
              : 'bg-[#12121A] text-[#00FF66] border-[#00FF66] shadow-[0_0_14px_rgba(0,255,102,0.35)] hover:bg-[#00FF66]/20'
          }`}
          aria-label={isPlaying ? t.pause : t.play}
        >
          {isPlaying ? (
            <span className="font-space text-lg font-bold">❚❚</span>
          ) : (
            <span className="ml-1 text-2xl leading-none">▶</span>
          )}
        </button>

        {/* REC Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onToggleRecord();
          }}
          className={`w-14 h-14 sm:w-15 sm:h-15 rounded-full flex flex-col items-center justify-center text-xs font-space font-bold active:scale-95 transition-all tracking-wider select-none border-2 ${
            isRecording
              ? 'bg-[#FF003C] text-white border-[#FF003C] shadow-[0_0_20px_rgba(255,0,60,0.8)] animate-ping'
              : 'bg-[#12121A] text-white/80 border-[#FF003C]/70 shadow-[0_0_10px_rgba(255,0,60,0.3)] hover:bg-[#FF003C]/15'
          }`}
          aria-label="Record"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF003C] mb-0.5 shadow-[0_0_6px_#FF003C]" />
          <span className="text-[10px] text-[#FF003C]">{t.rec}</span>
        </button>
      </div>

      {/* Utility Pill Toggles */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            triggerHaptic();
            onToggleSync();
          }}
          className={`flex-1 py-2 rounded-xl text-[11px] sm:text-xs font-space font-bold transition-all tracking-wide border ${
            transport.bpm === 128
              ? 'bg-[#00F0FF] text-black border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-[#12121A] text-white/70 border-white/15 hover:border-[#00F0FF] hover:text-[#00F0FF]'
          }`}
        >
          {t.sync} (128)
        </button>
        <button
          onClick={() => {
            triggerHaptic();
            onToggleQuantize();
          }}
          className={`flex-1 py-2 rounded-xl text-[11px] sm:text-xs font-space font-bold transition-all tracking-wide border ${
            transport.quantize !== 'OFF'
              ? 'bg-[#C77DFF] text-black border-[#C77DFF] shadow-[0_0_12px_rgba(199,125,255,0.4)]'
              : 'bg-[#12121A] text-white/70 border-white/15 hover:border-[#C77DFF] hover:text-[#C77DFF]'
          }`}
        >
          {t.quantize}: {transport.quantize === 'OFF' ? t.quantizeOff : transport.quantize}
        </button>
      </div>
    </div>
  );
};
