import React from 'react';
import { PadDefinition, BankId, Language, ThemeId } from '../types';
import { TRANSLATIONS, UKRAINIAN_PAD_NAMES } from '../utils/translations';
import { THEMES, ThemeConfig } from '../utils/theme';

interface StepSequencerProps {
  pattern: boolean[][];
  currentStep: number;
  selectedPadIndex: number;
  pads: PadDefinition[];
  currentBank: BankId;
  lang: Language;
  theme?: ThemeId;
  lastAutoSavedAt?: number;
  onToggleStep: (padIndex: number, stepIndex: number) => void;
  onSelectPad: (padIndex: number) => void;
  onClearPattern: () => void;
  onResetPreset?: () => void;
  onOpenDrive?: () => void;
}

export const StepSequencer: React.FC<StepSequencerProps> = ({
  pattern,
  currentStep,
  selectedPadIndex,
  pads,
  currentBank,
  lang,
  theme = 'onyx',
  lastAutoSavedAt,
  onToggleStep,
  onSelectPad,
  onClearPattern,
  onResetPreset,
  onOpenDrive,
}) => {
  const selectedPad = pads[selectedPadIndex] || pads[0];
  const padSteps = pattern[selectedPadIndex] || Array(16).fill(false);
  const t = TRANSLATIONS[lang];
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;

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
    <div 
      className="rounded-3xl p-4 flex flex-col gap-3.5 w-full border transition-all"
      style={{
        backgroundColor: themeConfig.bgPanel,
        borderColor: themeConfig.borderSubtle,
        boxShadow: `0 8px 24px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Header with Title & Action buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-white font-bold font-space text-sm tracking-tight flex items-center gap-2">
            <span>{t.sequencerTitle}</span>
            <span 
              className="text-[9px] px-2 py-0.5 rounded-full border font-mono"
              style={{
                backgroundColor: `${themeConfig.accent}15`,
                borderColor: `${themeConfig.accent}40`,
                color: themeConfig.accent,
              }}
            >
              16-STEP
            </span>
            <span
              className="text-[8.5px] px-1.5 py-0.5 rounded-full border font-mono text-emerald-400 bg-emerald-500/10 border-emerald-500/30 flex items-center gap-1"
              title="Patterns and BPM auto-saved every 5s"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{lang === 'uk' ? 'АВТОЗБЕРЕЖЕННЯ 5с' : 'AUTO-SAVED'}</span>
            </span>
          </h2>
          <span className="text-[11px] text-white/50 font-space">
            {t.stepNumber} <span className="font-bold font-mono" style={{ color: themeConfig.accentSecondary }}>{currentStep + 1}</span>/16 •{' '}
            <span className="font-bold" style={{ color: themeConfig.accentTertiary }}>{getPadName(selectedPad)}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onOpenDrive && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onOpenDrive();
              }}
              className="text-cyan-400 hover:text-white text-[11px] font-space font-bold px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-xl active:scale-95 transition-all border border-cyan-500/30 flex items-center gap-1"
              title={lang === 'uk' ? 'Google Drive Хмара' : 'Google Drive Cloud'}
            >
              <span>☁️</span>
              <span>{lang === 'uk' ? 'Drive' : 'Drive'}</span>
            </button>
          )}
          {onResetPreset && (
            <button
              onClick={() => {
                triggerHaptic();
                onResetPreset();
              }}
              className="text-white/70 hover:text-white text-[11px] font-space font-bold px-2.5 py-1 bg-white/5 rounded-xl active:scale-95 transition-all border border-white/10"
            >
              {t.resetPreset}
            </button>
          )}
          <button
            onClick={() => {
              triggerHaptic();
              onClearPattern();
            }}
            className="text-[#FF003C] hover:bg-[#FF003C] hover:text-white text-[11px] font-space font-bold px-2.5 py-1 bg-[#1B0F15] border border-[#FF003C]/30 rounded-xl active:scale-95 transition-all shadow-sm"
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
              className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-space font-bold transition-all flex items-center gap-1.5 border select-none"
              style={{
                backgroundColor: isSelected ? themeConfig.accent : themeConfig.bgCard,
                borderColor: isSelected ? themeConfig.accent : themeConfig.borderSubtle,
                color: isSelected ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                boxShadow: isSelected ? `0 0 12px ${themeConfig.accentGlow}` : 'none',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: pad.color }}
              />
              <span className="truncate max-w-[85px]">{padTitle}</span>
              {hasNotes && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: isSelected ? '#000000' : themeConfig.accentTertiary,
                  }}
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
              className="aspect-square rounded-2xl flex flex-col justify-between p-2 sm:p-2.5 transition-all relative select-none border"
              style={{
                backgroundColor: isTriggered 
                  ? themeConfig.accentTertiary 
                  : isBeatStart 
                  ? `${themeConfig.bgCard}` 
                  : `${themeConfig.bgMain}`,
                borderColor: isTriggered 
                  ? themeConfig.accentTertiary 
                  : isBeatStart 
                  ? themeConfig.borderActive 
                  : themeConfig.borderSubtle,
                boxShadow: isTriggered ? `0 0 16px ${themeConfig.accentTertiary}80` : 'none',
                transform: isTriggered ? 'scale(0.97)' : 'scale(1)',
              }}
            >
              <div className="flex justify-between items-center w-full">
                <span
                  className="text-[9.5px] font-space font-bold"
                  style={{
                    color: isTriggered ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                {isBeatStart && (
                  <span
                    className="text-[8px] font-space font-bold uppercase"
                    style={{
                      color: isTriggered ? '#FFFFFF' : themeConfig.accent,
                    }}
                  >
                    B{Math.floor(idx / 4) + 1}
                  </span>
                )}
              </div>

              {/* Step indicator LED */}
              <div className="w-full flex justify-end">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: isTriggered
                      ? '#FFFFFF'
                      : isBeatStart
                      ? `${themeConfig.accent}50`
                      : 'rgba(255, 255, 255, 0.1)',
                  }}
                />
              </div>

              {/* Playhead highlight frame */}
              {isPlayhead && (
                <div 
                  className="absolute inset-0 border-2 rounded-2xl pointer-events-none animate-pulse"
                  style={{
                    borderColor: themeConfig.accentSecondary,
                    backgroundColor: `${themeConfig.accentSecondary}25`,
                    boxShadow: `0 0 12px ${themeConfig.accentSecondary}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
