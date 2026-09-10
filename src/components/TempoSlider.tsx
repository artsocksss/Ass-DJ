import React from 'react';
import { Language, ThemeId } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { THEMES, ThemeConfig } from '../utils/theme';

interface TempoSliderProps {
  pitchBend: number; // in semitones (-12 to +12)
  lang: Language;
  theme?: ThemeId;
  onPitchChange: (pitch: number) => void;
  onResetPitch: () => void;
}

export const TempoSlider: React.FC<TempoSliderProps> = ({
  pitchBend,
  lang,
  theme = 'onyx',
  onPitchChange,
  onResetPitch,
}) => {
  const t = TRANSLATIONS[lang];
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(8);
      }
    } catch {
      // ignore
    }
  };

  const handleStep = (delta: number) => {
    triggerHaptic();
    const nextVal = Math.max(-12, Math.min(12, Math.round(pitchBend + delta)));
    onPitchChange(nextVal);
  };

  return (
    <div 
      className="rounded-3xl p-4 flex flex-col gap-3.5 w-full border transition-all"
      style={{
        backgroundColor: themeConfig.bgPanel,
        borderColor: themeConfig.borderSubtle,
        boxShadow: `0 8px 24px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-white font-bold font-space text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span>{t.pitchBend}</span>
          </span>
          <span className="text-[10px] text-white/40 font-space">
            {t.pitchSemitones}
          </span>
        </div>
        <button
          onClick={() => {
            triggerHaptic();
            onResetPitch();
          }}
          className="text-[10px] font-space font-bold text-white/70 hover:text-white px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-xl active:scale-95 transition-all border border-white/10"
        >
          {t.pitchReset}
        </button>
      </div>

      {/* Main Pitch Slider */}
      <div 
        className="flex flex-col gap-2 p-3 rounded-2xl border transition-all"
        style={{
          backgroundColor: themeConfig.bgCard,
          borderColor: themeConfig.borderSubtle,
        }}
      >
        <div className="flex justify-between items-center text-xs font-space font-bold">
          <span className="text-white/40 font-mono text-[10px]">-12 st</span>
          <span 
            className="text-base font-bold font-mono px-3 py-0.5 rounded-xl border"
            style={{
              backgroundColor: `${themeConfig.accent}15`,
              borderColor: `${themeConfig.accent}40`,
              color: themeConfig.accent,
            }}
          >
            {pitchBend > 0 ? `+${pitchBend}` : pitchBend} {t.pitchSemitonesUnit}
          </span>
          <span className="text-white/40 font-mono text-[10px]">+12 st</span>
        </div>

        <input
          type="range"
          min={-12}
          max={12}
          step={1}
          value={pitchBend}
          onChange={(e) => onPitchChange(parseInt(e.target.value, 10))}
          className="w-full"
          style={{ accentColor: themeConfig.accent }}
        />

        {/* Step Buttons */}
        <div className="flex justify-between gap-1 pt-1">
          {[-12, -7, -1, 0, 1, 7, 12].map((st) => (
            <button
              key={st}
              onClick={() => {
                triggerHaptic();
                onPitchChange(st);
              }}
              className="flex-1 py-1 rounded-lg text-[9px] font-mono font-bold transition-all border"
              style={{
                backgroundColor: pitchBend === st ? themeConfig.accent : 'rgba(255, 255, 255, 0.05)',
                borderColor: pitchBend === st ? themeConfig.accent : 'rgba(255, 255, 255, 0.08)',
                color: pitchBend === st ? '#000000' : 'rgba(255, 255, 255, 0.6)',
              }}
            >
              {st > 0 ? `+${st}` : st}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
