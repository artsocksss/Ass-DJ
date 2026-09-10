import React from 'react';
import { TransportState, Language, ThemeId } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { THEMES, ThemeConfig } from '../utils/theme';

interface TransportDeckProps {
  transport: TransportState;
  isRecording: boolean;
  lang: Language;
  theme?: ThemeId;
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
  theme = 'onyx',
  onPlayPause,
  onCue,
  onToggleSync,
  onToggleQuantize,
  onToggleRecord,
}) => {
  const isPlaying = transport.playbackState === 'playing';
  const t = TRANSLATIONS[lang];
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;

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
    <div 
      className="rounded-3xl p-3.5 flex flex-col gap-3 w-full border transition-all"
      style={{
        backgroundColor: themeConfig.bgPanel,
        borderColor: themeConfig.borderSubtle,
        boxShadow: `0 8px 24px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Primary Circular Deck Controls */}
      <div className="flex justify-around items-center px-1">
        {/* CUE Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onCue();
          }}
          className="w-14 h-14 sm:w-15 sm:h-15 rounded-full border-2 flex flex-col items-center justify-center font-space font-bold active:scale-95 transition-all text-xs tracking-wider"
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: '#FF9F0A',
            color: '#FF9F0A',
            boxShadow: '0 0 12px rgba(255, 159, 10, 0.25)',
          }}
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
          className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full flex items-center justify-center text-xl transition-all active:scale-95 select-none border-2"
          style={{
            backgroundColor: isPlaying ? themeConfig.accentSecondary : themeConfig.bgCard,
            color: isPlaying ? '#000000' : themeConfig.accentSecondary,
            borderColor: themeConfig.accentSecondary,
            boxShadow: isPlaying ? `0 0 24px ${themeConfig.accentSecondary}` : `0 0 12px ${themeConfig.accentSecondary}40`,
          }}
          aria-label={isPlaying ? t.pause : t.play}
        >
          {isPlaying ? (
            <span className="font-space text-base font-bold">❚❚</span>
          ) : (
            <span className="ml-0.5 text-2xl leading-none">▶</span>
          )}
        </button>

        {/* REC Button */}
        <button
          onClick={() => {
            triggerHaptic();
            onToggleRecord();
          }}
          className="w-14 h-14 sm:w-15 sm:h-15 rounded-full flex flex-col items-center justify-center text-xs font-space font-bold active:scale-95 transition-all tracking-wider select-none border-2"
          style={{
            backgroundColor: isRecording ? '#FF003C' : themeConfig.bgCard,
            color: isRecording ? '#FFFFFF' : '#FF003C',
            borderColor: '#FF003C',
            boxShadow: isRecording ? '0 0 20px rgba(255,0,60,0.8)' : '0 0 10px rgba(255,0,60,0.3)',
          }}
          aria-label="Record"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF003C] mb-0.5 shadow-[0_0_6px_#FF003C]" />
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
          className="flex-1 py-2 rounded-xl text-[11px] sm:text-xs font-space font-bold transition-all tracking-wide border"
          style={{
            backgroundColor: transport.bpm === 128 ? themeConfig.accent : themeConfig.bgCard,
            borderColor: transport.bpm === 128 ? themeConfig.accent : themeConfig.borderSubtle,
            color: transport.bpm === 128 ? '#000000' : 'rgba(255, 255, 255, 0.7)',
            boxShadow: transport.bpm === 128 ? `0 0 12px ${themeConfig.accentGlow}` : 'none',
          }}
        >
          {t.sync} (128)
        </button>
        <button
          onClick={() => {
            triggerHaptic();
            onToggleQuantize();
          }}
          className="flex-1 py-2 px-2 rounded-xl text-[10.5px] sm:text-xs font-space font-bold transition-all tracking-wide border flex items-center justify-center gap-1"
          style={{
            backgroundColor:
              transport.quantize === 'SMART'
                ? themeConfig.accent
                : transport.quantize !== 'OFF'
                ? themeConfig.accentTertiary
                : themeConfig.bgCard,
            borderColor:
              transport.quantize === 'SMART'
                ? themeConfig.accent
                : transport.quantize !== 'OFF'
                ? themeConfig.accentTertiary
                : themeConfig.borderSubtle,
            color: transport.quantize !== 'OFF' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
            boxShadow:
              transport.quantize === 'SMART'
                ? `0 0 16px ${themeConfig.accentGlow}`
                : transport.quantize !== 'OFF'
                ? `0 0 12px ${themeConfig.accentGlow}`
                : 'none',
          }}
          title={t.smartQuantizeDesc}
        >
          {transport.quantize === 'SMART' ? (
            <>
              <span>⚡</span>
              <span>SMART Q</span>
              <span className="text-[9px] opacity-85 ml-0.5">1/16•1/32</span>
            </>
          ) : (
            <span>
              {t.quantize}: {transport.quantize === 'OFF' ? t.quantizeOff : transport.quantize}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
