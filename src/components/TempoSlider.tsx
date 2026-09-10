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
    <div className="bg-[#0B0B10] rounded-2xl p-4 flex flex-col gap-3.5 w-full border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-white font-bold font-space text-sm tracking-tight flex items-center gap-1.5">
            <span>{t.pitchBend}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40">
              DJ PITCH
            </span>
          </span>
          <span className="text-[10px] text-white/50 font-space font-medium">
            {t.pitchSemitones}
          </span>
        </div>
        <button
          onClick={() => {
            triggerHaptic();
            onResetPitch();
          }}
          className="text-xs font-space font-bold text-white/80 hover:text-white px-3 py-1 bg-[#181824] hover:bg-[#222232] rounded-lg active:scale-95 transition-all border border-white/20 shadow-xs"
        >
          {t.pitchReset}
        </button>
      </div>

      {/* Quick Semitone Jump Steppers */}
      <div className="grid grid-cols-5 gap-1.5 bg-[#12121A] p-1.5 rounded-xl border border-white/10">
        <button
          onClick={() => handleStep(-12)}
          className="py-1.5 text-[10.5px] font-space font-bold rounded-lg bg-[#181826] border border-white/15 text-white active:scale-95 hover:bg-[#FF007F] hover:text-white transition-all shadow-xs"
        >
          -12st
        </button>
        <button
          onClick={() => handleStep(-1)}
          className="py-1.5 text-[10.5px] font-space font-bold rounded-lg bg-[#181826] border border-white/15 text-white active:scale-95 hover:bg-[#FF007F] hover:text-white transition-all shadow-xs"
        >
          -1st
        </button>
        <button
          onClick={() => {
            triggerHaptic();
            onResetPitch();
          }}
          className="py-1.5 text-[10.5px] font-space font-bold rounded-lg bg-[#00F0FF] text-black border border-[#00F0FF] active:scale-95 shadow-[0_0_10px_rgba(0,240,255,0.4)] transition-all font-bold"
        >
          0st
        </button>
        <button
          onClick={() => handleStep(1)}
          className="py-1.5 text-[10.5px] font-space font-bold rounded-lg bg-[#181826] border border-white/15 text-white active:scale-95 hover:bg-[#00FF66] hover:text-black transition-all shadow-xs"
        >
          +1st
        </button>
        <button
          onClick={() => handleStep(12)}
          className="py-1.5 text-[10.5px] font-space font-bold rounded-lg bg-[#181826] border border-white/15 text-white active:scale-95 hover:bg-[#00FF66] hover:text-black transition-all shadow-xs"
        >
          +12st
        </button>
      </div>

      {/* Semitones Slider */}
      <div className="flex items-center gap-3 pt-0.5">
        <span className="text-white/50 text-xs font-space font-bold w-10 text-right">-12</span>
        <input
          type="range"
          min={-12}
          max={12}
          step={1}
          value={pitchBend}
          onChange={(e) => onPitchChange(parseInt(e.target.value, 10))}
          className="flex-1"
        />
        <span className="text-white/50 text-xs font-space font-bold w-10">+12</span>
      </div>

      {/* Readout Display */}
      <div className="flex justify-between items-center px-1 text-xs font-space">
        <span className="text-white/60 font-bold">
          Ratio: <span className="text-[#00F0FF] font-mono font-bold">{(Math.pow(2, pitchBend / 12)).toFixed(3)}x</span>
        </span>
        <span className="font-bold text-[#FF007F] text-sm drop-shadow-[0_0_8px_rgba(255,0,127,0.5)]">
          {pitchBend >= 0 ? `+${pitchBend} ${t.pitchSemitonesUnit}` : `${pitchBend} ${t.pitchSemitonesUnit}`}
        </span>
      </div>
    </div>
  );
};
