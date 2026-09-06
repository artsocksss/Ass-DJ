import { audioEngine } from './AudioEngine';

export interface StepEvent {
  step: number;
  time: number;
  bar: number;
  beat: number;
  sixteenth: number;
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

  public start() {
    if (this.isRunning) return;
    const ctx = audioEngine.getContext();
    this.isRunning = true;
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
    if (this.onStepUI) {
      this.onStepUI(0, 1, 1, 1);
    }
  }

  public getStep(): number {
    return this.currentStep;
  }

  private schedulerLoop = () => {
    if (!this.isRunning) return;
    const ctx = audioEngine.getContext();

    while (this.nextStepTime < ctx.currentTime + this.scheduleAheadSec) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }

    this.timerId = window.setTimeout(this.schedulerLoop, this.lookaheadMs);
  };

  private scheduleStep(step: number, time: number) {
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

  private advanceStep() {
    const secondsPerBeat = 60.0 / this.bpm;
    const baseSixteenthTime = 0.25 * secondsPerBeat;

    // Apply swing on odd steps (1, 3, 5...)
    let duration = baseSixteenthTime;
    if (this.currentStep % 2 === 0) {
      duration = baseSixteenthTime * (1 + this.swing);
    } else {
      duration = baseSixteenthTime * (1 - this.swing);
    }

    this.nextStepTime += duration;
    this.currentStep = (this.currentStep + 1) % 16;
  }
}

export const sequencerClock = new SequencerClock();
