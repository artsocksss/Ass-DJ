export type BankId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

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
  artist: string;
  subtitle: string;
  color: string;
  defaultBpm: number;
  pads: PadDefinition[];
}

export type FXType = 'FILTER' | 'CRUSH' | 'ECHO' | 'SPACE' | 'NOISE';

export type MacroProfile = 'RAVE_BUILD' | 'SUB_DROP' | 'CYBER_CRUSH' | 'TENSION_WASH';

export interface PerformanceMacroState {
  value: number; // 0 to 1
  profile: MacroProfile;
  latch: boolean; // if false, spring-back on release
}

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

export type QuantizeMode = 'SMART' | '1/16' | '1/32' | '1/8' | 'OFF';

export interface SequencerState {
  pattern: boolean[][]; // 16 pads x 16 steps
  currentStep: number;
  isPlaying: boolean;
  bpm: number;
  swing: number; // 0 to 100%
  selectedPadIndex: number;
  isRecording: boolean;
  quantize: QuantizeMode;
}

export interface TransportState {
  playbackState: 'stopped' | 'playing' | 'paused';
  bpm: number;
  pitchRange: 6 | 10 | 16 | 50; // percentage
  pitchBend: number; // -1 to +1
  masterTempo: boolean; // Key lock
  quantize: QuantizeMode;
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
export type ThemeId = 'onyx' | 'amber' | 'acid' | 'titanium' | 'tokyo';
export type FpsTarget = 30 | 60 | 120;

export interface CustomSavedPattern {
  id: string;
  name: string;
  bank: BankId;
  bpm: number;
  pattern: boolean[][];
  updatedAt: number;
}

export interface LoadedTrackInfo {
  name: string;
  duration: number;
  isPlaying: boolean;
  currentTime: number;
}

export interface RecordingConfig {
  format: 'wav' | 'webm';
  mode: 'master' | 'drums_only' | 'track_and_drums';
  quantizeBars: number; // 0 = freeform, 4, 8, 16, 32
  countIn?: boolean; // 1-bar metronome count-in
  preCount?: boolean;
  sampleRate?: number;
  bitDepth?: number;
}

export interface RecordedTake {
  id: string;
  name: string;
  title?: string;
  duration: number;
  durationSeconds?: number;
  url: string;
  blobUrl?: string;
  blob?: Blob;
  size?: number;
  blobSize?: number;
  createdAt: number;
  bpm: number;
  bank: BankId;
  format?: string;
  mode: 'master' | 'drums_only' | 'track_and_drums';
}

export interface RecordingState {
  isRecording: boolean;
  isCountingIn: boolean;
  countInBeat: number;
  durationSeconds: number;
  currentBarsRecorded: number;
  blobUrl: string | null;
  blobSize: number;
}

export interface PreviewGroove {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  bank: BankId;
  color: string;
  pattern?: boolean[][];
}

export type ActiveTab = 'pads' | 'sequencer' | 'fx' | 'track' | 'takes';

