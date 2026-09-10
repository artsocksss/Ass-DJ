import React from 'react';
import { EQState, FXState, FXType, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface SoundColorFXDeckProps {
  fxState: FXState;
  eqState: EQState;
  masterVolume: number;
  lang: Language;
  onFXChange: (fx: Partial<FXState>) => void;
  onEQChange: (eq: Partial<EQState>) => void;
  onMasterVolumeChange: (vol: number) => void;
}

export const SoundColorFXDeck: React.FC<SoundColorFXDeckProps> = ({
  fxState,
  eqState,
  masterVolume,
  lang,
  onFXChange,
  onEQChange,
  onMasterVolumeChange,
}) => {
  const t = TRANSLATIONS[lang];
  const fxList: { id: FXType; color: string; border: string; glow: string }[] = [
    { id: 'FILTER', color: 'text-[#00F0FF]', border: 'border-[#00F0FF]', glow: 'shadow-[0_0_10px_rgba(0,240,255,0.4)]' },
    { id: 'CRUSH', color: 'text-[#FF6600]', border: 'border-[#FF6600]', glow: 'shadow-[0_0_10px_rgba(255,102,0,0.4)]' },
    { id: 'ECHO', color: 'text-[#00FF66]', border: 'border-[#00FF66]', glow: 'shadow-[0_0_10px_rgba(0,255,102,0.4)]' },
    { id: 'SPACE', color: 'text-[#FF007F]', border: 'border-[#FF007F]', glow: 'shadow-[0_0_10px_rgba(255,0,127,0.4)]' },
    { id: 'NOISE', color: 'text-[#FFE600]', border: 'border-[#FFE600]', glow: 'shadow-[0_0_10px_rgba(255,230,0,0.4)]' },
  ];

  return (
    <div className="bg-[#0B0B10] rounded-2xl p-4 flex flex-col gap-5 w-full border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
      {/* Sound Color FX Section */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold font-space text-sm sm:text-base tracking-tight">
              {t.colorFx}
            </span>
          </div>
          <span className="text-xs font-space font-bold text-[#00F0FF] bg-[#12121D] px-2 py-0.5 rounded-md border border-[#00F0FF]/30">
            {fxState.param > 0 ? `+${(fxState.param * 100).toFixed(0)}%` : `${(fxState.param * 100).toFixed(0)}%`}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1 bg-[#12121A] p-1 rounded-xl border border-white/10">
          {fxList.map(({ id: fx, color, border, glow }) => {
            const isActive = fxState.activeFX === fx;
            return (
              <button
                key={fx}
                onClick={() => onFXChange({ activeFX: fx })}
                className={`py-2 text-[10px] sm:text-xs font-space font-bold rounded-lg transition-all text-center truncate px-0.5 ${
                  isActive
                    ? `bg-[#1E1E2E] ${color} ${border} ${glow} border font-bold scale-[1.02]`
                    : 'text-white/60 hover:text-white active:scale-95'
                }`}
              >
                {t.fxTypes[fx]}
              </button>
            );
          })}
        </div>

        <div className="pt-1 flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/40">-100%</span>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={fxState.param}
            onChange={(e) => onFXChange({ param: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="text-[10px] font-mono text-white/40">+100%</span>
        </div>
      </div>

      {/* 3-Band Isolator EQ Section */}
      <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
        <span className="text-white font-bold font-space text-sm sm:text-base tracking-tight">
          {t.threeBandEq}
        </span>
        <div className="flex flex-col gap-3">
          {[
            { label: t.eqHigh, val: eqState.high, key: 'high' as const, color: 'text-[#00F0FF]', glow: 'text-[#00F0FF]' },
            { label: t.eqMid, val: eqState.mid, key: 'mid' as const, color: 'text-[#FF007F]', glow: 'text-[#FF007F]' },
            { label: t.eqLow, val: eqState.low, key: 'low' as const, color: 'text-[#00FF66]', glow: 'text-[#00FF66]' },
          ].map((band) => (
            <div key={band.key} className="flex items-center gap-2 sm:gap-3 bg-[#12121A] px-3 py-2 rounded-xl border border-white/10">
              <span className={`w-16 sm:w-20 text-xs font-space font-bold ${band.color}`}>
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
              />
              <span className={`w-14 text-right text-xs font-space font-bold ${band.color}`}>
                {band.val > 0 ? `+${band.val}dB` : `${band.val}dB`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Master Volume Section */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-white/10">
        <div className="flex justify-between items-center">
          <span className="text-white font-bold font-space text-sm sm:text-base tracking-tight">
            {t.masterVolume}
          </span>
          <span className="text-xs font-space font-bold text-[#00FF66]">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
        <div className="bg-[#12121A] px-3 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
          <span className="text-xs font-mono text-white/50">0%</span>
          <input
            type="range"
            min={0}
            max={1.2}
            step={0.02}
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs font-mono text-[#00FF66]">120%</span>
        </div>
      </div>
    </div>
  );
};
