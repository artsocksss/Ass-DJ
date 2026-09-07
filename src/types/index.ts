export type BankId = 'A' | 'B' | 'C' | 'D';

export interface PadDefinition {
  id: number; // 0 to 15
  name: string;
  category: 'kick' | 'sub' | 'snare' | 'clap' | 'hihat' | 'percussion' | 'synth' | 'vocal' | 'fx';
  keyShortcut: string;
  color: string;
  description: string;
}

export interface BankConfig {
  id: BankId;
  name: string;
  subtitle: string;
  color: string;
  pads: PadDefinition[];
}

export type FXType = 'FILTER' | 'CRUSH' | 'ECHO' | 'SPACE' | 'NOISE';

export interface FXState {
  activeFX: FXType;
  param: number; // 0 to 1 (or -1 to 1 for filter)
  resonance: number;
  echoTime: number; // seconds
  echoFeedback: number;
}

export interface EQState {
  high: number; // -24 to +6 dB
  mid: number;
  low: number;
  killHigh: boolean;
  killMid: boolean;
  killLow: boolean;
}

export interface SequencerState {
  pattern: boolean[][]; // 16 pads x 16 steps
  currentStep: number;
  isPlaying: boolean;
  bpm: number;
  swing: number; // 0 to 100%
  selectedPadIndex: number;
  isRecording: boolean;
  quantize: '1/16' | '1/8' | 'OFF';
}

export interface TransportState {
  playbackState: 'stopped' | 'playing' | 'paused';
  bpm: number;
  pitchRange: 6 | 10 | 16 | 50; // percentage
  pitchBend: number; // -1 to +1
  masterTempo: boolean; // Key lock
  quantize: '1/16' | '1/8' | 'OFF';
  currentBar: number;
  currentBeat: number;
  currentSixteenth: number;
  key: string;
}

export interface VUMeterData {
  left: number;  // 0 to 1
  right: number; // 0 to 1
  peakLeft: number;
  peakRight: number;
}

export type MidiMappableParam = 'master_volume' | 'fx_param' | 'eq_high' | 'eq_mid' | 'eq_low' | 'pitch_bend';

export type MidiMappings = Record<MidiMappableParam, number | null>;

export type Language = 'uk' | 'en';

export interface CustomSavedPattern {
  id: string;
  name: string;
  bank: BankId;
  bpm: number;
  pattern: boolean[][];
  updatedAt: number;
}
