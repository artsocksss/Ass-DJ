import { audioEngine } from './AudioEngine';
import { QuantizeMode } from '../types';

export interface StepEvent {
  step: number;
  time: number;
  bar: number;
  beat: number;
  sixteenth: number;
}

export interface QuantizeResult {
  scheduledTime: number; // The exact Web Audio time to trigger playback
  targetStep: number;    // 0-15 sequencer step index
  division: '1/16' | '1/32' | '1/8' | 'raw';
  offsetMs: number;      // offset in ms from ideal grid (negative = early, positive = late)
  isSmartQuantized: boolean;
}

export class SequencerClock {
  private isRunning: boolean = false;
  private bpm: number = 128;
  private swing: number = 0; // 0 to 0.5 (0 = straight, 0.5 = heavy shuffle)
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private timerId: number | null = null;
  private lookaheadMs: number = 25; // How frequently to call scheduler (ms)
  private scheduleAheadSec: number = 0.1; // How far ahead to schedule audio (s)

  // Step history ring buffer for high-precision quantization
  private scheduledSteps: Array<{ step: number; time: number; duration: number }> = [];

  // Callbacks
  private onStepScheduled?: (step: number, time: number) => void;
  private onStepUI?: (step: number, bar: number, beat: number, sixteenth: number) => void;

  constructor() {}

  public setCallbacks(
    onStepScheduled: (step: number, time: number) => void,
    onStepUI: (step: number, bar: number, beat: number, sixteenth: number) => void
  ) {
    this.onStepScheduled = onStepScheduled;
    this.onStepUI = onStepUI;
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(40, Math.min(220, bpm));
  }

