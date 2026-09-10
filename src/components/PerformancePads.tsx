import React, { useState } from 'react';
import { PadDefinition, BankId, Language, ThemeId } from '../types';
import { UKRAINIAN_PAD_NAMES } from '../utils/translations';
import { THEMES, ThemeConfig } from '../utils/theme';

interface PerformancePadsProps {
  pads: PadDefinition[];
  currentBank: BankId;
  lang: Language;
  theme?: ThemeId;
  onTriggerPad: (padIndex: number, velocity?: number) => void;
  activePadIndices: Set<number>;
}

export const PerformancePads: React.FC<PerformancePadsProps> = ({
  pads,
  currentBank,
  lang,
  theme = 'onyx',
  onTriggerPad,
  activePadIndices,
}) => {
  const [pressedPads, setPressedPads] = useState<Set<number>>(new Set());
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch {
      // Ignore
    }
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent, padIndex: number) => {
    if ('touches' in e) e.preventDefault();
    triggerHaptic();
    setPressedPads((prev) => new Set(prev).add(padIndex));
    onTriggerPad(padIndex, 1.0);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent, padIndex: number) => {
    if ('touches' in e) e.preventDefault();
    setPressedPads((prev) => {
      const next = new Set(prev);
      next.delete(padIndex);
      return next;
    });
  };

  // Determine category accent color based on pad and active theme
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'kick':
        return themeConfig.accent;
      case 'snare':
      case 'clap':
        return themeConfig.accentTertiary;
      case 'hihat':
        return '#FFE600';
      case 'percussion':
      case 'tom':
        return themeConfig.accentSecondary;
      case 'sub':
      case 'bass':
      default:
        return '#00F0FF';
    }
  };

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full select-none touch-manipulation">
      {pads.map((pad) => {
        const isPressed = pressedPads.has(pad.id) || activePadIndices.has(pad.id);
        const localizedName =
          lang === 'uk' && UKRAINIAN_PAD_NAMES[currentBank]?.[pad.id]
            ? UKRAINIAN_PAD_NAMES[currentBank][pad.id]
            : pad.name;

        const catColor = getCategoryColor(pad.category);

        return (
          <button
            key={pad.id}
            type="button"
            onTouchStart={(e) => handleTouchStart(e, pad.id)}
            onTouchEnd={(e) => handleTouchEnd(e, pad.id)}
            onMouseDown={(e) => handleTouchStart(e, pad.id)}
            onMouseUp={(e) => handleTouchEnd(e, pad.id)}
            onMouseLeave={(e) => handleTouchEnd(e, pad.id)}
            className="aspect-square rounded-2xl flex flex-col justify-between p-2 sm:p-2.5 transition-all duration-75 select-none cursor-pointer border"
            style={{
              backgroundColor: isPressed ? catColor : themeConfig.bgPad,
              borderColor: isPressed ? catColor : `${catColor}35`,
              transform: isPressed ? 'scale(0.96)' : 'scale(1)',
              boxShadow: isPressed
                ? `0 0 20px ${catColor}, inset 0 0 10px rgba(255,255,255,0.6)`
                : `0 4px 12px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Pad Number & LED */}
            <div className="flex items-center justify-between w-full">
              <span
                className="text-[9.5px] sm:text-[10.5px] font-bold font-space transition-colors"
                style={{
                  color: isPressed ? '#000000' : 'rgba(255, 255, 255, 0.45)',
                }}
              >
                {String(pad.id + 1).padStart(2, '0')}
              </span>
              <span
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: isPressed ? '#FFFFFF' : catColor,
                  boxShadow: isPressed ? '0 0 8px #FFF' : `0 0 5px ${catColor}80`,
                }}
              />
            </div>

            {/* Localized Pad Title & Description */}
            <div className="flex flex-col items-start w-full gap-0.5">
              <span
                className="text-[10px] sm:text-[10.5px] font-bold tracking-tight uppercase leading-tight text-left w-full font-space select-none break-words"
                style={{
                  color: isPressed ? '#000000' : catColor,
                }}
              >
                {localizedName}
              </span>
              {pad.description && (
                <span
                  className="text-[7.5px] sm:text-[8px] leading-tight text-left w-full font-inter select-none truncate"
                  style={{
                    color: isPressed ? '#111111' : 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  {pad.description}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
