import React, { useState } from 'react';
import { PadDefinition, BankId, Language } from '../types';
import { UKRAINIAN_PAD_NAMES } from '../utils/translations';

interface PerformancePadsProps {
  pads: PadDefinition[];
  currentBank: BankId;
  lang: Language;
  onTriggerPad: (padIndex: number, velocity?: number) => void;
  activePadIndices: Set<number>;
}

// Neon party color scheme based on sound category
const getPadNeonColor = (category: string) => {
  switch (category) {
    case 'kick':
      return {
        idleBg: 'bg-[#150B10]',
        border: 'border-[#FF3366]/40',
        activeGlow: 'bg-[#FF3366] text-black shadow-[0_0_24px_#FF3366,inset_0_0_12px_#FFF]',
        text: 'text-[#FF3366]',
        dot: 'bg-[#FF3366]',
      };
    case 'snare':
    case 'clap':
      return {
        idleBg: 'bg-[#180C1A]',
        border: 'border-[#FF007F]/40',
        activeGlow: 'bg-[#FF007F] text-white shadow-[0_0_24px_#FF007F,inset_0_0_12px_#FFF]',
        text: 'text-[#FF007F]',
        dot: 'bg-[#FF007F]',
      };
    case 'hihat':
      return {
        idleBg: 'bg-[#18160B]',
        border: 'border-[#FFE600]/40',
        activeGlow: 'bg-[#FFE600] text-black shadow-[0_0_24px_#FFE600,inset_0_0_12px_#FFF]',
        text: 'text-[#FFE600]',
        dot: 'bg-[#FFE600]',
      };
    case 'tom':
    case 'percussion':
      return {
        idleBg: 'bg-[#0A1812]',
        border: 'border-[#00FF88]/40',
        activeGlow: 'bg-[#00FF88] text-black shadow-[0_0_24px_#00FF88,inset_0_0_12px_#FFF]',
        text: 'text-[#00FF88]',
        dot: 'bg-[#00FF88]',
      };
    case 'cymbal':
      return {
        idleBg: 'bg-[#09151A]',
        border: 'border-[#00F0FF]/40',
        activeGlow: 'bg-[#00F0FF] text-black shadow-[0_0_24px_#00F0FF,inset_0_0_12px_#FFF]',
        text: 'text-[#00F0FF]',
        dot: 'bg-[#00F0FF]',
      };
    case 'bass':
    default:
      return {
        idleBg: 'bg-[#120B1A]',
        border: 'border-[#C77DFF]/40',
        activeGlow: 'bg-[#C77DFF] text-black shadow-[0_0_24px_#C77DFF,inset_0_0_12px_#FFF]',
        text: 'text-[#C77DFF]',
        dot: 'bg-[#C77DFF]',
      };
  }
};

export const PerformancePads: React.FC<PerformancePadsProps> = ({
  pads,
  currentBank,
  lang,
  onTriggerPad,
  activePadIndices,
}) => {
  const [pressedPads, setPressedPads] = useState<Set<number>>(new Set());

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

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-2.5 w-full select-none touch-manipulation">
      {pads.map((pad) => {
        const isPressed = pressedPads.has(pad.id) || activePadIndices.has(pad.id);
        const localizedName =
          lang === 'uk' && UKRAINIAN_PAD_NAMES[currentBank]?.[pad.id]
            ? UKRAINIAN_PAD_NAMES[currentBank][pad.id]
            : pad.name;

        const colorCfg = getPadNeonColor(pad.category);

        return (
          <button
            key={pad.id}
            type="button"
            onTouchStart={(e) => handleTouchStart(e, pad.id)}
            onTouchEnd={(e) => handleTouchEnd(e, pad.id)}
            onMouseDown={(e) => handleTouchStart(e, pad.id)}
            onMouseUp={(e) => handleTouchEnd(e, pad.id)}
            onMouseLeave={(e) => handleTouchEnd(e, pad.id)}
            className={`aspect-square rounded-2xl flex flex-col justify-between p-2 sm:p-2.5 transition-transform duration-75 select-none cursor-pointer border ${
              isPressed
                ? `${colorCfg.activeGlow} scale-95 font-bold`
                : `${colorCfg.idleBg} ${colorCfg.border} hover:border-white/50 active:scale-95 shadow-[0_4px_10px_rgba(0,0,0,0.5)]`
            }`}
          >
            {/* Pad Number & Status LED */}
            <div className="flex items-center justify-between w-full">
              <span
                className={`text-[10px] sm:text-[11px] font-bold font-space ${
                  isPressed ? 'text-inherit' : 'text-white/60'
                }`}
              >
                {String(pad.id + 1).padStart(2, '0')}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isPressed ? 'bg-white shadow-[0_0_8px_#FFF]' : `${colorCfg.dot} opacity-70`
                }`}
              />
            </div>

            {/* Localized Pad Title & Description */}
            <div className="flex flex-col items-start w-full gap-0.5">
              <span
                className={`text-[10.5px] sm:text-[11px] font-bold tracking-tight uppercase leading-none text-left w-full font-space select-none break-words ${
                  isPressed ? 'text-inherit font-extrabold' : colorCfg.text
                }`}
              >
                {localizedName}
              </span>
              {pad.description && (
                <span
                  className={`text-[8px] sm:text-[9px] leading-tight text-left w-full font-inter select-none truncate opacity-80 ${
                    isPressed ? 'text-inherit' : 'text-white/50'
                  }`}
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
