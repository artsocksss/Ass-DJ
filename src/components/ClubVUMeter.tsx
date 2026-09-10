import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/AudioEngine';

interface ClubVUMeterProps {
  compact?: boolean;
}

export const ClubVUMeter: React.FC<ClubVUMeterProps> = ({ compact = false }) => {
  const barLeftRef = useRef<HTMLDivElement>(null);
  const barRightRef = useRef<HTMLDivElement>(null);
  const peakLeftRef = useRef<HTMLDivElement>(null);
  const peakRightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;

    const render = () => {
      const vu = audioEngine.getVUData();

      const lPct = Math.min(100, Math.max(0, vu.left * 100));
      const rPct = Math.min(100, Math.max(0, vu.right * 100));
      const pLPct = Math.min(100, Math.max(0, vu.peakLeft * 100));
      const pRPct = Math.min(100, Math.max(0, vu.peakRight * 100));

      if (barLeftRef.current) {
        barLeftRef.current.style.width = `${lPct}%`;
      }
      if (barRightRef.current) {
        barRightRef.current.style.width = `${rPct}%`;
      }
      if (peakLeftRef.current) {
        peakLeftRef.current.style.left = `calc(${pLPct}% - 2px)`;
        peakLeftRef.current.style.opacity = pLPct > 5 ? '1' : '0.3';
      }
      if (peakRightRef.current) {
        peakRightRef.current.style.left = `calc(${pRPct}% - 2px)`;
        peakRightRef.current.style.opacity = pRPct > 5 ? '1' : '0.3';
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (compact) {
    return (
      <div className="flex flex-col gap-1 w-7 h-4 bg-[#0A0A0F] p-0.5 rounded border border-[#00F0FF]/30 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
        {/* L Channel */}
        <div className="h-1 w-full bg-[#161622] rounded-[1px] overflow-hidden relative">
          <div
            ref={barLeftRef}
            className="h-full bg-gradient-to-r from-[#00FF66] via-[#FFE600] to-[#FF003C] rounded-[1px] will-change-[width]"
            style={{ width: '0%' }}
          />
        </div>
        {/* R Channel */}
        <div className="h-1 w-full bg-[#161622] rounded-[1px] overflow-hidden relative">
          <div
            ref={barRightRef}
            className="h-full bg-gradient-to-r from-[#00FF66] via-[#FFE600] to-[#FF003C] rounded-[1px] will-change-[width]"
            style={{ width: '0%' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full bg-[#08080C] p-2 rounded-xl border border-[#00F0FF]/25 shadow-[inset_0_1px_4px_rgba(0,0,0,0.8),0_0_12px_rgba(0,240,255,0.15)]">
      {/* Channel Labels & Scale */}
      <div className="flex justify-between items-center px-1 text-[9px] font-space font-bold text-white/50">
        <span className="text-[#00F0FF]">VU STEREO</span>
        <div className="flex gap-4 text-[8px] font-mono">
          <span className="text-[#00FF66]">-12dB</span>
          <span className="text-[#FFE600]">-3dB</span>
          <span className="text-[#FF003C]">CLIP</span>
        </div>
      </div>

      {/* L Channel */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-space font-bold text-[#00F0FF] w-2.5">L</span>
        <div className="h-2 flex-1 bg-[#12121C] rounded-[3px] overflow-hidden relative border border-white/10">
          {/* Main Level Bar */}
          <div
            ref={barLeftRef}
            className="h-full bg-gradient-to-r from-[#00FF66] via-[#FFE600] to-[#FF003C] rounded-[2px] will-change-[width] transition-[width] duration-75"
            style={{ width: '0%' }}
          />
          {/* Peak Hold Marker */}
          <div
            ref={peakLeftRef}
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_6px_#FF003C] pointer-events-none will-change-[left]"
            style={{ left: '0%' }}
          />
        </div>
      </div>

      {/* R Channel */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-space font-bold text-[#FF007F] w-2.5">R</span>
        <div className="h-2 flex-1 bg-[#12121C] rounded-[3px] overflow-hidden relative border border-white/10">
          {/* Main Level Bar */}
          <div
            ref={barRightRef}
            className="h-full bg-gradient-to-r from-[#00FF66] via-[#FFE600] to-[#FF003C] rounded-[2px] will-change-[width] transition-[width] duration-75"
            style={{ width: '0%' }}
          />
          {/* Peak Hold Marker */}
          <div
            ref={peakRightRef}
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_6px_#FF003C] pointer-events-none will-change-[left]"
            style={{ left: '0%' }}
          />
        </div>
      </div>
    </div>
  );
};
