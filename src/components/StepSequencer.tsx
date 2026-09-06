import React from 'react';
import { PadDefinition } from '../types';

interface StepSequencerProps {
  pattern: boolean[][]; // 16 pads x 16 steps
  currentStep: number;
  selectedPadIndex: number;
  pads: PadDefinition[];
  swing: number;
  onToggleStep: (padIndex: number, stepIndex: number) => void;
  onSelectPad: (padIndex: number) => void;
  onClearPattern: () => void;
  onRandomizePattern: () => void;
  onLoadPreset: (presetKey: string) => void;
  onSwingChange: (swing: number) => void;
}

export const StepSequencer: React.FC<StepSequencerProps> = ({
  pattern,
  currentStep,
  selectedPadIndex,
  pads,
  swing,
  onToggleStep,
  onSelectPad,
  onClearPattern,
  onRandomizePattern,
  onLoadPreset,
  onSwingChange,
}) => {
  const selectedPad = pads[selectedPadIndex] || pads[0];
  const padSteps = pattern[selectedPadIndex] || Array(16).fill(false);

  return (
    <div
      id="step-sequencer-module"
      className="flex flex-col gap-3 p-3 sm:p-4 bg-[#0e1015] border border-neutral-800/80 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]"
    >
      {/* Top Header: Pattern Controls & Selected Pad Badge */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b border-neutral-850 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-750">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedPad.color }}
            />
            <span className="text-xs font-mono font-bold text-white">
              STEP EDIT: {selectedPad.name}
            </span>
          </div>

          <span className="text-[10px] font-mono text-neutral-400">
            [16-STEP GRID]
          </span>
        </div>

        {/* Action Buttons: Presets, Swing, Clear, Random */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Preset Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-neutral-400">PRESET:</span>
            {(['A', 'B', 'C', 'D'] as const).map((key) => (
              <button
                key={key}
                id={`btn-load-preset-${key}`}
                type="button"
                onClick={() => onLoadPreset(key)}
                className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-200 transition-colors cursor-pointer"
              >
                {key}
              </button>
            ))}
          </div>

          {/* Randomize */}
          <button
            id="btn-pattern-random"
            type="button"
            onClick={onRandomizePattern}
            className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-purple-950/50 hover:bg-purple-900/50 active:scale-95 text-purple-300 border border-purple-800/40 transition-all cursor-pointer"
            title="Generate algorithmic groove"
          >
            RANDOM
          </button>

          {/* Clear */}
          <button
            id="btn-pattern-clear"
            type="button"
            onClick={onClearPattern}
            className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-neutral-800 hover:bg-red-950/60 active:scale-95 text-neutral-400 hover:text-red-400 border border-neutral-700 transition-all cursor-pointer"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* 16 Step Buttons for Currently Selected Pad */}
      <div className="grid grid-cols-16 gap-1 sm:gap-1.5 items-center">
        {padSteps.map((isTriggered, stepIdx) => {
          const isPlayhead = currentStep === stepIdx;
          const isQuarterBeat = stepIdx % 4 === 0;

          return (
            <button
              key={stepIdx}
              id={`step-btn-${selectedPadIndex}-${stepIdx}`}
              type="button"
              onClick={() => onToggleStep(selectedPadIndex, stepIdx)}
              className={`relative flex flex-col items-center justify-between py-2 sm:py-3 rounded-lg select-none transition-all duration-75 cursor-pointer touch-manipulation ${
                isPlayhead
                  ? 'ring-2 ring-white scale-105 z-10'
                  : ''
              } ${
                isTriggered
                  ? 'shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                  : 'bg-neutral-900 hover:bg-neutral-800'
              } ${
                isQuarterBeat && !isTriggered
                  ? 'border border-neutral-700'
                  : 'border border-neutral-800'
              }`}
              style={{
                backgroundColor: isTriggered ? selectedPad.color : undefined,
              }}
            >
              {/* Step indicator LED dot */}
              <div
                className={`w-1.5 h-1.5 rounded-full mb-1 ${
                  isPlayhead
                    ? 'bg-white shadow-[0_0_6px_#fff]'
                    : isTriggered
                    ? 'bg-white/70'
                    : 'bg-neutral-700'
                }`}
              />

              {/* Step Number */}
              <span
                className={`text-[9px] font-mono font-bold ${
                  isTriggered ? 'text-black' : isQuarterBeat ? 'text-neutral-300' : 'text-neutral-500'
                }`}
              >
                {stepIdx + 1}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mini Pad Selector Bar: Quick Tab between instruments */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1 scrollbar-thin">
        <span className="text-[10px] font-mono text-neutral-400 shrink-0 mr-1">TRACK:</span>
        {pads.map((pad) => {
          const isSelected = pad.id === selectedPadIndex;
          const hasSteps = pattern[pad.id]?.some((s) => s);

          return (
            <button
              key={pad.id}
              id={`btn-select-pad-track-${pad.id}`}
              type="button"
              onClick={() => onSelectPad(pad.id)}
              className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'text-black shadow-xs'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
              style={{
                backgroundColor: isSelected ? pad.color : undefined,
              }}
            >
              {pad.name}
              {hasSteps && (
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ml-1.5 ${
                    isSelected ? 'bg-black' : 'bg-amber-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Swing / Groove Slider */}
      <div className="flex items-center justify-between pt-1 border-t border-neutral-850 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono text-neutral-400">
            GROOVE / SWING:
          </span>
          <span className="font-mono font-bold text-amber-400">{swing}%</span>
        </div>
        <div className="flex items-center gap-2 w-48 sm:w-64">
          <span className="text-[10px] font-mono text-neutral-500">0%</span>
          <input
            id="input-groove-swing"
            type="range"
            min={0}
            max={75}
            value={swing}
            onChange={(e) => onSwingChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <span className="text-[10px] font-mono text-neutral-500">75%</span>
        </div>
      </div>
    </div>
  );
};
