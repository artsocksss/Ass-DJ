import type { FXState } from '../types';

export type MixPhase = 'intro' | 'groove' | 'build' | 'drop' | 'break';

export function phaseAt(bar: number): MixPhase {
  const i = Math.max(0, bar - 1);
  const cycle = i % 20;
  if (cycle < 4) return 'intro';
  if (cycle < 8) return 'groove';
  if (cycle < 12) return 'build';
  if (cycle < 16) return 'drop';
  return 'break';
}

export function shouldPlayPatternPad(
  pad: number,
  step: number,
  phase: MixPhase,
  pattern: boolean[][],
): boolean {
  if (!pattern[pad]?.[step]) return false;
  if (phase === 'intro' && (pad === 0 || pad === 1 || pad === 12)) return false;
  if (phase === 'break' && (pad === 0 || pad === 1) && step !== 0) return false;
  if (phase === 'build' && pad === 0 && step !== 0 && step !== 8) return false;
  return true;
}

export function extraHits(
  step: number,
  phase: MixPhase,
  pattern: boolean[][],
): { pad: number; vel: number }[] {
  const hits: { pad: number; vel: number }[] = [];
  const kickOn = Boolean(pattern[0]?.[step]);
  const down = step % 4 === 0;

  if (phase === 'intro') {
    if (step === 0) hits.push({ pad: 0, vel: 0.22 });
    if (step % 2 === 0 && !pattern[5]?.[step]) hits.push({ pad: 5, vel: 0.42 });
    if (step === 12 && !pattern[2]?.[step]) hits.push({ pad: 2, vel: 0.35 });
  }
  if (phase === 'groove') {
    if (down && !kickOn) hits.push({ pad: 0, vel: 0.58 });
    if ((step === 4 || step === 12) && !pattern[2]?.[step]) hits.push({ pad: 2, vel: 0.7 });
  }
  if (phase === 'build') {
    if (down && !kickOn) hits.push({ pad: 0, vel: 0.4 });
    if (step === 14) hits.push({ pad: 13, vel: 0.82 });
    if (step === 15) hits.push({ pad: 11, vel: 0.55 });
  }
  if (phase === 'drop') {
    if (down && !kickOn) hits.push({ pad: 0, vel: 0.82 });
    if (kickOn && step === 0) hits.push({ pad: 12, vel: 0.28 });
    if (step === 0) hits.push({ pad: 15, vel: 0.45 });
  }
  if (phase === 'break') {
    if (step === 0) hits.push({ pad: 0, vel: 0.38 });
    if (step === 8) hits.push({ pad: 3, vel: 0.5 });
  }
  return hits;
}

export function fxForPhase(
  phase: MixPhase,
  step: number,
  base: FXState,
): { fx: FXState; macro: number; drop: boolean } {
  if (phase === 'intro') {
    return { fx: { ...base, activeFX: 'FILTER', param: -0.35 }, macro: 0.08, drop: false };
  }
  if (phase === 'groove') {
    return { fx: { ...base, activeFX: 'FILTER', param: 0 }, macro: 0.12, drop: false };
  }
  if (phase === 'build') {
    const t = step / 15;
    return { fx: { ...base, activeFX: 'FILTER', param: -0.85 + t * 1.7 }, macro: 0.2 + t * 0.7, drop: false };
  }
  if (phase === 'drop') {
    return { fx: { ...base, activeFX: 'FILTER', param: 0 }, macro: 0, drop: step === 0 };
  }
  return { fx: { ...base, activeFX: 'SPACE', param: 0.25 }, macro: 0.15, drop: false };
}
