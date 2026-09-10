import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface WaveformVisualizerProps {
  lang: Language;
}

type VisualizerMode = 'wave' | 'spectrum' | 'hybrid';

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
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
      const analyser = audioEngine.getWaveformAnalyser();
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // 1. Clear background to deep Pioneer OLED black
      ctx.fillStyle = '#06060A';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw subtle background Pioneer grid & center line
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      // Horizontal center zero-axis
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      // Top & Bottom guide lines (+6dB / -6dB)
      ctx.moveTo(0, height * 0.2);
      ctx.lineTo(width, height * 0.2);
      ctx.moveTo(0, height * 0.8);
      ctx.lineTo(width, height * 0.8);

      // Vertical bar division markers (quarter markers)
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

        // Calculate RMS to determine signal presence
        let sumSquares = 0;
        for (let i = 0; i < timeData.length; i++) {
          const norm = (timeData[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        rms = Math.sqrt(sumSquares / timeData.length);
        hasAudio = rms > 0.008;
      }

      // Update HUD RMS reading throttled (every ~80ms)
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

      // 3. Render Spectrum Bars (for 'spectrum' or 'hybrid' modes)
      if (mode === 'spectrum' || mode === 'hybrid') {
        const barCount = 32;
        const barWidth = width / barCount;
        const barPadding = 1.5;

        // Initialize or resize peak hold array
        if (peakHoldRef.current.length !== barCount) {
          peakHoldRef.current = new Array(barCount).fill(0);
        }

        const opacity = mode === 'hybrid' ? 0.45 : 0.85;

        for (let i = 0; i < barCount; i++) {
          // Logarithmic distribution for frequency bins
          const freqIndex = Math.min(
            freqData.length - 1,
            Math.floor(Math.pow(i / barCount, 1.8) * (freqData.length * 0.75))
          );
          const rawVal = hasAudio ? freqData[freqIndex] / 255 : 0;
          const val = Math.min(1, rawVal * gainBoost);
          const barHeight = val * (height * 0.85);

          // Update peak hold with decay
          const curPeak = peakHoldRef.current[i] || 0;
          if (val > curPeak) {
            peakHoldRef.current[i] = val;
          } else {
            peakHoldRef.current[i] = Math.max(0, curPeak - 0.015);
          }

          const bx = i * barWidth + barPadding;
          const bw = Math.max(1, barWidth - barPadding * 2);
          const by = height - barHeight;

          // Color gradient: Cyan (lows/mids) -> Neon Green -> Yellow -> Hot Magenta (peaks)
          const grad = ctx.createLinearGradient(bx, height, bx, by);
          if (val > 0.8) {
            grad.addColorStop(0, `rgba(0, 240, 255, ${opacity * 0.7})`);
            grad.addColorStop(0.6, `rgba(0, 255, 102, ${opacity})`);
            grad.addColorStop(0.85, `rgba(255, 230, 0, ${opacity})`);
            grad.addColorStop(1, `rgba(255, 0, 127, ${opacity})`);
          } else {
            grad.addColorStop(0, `rgba(0, 240, 255, ${opacity * 0.5})`);
            grad.addColorStop(0.7, `rgba(0, 255, 102, ${opacity * 0.8})`);
            grad.addColorStop(1, `rgba(0, 240, 255, ${opacity})`);
          }

          ctx.fillStyle = grad;
          ctx.fillRect(bx, by, bw, barHeight);

          // Peak hold cap marker
          const peakY = height - peakHoldRef.current[i] * (height * 0.85);
          if (peakHoldRef.current[i] > 0.05) {
            ctx.fillStyle = peakHoldRef.current[i] > 0.85 ? '#FF007F' : '#00F0FF';
            ctx.fillRect(bx, peakY - 1.5, bw, 2);
          }
        }
      }

      // 4. Render Oscilloscope Time-Domain Waveform (for 'wave' or 'hybrid' modes)
      if (mode === 'wave' || mode === 'hybrid') {
        const sliceWidth = width / (timeData.length - 1);

        // Path for upper and lower wave
        ctx.beginPath();
        let firstX = 0;
        let firstY = centerY;

        if (hasAudio) {
          for (let i = 0; i < timeData.length; i++) {
            const v = (timeData[i] - 128) / 128; // -1 to +1
            const amplified = v * gainBoost;
            const y = centerY - amplified * (height * 0.44);

            const x = i * sliceWidth;
            if (i === 0) {
              firstX = x;
              firstY = y;
              ctx.moveTo(x, y);
            } else {
              // Smooth bezier curve between samples
              ctx.lineTo(x, y);
            }
          }
        } else {
          // Idle digital heartbeat pulse
          idlePhase += 0.04;
          for (let i = 0; i < timeData.length; i++) {
            const x = i * sliceWidth;
            const wave1 = Math.sin(i * 0.08 + idlePhase) * 2.5;
            const wave2 = Math.sin(i * 0.03 - idlePhase * 0.5) * 1.5;
            const y = centerY + wave1 + wave2;

            if (i === 0) {
              firstX = x;
              firstY = y;
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
        }

        // A. Draw glowing gradient body fill underneath the waveform
        ctx.save();
        const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
        if (hasAudio && rms * gainBoost > 0.4) {
          fillGrad.addColorStop(0, 'rgba(255, 0, 127, 0.25)');
          fillGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.18)');
          fillGrad.addColorStop(1, 'rgba(0, 255, 102, 0.25)');
        } else {
          fillGrad.addColorStop(0, 'rgba(0, 240, 255, 0.18)');
          fillGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.05)');
          fillGrad.addColorStop(1, 'rgba(0, 240, 255, 0.18)');
        }

        // Close fill path along the center zero-axis
        ctx.lineTo(width, centerY);
        ctx.lineTo(0, centerY);
        ctx.closePath();
        ctx.fillStyle = fillGrad;
        ctx.fill();
        ctx.restore();

        // B. Re-trace wave line for the sharp neon crest
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

        // Neon stroke with intense glow
        ctx.save();
        ctx.lineWidth = mode === 'hybrid' ? 2 : 2.5;
        const strokeColor = hasAudio
          ? (rms * gainBoost > 0.5 ? '#FF007F' : '#00F0FF')
          : 'rgba(0, 240, 255, 0.6)';

        ctx.strokeStyle = strokeColor;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = hasAudio ? 12 : 6;
        ctx.stroke();
        ctx.restore();
      }

      // 5. Center Playhead Needle Indicator
      ctx.save();
      const needleX = width / 2;
      ctx.strokeStyle = 'rgba(255, 230, 0, 0.6)';
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

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mode, gainBoost]);

  // Handle Retina & Responsive Canvas Resizing
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
    <div className="bg-[#08080E] rounded-xl p-2 sm:p-2.5 flex flex-col gap-1.5 w-full border border-[#00F0FF]/25 shadow-[0_0_15px_rgba(0,240,255,0.1),inset_0_1px_0_rgba(255,255,255,0.08)]">
      {/* Visualizer Top Bar: Mode Selectors, Gain & Live dB HUD */}
      <div className="flex items-center justify-between gap-1 text-[10px] font-space font-bold">
        {/* Left: Indicator & Title */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse shadow-[0_0_6px_#00FF66]" />
          <span className="text-white/80 uppercase tracking-wider text-[9.5px]">
            {t.waveformLive}
          </span>
          <span
            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border transition-colors ${
              isClipping
                ? 'bg-[#FF003C] text-white border-[#FF003C] animate-pulse shadow-[0_0_8px_#FF003C]'
                : 'bg-[#141422] text-[#00F0FF] border-[#00F0FF]/30'
            }`}
          >
            {rmsDisplay}
          </span>
        </div>

        {/* Right: Mode & Zoom Controls */}
        <div className="flex items-center gap-1">
          {/* Zoom / Gain Multiplier */}
          <button
            type="button"
            onClick={() => {
              setGainBoost((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2.5 : 1));
            }}
            className="px-1.5 py-0.5 rounded bg-[#141420] text-white/70 hover:text-white border border-white/15 text-[9px] active:scale-95 transition-all"
            title="Adjust Visualizer Gain"
          >
            {gainBoost}x
          </button>

          {/* Modes: Wave / Spectrum / Hybrid */}
          <div className="flex items-center bg-[#12121D] p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setMode('wave')}
              className={`px-1.5 py-0.5 rounded text-[8.5px] transition-all font-bold ${
                mode === 'wave'
                  ? 'bg-[#00F0FF] text-black shadow-[0_0_8px_rgba(0,240,255,0.5)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t.modeWave}
            </button>
            <button
              type="button"
              onClick={() => setMode('spectrum')}
              className={`px-1.5 py-0.5 rounded text-[8.5px] transition-all font-bold ${
                mode === 'spectrum'
                  ? 'bg-[#FF007F] text-white shadow-[0_0_8px_rgba(255,0,127,0.5)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t.modeSpectrum}
            </button>
            <button
              type="button"
              onClick={() => setMode('hybrid')}
              className={`px-1.5 py-0.5 rounded text-[8.5px] transition-all font-bold ${
                mode === 'hybrid'
                  ? 'bg-[#00FF66] text-black shadow-[0_0_8px_rgba(0,255,102,0.5)]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t.modeHybrid}
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Waveform Display */}
      <div
        ref={containerRef}
        className="relative w-full h-[68px] sm:h-[76px] rounded-lg overflow-hidden bg-[#06060A] border border-white/10 shadow-inner"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Phase/Time Ruler Markings at bottom */}
        <div className="absolute bottom-0.5 left-2 right-2 flex justify-between pointer-events-none text-[7.5px] font-mono text-white/30">
          <span>-1.0</span>
          <span>-0.5</span>
          <span className="text-[#FFE600]/60">0.0</span>
          <span>+0.5</span>
          <span>+1.0</span>
        </div>
      </div>
    </div>
  );
};
