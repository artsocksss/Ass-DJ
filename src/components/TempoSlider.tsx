import React from 'react';

interface TempoSliderProps {
  pitchBend: number;
  onPitchChange: (pitch: number) => void;
  onResetPitch: () => void;
}

export const TempoSlider: React.FC<TempoSliderProps> = ({ pitchBend, onPitchChange, onResetPitch }) => {
  return (
    <div className="bg-[#1C1C1E] rounded-3xl p-5 flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center">
         <span className="text-white font-bold text-lg tracking-tight">Pitch Bend</span>
         <button onClick={onResetPitch} className="text-sm font-semibold text-neutral-400 active:text-white">Reset (0%)</button>
      </div>
      <div className="flex items-center gap-4 py-4">
         <span className="text-neutral-500 text-sm font-semibold w-10 text-right">-16%</span>
         <input
           type="range"
           min={-16} max={16} step={0.1}
           value={pitchBend}
           onChange={(e) => onPitchChange(parseFloat(e.target.value))}
           className="flex-1"
         />
         <span className="text-neutral-500 text-sm font-semibold w-10">+16%</span>
      </div>
    </div>
  );
};
