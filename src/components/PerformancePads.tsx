import React, { useState, useEffect, useRef } from 'react';
import { PadDefinition } from '../types';

interface PerformancePadsProps {
  pads: PadDefinition[];
  onTriggerPad: (padIndex: number, velocity?: number) => void;
  activePadIndices: Set<number>;
  selectedPadIndex: number;
  onSelectPad: (padIndex: number) => void;
}

export const PerformancePads: React.FC<PerformancePadsProps> = ({
  pads,
  onTriggerPad,
  activePadIndices,
  selectedPadIndex,
  onSelectPad,
}) => {
  // Track currently pressed pads for visual feedback
  const [pressedPads, setPressedPads] = useState<Set<number>>(new Set());
  const touchTimesRef = useRef<Map<number, number>>(new Map());

  // Handle touch start with e.preventDefault() for iOS zero-latency response
  const handleTouchStart = (e: React.TouchEvent, padIndex: number) => {
    e.preventDefault(); // Disables mobile double tap zoom and 300ms click delay
    touchTimesRef.current.set(padIndex, performance.now());

    // Approximate velocity
    let velocity = 0.95;
    if (e.touches && e.touches.length > 0) {
      // iOS force touch or touch radius if available
      const touch = e.touches[0] as unknown as { force?: number; radiusX?: number };
      if (touch.force && touch.force > 0) {
        velocity = Math.min(1.0, 0.5 + touch.force * 0.5);
      }
    }

    setPressedPads((prev) => new Set(prev).add(padIndex));
    onSelectPad(padIndex);
    onTriggerPad(padIndex, velocity);
  };

  const handleTouchEnd = (e: React.TouchEvent, padIndex: number) => {
    e.preventDefault();
    setPressedPads((prev) => {
      const next = new Set(prev);
      next.delete(padIndex);
      return next;
    });
  };

  const handleMouseDown = (padIndex: number) => {
    setPressedPads((prev) => new Set(prev).add(padIndex));
    onSelectPad(padIndex);
    onTriggerPad(padIndex, 1.0);
  };

  const handleMouseUp = (padIndex: number) => {
    setPressedPads((prev) => {
      const next = new Set(prev);
      next.delete(padIndex);
      return next;
    });
  };

  return (
    <div
      id="performance-pads-matrix"
      className="p-3 sm:p-4 bg-[#0e1015] border border-neutral-800/80 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]"
    >
      {/* 4x4 Grid Matrix */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {pads.map((pad) => {
          const isPressed = pressedPads.has(pad.id) || activePadIndices.has(pad.id);
          const isSelected = selectedPadIndex === pad.id;

          return (
            <div
              key={pad.id}
              id={`drum-pad-${pad.id}`}
              onTouchStart={(e) => handleTouchStart(e, pad.id)}
              onTouchEnd={(e) => handleTouchEnd(e, pad.id)}
              onMouseDown={() => handleMouseDown(pad.id)}
              onMouseUp={() => handleMouseUp(pad.id)}
              onMouseLeave={() => handleMouseUp(pad.id)}
              className={`relative flex flex-col justify-between p-2 sm:p-2.5 min-h-[72px] sm:min-h-[86px] rounded-xl cursor-pointer select-none transition-all duration-75 touch-none ${
                isPressed
                  ? 'scale-[0.97] shadow-[0_0_18px_rgba(255,255,255,0.4)] brightness-125'
                  : 'shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] hover:border-neutral-600'
              } ${
                isSelected
                  ? 'ring-2 ring-amber-400/90'
                  : 'ring-1 ring-neutral-800'
              }`}
              style={{
                backgroundColor: isPressed ? pad.color : '#161922',
                borderColor: pad.color,
                borderWidth: '1.5px',
              }}
            >
              {/* Active illuminated glow layer */}
              {isPressed && (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none opacity-40 mix-blend-screen"
                  style={{ backgroundColor: pad.color }}
                />
              )}

              {/* Top Row: Pad Number & Keyboard Shortcut */}
              <div className="flex items-center justify-between pointer-events-none">
                <span
                  className={`text-[10px] font-mono font-black ${
                    isPressed ? 'text-black' : 'text-neutral-400'
                  }`}
                >
                  #{pad.id + 1}
                </span>

                <div
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                    isPressed
                      ? 'bg-black/30 text-white'
                      : 'bg-neutral-800/80 text-neutral-300 border border-neutral-700'
                  }`}
                >
                  {pad.keyShortcut}
                </div>
              </div>

              {/* Center / Bottom: Sound Name & Category */}
              <div className="pointer-events-none mt-1">
                <div
                  className={`text-xs sm:text-sm font-black font-mono tracking-tight leading-tight uppercase truncate ${
                    isPressed ? 'text-black' : 'text-white'
                  }`}
                >
                  {pad.name}
                </div>
                <div
                  className={`text-[9px] font-mono tracking-wider truncate uppercase ${
                    isPressed ? 'text-black/80 font-bold' : 'text-neutral-400'
                  }`}
                >
                  {pad.category}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
