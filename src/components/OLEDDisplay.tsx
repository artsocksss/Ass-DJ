import React from 'react';
import { TransportState, Language, ThemeId } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { THEMES, ThemeConfig } from '../utils/theme';
import { WaveformVisualizer } from './WaveformVisualizer';
import { ClubVUMeter } from './ClubVUMeter';

interface OLEDDisplayProps {
  transport: TransportState;
  bankName: string;
  lang: Language;
  theme?: ThemeId;
  onTapTempo: () => void;
  onBpmChange: (bpm: number) => void;
}

export const OLEDDisplay: React.FC<OLEDDisplayProps> = ({
  transport,
  bankName,
  lang,
  theme = 'onyx',
  onTapTempo,
  onBpmChange,
}) => {
  const t = TRANSLATIONS[lang];
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;

  return (
    <div 
      className="flex flex-col gap-2.5 rounded-3xl p-3 border transition-all"
      style={{
        backgroundColor: themeConfig.bgPanel,
        borderColor: themeConfig.borderSubtle,
        boxShadow: `0 8px 24px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Top Row: BPM, Key & Bank Status */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-white/50 text-[10px] font-bold font-space uppercase tracking-widest">
              {t.tempo}
            </span>
            <span 
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold font-space rounded-full border transition-all"
              style={{
                backgroundColor: `${themeConfig.accent}12`,
                borderColor: `${themeConfig.accent}35`,
                color: themeConfig.accent,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: themeConfig.accent }} />
              {bankName}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span 
              className="text-3xl sm:text-4xl font-bold tracking-tight font-space transition-all"
              style={{
                color: themeConfig.accent,
                textShadow: `0 0 16px ${themeConfig.accentGlow}`,
              }}
            >
              {transport.bpm.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-white/40 font-space uppercase tracking-wider">
              {t.bpm}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-white/40 text-[10px] font-bold font-space uppercase tracking-widest mb-0.5">
            {t.key}
          </span>
          <span 
            className="text-sm sm:text-base font-bold font-space px-2.5 py-0.5 rounded-xl border transition-all"
            style={{
              backgroundColor: `${themeConfig.accentTertiary}15`,
              borderColor: `${themeConfig.accentTertiary}40`,
              color: themeConfig.accentTertiary,
            }}
          >
            {transport.key}
          </span>
        </div>
      </div>

      {/* Middle Row: BPM Step Controls, Tap Tempo & Bar Counter */}
      <div className="flex items-center justify-between gap-2">
        <div 
          className="flex items-center gap-1 rounded-full p-1 border"
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderSubtle,
          }}
        >
          <button
            onClick={() => onBpmChange(transport.bpm - 1)}
            className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold active:scale-95 transition-all text-white hover:bg-white/20"
            aria-label="Decrease BPM"
          >
            -
          </button>
          <button
            onClick={onTapTempo}
            className="px-3 py-1 text-[11px] font-bold font-space active:scale-95 transition-all tracking-wider uppercase rounded-full"
            style={{
              color: themeConfig.accent,
              backgroundColor: `${themeConfig.accent}15`,
            }}
          >
            {t.tap}
          </button>
          <button
            onClick={() => onBpmChange(transport.bpm + 1)}
            className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold active:scale-95 transition-all text-white hover:bg-white/20"
            aria-label="Increase BPM"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div 
            className="flex items-baseline gap-1.5 font-space tracking-tight px-3 py-1.5 rounded-full border"
            style={{
              backgroundColor: themeConfig.bgCard,
              borderColor: themeConfig.borderSubtle,
            }}
          >
            <span className="text-white/40 text-[10px] uppercase font-bold">{t.bar}</span>
            <span 
              className="text-sm font-bold font-mono"
              style={{ color: themeConfig.accentSecondary }}
            >
              {String(transport.currentBar).padStart(2, '0')}
            </span>
            <span className="text-white/20">:</span>
            <span 
              className="text-sm font-bold font-mono"
              style={{ color: themeConfig.accentTertiary }}
            >
              {transport.currentBeat}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Web Audio AnalyserNode Waveform Visualizer */}
      <WaveformVisualizer lang={lang} theme={theme} />

      {/* High-FPS GPU-Accelerated Club Stereo VU Meter */}
      <ClubVUMeter theme={theme} />
    </div>
  );
};