  public setSwing(swingPercent: number) {
    // 0% to 100% maps to 0 to 0.35 swing ratio
    this.swing = (Math.max(0, Math.min(100, swingPercent)) / 100) * 0.35;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getBpm(): number {
    return this.bpm;
  }

  public getSwing(): number {
    return this.swing;
  }

  public getStepDuration(step: number): number {
    const secondsPerBeat = 60.0 / this.bpm;
    const baseSixteenthTime = 0.25 * secondsPerBeat;
    if (step % 2 === 0) {
      return baseSixteenthTime * (1 + this.swing);
    } else {
      return baseSixteenthTime * (1 - this.swing);
    }
  }

  public start() {
    if (this.isRunning) return;
    const ctx = audioEngine.getContext();
    this.isRunning = true;
    this.scheduledSteps = [];
    this.nextStepTime = ctx.currentTime + 0.05;
    this.schedulerLoop();
  }

  public pause() {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public stopAndCue() {
    this.pause();
    this.currentStep = 0;
    this.scheduledSteps = [];
    if (this.onStepUI) {
      this.onStepUI(0, 1, 1, 1);
    }
  }

  public getStep(): number {
    return this.currentStep;
  }

  /**
   * Smart Quantize Engine:
   * Dynamically evaluates the user's strike against the running groove grid.
   * Adaptively quantizes to 1/16th or 1/32nd note based on player dynamics (rolls/flams)
   * and distance to subdivisions, preserving micro-timing groove with swing.
   */
  public getQuantizedTime(
    currentTime: number,
    mode: QuantizeMode = 'SMART',
    lastTapTime?: number
  ): QuantizeResult {
    // If quantize is OFF, sequencer is stopped, or no steps scheduled yet, trigger immediately
    if (mode === 'OFF' || !this.isRunning || this.scheduledSteps.length === 0) {
      return {
        scheduledTime: currentTime,
        targetStep: this.currentStep,
        division: 'raw',
        offsetMs: 0,
        isSmartQuantized: false,
      };
    }

    // Find the closest scheduled step around currentTime
    let bestStep = this.scheduledSteps[0];
    let minDistance = Math.abs(currentTime - bestStep.time);

    for (let i = 1; i < this.scheduledSteps.length; i++) {
      const entry = this.scheduledSteps[i];
      const dist = Math.abs(currentTime - entry.time);
      if (dist < minDistance) {
        minDistance = dist;
        bestStep = entry;
      }
    }

    const stepIdx = this.scheduledSteps.indexOf(bestStep);
    const curr = bestStep;
    const next =
      stepIdx < this.scheduledSteps.length - 1
        ? this.scheduledSteps[stepIdx + 1]
        : {
            step: (curr.step + 1) % 16,
            time: curr.time + curr.duration,
            duration: this.getStepDuration((curr.step + 1) % 16),
          };
    const prev =
      stepIdx > 0
        ? this.scheduledSteps[stepIdx - 1]
        : {
            step: (curr.step + 15) % 16,
            time: curr.time - this.getStepDuration((curr.step + 15) % 16),
            duration: this.getStepDuration((curr.step + 15) % 16),
          };

    // Candidate 1/16th grid points
    const points16 = [
      { time: prev.time, step: prev.step },
      { time: curr.time, step: curr.step },
      { time: next.time, step: next.step },
    ];

    let nearest16 = points16[0];
    let dist16 = Math.abs(currentTime - nearest16.time);
    for (let i = 1; i < points16.length; i++) {
      const d = Math.abs(currentTime - points16[i].time);
      if (d < dist16) {
        dist16 = d;
        nearest16 = points16[i];
      }
    }

    // Candidate 1/32nd subdivisions (including 16th boundaries and midpoints)
    const points32 = [
      { time: prev.time, step: prev.step, isSubdivision: false },
      { time: prev.time + prev.duration * 0.5, step: prev.step, isSubdivision: true },
      { time: curr.time, step: curr.step, isSubdivision: false },
      { time: curr.time + curr.duration * 0.5, step: curr.step, isSubdivision: true },
      { time: next.time, step: next.step, isSubdivision: false },
      { time: next.time + next.duration * 0.5, step: next.step, isSubdivision: true },
    ];

    let nearest32 = points32[0];
    let dist32 = Math.abs(currentTime - nearest32.time);
    for (let i = 1; i < points32.length; i++) {
      const d = Math.abs(currentTime - points32[i].time);
      if (d < dist32) {
        dist32 = d;
        nearest32 = points32[i];
      }
    }

    let targetGridTime = nearest16.time;
    let targetStep = nearest16.step;
    let division: '1/16' | '1/32' | '1/8' = '1/16';

    if (mode === '1/16') {
      targetGridTime = nearest16.time;
      targetStep = nearest16.step;
      division = '1/16';
    } else if (mode === '1/32') {
      targetGridTime = nearest32.time;
      targetStep = nearest32.step;
      division = nearest32.isSubdivision ? '1/32' : '1/16';
    } else if (mode === '1/8') {
      const evenPoints = points16.filter((p) => p.step % 2 === 0);
      if (evenPoints.length > 0) {
        let bestEven = evenPoints[0];
        let bestEvenDist = Math.abs(currentTime - bestEven.time);
        for (let i = 1; i < evenPoints.length; i++) {
          const d = Math.abs(currentTime - evenPoints[i].time);
          if (d < bestEvenDist) {
            bestEvenDist = d;
            bestEven = evenPoints[i];
          }
        }
        targetGridTime = bestEven.time;
        targetStep = bestEven.step;
        division = '1/8';
      }
    } else if (mode === 'SMART') {
      // SMART QUANTIZE:
      // 1) Fast roll / flam / trap stutter detection (< 200ms interval between taps)
      const isRollOrFlam = lastTapTime !== undefined && currentTime - lastTapTime < 0.2;
      // 2) Groove proximity: did user intentionally land near the 32nd note subdivision?
      const isCloserTo32ndSubdivision = nearest32.isSubdivision && dist32 < dist16 * 0.68;

      if (isRollOrFlam || isCloserTo32ndSubdivision) {
        targetGridTime = nearest32.time;
        targetStep = nearest32.step;
        division = nearest32.isSubdivision ? '1/32' : '1/16';
      } else {
        targetGridTime = nearest16.time;
        targetStep = nearest16.step;
        division = '1/16';
      }
    }

    const deltaSec = targetGridTime - currentTime;
    const offsetMs = Math.round(deltaSec * 1000);

    // Audio scheduling calculation:
    // If target is in the future within tight window (<= 45ms), schedule for precision
    // If tap was early but too far ahead (> 45ms), clamp to 38ms so touch doesn't feel laggy
    // If target is in the past (tapped slightly late), trigger immediately
    let scheduledTime = currentTime;
    if (deltaSec > 0) {
      if (deltaSec <= 0.045) {
        scheduledTime = targetGridTime;
      } else {
        scheduledTime = currentTime + Math.min(deltaSec, 0.038);
      }
    } else {
      scheduledTime = currentTime;
    }

    return {
      scheduledTime,
      targetStep,
      division,
      offsetMs,
      isSmartQuantized: true,
    };
  }

  private schedulerLoop = () => {
    if (!this.isRunning) return;
    const ctx = audioEngine.getContext();

    while (this.nextStepTime < ctx.currentTime + this.scheduleAheadSec) {
      const step = this.currentStep;
      const time = this.nextStepTime;
      const duration = this.getStepDuration(step);
      this.scheduleStep(step, time, duration);
      this.advanceStep(duration);
    }

    this.timerId = window.setTimeout(this.schedulerLoop, this.lookaheadMs);
  };

  private scheduleStep(step: number, time: number, duration: number) {
    this.scheduledSteps.push({ step, time, duration });
    if (this.scheduledSteps.length > 48) {
      this.scheduledSteps.shift();
    }

    if (this.onStepScheduled) {
      this.onStepScheduled(step, time);
    }

    // Schedule UI update close to actual audio output
    const ctx = audioEngine.getContext();
    const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);

    setTimeout(() => {
      if (!this.isRunning) return;
      const bar = Math.floor(step / 16) + 1;
      const beat = Math.floor((step % 16) / 4) + 1;
      const sixteenth = (step % 4) + 1;
      if (this.onStepUI) {
        this.onStepUI(step, bar, beat, sixteenth);
      }
    }, delayMs);
  }

  private advanceStep(duration?: number) {
    const stepDuration = duration ?? this.getStepDuration(this.currentStep);
    this.nextStepTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % 16;
  }
}

export const sequencerClock = new SequencerClock();

