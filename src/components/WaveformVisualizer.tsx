import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { Language, ThemeId } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { THEMES, ThemeConfig } from '../utils/theme';

interface WaveformVisualizerProps {
  lang: Language;
  theme?: ThemeId;
}

type VisualizerMode = 'wave' | 'spectrum' | 'hybrid';

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  lang,
  theme = 'onyx',
}) => {
  const t = TRANSLATIONS[lang];
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<VisualizerMode>('hybrid');
  const [gainBoost, setGainBoost] = useState<number>(1.5);
  const [rmsDisplay, setRmsDisplay] = useState<string>('0.0 dB');
  const [isClipping, setIsClipping] = useState<boolean>(false);

  // Peak hold data for spectrum bars
  const peakHoldRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let idlePhase = 0;
    const fftSize = 512;
    const timeData = new Uint8Array(fftSize);
    const freqData = new Uint8Array(fftSize / 2);

    let lastRmsUpdate = 0;

    const render = (timestamp: number) => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      const analyser = audioEngine.getWaveformAnalyser();
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // 1. Clear background to dark minimal background
      ctx.fillStyle = themeConfig.bgMain;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw subtle background studio grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.moveTo(0, height * 0.25);
      ctx.lineTo(width, height * 0.25);
      ctx.moveTo(0, height * 0.75);
      ctx.lineTo(width, height * 0.75);

      for (let x = 0; x <= width; x += width / 8) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();

      let hasAudio = false;
      let rms = 0;

      if (analyser) {
        analyser.getByteTimeDomainData(timeData);
        analyser.getByteFrequencyData(freqData);

        let sumSquares = 0;
        for (let i = 0; i < timeData.length; i++) {
          const norm = (timeData[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        rms = Math.sqrt(sumSquares / timeData.length);
        hasAudio = rms > 0.008;
      }

      // Update HUD RMS reading
      if (timestamp - lastRmsUpdate > 80) {
        lastRmsUpdate = timestamp;
        if (hasAudio) {
          const db = Math.max(-48, Math.round(20 * Math.log10(rms * gainBoost)));
          setRmsDisplay(`${db > 0 ? `+${db}` : db} dB`);
          setIsClipping(rms * gainBoost >= 0.95);
        } else {
          setRmsDisplay('-INF');
          setIsClipping(false);
        }
      }

      // 3. Render Spectrum Bars
      if (mode === 'spectrum' || mode === 'hybrid') {
        const barCount = 32;
        const barWidth = width / barCount;
        const barPadding = 1.5;

        if (peakHoldRef.current.length !== barCount) {
          peakHoldRef.current = new Array(barCount).fill(0);
        }

        const opacity = mode === 'hybrid' ? 0.45 : 0.85;

        for (let i = 0; i < barCount; i++) {
          const freqIndex = Math.min(
            freqData.length - 1,
            Math.floor(Math.pow(i / barCount, 1.8) * (freqData.length * 0.75))
          );
          const rawVal = hasAudio ? freqData[freqIndex] / 255 : 0;
          const val = Math.min(1, rawVal * gainBoost);
          const barHeight = val * (height * 0.85);

          const curPeak = peakHoldRef.current[i] || 0;
          if (val > curPeak) {
            peakHoldRef.current[i] = val;
          } else {
            peakHoldRef.current[i] = Math.max(0, curPeak - 0.015);
          }

          const bx = i * barWidth + barPadding;
          const bw = Math.max(1, barWidth - barPadding * 2);
          const by = height - barHeight;

          const grad = ctx.createLinearGradient(bx, height, bx, by);
          grad.addColorStop(0, `${themeConfig.accent}20`);
          grad.addColorStop(0.7, `${themeConfig.accentSecondary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`);
          grad.addColorStop(1, `${themeConfig.accent}`);

          ctx.fillStyle = grad;
          ctx.fillRect(bx, by, bw, barHeight);

          // Peak cap
          const peakY = height - peakHoldRef.current[i] * (height * 0.85);
          if (peakHoldRef.current[i] > 0.05) {
            ctx.fillStyle = themeConfig.accent;
            ctx.fillRect(bx, peakY - 1.5, bw, 2);
          }
        }
      }

      // 4. Render Oscilloscope Time-Domain Waveform
      if (mode === 'wave' || mode === 'hybrid') {
        const sliceWidth = width / (timeData.length - 1);
        ctx.beginPath();

        if (hasAudio) {
          for (let i = 0; i < timeData.length; i++) {
            const v = (timeData[i] - 128) / 128;
            const amplified = v * gainBoost;
            const y = centerY - amplified * (height * 0.44);
            const x = i * sliceWidth;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        } else {
          idlePhase += 0.04;
          for (let i = 0; i < timeData.length; i++) {
            const x = i * sliceWidth;
            const wave1 = Math.sin(i * 0.08 + idlePhase) * 2.5;
            const wave2 = Math.sin(i * 0.03 - idlePhase * 0.5) * 1.5;
            const y = centerY + wave1 + wave2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }

        // Fill glow
        ctx.save();
        const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
        fillGrad.addColorStop(0, `${themeConfig.accent}25`);
        fillGrad.addColorStop(0.5, `${themeConfig.accent}08`);
        fillGrad.addColorStop(1, `${themeConfig.accent}25`);

        ctx.lineTo(width, centerY);
        ctx.lineTo(0, centerY);
        ctx.closePath();
        ctx.fillStyle = fillGrad;
        ctx.fill();
        ctx.restore();

        // Wave outline
        ctx.save();
        ctx.beginPath();
        if (hasAudio) {
          for (let i = 0; i < timeData.length; i++) {
            const v = (timeData[i] - 128) / 128;
            const amplified = v * gainBoost;
            const y = centerY - amplified * (height * 0.44);
            const x = i * sliceWidth;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        } else {
          for (let i = 0; i < timeData.length; i++) {
            const x = i * sliceWidth;
            const wave1 = Math.sin(i * 0.08 + idlePhase) * 2.5;
            const wave2 = Math.sin(i * 0.03 - idlePhase * 0.5) * 1.5;
            const y = centerY + wave1 + wave2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }

        ctx.lineWidth = mode === 'hybrid' ? 2 : 2.5;
        ctx.strokeStyle = hasAudio ? themeConfig.accent : `${themeConfig.accent}80`;
        ctx.shadowColor = themeConfig.accent;
        ctx.shadowBlur = hasAudio ? 10 : 4;
        ctx.stroke();
        ctx.restore();
      }

      // 5. Center Playhead Needle
      ctx.save();
      const needleX = width / 2;
      ctx.strokeStyle = `${themeConfig.accentSecondary}80`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(needleX, 0);
      ctx.lineTo(needleX, height);
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [mode, gainBoost, themeConfig]);

  // Retina & Responsive Canvas Resizing
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      className="rounded-2xl p-2.5 flex flex-col gap-1.5 w-full border transition-all"
      style={{
        backgroundColor: themeConfig.bgCard,
        borderColor: themeConfig.borderSubtle,
      }}
    >
      {/* Visualizer Top Bar */}
      <div className="flex items-center justify-between gap-1 text-[10px] font-space font-bold">
        {/* Left: Indicator & Title */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: themeConfig.accent }} />
          <span className="text-white/70 uppercase tracking-wider text-[9px]">
            {t.waveformLive}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold border transition-colors ${
              isClipping
                ? 'bg-[#FF003C] text-white border-[#FF003C] animate-pulse shadow-[0_0_8px_#FF003C]'
                : 'text-white/80'
            }`}
            style={{
              backgroundColor: isClipping ? '#FF003C' : `${themeConfig.accent}15`,
              borderColor: isClipping ? '#FF003C' : `${themeConfig.accent}40`,
              color: isClipping ? '#FFF' : themeConfig.accent,
            }}
          >
            {rmsDisplay}
          </span>
        </div>

        {/* Right: Mode & Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setGainBoost((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2.5 : 1))}
            className="px-1.5 py-0.5 rounded bg-white/5 text-white/60 hover:text-white border border-white/10 text-[9px] active:scale-95 transition-all"
            title="Gain"
          >
            {gainBoost}x
          </button>

          <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setMode('wave')}
              className="px-1.5 py-0.5 rounded text-[8px] transition-all font-bold"
              style={{
                backgroundColor: mode === 'wave' ? themeConfig.accent : 'transparent',
                color: mode === 'wave' ? '#000' : 'rgba(255,255,255,0.5)',
              }}
            >
              {t.modeWave}
            </button>
            <button
              type="button"
              onClick={() => setMode('spectrum')}
              className="px-1.5 py-0.5 rounded text-[8px] transition-all font-bold"
              style={{
                backgroundColor: mode === 'spectrum' ? themeConfig.accentSecondary : 'transparent',
                color: mode === 'spectrum' ? '#000' : 'rgba(255,255,255,0.5)',
              }}
            >
              {t.modeSpectrum}
            </button>
            <button
              type="button"
              onClick={() => setMode('hybrid')}
              className="px-1.5 py-0.5 rounded text-[8px] transition-all font-bold"
              style={{
                backgroundColor: mode === 'hybrid' ? themeConfig.accentTertiary : 'transparent',
                color: mode === 'hybrid' ? '#000' : 'rgba(255,255,255,0.5)',
              }}
            >
              {t.modeHybrid}
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Waveform Display */}
      <div
        ref={containerRef}
        className="relative w-full h-[62px] sm:h-[70px] rounded-xl overflow-hidden border border-white/5 shadow-inner"
        style={{ backgroundColor: themeConfig.bgMain }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        <div className="absolute bottom-0.5 left-2 right-2 flex justify-between pointer-events-none text-[7px] font-mono text-white/20">
          <span>-1.0</span>
          <span>-0.5</span>
          <span style={{ color: themeConfig.accent }}>0.0</span>
          <span>+0.5</span>
          <span>+1.0</span>
        </div>
      </div>
    </div>
  );
};
