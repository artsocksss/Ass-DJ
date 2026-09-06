import React from 'react';

interface TempoSliderProps {
  pitchBend: number; // percentage (-range to +range)
  pitchRange: 6 | 10 | 16 | 50;
  onPitchChange: (pitch: number) => void;
  onRangeChange: (range: 6 | 10 | 16 | 50) => void;
  onPitchBendNudge: (direction: 'up' | 'down') => void;
  onResetPitch: () => void;
}

export const TempoSlider: React.FC<TempoSliderProps> = ({
  pitchBend,
  pitchRange,
  onPitchChange,
  onRangeChange,
  onPitchBendNudge,
  onResetPitch,
}) => {
  const isZero = Math.abs(pitchBend) < 0.05;

  return (
    <div
      id="tempo-pitch-fader-card"
      className="flex flex-col gap-2 p-3 bg-[#101218] border border-neutral-800 rounded-2xl shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)]"
    >
      {/* Header: Range Selectors & Detent LED */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
            TEMPO RANGE:
          </span>
          {([6, 10, 16, 50] as const).map((r) => (
            <button
              key={r}
              id={`btn-range-${r}`}
              type="button"
              onClick={() => onRangeChange(r)}
              className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${
                pitchRange === r
                  ? 'bg-amber-400 text-black shadow-xs'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              } transition-colors`}
            >
              ±{r === 50 ? 'WIDE' : `${r}%`}
            </button>
          ))}
        </div>

        {/* 0.0% Detent Indicator */}
        <button
          id="btn-pitch-detent-zero"
          type="button"
          onClick={onResetPitch}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 active:scale-95 transition-all cursor-pointer"
          title="Click to reset pitch to 0%"
        >
          <span
            className={`w-2 h-2 rounded-full transition-all ${
              isZero
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                : 'bg-neutral-700'
            }`}
          />
          <span className="text-[10px] font-mono font-bold text-neutral-300">
            0% DETENT
          </span>
        </button>
      </div>

      {/* Slider Travel & Nudge Buttons */}
      <div className="flex items-center gap-3">
        {/* Nudge Down (-) */}
        <button
          id="btn-pitch-nudge-down"
          type="button"
          onClick={() => onPitchBendNudge('down')}
          className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 flex items-center justify-center font-black text-amber-400 border border-neutral-700 transition-all active:scale-90 select-none cursor-pointer"
          title="Nudge pitch down"
        >
          -
        </button>

        {/* Slider Input with Pioneer Track Background */}
        <div className="relative flex-1 flex items-center py-1">
          {/* Center line marker */}
          <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-4 bg-emerald-500/50 pointer-events-none" />

          <input
            id="input-tempo-pitch-slider"
            type="range"
            min={-pitchRange}
            max={pitchRange}
            step={0.1}
            value={pitchBend}
            onChange={(e) => onPitchChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-neutral-850 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
          />
        </div>

        {/* Nudge Up (+) */}
        <button
          id="btn-pitch-nudge-up"
          type="button"
          onClick={() => onPitchBendNudge('up')}
          className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 flex items-center justify-center font-black text-amber-400 border border-neutral-700 transition-all active:scale-90 select-none cursor-pointer"
          title="Nudge pitch up"
        >
          +
        </button>
      </div>
    </div>
  );
};
