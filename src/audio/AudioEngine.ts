import { BankId, EQState, FXState, FXType, VUMeterData, RecordingConfig, MacroProfile, PerformanceMacroState } from '../types';

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samplesL: Float32Array, samplesR: Float32Array, sampleRate: number): Blob {
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samplesL.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samplesL.length; i++) {
    const sL = Math.max(-1, Math.min(1, samplesL[i]));
    view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7FFF, true);
    offset += 2;
    const sR = Math.max(-1, Math.min(1, samplesR[i]));
    view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private headphoneGain: GainNode | null = null;
  private analyserLeft: AnalyserNode | null = null;
  private analyserRight: AnalyserNode | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private dcBlocker: BiquadFilterNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;

  // 3-Band Isolator EQ Nodes
  private eqLowNode: BiquadFilterNode | null = null;
  private eqMidNode: BiquadFilterNode | null = null;
  private eqHighNode: BiquadFilterNode | null = null;

  // Sound Color FX Nodes
  private filterNode: BiquadFilterNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackNode: GainNode | null = null;
  private delayFilterNode: BiquadFilterNode | null = null;
  private delayWetGain: GainNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private bitcrushNode: WaveShaperNode | null = null;
  private fxDryGain: GainNode | null = null;

  // Noise generator for FX
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;

  // Noise buffers cache
  private whiteNoiseBuffer: AudioBuffer | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;

  // State
  public currentBank: BankId = 'A';
  public pitchShiftMultiplier: number = 1.0;
  private isInitialized: boolean = false;

  private fxState: FXState = {
    activeFX: 'FILTER',
    param: 0,
    resonance: 3,
    echoTime: 0.25,
    echoFeedback: 0.45,
  };

  private eqState: EQState = {
    low: 0,
    mid: 0,
    high: 0,
    killLow: false,
    killMid: false,
    killHigh: false,
  };

  // Performance Macro State
  private macroState: PerformanceMacroState = {
    value: 0,
    profile: 'RAVE_BUILD',
    latch: false,
  };

  // Safe linear pass-through curve for WaveShaperNode (bypasses distortion cleanly across all browsers)
  private linearPassCurve: Float32Array = new Float32Array([-1, 1]);

  private setBitcrushCurve(curve: Float32Array | null) {
    if (!this.bitcrushNode) return;
    try {
      this.bitcrushNode.curve = (curve && curve.length >= 2) ? curve : this.linearPassCurve;
    } catch {
      // Safely ignore if browser restricts curve re-assignment
    }
  }

  // VU Meter state & callback
  private currentVU: VUMeterData = { left: 0, right: 0, peakLeft: 0, peakRight: 0 };
  private onVUUpdate?: (vu: VUMeterData) => void;
  private vuAnimationId: number | null = null;

  // Real-time Waveform & Spectrum Analyser Node for OLED Display
  private waveformAnalyser: AnalyserNode | null = null;

  // Recording State & Nodes
  private isRecordingActive: boolean = false;
  private recordingStartTime: number = 0;
  private recordingNode: ScriptProcessorNode | null = null;
  private recBuffersL: Float32Array[] = [];
  private recBuffersR: Float32Array[] = [];
  private recLength: number = 0;
  private lastRecordedBlob: Blob | null = null;
  private lastRecordedUrl: string | null = null;

  // Loaded User Track State & Nodes
  private userTrackBuffer: AudioBuffer | null = null;
  private userTrackName: string = '';
  private userTrackSource: AudioBufferSourceNode | null = null;
  private userTrackGain: GainNode | null = null;
  private userTrackStartTime: number = 0;
  private userTrackPauseOffset: number = 0;
  private userTrackIsPlaying: boolean = false;

  // Scratch synthesis throttle
  private lastScratchTime: number = 0;

  constructor() {
    // Lazy AudioContext initialization on first user touch/click for Safari compliance
  }

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      try {
        this.ctx = new AudioCtxClass({ latencyHint: 'interactive' });
      } catch (e) {
        this.ctx = new AudioCtxClass(); // Fallback for Safari/unsupported environments
      }

      // Generate noise buffers
      this.createNoiseBuffers();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

      this.headphoneGain = this.ctx.createGain();
      this.headphoneGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

      // EQ Section
      this.eqLowNode = this.ctx.createBiquadFilter();
      this.eqLowNode.type = 'lowshelf';
      this.eqLowNode.frequency.setValueAtTime(100, this.ctx.currentTime);
      this.eqLowNode.gain.setValueAtTime(0, this.ctx.currentTime);

      this.eqMidNode = this.ctx.createBiquadFilter();
      this.eqMidNode.type = 'peaking';
      this.eqMidNode.frequency.setValueAtTime(1000, this.ctx.currentTime);
      this.eqMidNode.Q.setValueAtTime(1.2, this.ctx.currentTime);
      this.eqMidNode.gain.setValueAtTime(0, this.ctx.currentTime);

      this.eqHighNode = this.ctx.createBiquadFilter();
      this.eqHighNode.type = 'highshelf';
      this.eqHighNode.frequency.setValueAtTime(13000, this.ctx.currentTime);
      this.eqHighNode.gain.setValueAtTime(0, this.ctx.currentTime);

      // Chain EQ: Low -> Mid -> High
      this.eqLowNode.connect(this.eqMidNode);
      this.eqMidNode.connect(this.eqHighNode);

      // Sound Color Filter Node
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'allpass'; // Default flat bypass
      this.filterNode.frequency.setValueAtTime(1000, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(2.5, this.ctx.currentTime);

      this.eqHighNode.connect(this.filterNode);

      // FX Routing: Delay & Reverb
      this.delayNode = this.ctx.createDelay(2.0);
      this.delayNode.delayTime.setValueAtTime(0.25, this.ctx.currentTime);

      this.delayFeedbackNode = this.ctx.createGain();
      this.delayFeedbackNode.gain.setValueAtTime(0.4, this.ctx.currentTime);

      this.delayFilterNode = this.ctx.createBiquadFilter();
      this.delayFilterNode.type = 'lowpass';
      this.delayFilterNode.frequency.setValueAtTime(4500, this.ctx.currentTime);

      this.delayWetGain = this.ctx.createGain();
      this.delayWetGain.gain.setValueAtTime(0, this.ctx.currentTime);

      // Bitcrusher Waveshaper (passes audio transparently using linear curve)
      this.bitcrushNode = this.ctx.createWaveShaper();
      this.setBitcrushCurve(null);

      this.filterNode.connect(this.bitcrushNode);

      // Delay loop: bitcrushNode -> delay -> delayFilter -> feedback -> delay
      this.bitcrushNode.connect(this.delayNode);
      this.delayNode.connect(this.delayFilterNode);
      this.delayFilterNode.connect(this.delayFeedbackNode);
      this.delayFeedbackNode.connect(this.delayNode);
      this.delayFilterNode.connect(this.delayWetGain);

      // Reverb Convolver
      this.reverbConvolver = this.ctx.createConvolver();
      this.reverbConvolver.buffer = this.buildImpulseResponse(2.2, 2.0);
      this.reverbWetGain = this.ctx.createGain();
      this.reverbWetGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.bitcrushNode.connect(this.reverbConvolver);
      this.reverbConvolver.connect(this.reverbWetGain);

      this.fxDryGain = this.ctx.createGain();
      this.fxDryGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.bitcrushNode.connect(this.fxDryGain);

      // Mix FX back to Master Gain
      this.fxDryGain.connect(this.masterGain);
      this.delayWetGain.connect(this.masterGain);
      this.reverbWetGain.connect(this.masterGain);

      // Noise sweep generator
      this.noiseFilter = this.ctx.createBiquadFilter();
      this.noiseFilter.type = 'bandpass';
      this.noiseFilter.frequency.setValueAtTime(1500, this.ctx.currentTime);
      this.noiseFilter.Q.setValueAtTime(4, this.ctx.currentTime);

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.noiseFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain);

      // VU Meter Analysers
      this.splitter = this.ctx.createChannelSplitter(2);
      this.analyserLeft = this.ctx.createAnalyser();
      this.analyserRight = this.ctx.createAnalyser();
      this.analyserLeft.fftSize = 256;
      this.analyserRight.fftSize = 256;

      this.masterGain.connect(this.splitter);
      this.splitter.connect(this.analyserLeft, 0);
      this.splitter.connect(this.analyserRight, 1);

      // Real-time OLED Waveform Visualizer Analyser
      this.waveformAnalyser = this.ctx.createAnalyser();
      this.waveformAnalyser.fftSize = 512;
      this.waveformAnalyser.smoothingTimeConstant = 0.4;
      this.masterGain.connect(this.waveformAnalyser);

      // DC Blocker (Highpass at 18Hz to eliminate DC offset & subsonic speaker damage)
      this.dcBlocker = this.ctx.createBiquadFilter();
      this.dcBlocker.type = 'highpass';
      this.dcBlocker.frequency.setValueAtTime(18, this.ctx.currentTime);
      this.dcBlocker.Q.setValueAtTime(0.707, this.ctx.currentTime);

      // Studio Master Brickwall Limiter & Dynamics Compressor (Zero clipping, smooth punch)
      this.masterLimiter = this.ctx.createDynamicsCompressor();
      this.masterLimiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime);
      this.masterLimiter.knee.setValueAtTime(3.0, this.ctx.currentTime);
      this.masterLimiter.ratio.setValueAtTime(16.0, this.ctx.currentTime);
      this.masterLimiter.attack.setValueAtTime(0.002, this.ctx.currentTime);
      this.masterLimiter.release.setValueAtTime(0.05, this.ctx.currentTime);

      // Master output chain: MasterGain -> DC Blocker -> Master Limiter -> Destination
      this.masterGain.connect(this.dcBlocker);
      this.dcBlocker.connect(this.masterLimiter);
      this.masterLimiter.connect(this.ctx.destination);

      this.isInitialized = true;
      this.startVUMeterLoop();
    } catch (e) {
      console.warn('Web Audio initialization deferral:', e);
    }
  }

  public getContext(): AudioContext {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx!;
  }

  public getVUData(): VUMeterData {
    return this.currentVU;
  }

  public getWaveformAnalyser(): AnalyserNode | null {
    if (!this.waveformAnalyser && this.ctx && this.masterGain) {
      this.waveformAnalyser = this.ctx.createAnalyser();
      this.waveformAnalyser.fftSize = 512;
      this.waveformAnalyser.smoothingTimeConstant = 0.4;
      this.masterGain.connect(this.waveformAnalyser);
    }
    return this.waveformAnalyser;
  }

  public setVUMeterListener(callback: (vu: VUMeterData) => void) {
    this.onVUUpdate = callback;
  }

  // Kick Drum Trigger Listener (Audio Clock Synced)
  private onKickTrigger?: (time: number, velocity: number) => void;

  public setKickTriggerListener(callback: ((time: number, velocity: number) => void) | undefined) {
    this.onKickTrigger = callback;
  }

  public notifyKickTrigger(time: number, velocity: number = 1.0) {
    if (this.onKickTrigger) {
      this.onKickTrigger(time, velocity);
    }
  }

  // ----------------------------------------------------
  // MASTER AUDIO RECORDING (Lossless 16-bit WAV Export)
  // ----------------------------------------------------
  // RECORDING & EXPORT ENGINE (Lossless WAV)
  // ----------------------------------------------------
  private currentRecConfig?: RecordingConfig;
  private recSourceNode?: AudioNode;

  public startRecording(config?: RecordingConfig): boolean {
    const ctx = this.getContext();
    if (this.isRecordingActive || !this.masterGain) return false;

    this.currentRecConfig = config;
    this.recBuffersL = [];
    this.recBuffersR = [];
    this.recLength = 0;
    this.isRecordingActive = true;
    this.recordingStartTime = ctx.currentTime;

    if (this.lastRecordedUrl) {
      URL.revokeObjectURL(this.lastRecordedUrl);
      this.lastRecordedUrl = null;
      this.lastRecordedBlob = null;
    }

    try {
      this.recordingNode = ctx.createScriptProcessor(4096, 2, 2);
      this.recordingNode.onaudioprocess = (e) => {
        if (!this.isRecordingActive) return;
        const inputL = e.inputBuffer.getChannelData(0);
        const inputR = e.inputBuffer.numberOfChannels > 1 ? e.inputBuffer.getChannelData(1) : inputL;

        this.recBuffersL.push(new Float32Array(inputL));
        this.recBuffersR.push(new Float32Array(inputR));
        this.recLength += inputL.length;
      };

      // Connect source node based on mode
      const source = (config?.mode === 'drums_only' && this.eqLowNode)
        ? this.eqLowNode
        : this.masterGain;

      this.recSourceNode = source;
      source.connect(this.recordingNode);
      this.recordingNode.connect(ctx.destination);
      return true;
    } catch {
      this.isRecordingActive = false;
      return false;
    }
  }

  public async stopRecording(): Promise<{ blob: Blob; url: string } | null> {
    if (!this.isRecordingActive || !this.ctx) return null;

    this.isRecordingActive = false;
    if (this.recordingNode) {
      try {
        if (this.recSourceNode) {
          this.recSourceNode.disconnect(this.recordingNode);
        } else {
          this.masterGain?.disconnect(this.recordingNode);
        }
        this.recordingNode.disconnect();
      } catch {
        // ignore
      }
      this.recSourceNode = undefined;
      this.recordingNode = null;
    }

    if (this.recLength === 0) return null;

    const sampleRate = this.ctx.sampleRate;
    const mergedL = new Float32Array(this.recLength);
    const mergedR = new Float32Array(this.recLength);
    let offset = 0;
    for (let i = 0; i < this.recBuffersL.length; i++) {
      mergedL.set(this.recBuffersL[i], offset);
      mergedR.set(this.recBuffersR[i], offset);
      offset += this.recBuffersL[i].length;
    }

    const wavBlob = encodeWAV(mergedL, mergedR, sampleRate);
    const url = URL.createObjectURL(wavBlob);
    this.lastRecordedBlob = wavBlob;
    this.lastRecordedUrl = url;

    return { blob: wavBlob, url };
  }

  public isRecording(): boolean {
    return this.isRecordingActive;
  }

  public getRecordingDuration(): number {
    if (!this.isRecordingActive || !this.ctx) return 0;
    return Math.max(0, this.ctx.currentTime - this.recordingStartTime);
  }

  public getLastRecording(): { blob: Blob | null; url: string | null } {
    return { blob: this.lastRecordedBlob, url: this.lastRecordedUrl };
  }

  // ----------------------------------------------------
  // USER AUDIO TRACK LOADING & PLAYBACK (Deck A / Track)
  // ----------------------------------------------------
  public async loadUserTrackFile(file: File): Promise<{ name: string; duration: number }> {
    const ctx = this.getContext();
    this.pauseUserTrack();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.userTrackBuffer = audioBuffer;
    this.userTrackName = file.name;
    this.userTrackPauseOffset = 0;
    return { name: file.name, duration: audioBuffer.duration };
  }

  public playUserTrack(fromOffset?: number) {
    if (!this.userTrackBuffer) return;
    const ctx = this.getContext();
    this.pauseUserTrack();

    const source = ctx.createBufferSource();
    source.buffer = this.userTrackBuffer;
    source.loop = true;

    if (!this.userTrackGain) {
      this.userTrackGain = ctx.createGain();
      this.userTrackGain.gain.setValueAtTime(0.85, ctx.currentTime);
      // Connect to EQ input node so loaded track benefits from EQ & Color FX
      this.userTrackGain.connect(this.eqLowNode!);
    }

    source.connect(this.userTrackGain);

    const startOffset = fromOffset !== undefined ? fromOffset : this.userTrackPauseOffset;
    const safeOffset = startOffset % this.userTrackBuffer.duration;
    source.start(0, safeOffset);

    this.userTrackSource = source;
    this.userTrackStartTime = ctx.currentTime - safeOffset;
    this.userTrackIsPlaying = true;
  }

  public pauseUserTrack() {
    if (this.userTrackSource) {
      try {
        this.userTrackSource.stop();
        this.userTrackSource.disconnect();
      } catch {
        // ignore
      }
      this.userTrackSource = null;
    }
    if (this.userTrackIsPlaying && this.ctx && this.userTrackBuffer) {
      const elapsed = this.ctx.currentTime - this.userTrackStartTime;
      this.userTrackPauseOffset = elapsed % this.userTrackBuffer.duration;
    }
    this.userTrackIsPlaying = false;
  }

  public seekUserTrack(offsetSeconds: number) {
    if (!this.userTrackBuffer) return;
    this.userTrackPauseOffset = Math.max(0, Math.min(this.userTrackBuffer.duration, offsetSeconds));
    if (this.userTrackIsPlaying) {
      this.playUserTrack(this.userTrackPauseOffset);
    }
  }

  public scratchUserTrack(speedRate: number) {
    if (this.userTrackSource && this.ctx) {
      const clampedRate = Math.max(0.1, Math.min(3.0, Math.abs(speedRate)));
      this.userTrackSource.playbackRate.setValueAtTime(clampedRate, this.ctx.currentTime);
    }
  }

  public getUserTrackInfo(): { name: string; duration: number; isPlaying: boolean; currentTime: number; hasTrack: boolean } {
    if (!this.userTrackBuffer) {
      return { name: '', duration: 0, isPlaying: false, currentTime: 0, hasTrack: false };
    }
    let cur = this.userTrackPauseOffset;
    if (this.userTrackIsPlaying && this.ctx) {
      cur = (this.ctx.currentTime - this.userTrackStartTime) % this.userTrackBuffer.duration;
    }
    return {
      name: this.userTrackName,
      duration: this.userTrackBuffer.duration,
      isPlaying: this.userTrackIsPlaying,
      currentTime: cur,
      hasTrack: true,
    };
  }

  public setUserTrackVolume(vol: number) {
    if (this.userTrackGain && this.ctx) {
      this.userTrackGain.gain.setValueAtTime(Math.max(0, Math.min(1.5, vol)), this.ctx.currentTime);
    }
  }

  public clearUserTrack() {
    this.pauseUserTrack();
    this.userTrackBuffer = null;
    this.userTrackName = '';
    this.userTrackPauseOffset = 0;
  }

  public unloadUserTrack() {
    this.clearUserTrack();
  }

  // ----------------------------------------------------
  // DJ TURNTABLE SCRATCH SYNTHESIZER
  // ----------------------------------------------------
  public triggerScratchSound(velocity: number = 1.0, direction: 1 | -1 = 1) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    if (now - this.lastScratchTime < 0.04) return;
    this.lastScratchTime = now;

    const vel = Math.max(0.3, Math.min(2.0, Math.abs(velocity)));
    const duration = 0.07 + vel * 0.06;

    // Resonant bandpass noise sweep
    const buffer = direction > 0 ? this.pinkNoiseBuffer : this.whiteNoiseBuffer;
    if (buffer) {
      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const baseFreq = direction > 0 ? 650 : 1200;
      const targetFreq = direction > 0 ? 2200 * vel : 350 * vel;
      filter.frequency.setValueAtTime(baseFreq, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(120, targetFreq), now + duration);
      filter.Q.setValueAtTime(5.5, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.24 * Math.min(1.0, vel), now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.eqLowNode!);

      src.start(now);
      src.stop(now + duration + 0.02);
    }

    // Sawtooth tonal needle scrub
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const oscFreqStart = direction > 0 ? 140 * vel : 520 * vel;
    const oscFreqEnd = direction > 0 ? 480 * vel : 110 * vel;
    osc.frequency.setValueAtTime(oscFreqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(50, oscFreqEnd), now + duration);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.01, now);
    oscGain.gain.linearRampToValueAtTime(0.16 * Math.min(1.0, vel), now + 0.01);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(this.eqLowNode!);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private startVUMeterLoop() {
    if (this.vuAnimationId) cancelAnimationFrame(this.vuAnimationId);

    const bufferLeft = new Uint8Array(64);
    const bufferRight = new Uint8Array(64);

    let peakL = 0;
    let peakR = 0;

    const tick = () => {
      if (this.analyserLeft && this.analyserRight) {
        this.analyserLeft.getByteTimeDomainData(bufferLeft);
        this.analyserRight.getByteTimeDomainData(bufferRight);

        let sumL = 0;
        let sumR = 0;

        for (let i = 0; i < bufferLeft.length; i++) {
          const l = (bufferLeft[i] - 128) / 128;
          const r = (bufferRight[i] - 128) / 128;
          sumL += l * l;
          sumR += r * r;
        }

        const rmsL = Math.sqrt(sumL / bufferLeft.length);
        const rmsR = Math.sqrt(sumR / bufferRight.length);

        const currentL = Math.min(1, rmsL * 3.5);
        const currentR = Math.min(1, rmsR * 3.5);

        peakL = Math.max(currentL, peakL * 0.94);
        peakR = Math.max(currentR, peakR * 0.94);

        this.currentVU = {
          left: currentL,
          right: currentR,
          peakLeft: peakL,
          peakRight: peakR,
        };

        if (this.onVUUpdate) {
          this.onVUUpdate(this.currentVU);
        }
      }
      this.vuAnimationId = requestAnimationFrame(tick);
    };

    this.vuAnimationId = requestAnimationFrame(tick);
  }

  private createNoiseBuffers() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds

    // White noise
    const whiteBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = whiteBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.whiteNoiseBuffer = whiteBuffer;

    // Pink noise
    const pinkBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const pinkData = pinkBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    this.pinkNoiseBuffer = pinkBuffer;
  }

  private buildImpulseResponse(duration: number, decay: number): AudioBuffer {
    const sampleRate = this.ctx ? this.ctx.sampleRate : 44100;
    const length = sampleRate * duration;
    const impulse = this.ctx ? this.ctx.createBuffer(2, length, sampleRate) : new AudioBuffer({ length, sampleRate, numberOfChannels: 2 });
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      const factor = Math.pow(n / length, decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  private makeBitcrushCurve(amount: number): Float32Array {
    const samples = 4096;
    const curve = new Float32Array(samples);
    const bits = Math.max(2, Math.floor(16 - amount * 12));
    const step = Math.pow(0.5, bits);

    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      curve[i] = step * Math.round(x / step);
    }
    return curve;
  }

  // ----------------------------------------------------
  // SOUND COLOR FX ENGINE
  // ----------------------------------------------------
  public setFX(fxState: FXState) {
    this.fxState = fxState;
    if (!this.ctx || !this.filterNode) return;

    const t = this.ctx.currentTime;
    const param = fxState.param; // -1 to +1 (or 0 to 1)

    // Reset nodes
    if (fxState.activeFX === 'FILTER') {
      if (Math.abs(param) < 0.04) {
        // Flat bypass
        this.filterNode.type = 'allpass';
        this.filterNode.frequency.setTargetAtTime(1000, t, 0.02);
      } else if (param < 0) {
        // LPF: 20000Hz down to 100Hz
        this.filterNode.type = 'lowpass';
        const cutoff = 20000 * Math.pow(0.005, -param);
        this.filterNode.frequency.setTargetAtTime(Math.max(60, cutoff), t, 0.02);
        this.filterNode.Q.setTargetAtTime(1 + fxState.resonance * 2, t, 0.02);
      } else {
        // HPF: 20Hz up to 9000Hz
        this.filterNode.type = 'highpass';
        const cutoff = 20 * Math.pow(450, param);
        this.filterNode.frequency.setTargetAtTime(Math.min(14000, cutoff), t, 0.02);
        this.filterNode.Q.setTargetAtTime(1 + fxState.resonance * 2, t, 0.02);
      }
      this.delayWetGain?.gain.setTargetAtTime(0, t, 0.02);
      this.reverbWetGain?.gain.setTargetAtTime(0, t, 0.02);
      this.noiseGain?.gain.setTargetAtTime(0, t, 0.02);
    } else if (fxState.activeFX === 'ECHO') {
      this.filterNode.type = 'allpass';
      const wet = Math.min(0.85, Math.abs(param) * 0.9);
      this.delayWetGain?.gain.setTargetAtTime(wet, t, 0.02);
      if (this.delayNode) {
        const time = 0.05 + Math.abs(param) * 0.4;
        this.delayNode.delayTime.setTargetAtTime(time, t, 0.03);
      }
      if (this.delayFeedbackNode) {
        this.delayFeedbackNode.gain.setTargetAtTime(Math.min(0.78, 0.3 + Math.abs(param) * 0.45), t, 0.02);
      }
      this.reverbWetGain?.gain.setTargetAtTime(0, t, 0.02);
      this.noiseGain?.gain.setTargetAtTime(0, t, 0.02);
    } else if (fxState.activeFX === 'SPACE') {
      this.filterNode.type = 'allpass';
      const wet = Math.min(0.9, Math.abs(param) * 0.95);
      this.reverbWetGain?.gain.setTargetAtTime(wet, t, 0.02);
      this.delayWetGain?.gain.setTargetAtTime(0, t, 0.02);
      this.noiseGain?.gain.setTargetAtTime(0, t, 0.02);
    } else if (fxState.activeFX === 'CRUSH') {
      this.filterNode.type = 'allpass';
      this.setBitcrushCurve(Math.abs(param) < 0.04 ? null : this.makeBitcrushCurve(Math.abs(param)));
      this.delayWetGain?.gain.setTargetAtTime(0, t, 0.02);
      this.reverbWetGain?.gain.setTargetAtTime(0, t, 0.02);
      this.noiseGain?.gain.setTargetAtTime(0, t, 0.02);
    } else if (fxState.activeFX === 'NOISE') {
      this.filterNode.type = 'allpass';
      this.setBitcrushCurve(null);
      const amount = Math.abs(param);
      if (this.noiseGain && this.noiseFilter) {
        this.noiseGain.gain.setTargetAtTime(amount * 0.4, t, 0.02);
        this.noiseFilter.frequency.setTargetAtTime(300 + amount * 6000, t, 0.03);
      }
      this.delayWetGain?.gain.setTargetAtTime(amount * 0.3, t, 0.02);
      this.reverbWetGain?.gain.setTargetAtTime(amount * 0.35, t, 0.02);
    }

    if (fxState.activeFX !== 'CRUSH' && this.macroState.value <= 0.005) {
      this.setBitcrushCurve(null);
    }
  }

  // ----------------------------------------------------
  // PERFORMANCE MACRO ENGINE
  // Single-gesture multi-parameter build-up & drop control
  // ----------------------------------------------------
  public setPerformanceMacro(value: number, profile: MacroProfile = 'RAVE_BUILD') {
    this.macroState = { ...this.macroState, value, profile };
    if (!this.ctx || !this.filterNode) return;

    const t = this.ctx.currentTime;
    const v = Math.max(0, Math.min(1, value));

    if (v <= 0.005) {
      // Restore user's standard Sound Color FX and EQ values
      this.setFX(this.fxState);
      this.setEQ(this.eqState);
      if (this.fxState.activeFX === 'CRUSH' && Math.abs(this.fxState.param) > 0.04) {
        this.setBitcrushCurve(this.makeBitcrushCurve(Math.abs(this.fxState.param)));
      } else {
        this.setBitcrushCurve(null);
      }
      return;
    }

    // Active macro modulation across multiple nodes simultaneously
    switch (profile) {
      case 'RAVE_BUILD': {
        // 1. High-Pass Filter sweep with screaming resonance (Q up to 15.0)
        this.filterNode.type = 'highpass';
        const cutoff = 25 * Math.pow(300, v); // 25Hz up to 7500Hz
        this.filterNode.frequency.setTargetAtTime(Math.min(14000, cutoff), t, 0.02);
        const reso = 1.5 + v * 13.5; // Q: 1.5 -> 15.0
        this.filterNode.Q.setTargetAtTime(reso, t, 0.02);

        // 2. Echo / Delay Wash with accelerating feedback
        const wetDelay = Math.min(0.85, v * 0.9);
        this.delayWetGain?.gain.setTargetAtTime(wetDelay, t, 0.02);
        if (this.delayNode) {
          const delayTime = 0.25 - v * 0.125; // 1/4 to 1/8 note feel
          this.delayNode.delayTime.setTargetAtTime(Math.max(0.04, delayTime), t, 0.03);
        }
        if (this.delayFeedbackNode) {
          const fb = 0.35 + v * 0.50; // up to 0.85 feedback
          this.delayFeedbackNode.gain.setTargetAtTime(Math.min(0.88, fb), t, 0.02);
        }

        // 3. Bitcrush distortion kicks in as tension rises (> 25%)
        if (v > 0.25) {
          const crushAmt = Math.min(0.85, (v - 0.25) * 1.15);
          this.setBitcrushCurve(this.makeBitcrushCurve(crushAmt));
        } else {
          this.setBitcrushCurve(null);
        }

        // 4. Low EQ Ducking: Sucks out sub-bass frequencies right before the drop!
        if (this.eqLowNode) {
          const currentLow = this.eqState.killLow ? -70 : this.eqState.low;
          const duckedLow = currentLow - v * 24;
          this.eqLowNode.gain.setTargetAtTime(Math.max(-70, duckedLow), t, 0.02);
        }

        // 5. Space Reverb tail wash
        const revWet = v > 0.5 ? (v - 0.5) * 0.7 : 0;
        this.reverbWetGain?.gain.setTargetAtTime(revWet, t, 0.02);

        // 6. White noise riser whoosh
        if (this.noiseGain && this.noiseFilter) {
          this.noiseGain.gain.setTargetAtTime(v * 0.22, t, 0.02);
          this.noiseFilter.frequency.setTargetAtTime(800 + v * 5500, t, 0.03);
          this.noiseFilter.Q.setTargetAtTime(3.5, t, 0.02);
        }
        break;
      }

      case 'SUB_DROP': {
        // 1. Low-Pass slam filter: muffle top end and focus on heavy sub rumble
        this.filterNode.type = 'lowpass';
        const cutoff = 18000 * Math.pow(0.012, v); // 18kHz down to 216Hz
        this.filterNode.frequency.setTargetAtTime(Math.max(80, cutoff), t, 0.02);
        this.filterNode.Q.setTargetAtTime(3.8, t, 0.02);

        // 2. Sub bass boost (+6dB)
        if (this.eqLowNode) {
          const currentLow = this.eqState.killLow ? -70 : this.eqState.low;
          this.eqLowNode.gain.setTargetAtTime(Math.min(12, currentLow + v * 6), t, 0.02);
        }
        // 3. High cut (-22dB)
        if (this.eqHighNode) {
          const currentHigh = this.eqState.killHigh ? -70 : this.eqState.high;
          this.eqHighNode.gain.setTargetAtTime(Math.max(-70, currentHigh - v * 22), t, 0.02);
        }

        // 4. Cavernous space reverb bloom & warm lowpass echo
        this.reverbWetGain?.gain.setTargetAtTime(Math.min(0.75, v * 0.8), t, 0.02);
        this.delayWetGain?.gain.setTargetAtTime(v * 0.25, t, 0.02);
        this.setBitcrushCurve(null);
        if (this.noiseGain) this.noiseGain.gain.setTargetAtTime(0, t, 0.02);
        break;
      }

      case 'CYBER_CRUSH': {
        // 1. Bandpass filter sweep with sharp resonant peak
        this.filterNode.type = 'bandpass';
        const center = 400 + v * 4000;
        this.filterNode.frequency.setTargetAtTime(center, t, 0.02);
        this.filterNode.Q.setTargetAtTime(8.5, t, 0.02);

        // 2. Extreme bitcrush (down to 2-3 bits for aggressive industrial crunch)
        this.setBitcrushCurve(this.makeBitcrushCurve(v * 0.92));

        // 3. Glitch echo slapback
        this.delayWetGain?.gain.setTargetAtTime(v * 0.65, t, 0.02);
        if (this.delayNode) {
          this.delayNode.delayTime.setTargetAtTime(0.08 + v * 0.12, t, 0.02);
        }
        if (this.delayFeedbackNode) {
          this.delayFeedbackNode.gain.setTargetAtTime(0.45 + v * 0.38, t, 0.02);
        }

        this.reverbWetGain?.gain.setTargetAtTime(v * 0.2, t, 0.02);
        if (this.noiseGain) this.noiseGain.gain.setTargetAtTime(0, t, 0.02);
        break;
      }

      case 'TENSION_WASH': {
        // 1. Ambient space reverb bloom
        this.reverbWetGain?.gain.setTargetAtTime(Math.min(0.9, v * 0.95), t, 0.02);

        // 2. Dotted 8th echo wash
        this.delayWetGain?.gain.setTargetAtTime(v * 0.55, t, 0.02);
        if (this.delayNode) {
          this.delayNode.delayTime.setTargetAtTime(0.375, t, 0.02);
        }
        if (this.delayFeedbackNode) {
          this.delayFeedbackNode.gain.setTargetAtTime(0.40 + v * 0.35, t, 0.02);
        }

        // 3. High-pass filter frequency lift
        this.filterNode.type = 'highpass';
        const cutoff = 20 * Math.pow(150, v); // up to 3000Hz
        this.filterNode.frequency.setTargetAtTime(cutoff, t, 0.02);
        this.filterNode.Q.setTargetAtTime(2.5, t, 0.02);

        // 4. Low cut
        if (this.eqLowNode) {
          const currentLow = this.eqState.killLow ? -70 : this.eqState.low;
          this.eqLowNode.gain.setTargetAtTime(Math.max(-70, currentLow - v * 16), t, 0.02);
        }
        this.setBitcrushCurve(null);
        if (this.noiseGain) this.noiseGain.gain.setTargetAtTime(0, t, 0.02);
        break;
      }
    }
  }

  public getPerformanceMacro(): PerformanceMacroState {
    return this.macroState;
  }

  public triggerDropImpact() {
    this.setPerformanceMacro(0, this.macroState.profile);
    const ctx = this.getContext();
    const t = ctx.currentTime;
    this.notifyKickTrigger(t, 1.0);

    // Instant explosive sub drop transient
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(36, t + 0.18);

      gain.gain.setValueAtTime(0.95, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch {
      // ignore
    }
  }

  // ----------------------------------------------------
  // 3-BAND ISOLATOR EQ ENGINE
  // ----------------------------------------------------
  public setEQ(eq: EQState) {
    this.eqState = eq;
    if (!this.ctx || !this.eqLowNode || !this.eqMidNode || !this.eqHighNode) return;
    const t = this.ctx.currentTime;

    // LOW (100Hz)
    const lowGain = eq.killLow ? -70 : eq.low;
    this.eqLowNode.gain.setTargetAtTime(lowGain, t, 0.02);

    // MID (1000Hz)
    const midGain = eq.killMid ? -70 : eq.mid;
    this.eqMidNode.gain.setTargetAtTime(midGain, t, 0.02);

    // HIGH (13kHz)
    const highGain = eq.killHigh ? -70 : eq.high;
    this.eqHighNode.gain.setTargetAtTime(highGain, t, 0.02);
  }

  public setMasterVolume(vol: number) {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1.5, vol)), this.ctx.currentTime, 0.02);
  }

  // ----------------------------------------------------
  // SOUND SYNTHESIS FOR 64 PADS (4 BANKS x 16 SOUNDS)
  // ----------------------------------------------------
  public triggerPad(padIndex: number, velocity: number = 1.0, time?: number) {
    const ctx = this.getContext();
    const t = time ?? ctx.currentTime;
    const inputNode = this.eqLowNode!;
    const pitchMul = this.pitchShiftMultiplier;

    // Clamp velocity
    const vel = Math.max(0.2, Math.min(1.0, velocity));

    // Notify kick drum trigger listener for high-precision audio clock synced UI pulse
    if (padIndex === 0) {
      this.notifyKickTrigger(t, vel);
    }

    switch (this.currentBank) {
      case 'A':
        this.synthesizeBankA(padIndex, vel, t, inputNode, pitchMul);
        break;
      case 'B':
        this.synthesizeBankB(padIndex, vel, t, inputNode, pitchMul);
        break;
      case 'C':
        this.synthesizeBankC(padIndex, vel, t, inputNode, pitchMul);
        break;
      case 'D':
        this.synthesizeBankD(padIndex, vel, t, inputNode, pitchMul);
        break;
      case 'E':
        this.synthesizeBankE(padIndex, vel, t, inputNode, pitchMul);
        break;
      case 'F':
        this.synthesizeBankF(padIndex, vel, t, inputNode, pitchMul);
        break;
      case 'G':
        this.synthesizeBankG(padIndex, vel, t, inputNode, pitchMul);
        break;
    }
  }

  // BANK A: MADDIX • BIG ROOM TECHNO & RAVE (140-145 BPM)
  private synthesizeBankA(pad: number, vel: number, t: number, dest: AudioNode, pMul: number) {
    switch (pad) {
      case 0: // MADDIX RUMBLE KICK (Massive distorted 909 sub rumble kick)
        this.synthRumbleKick(t, dest, vel, 195 * pMul, 42 * pMul);
        break;
      case 1: // ACID 303 MADDIX (Screaming resonant TB-303 overdrive slide)
        this.synthAcidBass(t, dest, vel, 74 * pMul, 0.38, true);
        break;
      case 2: // BIG ROOM CLAP (Layered stereo warehouse clap)
        this.synthClap(t, dest, vel, 0.28, 1900);
        break;
      case 3: // REVERSE BASS PUNCH (Hard techno offbeat reverse punch)
        this.synthReverseBass(t, dest, vel, 68 * pMul);
        break;
      case 4: // HYPNOTIC SUPERSAW (7-voice detuned massive rave lead)
        this.synthSupersawRaveLead(t, dest, vel, 330 * pMul, 0.36);
        break;
      case 5: // 909 DRIVING HAT (Relentless crisp 909 closed hat)
        this.synthHat(t, dest, vel, 0.032, 9400, false);
        break;
      case 6: // SIZZLE OPEN HAT (Driving offbeat open hat)
        this.synthHat(t, dest, vel, 0.36, 7600, true);
        break;
      case 7: // SUB ROLLER 42HZ (Distorted sub rumble drone)
        this.synthSub808(t, dest, vel, 42 * pMul, 0.85);
        break;
      case 8: // HARDSTYLE SCREECH (Harsh abrasive filter scream)
        this.synthLaser(t, dest, vel, 2400 * pMul, 420 * pMul, 0.22);
        break;
      case 9: // ANVIL DROP IMPACT (High metal warehouse percussion)
        this.synthCowbell(t, dest, vel, 560 * pMul);
        break;
      case 10: // DARK TECHNO STAB (Detuned stadium minor chord)
        this.synthRaveChord(t, dest, vel, 185 * pMul);
        break;
      case 11: // MADDIX LASER ZAP (Punchy high attack transient)
        this.synthLaser(t, dest, vel, 1500 * pMul, 110 * pMul, 0.16);
        break;
      case 12: // SUB BOMB 808 (Massive pitch-diving sub bomb)
        this.synthLaser(t, dest, vel, 160 * pMul, 35 * pMul, 0.9);
        break;
      case 13: // NOISE RISER BUILD (Heavy white noise build)
        this.synthNoiseBurst(t, dest, vel, 0.65);
        break;
      case 14: // MADDIX RAVE VOX ("TODAY IS THE DAY / ACID")
        this.synthVocalChant(t, dest, vel, 330 * pMul, 0.28, 'A');
        break;
      case 15: // STADIUM REVERB BOMB (Warehouse sub explosion drop)
        this.synthCrash(t, dest, vel, 2.2, 2800);
        break;
    }
  }

  // BANK B: BORIS BREJCHA • HIGH-TECH MINIMAL (126-128 BPM)
  private synthesizeBankB(pad: number, vel: number, t: number, dest: AudioNode, pMul: number) {
    switch (pad) {
      case 0: // BREJCHA CLICK KICK (Tight punchy kick with high transient click)
        this.synthBrejchaClickKick(t, dest, vel, pMul);
        break;
      case 1: // JOKER ROLLING BASS (Bouncy square-saw 16th rolling bass)
        this.synthBrejchaJokerBass(t, dest, vel, 62 * pMul, 0.22);
        break;
      case 2: // WOOD RIMSHOT (Snappy organic wooden rimshot)
        this.synthRimshot(t, dest, vel, 520 * pMul);
        break;
      case 3: // DUCK QUACK CLIK (Boris Brejcha's signature quirky pitch perc)
        this.synthDuckQuackPerc(t, dest, vel, 860 * pMul);
        break;
      case 4: // MINIMAL PLUCK ARP (Plucked analog filter lead)
        this.synthMelodicPluck(t, dest, vel, 440 * pMul, 0.22);
        break;
      case 5: // CRISP MICRO HAT (Ultra-tight micro closed hat)
        this.synthHat(t, dest, vel, 0.026, 9800, false);
        break;
      case 6: // SWUNG OPEN HAT (Bouncy swung offbeat open hat)
        this.synthHat(t, dest, vel, 0.26, 7200, true);
        break;
      case 7: // MODULATED SUB (Deep modulated sub-bass)
        this.synthSub808(t, dest, vel, 48 * pMul, 0.55);
        break;
      case 8: // TECHNO BLEEP (High-pitched resonant synth blip)
        this.synthWoodblock(t, dest, vel, 720 * pMul);
        break;
      case 9: // HIGH WOOD PERC (Sharp resonant wood click)
        this.synthRimshot(t, dest, vel, 1100 * pMul);
        break;
      case 10: // BREJCHA CHORD (Atmospheric space-delayed minor chord)
        this.synthRaveChord(t, dest, vel * 0.75, 230 * pMul);
        break;
      case 11: // GLITCH NOISE FX (Micro glitch reverse texture)
        this.synthReverseSweep(t, dest, vel * 0.6, 0.16);
        break;
      case 12: // SUB DIVE 126 (Sub sine click dive)
        this.synthKick(t, dest, vel * 0.75, 130 * pMul, 42 * pMul, 0.16, 0.008, false);
        break;
      case 13: // FILTERED RISER (Resonant highpass noise sweep)
        this.synthNoiseBurst(t, dest, vel * 0.7, 0.45);
        break;
      case 14: // GLITCH VOCAL CHOP (Boris-style stuttered vocal chop)
        this.synthVocalChant(t, dest, vel, 310 * pMul, 0.2, 'O');
        break;
      case 15: // ACOUSTIC PULSE (Subtle minimal room pulse)
        this.synthCrash(t, dest, vel * 0.5, 1.2, 5200);
        break;
    }
  }

  // BANK C: ARTBAT & KOROLOVA • MELODIC TECHNO (124-126 BPM)
  private synthesizeBankC(pad: number, vel: number, t: number, dest: AudioNode, pMul: number) {
    switch (pad) {
      case 0: // PROGRESSIVE KICK (Warm deep 909 kick with rich low end)
        this.synthKick(t, dest, vel, 160 * pMul, 45 * pMul, 0.24, 0.012, true);
        break;
      case 1: // MELODIC SAW BASS (Rolling multi-saw progressive techno bassline)
        this.synthProgressiveSawBass(t, dest, vel, 65 * pMul, 0.28);
        break;
      case 2: // STEREO TECH CLAP (Lush wide reverb clap)
        this.synthClap(t, dest, vel, 0.32, 1400);
        break;
      case 3: // ANALOG TOM PERC (Warm resonant analog low tom)
        this.synthTom(t, dest, vel, 120 * pMul, 0.3);
        break;
      case 4: // ARTBAT BRASS STAB (Signature detuned analog brass chord stab)
        this.synthAnalogBrassStab(t, dest, vel, 196 * pMul);
        break;
      case 5: // SILKY CLOSED HAT (Soft smooth 16th closed hat)
        this.synthHat(t, dest, vel, 0.032, 8800, false);
        break;
      case 6: // WIDE OPEN CYM (Silky open hat with gentle stereo tail)
        this.synthHat(t, dest, vel, 0.32, 7000, true);
        break;
      case 7: // KOROLOVA WARM PAD (Lush minor 9th atmospheric pad chord)
        this.synthAtmosphericPad(t, dest, vel, 220 * pMul, 0.85);
        break;
      case 8: // REVERB PLUCK (Cinematic melodic pluck lead)
        this.synthMelodicPluck(t, dest, vel, 520 * pMul, 0.36);
        break;
      case 9: // SHAKER 16TH (Silky 16th progressive shaker)
        this.synthShaker(t, dest, vel, 0.07);
        break;
      case 10: // EUPHORIC LEAD (Singing analog saw lead)
        this.synthSynthStab(t, dest, vel, 392 * pMul, 'sawtooth', 0.4);
        break;
      case 11: // ATMOSPHERE DRONE (Deep hypnotic space reverb drone)
        this.synthSub808(t, dest, vel * 0.6, 55 * pMul, 0.95);
        break;
      case 12: // SUB SINE WARMTH (Pure 45Hz sub roller)
        this.synthSub808(t, dest, vel, 45 * pMul, 0.7);
        break;
      case 13: // DOWNLIFTER SWEEP (Smooth atmospheric white noise downlifter)
        this.synthReverseSweep(t, dest, vel * 0.7, 0.5);
        break;
      case 14: // SOULFUL ECHO VOX (Spacious emotive vocal phrase snippet)
        this.synthVocalChant(t, dest, vel, 280 * pMul, 0.38, 'E');
        break;
      case 15: // SPACE IMPACT (Deep cinematic low-end boom)
        this.synthCrash(t, dest, vel * 0.8, 2.0, 3600);
        break;
    }
  }

  // BANK D: DRUM & BASS • NOISIA, SUB FOCUS & CHASE & STATUS (174-176 BPM)
  private synthesizeBankD(pad: number, vel: number, t: number, dest: AudioNode, pMul: number) {
    switch (pad) {
      case 0: // PUNCH DNB KICK (180Hz transient punch kick)
        this.synthKick(t, dest, vel, 190 * pMul, 48 * pMul, 0.17, 0.01, true);
        break;
      case 1: // TEAROUT REESE BASS (Distorted multi-saw neuro reese)
        this.synthReeseBass(t, dest, vel, 52 * pMul, 0.48);
        break;
      case 2: // 200HZ CRACK SNARE (Piercing transient 200Hz snare crack)
        this.synthSnare(t, dest, vel, 210 * pMul, 0.15, 0.22, 4800);
        break;
      case 3: // AMEN GHOST CHOP (Fast breakbeat ghost chop snare)
        this.synthSnare(t, dest, vel, 245 * pMul, 0.07, 0.12, 4000);
        break;
      case 4: // NASTY FOGHORN (Piercing heavy jump-up foghorn)
        this.synthFoghornBass(t, dest, vel, 88 * pMul, 0.35);
        break;
      case 5: // ROLLING 16TH HAT (Relentless 16th rolling closed hat)
        this.synthHat(t, dest, vel, 0.035, 9600, false);
        break;
      case 6: // RIDE CYMBAL BELL (Crisp syncopated ride bell)
        this.synthRide(t, dest, vel, 0.65);
        break;
      case 7: // SUB SINE 45HZ (Deep vibrating 45Hz sub roller)
        this.synthSub808(t, dest, vel, 45 * pMul, 0.75);
        break;
      case 8: // NEURO GROWL FM (Aggressive FM modulated mid bass)
        this.synthFoghornBass(t, dest, vel, 105 * pMul, 0.32);
        break;
      case 9: // DUB SIREN ROOTS (Authentic Dub/Jungle sound system siren)
        this.synthDubSiren(t, dest, vel);
        break;
      case 10: // RAVE CHORD 90S (Euphoric rave piano / stab)
        this.synthRaveChord(t, dest, vel, 260 * pMul);
        break;
      case 11: // AMEN BREAK ROLL (Classic chopped jungle break roll)
        this.synthSnare(t, dest, vel * 0.9, 230 * pMul, 0.09, 0.15, 3600);
        break;
      case 12: // 808 SUB SLIDE (Deep portamento sub dive)
        this.synthLaser(t, dest, vel, 130 * pMul, 38 * pMul, 0.75);
        break;
      case 13: // REVERSE CRASH FX (Tension cymbal riser)
        this.synthReverseSweep(t, dest, vel, 0.45);
        break;
      case 14: // MC PRE-DROP SHOUT ("LET THE BASS DROP!")
        this.synthVocalChant(t, dest, vel, 290 * pMul, 0.32, 'E');
        break;
      case 15: // DJ SPINBACK FX (Vinyl deck reverse spinback)
        this.triggerScratchSound(vel * 1.5, -1);
        break;
    }
  }

  // BANK E: ACID 303 & KAZANTIP (142 BPM)
  private synthesizeBankE(pad: number, vel: number, t: number, dest: AudioNode, pMul: number) {
    switch (pad) {
      case 0: // 909 ACID KICK (Deep punchy 909 sub rave kick)
        this.synthKick(t, dest, vel, 195 * pMul, 42 * pMul, 0.28, 0.012, true);
        break;
      case 1: // TB-303 SQUELCH (Screaming resonant diode squelch)
        this.synthAcidSquelch(t, dest, vel, 68 * pMul, 0.35);
        break;
      case 2: // RAVE CLAP 90S (Snappy Kazantip beach stadium clap)
        this.synthClap(t, dest, vel, 0.3, 1600);
        break;
      case 3: // ACID REVERSE (Punchy 142 BPM reverse sub bass)
        this.synthReverseBass(t, dest, vel, 65 * pMul);
        break;
      case 4: // KAZANTIP LEAD (Iconic Kazantip anthem glide lead)
        this.synthKazantipLead(t, dest, vel, 330 * pMul, 0.38);
        break;
      case 5: // 909 TIGHT HAT (Crisp relentless 909 closed hat)
        this.synthHat(t, dest, vel, 0.03, 9200, false);
        break;
      case 6: // KAZANTIP OPEN (Offbeat sizzling 909 open hat)
        this.synthHat(t, dest, vel, 0.34, 7500, true);
        break;
      case 7: // ACID DRONE 303 (Low resonant 303 drone bass)
        this.synthSub808(t, dest, vel, 44 * pMul, 0.85);
        break;
      case 8: // RESONANT SLIDE (High-Q 303 filter envelope glide)
        this.synthAcidBass(t, dest, vel, 130 * pMul, 0.4, true);
        break;
      case 9: // RAVE PIANO STAB (90s Kazantip rave piano chord)
        this.synthRaveChord(t, dest, vel, 220 * pMul);
        break;
      case 10: // KAZANTIP CHORD (Sunset festival atmospheric minor chord)
        this.synthAtmosphericPad(t, dest, vel, 260 * pMul, 0.7);
        break;
      case 11: // ACID FILTER SWEEP (Resonant TB-303 highpass noise sweep)
        this.synthReverseSweep(t, dest, vel, 0.35);
        break;
      case 12: // SUB DROP BOOM (Sub bass dive explosion)
        this.synthLaser(t, dest, vel, 180 * pMul, 35 * pMul, 0.9);
        break;
      case 13: // ORANGE RISER (Beach sunset white noise tension riser)
        this.synthNoiseBurst(t, dest, vel, 0.6);
        break;
      case 14: // KAZANTIP VOX (Beach anthem vocal shout)
        this.synthVocalChant(t, dest, vel, 320 * pMul, 0.3, 'A');
        break;
      case 15: // FESTIVAL IMPACT (Massive open-air festival sub impact)
        this.synthCrash(t, dest, vel, 2.5, 3000);
        break;
    }
  }

  // BANK F: DAVID GUETTA & MORTEN • FUTURE RAVE (128 BPM)
  private synthesizeBankF(pad: number, vel: number, t: number, dest: AudioNode, pMul: number) {
    switch (pad) {
      case 0: // FUTURE RAVE KICK (Punchy titanium future rave kick)
        this.synthFutureRaveKick(t, dest, vel, pMul);
        break;
      case 1: // TITANIUM BASS (Sub rolling cyberpunk saw bass)
        this.synthProgressiveSawBass(t, dest, vel, 60 * pMul, 0.25);
        break;
      case 2: // FUTURE RAVE CLAP (Crisp tight modern stadium clap)
        this.synthClap(t, dest, vel, 0.26, 2000);
        break;
      case 3: // PUNCH REVERSE (Tight offbeat reverse punch)
        this.synthReverseBass(t, dest, vel, 70 * pMul);
        break;
      case 4: // TITANIUM SAW LEAD (Signature Guetta & MORTEN saw pluck)
        this.synthFutureRaveLead(t, dest, vel, 350 * pMul, 0.35);
        break;
      case 5: // CYBER HAT (Ultra-crisp modern titanium closed hat)
        this.synthHat(t, dest, vel, 0.028, 9800, false);
        break;
      case 6: // TITANIUM CYMBAL (High-passed wide festival open hat)
        this.synthHat(t, dest, vel, 0.3, 8000, true);
        break;
      case 7: // SUB BOMB 808 (Deep 40Hz titanium sub drone)
        this.synthSub808(t, dest, vel, 40 * pMul, 0.9);
        break;
      case 8: // FUTURE SCREECH (Cyberpunk pitch-bending synth screech)
        this.synthLaser(t, dest, vel, 2200 * pMul, 380 * pMul, 0.24);
        break;
      case 9: // METALLIC HIT (Sharp titanium metallic anvil impact)
        this.synthCowbell(t, dest, vel, 580 * pMul);
        break;
      case 10: // DARK RAVE CHORD (Titanium detuned minor rave chord)
        this.synthAnalogBrassStab(t, dest, vel, 210 * pMul);
        break;
      case 11: // CYBER LASER (Fast futuristic pitch laser zapper)
        this.synthLaser(t, dest, vel, 1600 * pMul, 120 * pMul, 0.15);
        break;
      case 12: // DEEP SUB SLIDE (Pitch dive sub shockwave)
        this.synthKick(t, dest, vel, 140 * pMul, 36 * pMul, 0.2, 0.01, false);
        break;
      case 13: // WHITE NOISE SWEEP (Future rave build-up noise)
        this.synthNoiseBurst(t, dest, vel, 0.55);
        break;
      case 14: // GUETTA VOX ("NEVER BE ALONE / FUTURE RAVE")
        this.synthVocalChant(t, dest, vel, 300 * pMul, 0.28, 'O');
        break;
      case 15: // TITANIUM DROP (Heavy futuristic sub drop)
        this.synthCrash(t, dest, vel, 2.0, 3500);
        break;
    }
  }

  // BANK G: GARD TECHNO • HARD TECHNO & SCHRANZ (152 BPM)
  private synthesizeBankG(pad: number, vel: number, t: number, dest: AudioNode, pMul: number) {
    switch (pad) {
      case 0: // WAREHOUSE HAMMER (152 BPM overdriven Berlin hammer kick)
        this.synthSchranzIndustrialKick(t, dest, vel, pMul);
        break;
      case 1: // DISTORTED RUMBLE (Aggressive clipped industrial rumble)
        this.synthSub808(t, dest, vel, 38 * pMul, 0.95);
        break;
      case 2: // INDUSTRIAL CLAP (Abrasive gated warehouse clap)
        this.synthClap(t, dest, vel, 0.25, 1200);
        break;
      case 3: // SCHRANZ PUNCH (Hardcore offbeat reverse punch)
        this.synthReverseBass(t, dest, vel, 75 * pMul);
        break;
      case 4: // ANVIL METALLIC (Heavy steel anvil impact hit)
        this.synthAnvilMetalStrike(t, dest, vel, 720 * pMul);
        break;
      case 5: // HARSH CLOSED HAT (High-velocity 16th industrial hat)
        this.synthHat(t, dest, vel, 0.024, 10500, false);
        break;
      case 6: // PIERCING OPEN HAT (Ear-piercing industrial open hat)
        this.synthHat(t, dest, vel, 0.28, 8800, true);
        break;
      case 7: // DARK SUB DRONE (Sub-bass distortion hum 38Hz)
        this.synthSub808(t, dest, vel, 36 * pMul, 1.0);
        break;
      case 8: // FILTER SCREECH (Abrasive resonance filter scream)
        this.synthHarshScreech(t, dest, vel, 2600 * pMul, 0.25);
        break;
      case 9: // CLANG PERCUSSION (Metallic oil drum hit)
        this.synthWoodblock(t, dest, vel, 840 * pMul);
        break;
      case 10: // INDUSTRIAL STAB (Harsh distorted schranz synth stab)
        this.synthRaveChord(t, dest, vel, 190 * pMul);
        break;
      case 11: // SCHRANZ ROLL (Relentless 16th industrial perc roll)
        this.synthRimshot(t, dest, vel, 1200 * pMul);
        break;
      case 12: // SUB BOMB SLAM (Massive clipped sub impact boom)
        this.synthLaser(t, dest, vel, 170 * pMul, 32 * pMul, 0.95);
        break;
      case 13: // ABRASIVE RISER (Distorted filter sweep tension)
        this.synthNoiseBurst(t, dest, vel, 0.7);
        break;
      case 14: // TECHNO SHOUT ("FASTER / HARDER")
        this.synthVocalChant(t, dest, vel, 340 * pMul, 0.3, 'A');
        break;
      case 15: // METALLIC CRASH (Warehouse concrete explosion crash)
        this.synthCrash(t, dest, vel, 2.4, 2500);
        break;
    }
  }

  // ----------------------------------------------------
  // LOW-LATENCY SYNTHESIS COMPONENT ROUTINES
  // ----------------------------------------------------

  // NEURO DETUNED REESE BASS
  private synthReeseBass(t: number, dest: AudioNode, vel: number, freq: number, decay: number) {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(2200, freq * 7), t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 1.8), t + decay);
    filter.Q.setValueAtTime(4.5, t);

    // 2 detuned saws for authentic neuro motion
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(Math.max(20, freq - 1.8), t);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq + 1.8, t);

    // Clean sub sine
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq, t);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.65 * vel, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    sub.connect(subGain);
    subGain.connect(dest);

    osc1.start(t);
    osc2.start(t);
    sub.start(t);
    osc1.stop(t + decay);
    osc2.stop(t + decay);
    sub.stop(t + decay);
  }

  // JUMP UP FOGHORN BASS
  private synthFoghornBass(t: number, dest: AudioNode, vel: number, freq: number, decay: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 1.25, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.08);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(390, t);
    filter.Q.setValueAtTime(6.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.1 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + decay);
  }

  // ROOTS DUB SIREN
  private synthDubSiren(t: number, dest: AudioNode, vel: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'square';

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(5.5, t);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(120, t);

    osc.frequency.setValueAtTime(580, t);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    lfo.start(t);
    osc.start(t);
    lfo.stop(t + 0.6);
    osc.stop(t + 0.6);
  }

  // LIQUID SOULFUL RHODES CHORD
  private synthLiquidRhodes(t: number, dest: AudioNode, vel: number, rootFreq: number) {
    const ctx = this.ctx!;
    const freqs = [rootFreq, rootFreq * 1.189, rootFreq * 1.498, rootFreq * 1.782, rootFreq * 2.245];
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.frequency.exponentialRampToValueAtTime(700, t + 0.55);

    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + 0.55);
    }
    filter.connect(gain);
    gain.connect(dest);
  }

  // PUNCHY / 808 / 909 KICK
  private synthKick(t: number, dest: AudioNode, vel: number, startFreq: number, endFreq: number, decay: number, clickDur: number, saturation: boolean) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + decay);

    gain.gain.setValueAtTime(1.1 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    // Transient click oscillator
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(650, t);
    clickOsc.frequency.exponentialRampToValueAtTime(60, t + clickDur);
    clickGain.gain.setValueAtTime(0.7 * vel, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + clickDur);

    clickOsc.connect(clickGain);
    clickGain.connect(dest);

    clickOsc.start(t);
    clickOsc.stop(t + clickDur);

    if (saturation) {
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeSaturationCurve(1.5);
      osc.connect(gain);
      gain.connect(shaper);
      shaper.connect(dest);
    } else {
      osc.connect(gain);
      gain.connect(dest);
    }

    osc.start(t);
    osc.stop(t + decay);
  }

  // 808 SUB DRONE
  private synthSub808(t: number, dest: AudioNode, vel: number, freq: number, decay: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.8, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.08);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.95 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    subOsc.start(t);
    osc.stop(t + decay);
    subOsc.stop(t + decay);
  }

  // LOG DRUM (Amapiano)
  private synthLogDrum(t: number, dest: AudioNode, vel: number, freq: number, decay: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const click = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 3.5, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.05);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);

    click.type = 'square';
    click.frequency.setValueAtTime(300, t);
    click.frequency.exponentialRampToValueAtTime(80, t + 0.02);

    gain.gain.setValueAtTime(1.0 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc.connect(filter);
    click.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(t);
    click.start(t);
    osc.stop(t + decay);
    click.stop(t + 0.03);
  }

  // SNARE
  private synthSnare(t: number, dest: AudioNode, vel: number, toneFreq: number, toneDecay: number, noiseDecay: number, noiseFreq: number) {
    const ctx = this.ctx!;

    // Tonal body
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(toneFreq * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(toneFreq, t + toneDecay);
    oscGain.gain.setValueAtTime(0.7 * vel, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + toneDecay);
    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(t);
    osc.stop(t + toneDecay);

    // Noise snap
    if (this.whiteNoiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.whiteNoiseBuffer;
      const noiseGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(noiseFreq, t);

      noiseGain.gain.setValueAtTime(0.85 * vel, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseDecay);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(dest);

      noise.start(t);
      noise.stop(t + noiseDecay);
    }
  }

  // CLAP (Multi-reflection burst)
  private synthClap(t: number, dest: AudioNode, vel: number, duration: number, filterFreq: number) {
    const ctx = this.ctx!;
    if (!this.whiteNoiseBuffer) return;

    // 3 micro reflections
    const delays = [0, 0.011, 0.022];
    for (const d of delays) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.whiteNoiseBuffer;
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(filterFreq, t + d);
      f.Q.setValueAtTime(3, t + d);

      g.gain.setValueAtTime(0.4 * vel, t + d);
      g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.02);

      noise.connect(f);
      f.connect(g);
      g.connect(dest);

      noise.start(t + d);
      noise.stop(t + d + 0.025);
    }

    // Main diffuse clap tail
    const mainNoise = ctx.createBufferSource();
    mainNoise.buffer = this.whiteNoiseBuffer;
    const mainGain = ctx.createGain();
    const mainFilter = ctx.createBiquadFilter();
    mainFilter.type = 'bandpass';
    mainFilter.frequency.setValueAtTime(filterFreq, t + 0.033);
    mainFilter.Q.setValueAtTime(2.2, t + 0.033);

    mainGain.gain.setValueAtTime(0.8 * vel, t + 0.033);
    mainGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    mainNoise.connect(mainFilter);
    mainFilter.connect(mainGain);
    mainGain.connect(dest);

    mainNoise.start(t + 0.033);
    mainNoise.stop(t + duration);
  }

  // HI-HAT
  private synthHat(t: number, dest: AudioNode, vel: number, decay: number, filterFreq: number, isOpen: boolean) {
    const ctx = this.ctx!;
    if (!this.whiteNoiseBuffer) return;

    const noise = ctx.createBufferSource();
    noise.buffer = this.whiteNoiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(filterFreq, t);

    // Bandpass resonance peak
    const peak = ctx.createBiquadFilter();
    peak.type = 'peaking';
    peak.frequency.setValueAtTime(10500, t);
    peak.gain.setValueAtTime(6, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.75 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    noise.connect(filter);
    filter.connect(peak);
    peak.connect(gain);
    gain.connect(dest);

    noise.start(t);
    noise.stop(t + decay);
  }

  // SHAKER
  private synthShaker(t: number, dest: AudioNode, vel: number, decay: number) {
    const ctx = this.ctx!;
    if (!this.whiteNoiseBuffer) return;
    const noise = ctx.createBufferSource();
    noise.buffer = this.whiteNoiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(6500, t);
    filter.Q.setValueAtTime(4.5, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.6 * vel, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(t);
    noise.stop(t + decay);
  }

  // TOM
  private synthTom(t: number, dest: AudioNode, vel: number, startFreq: number, decay: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq * 1.6, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.7, t + decay);

    gain.gain.setValueAtTime(0.85 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + decay);
  }

  // LASER TOM (Simmons Retro)
  private synthLaserTom(t: number, dest: AudioNode, vel: number, startFreq: number, endFreq: number, decay: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + decay);

    gain.gain.setValueAtTime(0.8 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + decay);
  }

  // RIDE CYMBAL
  private synthRide(t: number, dest: AudioNode, vel: number, decay: number) {
    const ctx = this.ctx!;
    const ratios = [520, 830, 1140, 1420];
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, t);

    for (const f of ratios) {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + decay);
    }

    filter.connect(gain);
    gain.connect(dest);
  }

  // CRASH CYMBAL
  private synthCrash(t: number, dest: AudioNode, vel: number, decay: number, filterFreq: number = 4000) {
    const ctx = this.ctx!;
    if (!this.whiteNoiseBuffer) return;
    const noise = ctx.createBufferSource();
    noise.buffer = this.whiteNoiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(filterFreq, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(t);
    noise.stop(t + decay);
  }

  // 808 COWBELL
  private synthCowbell(t: number, dest: AudioNode, vel: number, freq: number) {
    const ctx = this.ctx!;
    const f1 = freq;
    const f2 = freq * 1.5;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(f1, t);
    osc2.frequency.setValueAtTime(f2, t);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.25, t);
    filter.Q.setValueAtTime(3.5, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.3);
    osc2.stop(t + 0.3);
  }

  // RIMSHOT / WOODCLICK
  private synthRimshot(t: number, dest: AudioNode, vel: number, freq: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.85 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // WOODBLOCK
  private synthWoodblock(t: number, dest: AudioNode, vel: number, freq: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.4, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.01);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // SYNTH STAB
  private synthSynthStab(t: number, dest: AudioNode, vel: number, freq: number, wave: OscillatorType, decay: number) {
    const ctx = this.ctx!;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();

    osc1.type = wave;
    osc2.type = wave;
    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq * 1.008, t); // Detuned

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 5, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.2, t + decay);
    filter.Q.setValueAtTime(4.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + decay);
    osc2.stop(t + decay);
  }

  // HARD INDUSTRIAL RUMBLE KICK (909 + Distorted Sub Rumble)
  private synthRumbleKick(t: number, dest: AudioNode, vel: number, startFreq: number, endFreq: number) {
    const ctx = this.ctx!;
    const decay = 0.28;

    // Main punch transient
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + decay);

    gain.gain.setValueAtTime(1.2 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    // Click transient
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(800, t);
    click.frequency.exponentialRampToValueAtTime(80, t + 0.015);
    clickGain.gain.setValueAtTime(0.9 * vel, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

    // Distorted Sub Rumble Tail
    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    const rumbleFilter = ctx.createBiquadFilter();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(42, t);
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(120, t);

    rumbleGain.gain.setValueAtTime(0.01, t);
    rumbleGain.gain.linearRampToValueAtTime(0.7 * vel, t + 0.03);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    const shaper = ctx.createWaveShaper();
    shaper.curve = this.makeSaturationCurve(2.5);

    osc.connect(gain);
    gain.connect(shaper);
    click.connect(clickGain);
    clickGain.connect(dest);

    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(shaper);

    shaper.connect(dest);

    osc.start(t);
    click.start(t);
    rumble.start(t);
    osc.stop(t + decay);
    click.stop(t + 0.02);
    rumble.stop(t + 0.36);
  }

  // ACID BASS (TB-303 style with Screaming Filter Resonance & Drive)
  private synthAcidBass(t: number, dest: AudioNode, vel: number, freq: number, decay: number, isHard: boolean = true) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = isHard ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(freq * (isHard ? 1.05 : 1.0), t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.04);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * (isHard ? 10 : 6), t);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.4, t + decay);
    filter.Q.setValueAtTime(isHard ? 12.0 : 7.0, t); // Screaming resonance

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.95 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    if (isHard) {
      const shaper = ctx.createWaveShaper();
      shaper.curve = this.makeSaturationCurve(2.8);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(shaper);
      shaper.connect(dest);
    } else {
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
    }

    osc.start(t);
    osc.stop(t + decay);
  }

  // RAVE CHORD (Minor 7th stab)
  private synthRaveChord(t: number, dest: AudioNode, vel: number, rootFreq: number) {
    const ctx = this.ctx!;
    // Minor triad: 1, minor 3rd (1.189), 5th (1.498), minor 7th (1.782)
    const freqs = [rootFreq, rootFreq * 1.189, rootFreq * 1.498, rootFreq * 1.782];
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, t);
    filter.frequency.exponentialRampToValueAtTime(900, t + 0.35);
    filter.Q.setValueAtTime(4.0, t);

    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + 0.35);
    }

    filter.connect(gain);
    gain.connect(dest);
  }

  // FORMANT VOCAL CHANT ("HEY", "GO", "YEAH")
  private synthVocalChant(t: number, dest: AudioNode, vel: number, fundamental: number, decay: number, vowel: 'A' | 'O' | 'E' | 'U') {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(fundamental, t);

    // Formant frequencies (F1, F2)
    let f1 = 800;
    let f2 = 1200;
    if (vowel === 'O') { f1 = 500; f2 = 900; }
    else if (vowel === 'E') { f1 = 400; f2 = 2200; }
    else if (vowel === 'U') { f1 = 350; f2 = 800; }

    const formant1 = ctx.createBiquadFilter();
    formant1.type = 'bandpass';
    formant1.frequency.setValueAtTime(f1, t);
    formant1.Q.setValueAtTime(5, t);

    const formant2 = ctx.createBiquadFilter();
    formant2.type = 'bandpass';
    formant2.frequency.setValueAtTime(f2, t);
    formant2.Q.setValueAtTime(6, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc.connect(formant1);
    osc.connect(formant2);
    formant1.connect(gain);
    formant2.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + decay);
  }

  // LASER ZAP
  private synthLaser(t: number, dest: AudioNode, vel: number, startFreq: number, endFreq: number, decay: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + decay);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + decay);
  }

  // NOISE BURST / RISER
  private synthNoiseBurst(t: number, dest: AudioNode, vel: number, duration: number) {
    const ctx = this.ctx!;
    if (!this.whiteNoiseBuffer) return;
    const noise = ctx.createBufferSource();
    noise.buffer = this.whiteNoiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(6000, t + duration);
    filter.Q.setValueAtTime(5, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.8 * vel, t + duration * 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(t);
    noise.stop(t + duration);
  }

  // REVERSE CYMBAL SWEEP
  private synthReverseSweep(t: number, dest: AudioNode, vel: number, duration: number) {
    const ctx = this.ctx!;
    if (!this.whiteNoiseBuffer) return;
    const noise = ctx.createBufferSource();
    noise.buffer = this.whiteNoiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, t);
    filter.frequency.exponentialRampToValueAtTime(2000, t + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.85 * vel, t + duration - 0.02);
    gain.gain.linearRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(t);
    noise.stop(t + duration);
  }

  // KALIMBA
  private synthKalimba(t: number, dest: AudioNode, vel: number, freq: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    const harm = ctx.createOscillator();
    harm.type = 'sine';
    harm.frequency.setValueAtTime(freq * 3, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    const harmGain = ctx.createGain();
    harmGain.gain.setValueAtTime(0.3 * vel, t);
    harmGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    harm.connect(harmGain);
    harmGain.connect(gain);
    gain.connect(dest);

    osc.start(t);
    harm.start(t);
    osc.stop(t + 0.65);
    harm.stop(t + 0.1);
  }

  // BAMBOO FLUTE
  private synthFlute(t: number, dest: AudioNode, vel: number, freq: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    const breath = ctx.createBufferSource();
    if (this.whiteNoiseBuffer) {
      breath.buffer = this.whiteNoiseBuffer;
    }
    const bFilter = ctx.createBiquadFilter();
    bFilter.type = 'bandpass';
    bFilter.frequency.setValueAtTime(freq * 2, t);
    bFilter.Q.setValueAtTime(4, t);

    const bGain = ctx.createGain();
    bGain.gain.setValueAtTime(0.12 * vel, t);
    bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.7 * vel, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    if (this.whiteNoiseBuffer) {
      breath.connect(bFilter);
      bFilter.connect(bGain);
      bGain.connect(gain);
      breath.start(t);
      breath.stop(t + 0.5);
    }
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.55);
  }

  // CHIMES
  private synthChimes(t: number, dest: AudioNode, vel: number) {
    const ctx = this.ctx!;
    const chimeFreqs = [1200, 1450, 1780, 2100, 2560];
    chimeFreqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.04);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.25 * vel, t + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.4);

      osc.connect(g);
      g.connect(dest);

      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.45);
    });
  }

  // ----------------------------------------------------
  // ARTIST-SPECIFIC PRO SYNTHESIZERS
  // ----------------------------------------------------

  // MADDIX: 7-Oscillator Detuned Hypnotic Supersaw Lead
  private synthSupersawRaveLead(t: number, dest: AudioNode, vel: number, rootFreq: number, decay: number = 0.35) {
    const ctx = this.ctx!;
    const detuneOffsets = [-18, -10, -4, 0, 4, 11, 19]; // cents
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.32 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(rootFreq * 8, t);
    filter.frequency.exponentialRampToValueAtTime(rootFreq * 2, t + decay);
    filter.Q.setValueAtTime(5.5, t);

    const shaper = ctx.createWaveShaper();
    shaper.curve = this.makeSaturationCurve(2.2);

    detuneOffsets.forEach((detune) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(rootFreq, t);
      osc.detune.setValueAtTime(detune, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + decay);
    });

    filter.connect(gain);
    gain.connect(shaper);
    shaper.connect(dest);
  }

  // MADDIX: Big Room Reverse Bass Punch
  private synthReverseBass(t: number, dest: AudioNode, vel: number, freq: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.08);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, t);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.18);
    filter.frequency.exponentialRampToValueAtTime(160, t + 0.28);
    filter.Q.setValueAtTime(7, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.95 * vel, t + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    const shaper = ctx.createWaveShaper();
    shaper.curve = this.makeSaturationCurve(3.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(shaper);
    shaper.connect(dest);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // BORIS BREJCHA: Signature High-Tech Minimal Click Kick
  private synthBrejchaClickKick(t: number, dest: AudioNode, vel: number, pitchMul: number = 1.0) {
    const ctx = this.ctx!;
    const decay = 0.22;

    // Sub sine body
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180 * pitchMul, t);
    osc.frequency.exponentialRampToValueAtTime(46 * pitchMul, t + 0.06);
    oscGain.gain.setValueAtTime(1.1 * vel, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    // Signature Brejcha Click transient
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(2400 * pitchMul, t);
    click.frequency.exponentialRampToValueAtTime(120 * pitchMul, t + 0.008);
    clickGain.gain.setValueAtTime(0.85 * vel, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.008);

    osc.connect(oscGain);
    oscGain.connect(dest);
    click.connect(clickGain);
    clickGain.connect(dest);

    osc.start(t);
    click.start(t);
    osc.stop(t + decay);
    click.stop(t + 0.01);
  }

  // BORIS BREJCHA: Signature Joker Rolling Bouncy Bass
  private synthBrejchaJokerBass(t: number, dest: AudioNode, vel: number, freq: number, decay: number = 0.24) {
    const ctx = this.ctx!;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq * 1.006, t);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 9, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.8, t + decay);
    filter.Q.setValueAtTime(9.5, t); // High snappy resonance

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.85 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    const shaper = ctx.createWaveShaper();
    shaper.curve = this.makeSaturationCurve(1.8);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(shaper);
    shaper.connect(dest);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + decay);
    osc2.stop(t + decay);
  }

  // BORIS BREJCHA: Duck Quack / Pitch Click Micro Perc
  private synthDuckQuackPerc(t: number, dest: AudioNode, vel: number, startFreq: number = 850) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.25, t + 0.045);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.045);
    filter.Q.setValueAtTime(12, t); // Resonant quack/click

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // ARTBAT & KOROLOVA: Rolling Progressive Saw Bass
  private synthProgressiveSawBass(t: number, dest: AudioNode, vel: number, freq: number, decay: number = 0.26) {
    const ctx = this.ctx!;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const subOsc = ctx.createOscillator();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    subOsc.type = 'sine';

    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq * 1.008, t); // Creamy detune
    subOsc.frequency.setValueAtTime(freq * 0.5, t); // Deep sub octave

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 6, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, t + decay);
    filter.Q.setValueAtTime(4.5, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.75 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.85 * vel, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    subOsc.connect(subGain);
    subGain.connect(dest);

    osc1.start(t);
    osc2.start(t);
    subOsc.start(t);
    osc1.stop(t + decay);
    osc2.stop(t + decay);
    subOsc.stop(t + decay);
  }

  // ARTBAT: Signature Detuned Analog Brass Chord Stab
  private synthAnalogBrassStab(t: number, dest: AudioNode, vel: number, rootFreq: number) {
    const ctx = this.ctx!;
    // Minor 9th / 7th chord: 1, 1.189 (m3), 1.498 (5th), 1.782 (m7), 2.245 (9th)
    const freqs = [rootFreq, rootFreq * 1.189, rootFreq * 1.498, rootFreq * 1.782];
    const decay = 0.45;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.45 * vel, t + 0.025); // Smooth brass attack
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(4200, t + 0.05); // Brass swell
    filter.frequency.exponentialRampToValueAtTime(1100, t + decay);
    filter.Q.setValueAtTime(4.8, t);

    const shaper = ctx.createWaveShaper();
    shaper.curve = this.makeSaturationCurve(1.5);

    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + decay);
    });

    filter.connect(gain);
    gain.connect(shaper);
    shaper.connect(dest);
  }

  // KOROLOVA: Cinematic Reverb-Soaked Melodic Pluck
  private synthMelodicPluck(t: number, dest: AudioNode, vel: number, freq: number, decay: number = 0.38) {
    const ctx = this.ctx!;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq * 2.004, t);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 10, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.1, t + decay * 0.7);
    filter.Q.setValueAtTime(6.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.85 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + decay);
    osc2.stop(t + decay);
  }

  // KOROLOVA & ARTBAT: Lush Atmospheric Pad Chord
  private synthAtmosphericPad(t: number, dest: AudioNode, vel: number, rootFreq: number, duration: number = 0.8) {
    const ctx = this.ctx!;
    const freqs = [rootFreq, rootFreq * 1.189, rootFreq * 1.498, rootFreq * 1.782];

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.35 * vel, t + 0.08); // Gentle pad attack
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.linearRampToValueAtTime(3200, t + duration * 0.4);
    filter.frequency.exponentialRampToValueAtTime(900, t + duration);
    filter.Q.setValueAtTime(2.0, t);

    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + duration);
    });

    filter.connect(gain);
    gain.connect(dest);
  }

  // KAZANTIP: High-resonance anthem slide lead
  private synthKazantipLead(t: number, dest: AudioNode, vel: number, rootFreq: number, duration: number = 0.38) {
    const ctx = this.ctx!;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(rootFreq * 0.96, t);
    osc1.frequency.exponentialRampToValueAtTime(rootFreq, t + 0.03);
    osc2.frequency.setValueAtTime(rootFreq * 1.006, t);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(rootFreq * 2, t);
    filter.frequency.exponentialRampToValueAtTime(rootFreq * 9, t + 0.04);
    filter.frequency.exponentialRampToValueAtTime(rootFreq * 2.5, t + duration);
    filter.Q.setValueAtTime(8.5, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.85 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
  }

  // TB-303: Screaming Diode Squelch Bass
  private synthAcidSquelch(t: number, dest: AudioNode, vel: number, freq: number, duration: number = 0.35) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 12, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.2, t + duration * 0.8);
    filter.Q.setValueAtTime(14, t); // Screaming resonance

    const shaper = ctx.createWaveShaper();
    shaper.curve = this.makeSaturationCurve(3.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(shaper);
    shaper.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + duration);
  }

  // DAVID GUETTA & MORTEN: Titanium Future Rave Saw Pluck Lead
  private synthFutureRaveLead(t: number, dest: AudioNode, vel: number, rootFreq: number, duration: number = 0.35) {
    const ctx = this.ctx!;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc3.type = 'square';

    osc1.frequency.setValueAtTime(rootFreq, t);
    osc2.frequency.setValueAtTime(rootFreq * 1.012, t); // Wide stereo detune
    osc3.frequency.setValueAtTime(rootFreq * 0.5, t); // Underbelly sub-square

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(rootFreq * 11, t);
    filter.frequency.exponentialRampToValueAtTime(rootFreq * 1.8, t + duration * 0.6);
    filter.Q.setValueAtTime(6.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.88 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(t);
    osc2.start(t);
    osc3.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
    osc3.stop(t + duration);
  }

  // FUTURE RAVE: Heavy Punch Modern Kick
  private synthFutureRaveKick(t: number, dest: AudioNode, vel: number, pMul: number) {
    this.synthKick(t, dest, vel, 210 * pMul, 44 * pMul, 0.22, 0.008, true);
    // Add sub click
    const ctx = this.ctx!;
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(800 * pMul, t);
    click.frequency.exponentialRampToValueAtTime(120 * pMul, t + 0.012);
    clickGain.gain.setValueAtTime(0.35 * vel, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    click.connect(clickGain);
    clickGain.connect(dest);
    click.start(t);
    click.stop(t + 0.02);
  }

  // SCHRANZ / HARD TECHNO: Distorted Industrial Hammer Kick
  private synthSchranzIndustrialKick(t: number, dest: AudioNode, vel: number, pMul: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260 * pMul, t);
    osc.frequency.exponentialRampToValueAtTime(45 * pMul, t + 0.08);

    const shaper = ctx.createWaveShaper();
    shaper.curve = this.makeSaturationCurve(4.0); // Heavy distortion clip

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.setValueAtTime(3.5, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.0 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(shaper);
    shaper.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // HARD TECHNO: Industrial Steel Anvil Strike
  private synthAnvilMetalStrike(t: number, dest: AudioNode, vel: number, rootFreq: number) {
    const ctx = this.ctx!;
    const freqs = [rootFreq, rootFreq * 1.414, rootFreq * 2.23, rootFreq * 3.75];
    const decay = 0.28;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(rootFreq * 1.5, t);
    filter.Q.setValueAtTime(8, t);

    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + decay);
    });

    filter.connect(gain);
    gain.connect(dest);
  }

  // HARD TECHNO: Harsh Resonant Screech
  private synthHarshScreech(t: number, dest: AudioNode, vel: number, startFreq: number, duration: number = 0.25) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.3, t + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(startFreq * 0.8, t);
    filter.frequency.exponentialRampToValueAtTime(500, t + duration);
    filter.Q.setValueAtTime(15, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.75 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + duration);
  }

  // METRONOME TICK (For count-in pre-roll before recording)
  public playMetronomeClick(beat: number, t?: number) {
    const ctx = this.getContext();
    const time = t ?? ctx.currentTime;
    const isDownbeat = beat === 1;
    const freq = isDownbeat ? 1400 : 900;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(isDownbeat ? 0.85 : 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(time);
    osc.stop(time + 0.04);
  }

  // DOWNLOAD RECORDED TAKE (Direct browser download to WAV)
  public downloadRecordedTake(blob: Blob, filename: string = 'master-mix.wav') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename.endsWith('.wav') ? filename : `${filename}.wav`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  private makeSaturationCurve(amount: number): Float32Array {
    const n = 256;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  public destroy() {
    if (this.vuAnimationId) {
      cancelAnimationFrame(this.vuAnimationId);
    }
    if (this.ctx) {
      this.ctx.close();
    }
  }
}

// Global Singleton Instance
export const audioEngine = new AudioEngine();
