import { BankId, EQState, FXState, FXType, VUMeterData } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private headphoneGain: GainNode | null = null;
  private analyserLeft: AnalyserNode | null = null;
  private analyserRight: AnalyserNode | null = null;
  private splitter: ChannelSplitterNode | null = null;

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

  // VU Meter callback
  private onVUUpdate?: (vu: VUMeterData) => void;
  private vuAnimationId: number | null = null;

  constructor() {
    // Lazy AudioContext initialization on first user touch/click for Safari compliance
  }

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass({ latencyHint: 'interactive' });

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

      // Delay loop: filterNode -> delay -> delayFilter -> feedback -> delay
      this.filterNode.connect(this.delayNode);
      this.delayNode.connect(this.delayFilterNode);
      this.delayFilterNode.connect(this.delayFeedbackNode);
      this.delayFeedbackNode.connect(this.delayNode);
      this.delayFilterNode.connect(this.delayWetGain);

      // Reverb Convolver
      this.reverbConvolver = this.ctx.createConvolver();
      this.reverbConvolver.buffer = this.buildImpulseResponse(2.2, 2.0);
      this.reverbWetGain = this.ctx.createGain();
      this.reverbWetGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.filterNode.connect(this.reverbConvolver);
      this.reverbConvolver.connect(this.reverbWetGain);

      // Bitcrusher Waveshaper
      this.bitcrushNode = this.ctx.createWaveShaper();
      this.bitcrushNode.curve = this.makeBitcrushCurve(1.0);

      this.fxDryGain = this.ctx.createGain();
      this.fxDryGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.filterNode.connect(this.fxDryGain);

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

      // Destination
      this.masterGain.connect(this.ctx.destination);

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
      this.ctx.resume();
    }
    return this.ctx!;
  }

  public setVUMeterListener(callback: (vu: VUMeterData) => void) {
    this.onVUUpdate = callback;
  }

  private startVUMeterLoop() {
    if (this.vuAnimationId) cancelAnimationFrame(this.vuAnimationId);

    const bufferLeft = new Uint8Array(64);
    const bufferRight = new Uint8Array(64);

    let peakL = 0;
    let peakR = 0;

    const tick = () => {
      if (this.analyserLeft && this.analyserRight && this.onVUUpdate) {
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

        this.onVUUpdate({
          left: currentL,
          right: currentR,
          peakLeft: peakL,
          peakRight: peakR,
        });
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
      if (this.bitcrushNode) {
        this.bitcrushNode.curve = this.makeBitcrushCurve(Math.abs(param));
      }
      this.delayWetGain?.gain.setTargetAtTime(0, t, 0.02);
      this.reverbWetGain?.gain.setTargetAtTime(0, t, 0.02);
      this.noiseGain?.gain.setTargetAtTime(0, t, 0.02);
    } else if (fxState.activeFX === 'NOISE') {
      this.filterNode.type = 'allpass';
      const amount = Math.abs(param);
      if (this.noiseGain && this.noiseFilter) {
        this.noiseGain.gain.setTargetAtTime(amount * 0.4, t, 0.02);
        this.noiseFilter.frequency.setTargetAtTime(300 + amount * 6000, t, 0.03);
      }
      this.delayWetGain?.gain.setTargetAtTime(amount * 0.3, t, 0.02);
      this.reverbWetGain?.gain.setTargetAtTime(amount * 0.35, t, 0.02);
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
    }
  }

  // BANK A: 808 TRAP & HIP HOP
  private synthesizeBankA(pad: number, vel: number, t: number, dest: AudioNode, pMul: number) {
    const ctx = this.ctx!;
    switch (pad) {
      case 0: // KICK PUNCH
        this.synthKick(t, dest, vel, 140 * pMul, 38 * pMul, 0.28, 0.015, true);
        break;
      case 1: // 808 SUB LOW
        this.synthSub808(t, dest, vel, 55 * pMul, 0.85);
        break;
      case 2: // SNARE TIGHT
        this.synthSnare(t, dest, vel, 195 * pMul, 0.18, 0.22, 3500);
        break;
      case 3: // TRAP CLAP
        this.synthClap(t, dest, vel, 0.24, 1200);
        break;
      case 4: // RIM CLICK
        this.synthRimshot(t, dest, vel, 420 * pMul);
        break;
      case 5: // CLOSED HH
        this.synthHat(t, dest, vel, 0.045, 8000, false);
        break;
      case 6: // OPEN SIZZLE
        this.synthHat(t, dest, vel, 0.38, 6500, true);
        break;
      case 7: // SHAKER HIT
        this.synthShaker(t, dest, vel, 0.09);
        break;
      case 8: // HI TOM
        this.synthTom(t, dest, vel, 190 * pMul, 0.32);
        break;
      case 9: // LO TOM
        this.synthTom(t, dest, vel, 95 * pMul, 0.45);
        break;
      case 10: // RIDE CYMBAL
        this.synthRide(t, dest, vel, 0.65);
        break;
      case 11: // CRASH DROP
        this.synthCrash(t, dest, vel, 1.4);
        break;
      case 12: // 808 COWBELL
        this.synthCowbell(t, dest, vel, 540 * pMul);
        break;
      case 13: // BRASS STAB
        this.synthSynthStab(t, dest, vel, 220 * pMul, 'sawtooth', 0.28);
        break;
      case 14: // VOX CHANT
        this.synthVocalChant(t, dest, vel, 280 * pMul, 0.22, 'A');
        break;
      case 15: // LASER RISER
        this.synthLaser(t, dest, vel, 850 * pMul, 80 * pMul, 0.35);
        break;
    }
  }

  // BANK B: 909 TECHNO & CLUB
  private synthesizeBankB(pad: number, vel: number, t: number, dest: AudioNode, pMul: number) {
    switch (pad) {
      case 0: // 909 PUNCH
        this.synthKick(t, dest, vel, 160 * pMul, 46 * pMul, 0.35, 0.02, true);
        break;
      case 1: // ACID SUB
        this.synthAcidBass(t, dest, vel, 65 * pMul, 0.4);
        break;
      case 2: // 909 SNARE
        this.synthSnare(t, dest, vel, 220 * pMul, 0.25, 0.3, 4000);
        break;
      case 3: // STACK CLAP
        this.synthClap(t, dest, vel, 0.3, 1400);
        break;
      case 4: // CHIP CLICK
        this.synthRimshot(t, dest, vel, 650 * pMul);
        break;
      case 5: // TICKING HH
        this.synthHat(t, dest, vel, 0.03, 9000, false);
        break;
      case 6: // OPEN 909 HH
        this.synthHat(t, dest, vel, 0.45, 6000, true);
        break;
      case 7: // PEDAL HAT
        this.synthHat(t, dest, vel, 0.07, 7500, false);
        break;
      case 8: // CONGA HI
        this.synthTom(t, dest, vel, 260 * pMul, 0.24);
        break;
      case 9: // CONGA LO
        this.synthTom(t, dest, vel, 140 * pMul, 0.38);
        break;
      case 10: // RIDE BELL
        this.synthRide(t, dest, vel, 0.8);
        break;
      case 11: // DARK CRASH
        this.synthCrash(t, dest, vel, 1.8, 3000);
        break;
      case 12: // RAVE CHORD
        this.synthRaveChord(t, dest, vel, 220 * pMul);
        break;
      case 13: // SAW PLUCK
        this.synthSynthStab(t, dest, vel, 330 * pMul, 'sawtooth', 0.18);
        break;
      case 14: // VOX DROP
        this.synthVocalChant(t, dest, vel, 240 * pMul, 0.26, 'O');
        break;
      case 15: // NOISE SWEEP
        this.synthNoiseBurst(t, dest, vel, 0.6);
        break;
    }
  }

  // BANK C: RETRO SYNTHWAVE
  private synthesizeBankC(pad: number, vel: number, t: number, dest: AudioNode, pMul: number) {
    switch (pad) {
      case 0: // GATED KICK
        this.synthKick(t, dest, vel, 130 * pMul, 52 * pMul, 0.22, 0.01, false);
        break;
      case 1: // ANALOG BASS
        this.synthAcidBass(t, dest, vel, 55 * pMul, 0.55);
        break;
      case 2: // LINN SNARE
        this.synthSnare(t, dest, vel, 180 * pMul, 0.32, 0.35, 2800);
        break;
      case 3: // RETRO CLAP
        this.synthClap(t, dest, vel, 0.35, 1100);
        break;
      case 4: // WOOD RIM
        this.synthRimshot(t, dest, vel, 500 * pMul);
        break;
      case 5: // DIGI HAT
        this.synthHat(t, dest, vel, 0.05, 8500, false);
        break;
      case 6: // OPEN SYNTH HH
        this.synthHat(t, dest, vel, 0.5, 7000, true);
        break;
      case 7: // TAMBOURINE
        this.synthShaker(t, dest, vel, 0.15);
        break;
      case 8: // SYNTH TOM HI
        this.synthLaserTom(t, dest, vel, 320 * pMul, 120 * pMul, 0.3);
        break;
      case 9: // SYNTH TOM LO
        this.synthLaserTom(t, dest, vel, 160 * pMul, 60 * pMul, 0.42);
        break;
      case 10: // CHIME CRASH
        this.synthCrash(t, dest, vel, 2.0, 7000);
        break;
      case 11: // CYBER REVERSE
        this.synthReverseSweep(t, dest, vel, 0.5);
        break;
      case 12: // CYBER LEAD
        this.synthSynthStab(t, dest, vel, 440 * pMul, 'square', 0.32);
        break;
      case 13: // NEON ARP
        this.synthSynthStab(t, dest, vel, 660 * pMul, 'triangle', 0.16);
        break;
      case 14: // ROBOT VOX
        this.synthVocalChant(t, dest, vel, 200 * pMul, 0.3, 'E');
        break;
      case 15: // GLITCH ZAP
        this.synthLaser(t, dest, vel, 1400 * pMul, 120 * pMul, 0.18);
        break;
    }
  }

  // BANK D: AFRO GROOVE & PERCUSSION
  private synthesizeBankD(pad: number, vel: number, t: number, dest: AudioNode, pMul: number) {
    switch (pad) {
      case 0: // TRIBAL KICK
        this.synthKick(t, dest, vel, 120 * pMul, 42 * pMul, 0.3, 0.015, false);
        break;
      case 1: // LOG DRUM
        this.synthLogDrum(t, dest, vel, 82 * pMul, 0.65);
        break;
      case 2: // WOOD SNARE
        this.synthSnare(t, dest, vel, 210 * pMul, 0.15, 0.18, 4200);
        break;
      case 3: // SLAP CLAP
        this.synthClap(t, dest, vel, 0.2, 1600);
        break;
      case 4: // WOOD BLOCK
        this.synthWoodblock(t, dest, vel, 900 * pMul);
        break;
      case 5: // CABASA TICK
        this.synthShaker(t, dest, vel, 0.06);
        break;
      case 6: // SEEDS SHAKER
        this.synthShaker(t, dest, vel, 0.14);
        break;
      case 7: // AGOGO BELL
        this.synthCowbell(t, dest, vel, 780 * pMul);
        break;
      case 8: // DJEMBE HI
        this.synthTom(t, dest, vel, 340 * pMul, 0.22);
        break;
      case 9: // DJEMBE BASS
        this.synthTom(t, dest, vel, 110 * pMul, 0.5);
        break;
      case 10: // BONGO HI
        this.synthTom(t, dest, vel, 420 * pMul, 0.16);
        break;
      case 11: // BONGO LO
        this.synthTom(t, dest, vel, 220 * pMul, 0.28);
        break;
      case 12: // KALIMBA TINE
        this.synthKalimba(t, dest, vel, 523 * pMul);
        break;
      case 13: // BAMBOO FLUTE
        this.synthFlute(t, dest, vel, 659 * pMul);
        break;
      case 14: // TRIBAL CHANT
        this.synthVocalChant(t, dest, vel, 310 * pMul, 0.24, 'U');
        break;
      case 15: // WIND CHIME
        this.synthChimes(t, dest, vel);
        break;
    }
  }

  // ----------------------------------------------------
  // LOW-LATENCY SYNTHESIS COMPONENT ROUTINES
  // ----------------------------------------------------

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

  // ACID BASS (TB-303 style)
  private synthAcidBass(t: number, dest: AudioNode, vel: number, freq: number, decay: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 8, t);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, t + decay);
    filter.Q.setValueAtTime(8.0, t); // High resonance

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8 * vel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

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
