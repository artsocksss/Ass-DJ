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
        navigator.vibrate(10);
      }
    } catch {
      // Ignore vibration error
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
    <div className="grid grid-cols-4 gap-2.5 w-full select-none touch-manipulation">
      {pads.map((pad) => {
        const isPressed = pressedPads.has(pad.id) || activePadIndices.has(pad.id);
        const localizedName =
          lang === 'uk' && UKRAINIAN_PAD_NAMES[currentBank]?.[pad.id]
            ? UKRAINIAN_PAD_NAMES[currentBank][pad.id]
            : pad.name;

        return (
          <button
            key={pad.id}
            type="button"
            onTouchStart={(e) => handleTouchStart(e, pad.id)}
            onTouchEnd={(e) => handleTouchEnd(e, pad.id)}
            onMouseDown={(e) => handleTouchStart(e, pad.id)}
            onMouseUp={(e) => handleTouchEnd(e, pad.id)}
            onMouseLeave={(e) => handleTouchEnd(e, pad.id)}
            className={`aspect-square rounded-xl flex flex-col justify-between p-2 sm:p-2.5 transition-all duration-75 select-none cursor-pointer border-2 border-[#111113] ${
              isPressed
                ? 'bg-[#E94E38] text-white scale-95 shadow-sm'
                : 'bg-white text-[#111113] hover:bg-[#FAF9F5] active:bg-[#E94E38] active:text-white active:scale-95 shadow-[0_2px_0_#111113]'
            }`}
          >
            {/* Pad Number (01..16 in Space Mono) */}
            <div className="flex items-center justify-between w-full">
              <span
                className={`text-[10px] sm:text-[11px] font-bold font-space ${
                  isPressed ? 'text-white' : 'text-[#111113]/70'
                }`}
              >
                {String(pad.id + 1).padStart(2, '0')}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPressed ? 'bg-white' : 'bg-[#111113]'
                }`}
              />
            </div>

            {/* Localized Pad Title */}
            <span
              className={`text-[9px] sm:text-[10px] font-bold tracking-tight uppercase truncate text-left w-full font-space select-none ${
                isPressed ? 'text-white' : 'text-[#111113]'
              }`}
            >
              {localizedName}
            </span>
          </button>
        );
      })}
    </div>
  );
};
