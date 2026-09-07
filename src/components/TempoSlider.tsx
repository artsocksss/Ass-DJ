import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface TempoSliderProps {
  pitchBend: number; // in semitones (-12 to +12) or percentage
  lang: Language;
  onPitchChange: (pitch: number) => void;
  onResetPitch: () => void;
}

export const TempoSlider: React.FC<TempoSliderProps> = ({
  pitchBend,
  lang,
  onPitchChange,
  onResetPitch,
}) => {
  const t = TRANSLATIONS[lang];

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
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-3.5 w-full border-2 border-[#111113] shadow-[0_2px_0_#111113]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[#111113] font-bold font-space text-sm tracking-tight">
            {t.pitchBend}
          </span>
          <span className="text-[10px] text-[#111113]/60 font-space font-medium">
            {t.pitchSemitones}
          </span>
        </div>
        <button
          onClick={() => {
            triggerHaptic();
            onResetPitch();
          }}
          className="text-xs font-space font-bold text-[#111113] px-3 py-1 bg-[#F8F7F4] hover:bg-[#FAF9F5] rounded-lg active:scale-95 transition-all border border-[#111113] shadow-[0_1px_0_#111113]"
        >
          {t.pitchReset}
        </button>
      </div>

      {/* Quick Semitone Jump Steppers */}
      <div className="grid grid-cols-5 gap-1.5 bg-[#F8F7F4] p-1.5 rounded-xl border border-[#111113]/20">
        <button
          onClick={() => handleStep(-12)}
          className="py-1.5 text-[10.5px] font-space font-bold rounded-lg bg-white border border-[#111113] text-[#111113] active:scale-95 hover:bg-[#E94E38] hover:text-white transition-all shadow-xs"
        >
          -12st
        </button>
        <button
          onClick={() => handleStep(-1)}
          className="py-1.5 text-[10.5px] font-space font-bold rounded-lg bg-white border border-[#111113] text-[#111113] active:scale-95 hover:bg-[#E94E38] hover:text-white transition-all shadow-xs"
        >
          -1st
        </button>
        <button
          onClick={() => {
            triggerHaptic();
            onResetPitch();
          }}
          className="py-1.5 text-[10.5px] font-space font-bold rounded-lg bg-[#111113] text-white border border-[#111113] active:scale-95 hover:bg-[#2C2C2E] transition-all shadow-xs"
        >
          0st
        </button>
        <button
          onClick={() => handleStep(1)}
          className="py-1.5 text-[10.5px] font-space font-bold rounded-lg bg-white border border-[#111113] text-[#111113] active:scale-95 hover:bg-[#E94E38] hover:text-white transition-all shadow-xs"
        >
          +1st
        </button>
        <button
          onClick={() => handleStep(12)}
          className="py-1.5 text-[10.5px] font-space font-bold rounded-lg bg-white border border-[#111113] text-[#111113] active:scale-95 hover:bg-[#E94E38] hover:text-white transition-all shadow-xs"
        >
          +12st
        </button>
      </div>

      {/* Semitones Slider */}
      <div className="flex items-center gap-3 pt-0.5">
        <span className="text-[#111113]/70 text-xs font-space font-bold w-10 text-right">-12</span>
        <input
          type="range"
          min={-12}
          max={12}
          step={1}
          value={pitchBend}
          onChange={(e) => onPitchChange(parseInt(e.target.value, 10))}
          className="flex-1 accent-[#111113]"
        />
        <span className="text-[#111113]/70 text-xs font-space font-bold w-10">+12</span>
      </div>

      {/* Readout Display */}
      <div className="flex justify-between items-center px-1 text-xs font-space">
        <span className="text-[#111113]/60 font-bold">
          Ratio: {(Math.pow(2, pitchBend / 12)).toFixed(3)}x
        </span>
        <span className="font-bold text-[#E94E38] text-sm">
          {pitchBend >= 0 ? `+${pitchBend} ${t.pitchSemitonesUnit}` : `${pitchBend} ${t.pitchSemitonesUnit}`}
        </span>
      </div>
    </div>
  );
};
