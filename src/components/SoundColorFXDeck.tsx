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
  const fxList: FXType[] = ['FILTER', 'CRUSH', 'ECHO', 'SPACE', 'NOISE'];

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-6 w-full border-2 border-[#111113] shadow-[0_2px_0_#111113]">
      {/* Sound Color FX Section */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-[#111113] font-bold font-space text-sm sm:text-base tracking-tight">
            {t.colorFx}
          </span>
          <span className="text-xs font-space font-bold text-[#E94E38]">
            {fxState.param > 0 ? `+${(fxState.param * 100).toFixed(0)}%` : `${(fxState.param * 100).toFixed(0)}%`}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1 bg-[#F8F7F4] p-1 rounded-xl border-2 border-[#111113]">
          {fxList.map((fx) => (
            <button
              key={fx}
              onClick={() => onFXChange({ activeFX: fx })}
              className={`py-2 text-[10px] sm:text-xs font-space font-bold rounded-lg transition-all text-center truncate px-0.5 ${
                fxState.activeFX === fx
                  ? 'bg-[#111113] text-white shadow-sm font-bold'
                  : 'text-[#111113]/70 hover:text-[#111113] active:scale-95'
              }`}
            >
              {t.fxTypes[fx]}
            </button>
          ))}
        </div>

        <div className="pt-1">
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={fxState.param}
            onChange={(e) => onFXChange({ param: parseFloat(e.target.value) })}
            className="w-full accent-[#E94E38]"
          />
        </div>
      </div>

      {/* 3-Band EQ Section */}
      <div className="flex flex-col gap-3 pt-2 border-t-2 border-[#111113]/10">
        <span className="text-[#111113] font-bold font-space text-sm sm:text-base tracking-tight">
          {t.threeBandEq}
        </span>
        <div className="flex flex-col gap-3.5">
          {[
            { label: t.eqHigh, val: eqState.high, key: 'high' as const },
            { label: t.eqMid, val: eqState.mid, key: 'mid' as const },
            { label: t.eqLow, val: eqState.low, key: 'low' as const },
          ].map((band) => (
            <div key={band.key} className="flex items-center gap-3">
              <span className="w-20 text-xs font-space font-bold text-[#111113]/70">{band.label}</span>
              <input
                type="range"
                min={-24}
                max={6}
                step={0.5}
                value={band.val}
                onChange={(e) => onEQChange({ [band.key]: parseFloat(e.target.value) })}
                className="flex-1 accent-[#111113]"
              />
              <span className="w-12 text-right text-xs font-space font-bold text-[#111113]">
                {band.val > 0 ? `+${band.val}dB` : `${band.val}dB`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Master Volume Section */}
      <div className="flex flex-col gap-3 pt-2 border-t-2 border-[#111113]/10">
        <div className="flex justify-between items-center">
          <span className="text-[#111113] font-bold font-space text-sm sm:text-base tracking-tight">
            {t.masterVolume}
          </span>
          <span className="text-xs font-space font-bold text-[#111113]">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1.2}
          step={0.02}
          value={masterVolume}
          onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
          className="w-full accent-[#111113]"
        />
      </div>
    </div>
  );
};
