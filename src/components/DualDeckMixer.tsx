import React, { useEffect, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { ThemeId } from '../types';
import { THEMES } from '../utils/theme';

export const DualDeckMixer: React.FC<{ theme?: ThemeId }> = ({ theme = 'onyx' }) => {
  const t = THEMES[theme] || THEMES.onyx;
  const [gainA, setGainA] = useState(0.85);
  const [gainB, setGainB] = useState(0.85);
  const [xfade, setXfade] = useState(0.5);
  const [vu, setVu] = useState({ left: 0, right: 0 });

  useEffect(() => {
    audioEngine.setDeckGain('A', gainA);
    audioEngine.setDeckGain('B', gainB);
    audioEngine.setXfade(xfade);
  }, [gainA, gainB, xfade]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const d = audioEngine.getVUData();
      setVu({ left: d.left, right: d.right });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="px-3 pb-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-2" style={{ background: t.bgCard, border: `1px solid ${t.borderSubtle}` }}>
          <p className="text-[9px] tracking-[0.2em]" style={{ color: t.accent }}>DECK A</p>
          <p className="mb-1 truncate text-[10px] text-white/50">PADS</p>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={gainA}
            onChange={(e) => setGainA(Number(e.target.value))}
            className="h-11 w-full"
            style={{ accentColor: t.accent }}
          />
        </div>
        <div className="rounded-lg p-2" style={{ background: t.bgCard, border: `1px solid ${t.borderSubtle}` }}>
          <p className="text-[9px] tracking-[0.2em]" style={{ color: t.accent }}>DECK B</p>
          <p className="mb-1 truncate text-[10px] text-white/50">TRACK</p>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={gainB}
            onChange={(e) => setGainB(Number(e.target.value))}
            className="h-11 w-full"
            style={{ accentColor: t.accent }}
          />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[10px] font-semibold" style={{ color: t.accent }}>A</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={xfade}
          onChange={(e) => setXfade(Number(e.target.value))}
          className="h-11 flex-1"
          style={{ accentColor: t.accent }}
        />
        <span className="text-[10px] font-semibold text-red-500">B</span>
      </div>
      <div className="mt-1 flex h-1.5 gap-0.5">
        <span className="block h-full rounded-full" style={{ width: `${Math.round(vu.left * 100)}%`, background: t.accent }} />
        <span className="block h-full rounded-full bg-red-500" style={{ width: `${Math.round(vu.right * 100)}%` }} />
      </div>
    </div>
  );
};
