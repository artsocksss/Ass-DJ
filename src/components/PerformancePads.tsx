import React, { useState } from 'react';
import { PadDefinition } from '../types';

interface PerformancePadsProps {
  pads: PadDefinition[];
  onTriggerPad: (padIndex: number, velocity?: number) => void;
  activePadIndices: Set<number>;
}

export const PerformancePads: React.FC<PerformancePadsProps> = ({ pads, onTriggerPad, activePadIndices }) => {
  const [pressedPads, setPressedPads] = useState<Set<number>>(new Set());

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent, padIndex: number) => {
    if ('touches' in e) e.preventDefault();
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
    <div className="grid grid-cols-4 gap-3 w-full">
      {pads.map((pad) => {
        const isPressed = pressedPads.has(pad.id) || activePadIndices.has(pad.id);
        return (
          <div
            key={pad.id}
            onTouchStart={(e) => handleTouchStart(e, pad.id)}
            onTouchEnd={(e) => handleTouchEnd(e, pad.id)}
            onMouseDown={(e) => handleTouchStart(e, pad.id)}
            onMouseUp={(e) => handleTouchEnd(e, pad.id)}
            onMouseLeave={(e) => handleTouchEnd(e, pad.id)}
            className={`aspect-square rounded-[1.25rem] flex flex-col justify-between p-3.5 transition-all duration-75 select-none ${
              isPressed ? 'scale-95' : 'bg-[#1C1C1E]'
            }`}
            style={{ backgroundColor: isPressed ? pad.color : undefined }}
          >
             <span className={`text-[11px] font-semibold ${isPressed ? 'text-black/60' : 'text-neutral-500'}`}>
               {pad.id + 1}
             </span>
             <span className={`text-[10px] font-semibold tracking-tight uppercase truncate ${isPressed ? 'text-black' : 'text-white'}`}>
               {pad.name}
             </span>
          </div>
        );
      })}
    </div>
  );
};
