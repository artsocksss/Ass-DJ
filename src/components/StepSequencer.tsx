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
    <div className="bg-[#0B0B10] rounded-2xl p-4 flex flex-col gap-3.5 w-full border border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
      {/* Header with Title & Action buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-white font-bold font-space text-base tracking-tight flex items-center gap-2">
            <span>{t.sequencerTitle}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
              16-STEP
            </span>
          </h2>
          <span className="text-[11px] text-white/60 font-space font-semibold">
            {t.stepNumber} <span className="text-[#00FF66] font-bold">{currentStep + 1}</span>/16 •{' '}
            <span className="text-[#FF007F] font-bold">{getPadName(selectedPad)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onResetPreset && (
            <button
              onClick={() => {
                triggerHaptic();
                onResetPreset();
              }}
              className="text-white/80 hover:text-white text-xs font-space font-bold px-2.5 py-1 bg-[#161622] rounded-lg active:scale-95 transition-all border border-white/15"
            >
              {t.resetPreset}
            </button>
          )}
          <button
            onClick={() => {
              triggerHaptic();
              onClearPattern();
            }}
            className="text-[#FF003C] hover:bg-[#FF003C] hover:text-white text-xs font-space font-bold px-2.5 py-1 bg-[#1B0F15] border border-[#FF003C]/40 rounded-lg active:scale-95 transition-all shadow-[0_0_8px_rgba(255,0,60,0.2)]"
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
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-space font-bold transition-all flex items-center gap-1.5 border select-none ${
                isSelected
                  ? 'bg-[#00F0FF] border-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.5)] scale-105'
                  : 'bg-[#12121A] border-white/15 text-white/70 hover:border-white/40'
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
                    isSelected ? 'bg-black' : 'bg-[#FF007F] shadow-[0_0_6px_#FF007F]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 4x4 Grid for 16 Sequencer Steps */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
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
              className={`aspect-square rounded-2xl flex flex-col justify-between p-2 sm:p-2.5 transition-transform duration-75 relative select-none border ${
                isTriggered
                  ? 'bg-[#FF007F] text-white border-[#FF007F] shadow-[0_0_16px_rgba(255,0,127,0.6)] scale-[0.98]'
                  : isBeatStart
                  ? 'bg-[#181826] border-white/20 hover:border-white/40'
                  : 'bg-[#101018] border-white/10 hover:border-white/25'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span
                  className={`text-[10px] font-space font-bold ${
                    isTriggered ? 'text-white' : 'text-white/60'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {isBeatStart && (
                  <span
                    className={`text-[8px] font-space font-bold uppercase ${
                      isTriggered ? 'text-white/80' : 'text-[#00F0FF]/80'
                    }`}
                  >
                    B{Math.floor(idx / 4) + 1}
                  </span>
                )}
              </div>

              {/* Step indicator LED */}
              <div className="w-full flex justify-end">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isTriggered
                      ? 'bg-white shadow-[0_0_6px_#FFF]'
                      : isBeatStart
                      ? 'bg-[#00F0FF]/30'
                      : 'bg-white/10'
                  }`}
                />
              </div>

              {/* Playhead Laser highlight frame */}
              {isPlayhead && (
                <div className="absolute inset-0 border-2 border-[#00FF66] bg-[#00FF66]/20 rounded-2xl shadow-[0_0_12px_#00FF66] pointer-events-none animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
