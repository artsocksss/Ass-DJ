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
      // Ignore vibration error on unsupported platforms
    }
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 flex flex-col gap-3 w-full border-2 border-[#111113] shadow-[0_2px_0_#111113]">
      {/* Primary Circular Deck Controls */}
      <div className="flex justify-around items-center px-1">
        {/* CUE Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onCue();
          }}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#F8F7F4] border-2 border-[#111113] text-[#111113] flex flex-col items-center justify-center font-space font-bold active:scale-95 transition-all text-xs tracking-wider shadow-[0_2px_0_#111113] hover:bg-[#FAF9F5]"
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
          className={`w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full flex items-center justify-center text-xl transition-all active:scale-95 select-none border-2 border-[#111113] ${
            isPlaying
              ? 'bg-[#111113] text-[#F8F7F4] shadow-[0_2px_0_#111113]'
              : 'bg-[#E94E38] text-white shadow-[0_2px_0_#111113]'
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
          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center text-xs font-space font-bold active:scale-95 transition-all tracking-wider select-none border-2 border-[#111113] shadow-[0_2px_0_#111113] ${
            isRecording
              ? 'bg-[#E94E38] text-white animate-pulse'
              : 'bg-[#F8F7F4] text-[#111113] hover:bg-[#FAF9F5]'
          }`}
          aria-label="Record"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#E94E38] mb-0.5" />
          <span className="text-[10px]">{t.rec}</span>
        </button>
      </div>

      {/* Utility Pill Toggles */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            triggerHaptic();
            onToggleSync();
          }}
          className={`flex-1 py-2 rounded-xl text-[11px] sm:text-xs font-space font-bold transition-all tracking-wide border-2 border-[#111113] ${
            transport.bpm === 128
              ? 'bg-[#111113] text-white shadow-[0_2px_0_#111113]'
              : 'bg-[#F8F7F4] text-[#111113] hover:bg-[#FAF9F5]'
          }`}
        >
          {t.sync} (128)
        </button>
        <button
          onClick={() => {
            triggerHaptic();
            onToggleQuantize();
          }}
          className={`flex-1 py-2 rounded-xl text-[11px] sm:text-xs font-space font-bold transition-all tracking-wide border-2 border-[#111113] ${
            transport.quantize !== 'OFF'
              ? 'bg-[#111113] text-white shadow-[0_2px_0_#111113]'
              : 'bg-[#F8F7F4] text-[#111113] hover:bg-[#FAF9F5]'
          }`}
        >
          {t.quantize}: {transport.quantize === 'OFF' ? t.quantizeOff : transport.quantize}
        </button>
      </div>
    </div>
  );
};
