import React from 'react';
import { PadDefinition } from '../types';

interface StepSequencerProps {
  pattern: boolean[][];
  currentStep: number;
  selectedPadIndex: number;
  pads: PadDefinition[];
  onToggleStep: (padIndex: number, stepIndex: number) => void;
  onSelectPad: (padIndex: number) => void;
  onClearPattern: () => void;
}

export const StepSequencer: React.FC<StepSequencerProps> = ({
  pattern, currentStep, selectedPadIndex, pads, onToggleStep, onSelectPad, onClearPattern
}) => {
  const selectedPad = pads[selectedPadIndex] || pads[0];
  const padSteps = pattern[selectedPadIndex] || Array(16).fill(false);

  return (
    <div className="bg-[#1C1C1E] rounded-3xl p-5 flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center">
        <span className="text-white font-bold text-lg tracking-tight">Sequencer</span>
        <button onClick={onClearPattern} className="text-red-500 text-sm font-semibold active:opacity-70">Clear</button>
      </div>

      {/* Pad Selector Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {pads.map(pad => (
          <button
            key={pad.id}
            onClick={() => onSelectPad(pad.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${pad.id === selectedPadIndex ? 'bg-white text-black' : 'bg-[#2C2C2E] text-neutral-400'}`}
          >
            {pad.name}
          </button>
        ))}
      </div>

      {/* 4x4 Grid for 16 steps */}
      <div className="grid grid-cols-4 gap-3">
         {padSteps.map((isTriggered, idx) => {
            const isPlayhead = currentStep === idx;
            return (
               <button
                 key={idx}
                 onClick={() => onToggleStep(selectedPadIndex, idx)}
                 className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-75 relative ${isTriggered ? '' : 'bg-[#2C2C2E]'}`}
                 style={{ backgroundColor: isTriggered ? selectedPad.color : undefined }}
               >
                  <span className={`text-[11px] font-semibold ${isTriggered ? 'text-black/50' : 'text-neutral-500'}`}>{idx + 1}</span>
                  {isPlayhead && <div className="absolute inset-0 border-[2.5px] border-white rounded-2xl scale-105" />}
               </button>
            )
         })}
      </div>
    </div>
  );
};
