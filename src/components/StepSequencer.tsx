import React from 'react';
import { PadDefinition, BankId, Language } from '../types';
import { TRANSLATIONS, UKRAINIAN_PAD_NAMES } from '../utils/translations';

interface StepSequencerProps {
  pattern: boolean[][];
  currentStep: number;
  selectedPadIndex: number;
  pads: PadDefinition[];
  currentBank: BankId;
  lang: Language;
  onToggleStep: (padIndex: number, stepIndex: number) => void;
  onSelectPad: (padIndex: number) => void;
  onClearPattern: () => void;
  onResetPreset?: () => void;
}

export const StepSequencer: React.FC<StepSequencerProps> = ({
  pattern,
  currentStep,
  selectedPadIndex,
  pads,
  currentBank,
  lang,
  onToggleStep,
  onSelectPad,
  onClearPattern,
  onResetPreset,
}) => {
  const selectedPad = pads[selectedPadIndex] || pads[0];
  const padSteps = pattern[selectedPadIndex] || Array(16).fill(false);
  const t = TRANSLATIONS[lang];

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(8);
      }
    } catch {
      // Ignore
    }
  };

  const getPadName = (pad: PadDefinition) => {
    return lang === 'uk' && UKRAINIAN_PAD_NAMES[currentBank]?.[pad.id]
      ? UKRAINIAN_PAD_NAMES[currentBank][pad.id]
      : pad.name;
  };

  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-4 w-full border-2 border-[#111113] shadow-[0_2px_0_#111113]">
      {/* Header with Title & Action buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[#111113] font-bold font-space text-base sm:text-lg tracking-tight">
            {t.sequencerTitle}
          </h2>
          <span className="text-[10px] text-[#111113]/70 font-space font-semibold">
            {t.stepNumber} {(currentStep + 1)}/16 • {getPadName(selectedPad)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onResetPreset && (
            <button
              onClick={() => {
                triggerHaptic();
                onResetPreset();
              }}
              className="text-[#111113] hover:text-[#111113] text-xs font-space font-bold px-2.5 py-1 bg-[#F8F7F4] rounded-lg active:scale-95 transition-all border border-[#111113]"
            >
              {t.resetPreset}
            </button>
          )}
          <button
            onClick={() => {
              triggerHaptic();
              onClearPattern();
            }}
            className="text-[#E94E38] hover:bg-[#E94E38] hover:text-white text-xs font-space font-bold px-2.5 py-1 bg-[#F8F7F4] border-2 border-[#E94E38] rounded-lg active:scale-95 transition-all"
          >
            {t.clearSequence}
          </button>
        </div>
      </div>

      {/* Pad Selector Horizontal Scroll */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-0.5">
        {pads.map((pad) => {
          const isSelected = pad.id === selectedPadIndex;
          const padTitle = getPadName(pad);
          const hasNotes = pattern[pad.id]?.some(Boolean);

          return (
            <button
              key={pad.id}
              onClick={() => {
                triggerHaptic();
                onSelectPad(pad.id);
              }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-space font-bold transition-all flex items-center gap-1.5 border-2 select-none ${
                isSelected
                  ? 'bg-[#111113] border-[#111113] text-[#F8F7F4] shadow-sm scale-105'
                  : 'bg-[#F8F7F4] border-[#111113]/30 text-[#111113] hover:border-[#111113]'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: pad.color }}
              />
              <span className="truncate max-w-[90px]">{padTitle}</span>
              {hasNotes && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-[#E94E38]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 4x4 Grid for 16 Sequencer Steps */}
      <div className="grid grid-cols-4 gap-2.5">
        {padSteps.map((isTriggered, idx) => {
          const isPlayhead = currentStep === idx;
          const isBeatStart = idx % 4 === 0;

          return (
            <button
              key={idx}
              onClick={() => {
                triggerHaptic();
                onToggleStep(selectedPadIndex, idx);
              }}
              className={`aspect-square rounded-xl flex flex-col justify-between p-2 transition-all duration-75 relative select-none border-2 border-[#111113] ${
                isTriggered
                  ? 'bg-[#E94E38] text-white shadow-sm scale-[0.98]'
                  : isBeatStart
                  ? 'bg-white hover:bg-[#F8F7F4]'
                  : 'bg-[#F8F7F4] hover:bg-white'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span
                  className={`text-[10px] font-space font-bold ${
                    isTriggered ? 'text-white' : 'text-[#111113]'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {isBeatStart && (
                  <span
                    className={`text-[8px] font-space font-bold uppercase ${
                      isTriggered ? 'text-white/80' : 'text-[#111113]/60'
                    }`}
                  >
                    B{Math.floor(idx / 4) + 1}
                  </span>
                )}
              </div>

              {/* Playhead highlight frame */}
              {isPlayhead && (
                <div className="absolute inset-0 border-2 border-[#111113] bg-[#111113]/10 rounded-xl shadow-sm pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
