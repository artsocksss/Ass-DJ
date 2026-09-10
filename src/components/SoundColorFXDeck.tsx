import React from 'react';
import { EQState, FXState, FXType, Language, ThemeId, PerformanceMacroState, MacroProfile } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { THEMES, ThemeConfig } from '../utils/theme';
import { PerformanceMacros } from './PerformanceMacros';

interface SoundColorFXDeckProps {
  fxState: FXState;
  eqState: EQState;
  macroState: PerformanceMacroState;
  masterVolume: number;
  lang: Language;
  theme?: ThemeId;
  onFXChange: (fx: Partial<FXState>) => void;
  onEQChange: (eq: Partial<EQState>) => void;
  onMacroChange: (val: number, profile?: MacroProfile, latch?: boolean) => void;
  onDropTrigger: () => void;
  onMasterVolumeChange: (vol: number) => void;
}

export const SoundColorFXDeck: React.FC<SoundColorFXDeckProps> = ({
  fxState,
  eqState,
  macroState,
  masterVolume,
  lang,
  theme = 'onyx',
  onFXChange,
  onEQChange,
  onMacroChange,
  onDropTrigger,
  onMasterVolumeChange,
}) => {
  const t = TRANSLATIONS[lang];
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;

  const fxList: { id: FXType }[] = [
    { id: 'FILTER' },
    { id: 'CRUSH' },
    { id: 'ECHO' },
    { id: 'SPACE' },
    { id: 'NOISE' },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Performance Macros: Single-Gesture Multi-Parameter Build-Up & Drop Engine */}
      <PerformanceMacros
        macroState={macroState}
        lang={lang}
        theme={theme}
        onMacroChange={onMacroChange}
        onDropTrigger={onDropTrigger}
      />

      <div 
        className="rounded-3xl p-4 flex flex-col gap-4 w-full border transition-all"
        style={{
          backgroundColor: themeConfig.bgPanel,
          borderColor: themeConfig.borderSubtle,
          boxShadow: `0 8px 24px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Sound Color FX Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <span className="text-white font-bold font-space text-xs uppercase tracking-wider">
            {t.colorFx}
          </span>
          <span 
            className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg border"
            style={{
              backgroundColor: `${themeConfig.accent}15`,
              borderColor: `${themeConfig.accent}40`,
              color: themeConfig.accent,
            }}
          >
            {fxState.param > 0 ? `+${(fxState.param * 100).toFixed(0)}%` : `${(fxState.param * 100).toFixed(0)}%`}
          </span>
        </div>

        <div 
          className="grid grid-cols-5 gap-1 p-1 rounded-2xl border"
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderSubtle,
          }}
        >
          {fxList.map(({ id: fx }) => {
            const isActive = fxState.activeFX === fx;
            return (
              <button
                key={fx}
                onClick={() => onFXChange({ activeFX: fx })}
                className="py-2 text-[10px] sm:text-[11px] font-space font-bold rounded-xl transition-all text-center truncate px-0.5 border"
                style={{
                  backgroundColor: isActive ? themeConfig.accent : 'transparent',
                  borderColor: isActive ? themeConfig.accent : 'transparent',
                  color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.6)',
                  boxShadow: isActive ? `0 0 10px ${themeConfig.accentGlow}` : 'none',
                }}
              >
                {t.fxTypes[fx]}
              </button>
            );
          })}
        </div>

        <div className="pt-0.5 flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/40">-100%</span>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={fxState.param}
            onChange={(e) => onFXChange({ param: parseFloat(e.target.value) })}
            className="flex-1 accent-cyan-400"
            style={{ accentColor: themeConfig.accent }}
          />
          <span className="text-[10px] font-mono text-white/40">+100%</span>
        </div>
      </div>

      {/* 3-Band Isolator EQ Section */}
      <div className="flex flex-col gap-2.5 pt-3 border-t" style={{ borderColor: themeConfig.borderSubtle }}>
        <span className="text-white font-bold font-space text-xs uppercase tracking-wider">
          {t.threeBandEq}
        </span>
        <div className="flex flex-col gap-2">
          {[
            { label: t.eqHigh, val: eqState.high, key: 'high' as const, color: themeConfig.accent },
            { label: t.eqMid, val: eqState.mid, key: 'mid' as const, color: themeConfig.accentTertiary },
            { label: t.eqLow, val: eqState.low, key: 'low' as const, color: themeConfig.accentSecondary },
          ].map((band) => (
            <div 
              key={band.key} 
              className="flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-2xl border transition-all"
              style={{
                backgroundColor: themeConfig.bgCard,
                borderColor: themeConfig.borderSubtle,
              }}
            >
              <span className="w-16 sm:w-20 text-[11px] font-space font-bold" style={{ color: band.color }}>
                {band.label}
              </span>
              <input
                type="range"
                min={-24}
                max={6}
                step={0.5}
                value={band.val}
                onChange={(e) => onEQChange({ [band.key]: parseFloat(e.target.value) })}
                className="flex-1"
                style={{ accentColor: band.color }}
              />
              <span className="w-14 text-right text-[11px] font-mono font-bold" style={{ color: band.color }}>
                {band.val > 0 ? `+${band.val}dB` : `${band.val}dB`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Master Volume Section */}
      <div className="flex flex-col gap-2 pt-3 border-t" style={{ borderColor: themeConfig.borderSubtle }}>
        <div className="flex justify-between items-center">
          <span className="text-white font-bold font-space text-xs uppercase tracking-wider">
            {t.masterVolume}
          </span>
          <span className="text-xs font-mono font-bold" style={{ color: themeConfig.accentSecondary }}>
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
        <div 
          className="px-3 py-2 rounded-2xl border flex items-center gap-3"
          style={{
            backgroundColor: themeConfig.bgCard,
            borderColor: themeConfig.borderSubtle,
          }}
        >
          <span className="text-[10px] font-mono text-white/40">0%</span>
          <input
            type="range"
            min={0}
            max={1.2}
            step={0.02}
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="flex-1"
            style={{ accentColor: themeConfig.accentSecondary }}
          />
          <span className="text-[10px] font-mono text-white/40">120%</span>
        </div>
      </div>
    </div>
  </div>
  );
};
