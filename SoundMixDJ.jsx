import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Web Audio Synthesizer & Sound Generation Engine ---
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.masterAnalyser = null;
    this.colorFilter = null;
    this.delayNode = null;
    this.delayGain = null;
    this.reverbConvolver = null;
    this.reverbGain = null;
    this.decks = {
      A: {
        lowFilter: null,
        midFilter: null,
        highFilter: null,
        gainNode: null,
        analyser: null,
        sourceLoop: null,
        isPlaying: false,
        cuePos: 0,
        bpm: 124,
      },
      B: {
        lowFilter: null,
        midFilter: null,
        highFilter: null,
        gainNode: null,
        analyser: null,
        sourceLoop: null,
        isPlaying: false,
        cuePos: 0,
        bpm: 124,
      }
    };
    this.crossfader = 0.5; // 0 (Deck A) to 1 (Deck B)
    this.tempo = 124;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Output & Analyser
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 64;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    // Color FX (Bi-directional Filter)
    this.colorFilter = this.ctx.createBiquadFilter();
    this.colorFilter.type = 'allpass'; // Default neutral
    this.colorFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    // Time FX: Delay
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.setValueAtTime((60 / this.tempo) * 0.75, this.ctx.currentTime); // 3/16 delay
    const delayFeedback = this.ctx.createGain();
    delayFeedback.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.delayNode.connect(delayFeedback);
    delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayGain);

    // Time FX: Reverb (Algorithmic Impulse Response)
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = this.generateImpulseResponse(1.8, 2.0);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.reverbConvolver.connect(this.reverbGain);

    // Summing Bus
    this.busGain = this.ctx.createGain();
    this.busGain.connect(this.colorFilter);
    this.colorFilter.connect(this.masterGain);

    // FX Sends
    this.busGain.connect(this.delayNode);
    this.delayGain.connect(this.masterGain);

    this.busGain.connect(this.reverbConvolver);
    this.reverbGain.connect(this.masterGain);

    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // Initialize Deck A & Deck B processing chains
    ['A', 'B'].forEach((deckId) => {
      const deck = this.decks[deckId];
      deck.lowFilter = this.ctx.createBiquadFilter();
      deck.lowFilter.type = 'lowshelf';
      deck.lowFilter.frequency.setValueAtTime(300, this.ctx.currentTime);
      deck.lowFilter.gain.setValueAtTime(0, this.ctx.currentTime);

      deck.midFilter = this.ctx.createBiquadFilter();
      deck.midFilter.type = 'peaking';
      deck.midFilter.frequency.setValueAtTime(1500, this.ctx.currentTime);
      deck.midFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
      deck.midFilter.gain.setValueAtTime(0, this.ctx.currentTime);

      deck.highFilter = this.ctx.createBiquadFilter();
      deck.highFilter.type = 'highshelf';
      deck.highFilter.frequency.setValueAtTime(4500, this.ctx.currentTime);
      deck.highFilter.gain.setValueAtTime(0, this.ctx.currentTime);

      deck.gainNode = this.ctx.createGain();
      deck.gainNode.gain.setValueAtTime(0.8, this.ctx.currentTime);

      deck.analyser = this.ctx.createAnalyser();
      deck.analyser.fftSize = 32;

      // Chain: EQ Low -> Mid -> High -> Gain -> Analyser -> Summing Bus
      deck.lowFilter.connect(deck.midFilter);
      deck.midFilter.connect(deck.highFilter);
      deck.highFilter.connect(deck.gainNode);
      deck.gainNode.connect(deck.analyser);
      deck.analyser.connect(this.busGain);
    });

    this.updateCrossfader(0.5);
    this.isInitialized = true;
  }

  generateImpulseResponse(duration, decay) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i;
      const factor = Math.exp(-n / (sampleRate * (decay / 4)));
      left[i] = ((Math.random() * 2) - 1) * factor;
      right[i] = ((Math.random() * 2) - 1) * factor;
    }
    return impulse;
  }

  // --- EQ & Isolator Controls ---
  setDeckEQ(deckId, band, dbValue) {
    if (!this.ctx) return;
    const deck = this.decks[deckId];
    const targetNode = band === 'low' ? deck.lowFilter : band === 'mid' ? deck.midFilter : deck.highFilter;
    if (targetNode) {
      targetNode.gain.setTargetAtTime(dbValue, this.ctx.currentTime, 0.03);
    }
  }

  setDeckVolume(deckId, volume) {
    if (!this.ctx) return;
    const deck = this.decks[deckId];
    if (deck && deck.gainNode) {
      deck.gainNode.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.02);
    }
  }

  updateCrossfader(val) {
    this.crossfader = val;
    if (!this.ctx) return;
    // Equal-power crossfade curve
    const gainA = Math.cos(val * 0.5 * Math.PI);
    const gainB = Math.sin(val * 0.5 * Math.PI);

    this.decks.A.gainNode.gain.setTargetAtTime(gainA, this.ctx.currentTime, 0.02);
    this.decks.B.gainNode.gain.setTargetAtTime(gainB, this.ctx.currentTime, 0.02);
  }

  setColorFX(value) {
    // value: -1.0 (LPF) to 0.0 (Bypass) to +1.0 (HPF)
    if (!this.ctx || !this.colorFilter) return;
    const now = this.ctx.currentTime;
    if (Math.abs(value) < 0.05) {
      this.colorFilter.type = 'allpass';
    } else if (value < 0) {
      this.colorFilter.type = 'lowpass';
      // Sweep 20000Hz down to 200Hz
      const freq = 200 + (1.0 + value) * 19800;
      this.colorFilter.frequency.setTargetAtTime(Math.max(150, freq), now, 0.03);
      this.colorFilter.Q.setTargetAtTime(2.5, now, 0.03);
    } else {
      this.colorFilter.type = 'highpass';
      // Sweep 20Hz up to 8000Hz
      const freq = 20 + value * 8000;
      this.colorFilter.frequency.setTargetAtTime(freq, now, 0.03);
      this.colorFilter.Q.setTargetAtTime(2.5, now, 0.03);
    }
  }

  setDelayWet(wet) {
    if (!this.ctx || !this.delayGain) return;
    this.delayGain.gain.setTargetAtTime(wet * 0.7, this.ctx.currentTime, 0.03);
  }

  setReverbWet(wet) {
    if (!this.ctx || !this.reverbGain) return;
    this.reverbGain.gain.setTargetAtTime(wet * 0.8, this.ctx.currentTime, 0.03);
  }

  // --- Real-time Synthesized Virtual DJ Decks ---
  triggerDeckLoop(deckId, start = true) {
    this.init();
    const deck = this.decks[deckId];
    if (!start) {
      if (deck.sourceLoop) {
        clearInterval(deck.sourceLoop);
        deck.sourceLoop = null;
      }
      deck.isPlaying = false;
      return;
    }

    if (deck.isPlaying) return;
    deck.isPlaying = true;

    // Deck A plays synthetic Techno/Deep House Grooves
    // Deck B plays synthetic Melodic Acid Basslines
    let step = 0;
    const intervalMs = (60 / this.tempo) * 250; // 16th note timing

    deck.sourceLoop = setInterval(() => {
      if (!this.ctx || !deck.isPlaying) return;
      const time = this.ctx.currentTime + 0.01;

      if (deckId === 'A') {
        // Deck A: Driving 4-on-the-floor beat & Offbeat hi-hat
        if (step % 4 === 0) {
          this.synthesizeDirectKick(time, deck.lowFilter);
        }
        if (step % 4 === 2) {
          this.synthesizeDirectHat(time, deck.lowFilter, 0.08);
        }
        if (step % 8 === 4) {
          this.synthesizeDirectClap(time, deck.lowFilter);
        }
      } else {
        // Deck B: Melodic 16th Acid Bassline with pitch movement
        const notes = [55, 55, 65, 58, 55, 70, 67, 62, 55, 58, 62, 65, 55, 53, 50, 48];
        const freq = 440 * Math.pow(2, (notes[step % 16] - 69) / 12);
        this.synthesizeDirectAcid(time, deck.lowFilter, freq);
      }
      step = (step + 1) % 16;
    }, intervalMs);
  }

  synthesizeDirectKick(time, destinationNode) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);
    gain.gain.setValueAtTime(0.85, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    osc.connect(gain);
    gain.connect(destinationNode);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  synthesizeDirectHat(time, destinationNode, decay) {
    const bufferSize = this.ctx.sampleRate * decay;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2) - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destinationNode);
    noise.start(time);
    noise.stop(time + decay);
  }

  synthesizeDirectClap(time, destinationNode) {
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2) - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.Q.setValueAtTime(2, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destinationNode);
    noise.start(time);
    noise.stop(time + 0.2);
  }

  synthesizeDirectAcid(time, destinationNode, freq) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);
    filter.frequency.exponentialRampToValueAtTime(2800, time + 0.05);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.16);
    filter.Q.setValueAtTime(7.0, time);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destinationNode);
    osc.start(time);
    osc.stop(time + 0.19);
  }

  // --- 16-PAD PERFORMANCE DRUM SYNTHESIZERS ---
  triggerPad(index) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime + 0.001;
    const out = this.busGain;

    switch (index) {
      case 0: // Deep Punch Kick
        this.playKick(now, out, 160, 38, 0.35, 1.0);
        break;
      case 1: // Snappy 909 Snare
        this.playSnare(now, out, 220, 0.22);
        break;
      case 2: // Layered Hand Clap
        this.playClap(now, out);
        break;
      case 3: // Closed Hi-Hat
        this.playHiHat(now, out, 0.06, 8000);
        break;
      case 4: // Open Hi-Hat
        this.playHiHat(now, out, 0.42, 6500);
        break;
      case 5: // Low Floor Tom
        this.playTom(now, out, 110, 60, 0.28);
        break;
      case 6: // Mid Rack Tom
        this.playTom(now, out, 180, 95, 0.24);
        break;
      case 7: // High Accent Tom
        this.playTom(now, out, 260, 140, 0.20);
        break;
      case 8: // Metallic Rimshot
        this.playRimshot(now, out);
        break;
      case 9: // Shaker
        this.playShaker(now, out);
        break;
      case 10: // 808 Cowbell
        this.playCowbell(now, out);
        break;
      case 11: // Metallic Crash Cymbal
        this.playCrash(now, out);
        break;
      case 12: // Resonant Sub Bass
        this.playSubBass(now, out, 55);
        break;
      case 13: // Rave Synth Stab
        this.playSynthStab(now, out, 440);
        break;
      case 14: // Sci-Fi Laser Zap
        this.playLaserZap(now, out);
        break;
      case 15: // Vinyl Scratch FX
        this.playScratchFX(now, out);
        break;
      default:
        break;
    }
  }

  playKick(time, dest, startFreq, endFreq, decay, gainAmt) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + decay * 0.5);
    gain.gain.setValueAtTime(gainAmt, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + decay);
  }

  playSnare(time, dest, toneFreq, decay) {
    // Tone oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(toneFreq, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
    oscGain.gain.setValueAtTime(0.6, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(oscGain);
    oscGain.connect(dest);

    // Snare Wire Noise Burst
    const bufferSize = this.ctx.sampleRate * decay;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2) - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, time);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.15);
    noise.start(time);
    noise.stop(time + decay);
  }

  playClap(time, dest) {
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2) - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, time);
    filter.Q.setValueAtTime(2.2, time);

    const gain = this.ctx.createGain();
    // Multi-tap clap envelope
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.05, time + 0.015);
    gain.gain.setValueAtTime(0.6, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.05, time + 0.035);
    gain.gain.setValueAtTime(0.7, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + 0.25);
  }

  playHiHat(time, dest, decay, freq) {
    const bufferSize = this.ctx.sampleRate * decay;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2) - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(freq, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + decay);
  }

  playTom(time, dest, startFreq, endFreq, decay) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + decay);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + decay);
  }

  playRimshot(time, dest) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, time);
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  playShaker(time, dest) {
    const bufferSize = this.ctx.sampleRate * 0.09;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2) - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(4500, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + 0.09);
  }

  playCowbell(time, dest) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(587, time);
    osc2.frequency.setValueAtTime(845, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, time);
    filter.Q.setValueAtTime(3.0, time);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.36);
    osc2.stop(time + 0.36);
  }

  playCrash(time, dest) {
    const bufferSize = this.ctx.sampleRate * 1.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2) - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + 1.4);
  }

  playSubBass(time, dest, freq) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);
    filter.frequency.exponentialRampToValueAtTime(80, time + 0.4);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.46);
  }

  playSynthStab(time, dest, freq) {
    const chordFrequencies = [freq, freq * 1.25, freq * 1.5]; // Major Triad
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, time);
    filter.frequency.exponentialRampToValueAtTime(500, time + 0.28);

    chordFrequencies.forEach((f) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, time);
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + 0.32);
    });

    filter.connect(gain);
    gain.connect(dest);
  }

  playLaserZap(time, dest) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.12);

    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  playScratchFX(time, dest) {
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2) - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700, time);
    filter.frequency.linearRampToValueAtTime(2800, time + 0.08);
    filter.frequency.linearRampToValueAtTime(400, time + 0.17);
    filter.Q.setValueAtTime(6.0, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + 0.19);
  }
}

// Global audio engine instance
const audio = new AudioEngine();

// --- Performance Pad Data Definitions ---
const PAD_CONFIG = [
  { id: 0, label: 'KICK 1', color: 'border-red-500 text-red-400 bg-red-950/20 active:bg-red-500' },
  { id: 1, label: 'SNARE 909', color: 'border-amber-500 text-amber-400 bg-amber-950/20 active:bg-amber-500' },
  { id: 2, label: 'CLAP', color: 'border-yellow-500 text-yellow-400 bg-yellow-950/20 active:bg-yellow-500' },
  { id: 3, label: 'CL HAT', color: 'border-cyan-500 text-cyan-400 bg-cyan-950/20 active:bg-cyan-500' },
  { id: 4, label: 'OP HAT', color: 'border-cyan-400 text-cyan-300 bg-cyan-950/20 active:bg-cyan-400' },
  { id: 5, label: 'LOW TOM', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/20 active:bg-emerald-500' },
  { id: 6, label: 'MID TOM', color: 'border-emerald-400 text-emerald-300 bg-emerald-950/20 active:bg-emerald-400' },
  { id: 7, label: 'HI TOM', color: 'border-teal-400 text-teal-300 bg-teal-950/20 active:bg-teal-400' },
  { id: 8, label: 'RIMSHOT', color: 'border-orange-500 text-orange-400 bg-orange-950/20 active:bg-orange-500' },
  { id: 9, label: 'SHAKER', color: 'border-lime-500 text-lime-400 bg-lime-950/20 active:bg-lime-500' },
  { id: 10, label: 'COWBELL', color: 'border-blue-500 text-blue-400 bg-blue-950/20 active:bg-blue-500' },
  { id: 11, label: 'CRASH', color: 'border-sky-400 text-sky-300 bg-sky-950/20 active:bg-sky-400' },
  { id: 12, label: 'SUB BASS', color: 'border-purple-500 text-purple-400 bg-purple-950/20 active:bg-purple-500' },
  { id: 13, label: 'RAVE STAB', color: 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-950/20 active:bg-fuchsia-500' },
  { id: 14, label: 'LASER ZAP', color: 'border-pink-500 text-pink-400 bg-pink-950/20 active:bg-pink-500' },
  { id: 15, label: 'SCRATCH', color: 'border-rose-500 text-rose-400 bg-rose-950/20 active:bg-rose-500' },
];

export default function SoundMixPioneerDJ() {
  // Mixer State
  const [deckAState, setDeckAState] = useState({ isPlaying: false, isCue: false, sync: false, vol: 0.8, low: 0, mid: 0, high: 0 });
  const [deckBState, setDeckBState] = useState({ isPlaying: false, isCue: false, sync: false, vol: 0.8, low: 0, mid: 0, high: 0 });
  const [crossfader, setCrossfader] = useState(0.5);
  const [bpm, setBpm] = useState(124);
  const [colorFX, setColorFX] = useState(0); // -1 (LPF) to 1 (HPF)
  const [delayWet, setDelayWet] = useState(0);
  const [reverbWet, setReverbWet] = useState(0);

  // Sequencer & Active Pad State
  const [activePad, setActivePad] = useState(null);
  const [isSeqPlaying, setIsSeqPlaying] = useState(false);
  const [seqStep, setSeqStep] = useState(0);
  const [tapTimes, setTapTimes] = useState([]);

  // 16-Step Sequencer Grid (4 core tracks: Kick, Snare, ClHat, Bass)
  const [seqGrid, setSeqGrid] = useState({
    0: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // Kick
    1: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Snare
    3: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], // Closed Hat
    12: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0] // Sub Bass
  });

  // VU Meter State
  const [vuDeckA, setVuDeckA] = useState(0);
  const [vuDeckB, setVuDeckB] = useState(0);
  const [vuMaster, setVuMaster] = useState(0);

  // Resume AudioContext on iOS first interaction
  const unlockAudio = useCallback(() => {
    audio.init();
  }, []);

  // Sequencer Clock Loop
  useEffect(() => {
    let interval = null;
    if (isSeqPlaying) {
      const stepMs = (60 / bpm) * 250;
      interval = setInterval(() => {
        setSeqStep((prev) => {
          const nextStep = (prev + 1) % 16;
          // Trigger drum pads programmed on this step
          Object.keys(seqGrid).forEach((padIndex) => {
            if (seqGrid[padIndex][nextStep] === 1) {
              audio.triggerPad(parseInt(padIndex, 10));
            }
          });
          return nextStep;
        });
      }, stepMs);
    } else {
      setSeqStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSeqPlaying, bpm, seqGrid]);

  // VU Meter Audio Visualizer loop
  useEffect(() => {
    let animFrame = null;
    const dataA = new Uint8Array(16);
    const dataB = new Uint8Array(16);
    const dataM = new Uint8Array(32);

    const updateVU = () => {
      if (audio.isInitialized) {
        if (audio.decks.A.analyser) {
          audio.decks.A.analyser.getByteFrequencyData(dataA);
          const avgA = dataA.reduce((a, b) => a + b, 0) / dataA.length;
          setVuDeckA(Math.min(100, Math.round((avgA / 255) * 120)));
        }
        if (audio.decks.B.analyser) {
          audio.decks.B.analyser.getByteFrequencyData(dataB);
          const avgB = dataB.reduce((a, b) => a + b, 0) / dataB.length;
          setVuDeckB(Math.min(100, Math.round((avgB / 255) * 120)));
        }
        if (audio.masterAnalyser) {
          audio.masterAnalyser.getByteFrequencyData(dataM);
          const avgM = dataM.reduce((a, b) => a + b, 0) / dataM.length;
          setVuMaster(Math.min(100, Math.round((avgM / 255) * 120)));
        }
      }
      animFrame = requestAnimationFrame(updateVU);
    };

    animFrame = requestAnimationFrame(updateVU);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Tap BPM Calculator
  const handleTapTempo = () => {
    unlockAudio();
    const now = performance.now();
    const recentTaps = [...tapTimes.filter((t) => now - t < 3000), now];
    setTapTimes(recentTaps);

    if (recentTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < recentTaps.length; i++) {
        intervals.push(recentTaps[i] - recentTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 60 && calculatedBpm <= 200) {
        setBpm(calculatedBpm);
        audio.tempo = calculatedBpm;
      }
    }
  };

  // Drum Pad Trigger Handler with iOS Touch Optimization
  const handlePadPress = (padId, e) => {
    if (e && e.cancelable) e.preventDefault();
    unlockAudio();
    setActivePad(padId);
    audio.triggerPad(padId);
    setTimeout(() => {
      setActivePad((curr) => (curr === padId ? null : curr));
    }, 120);
  };

  const toggleDeckPlay = (deckId) => {
    unlockAudio();
    if (deckId === 'A') {
      const next = !deckAState.isPlaying;
      setDeckAState((s) => ({ ...s, isPlaying: next }));
      audio.triggerDeckLoop('A', next);
    } else {
      const next = !deckBState.isPlaying;
      setDeckBState((s) => ({ ...s, isPlaying: next }));
      audio.triggerDeckLoop('B', next);
    }
  };

  const toggleDeckCue = (deckId) => {
    unlockAudio();
    if (deckId === 'A') {
      setDeckAState((s) => ({ ...s, isPlaying: false, isCue: true }));
      audio.triggerDeckLoop('A', false);
      setTimeout(() => setDeckAState((s) => ({ ...s, isCue: false })), 200);
    } else {
      setDeckBState((s) => ({ ...s, isPlaying: false, isCue: true }));
      audio.triggerDeckLoop('B', false);
      setTimeout(() => setDeckBState((s) => ({ ...s, isCue: false })), 200);
    }
  };

  const handleCrossfaderChange = (val) => {
    setCrossfader(val);
    audio.updateCrossfader(val);
  };

  const handleEQChange = (deckId, band, dbVal) => {
    if (deckId === 'A') {
      setDeckAState((s) => ({ ...s, [band]: dbVal }));
    } else {
      setDeckBState((s) => ({ ...s, [band]: dbVal }));
    }
    audio.setDeckEQ(deckId, band, dbVal);
  };

  const handleVolChange = (deckId, vol) => {
    if (deckId === 'A') {
      setDeckAState((s) => ({ ...s, vol }));
    } else {
      setDeckBState((s) => ({ ...s, vol }));
    }
    audio.setDeckVolume(deckId, vol);
  };

  const toggleSeqStep = (padId, stepIndex) => {
    setSeqGrid((prev) => {
      const row = prev[padId] ? [...prev[padId]] : new Array(16).fill(0);
      row[stepIndex] = row[stepIndex] === 1 ? 0 : 1;
      return { ...prev, [padId]: row };
    });
  };

  return (
    <div
      onClick={unlockAudio}
      onTouchStart={unlockAudio}
      className="min-h-screen bg-[#08080a] text-neutral-200 select-none touch-manipulation font-mono antialiased pb-safe"
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Top Pioneer Brand & Status Bar */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur px-4 py-2 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse" />
          <span className="font-extrabold text-sm tracking-widest text-white">Pioneer DJ</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-semibold border border-neutral-700">
            PRO-DJ LINK
          </span>
        </div>

        {/* Global Master OLED Display */}
        <div className="flex items-center space-x-4 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-md shadow-inner">
          <div className="text-center">
            <span className="text-[9px] text-neutral-500 uppercase block tracking-tighter">MASTER BPM</span>
            <span className="text-amber-400 font-bold text-sm tracking-wider">{bpm.toFixed(1)}</span>
          </div>
          <div className="h-5 w-[1px] bg-neutral-800" />
          <div className="text-center">
            <span className="text-[9px] text-neutral-500 uppercase block tracking-tighter">QUANTIZE</span>
            <span className="text-emerald-400 font-bold text-xs">1/16 ON</span>
          </div>
          <div className="h-5 w-[1px] bg-neutral-800" />
          {/* Master VU */}
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-neutral-500 tracking-tighter">M-VU</span>
            <div className="w-8 h-2.5 bg-neutral-950 rounded-sm overflow-hidden flex border border-neutral-800">
              <div
                className={`h-full transition-all duration-75 ${
                  vuMaster > 85 ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' : vuMaster > 60 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${vuMaster}%` }}
              />
            </div>
          </div>
        </div>

        {/* Master Tap Tempo */}
        <button
          onClick={handleTapTempo}
          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 active:bg-amber-500 active:text-black rounded text-[11px] font-bold text-amber-400 border border-amber-500/40 transition-colors shadow-sm"
        >
          TAP BPM
        </button>
      </header>

      {/* Main DJ Console Layout */}
      <main className="p-3 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* ========================================================================= */}
        {/* SECTION A: DUAL-DECK MIXER (Columns 1 to 5) */}
        {/* ========================================================================= */}
        <section className="lg:col-span-6 bg-gradient-to-b from-[#121216] to-[#0c0c0e] border border-neutral-800/90 rounded-xl p-3 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/80">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-neutral-400 tracking-wider">MIXING CONSOLE</span>
              <span className="text-[10px] text-neutral-600">DJM-900NXS2 ARCHITECTURE</span>
            </div>
            <div className="flex space-x-1">
              <span className={`w-2 h-2 rounded-full ${deckAState.isPlaying ? 'bg-cyan-400 shadow-[0_0_6px_#00f0ff]' : 'bg-neutral-700'}`} />
              <span className={`w-2 h-2 rounded-full ${deckBState.isPlaying ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-neutral-700'}`} />
            </div>
          </div>

          {/* Dual Channel Strips */}
          <div className="grid grid-cols-2 gap-3">
            {/* --- DECK A CHANNEL --- */}
            <div className="bg-[#0e0e12] border border-cyan-950/50 rounded-lg p-2.5 flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                <span className="text-xs font-black text-cyan-400 tracking-wider">CH 1 // DECK A</span>
                <button
                  onClick={() => setDeckAState((s) => ({ ...s, sync: !s.sync }))}
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                    deckAState.sync ? 'bg-cyan-500 text-black border-cyan-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  SYNC
                </button>
              </div>

              {/* 3-Band Isolator Knobs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400">HI</span>
                  <input
                    type="range"
                    min="-26"
                    max="6"
                    step="1"
                    value={deckAState.high}
                    onChange={(e) => handleEQChange('A', 'high', parseFloat(e.target.value))}
                    className="w-24 h-1.5 bg-neutral-800 accent-cyan-400 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[9px] text-neutral-500 w-6 text-right">{deckAState.high}dB</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400">MID</span>
                  <input
                    type="range"
                    min="-26"
                    max="6"
                    step="1"
                    value={deckAState.mid}
                    onChange={(e) => handleEQChange('A', 'mid', parseFloat(e.target.value))}
                    className="w-24 h-1.5 bg-neutral-800 accent-cyan-400 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[9px] text-neutral-500 w-6 text-right">{deckAState.mid}dB</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400">LOW</span>
                  <input
                    type="range"
                    min="-26"
                    max="6"
                    step="1"
                    value={deckAState.low}
                    onChange={(e) => handleEQChange('A', 'low', parseFloat(e.target.value))}
                    className="w-24 h-1.5 bg-neutral-800 accent-cyan-400 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[9px] text-neutral-500 w-6 text-right">{deckAState.low}dB</span>
                </div>
              </div>

              {/* VU Meter & Vertical Fader */}
              <div className="flex items-center justify-between pt-1">
                {/* VU Bar */}
                <div className="w-2.5 h-24 bg-black rounded-sm overflow-hidden flex flex-col-reverse p-0.5 border border-neutral-800">
                  <div
                    className={`w-full transition-all duration-75 rounded-sm ${
                      vuDeckA > 85 ? 'bg-red-500' : vuDeckA > 60 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ height: `${vuDeckA}%` }}
                  />
                </div>

                {/* Level Fader */}
                <div className="flex flex-col items-center flex-1 pl-3">
                  <span className="text-[9px] text-neutral-500 mb-1">CH-1 VOL</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={deckAState.vol}
                    onChange={(e) => handleVolChange('A', parseFloat(e.target.value))}
                    className="w-full h-2 bg-neutral-800 accent-cyan-400 rounded appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Deck A Transport */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80">
                <button
                  onClick={() => toggleDeckCue('A')}
                  className={`py-2 rounded font-black text-xs tracking-wider border ${
                    deckAState.isCue
                      ? 'bg-red-500 text-white border-red-400 shadow-[0_0_10px_#ef4444]'
                      : 'bg-neutral-900 text-red-400 border-red-500/40 hover:bg-neutral-800'
                  }`}
                >
                  CUE
                </button>
                <button
                  onClick={() => toggleDeckPlay('A')}
                  className={`py-2 rounded font-black text-xs tracking-wider border ${
                    deckAState.isPlaying
                      ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_#00f0ff]'
                      : 'bg-neutral-900 text-cyan-400 border-cyan-500/40 hover:bg-neutral-800'
                  }`}
                >
                  {deckAState.isPlaying ? 'PAUSE' : 'PLAY ▶'}
                </button>
              </div>
            </div>

            {/* --- DECK B CHANNEL --- */}
            <div className="bg-[#0e0e12] border border-amber-950/50 rounded-lg p-2.5 flex flex-col space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                <span className="text-xs font-black text-amber-400 tracking-wider">CH 2 // DECK B</span>
                <button
                  onClick={() => setDeckBState((s) => ({ ...s, sync: !s.sync }))}
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                    deckBState.sync ? 'bg-amber-500 text-black border-amber-400' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  SYNC
                </button>
              </div>

              {/* 3-Band Isolator Knobs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400">HI</span>
                  <input
                    type="range"
                    min="-26"
                    max="6"
                    step="1"
                    value={deckBState.high}
                    onChange={(e) => handleEQChange('B', 'high', parseFloat(e.target.value))}
                    className="w-24 h-1.5 bg-neutral-800 accent-amber-400 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[9px] text-neutral-500 w-6 text-right">{deckBState.high}dB</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400">MID</span>
                  <input
                    type="range"
                    min="-26"
                    max="6"
                    step="1"
                    value={deckBState.mid}
                    onChange={(e) => handleEQChange('B', 'mid', parseFloat(e.target.value))}
                    className="w-24 h-1.5 bg-neutral-800 accent-amber-400 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[9px] text-neutral-500 w-6 text-right">{deckBState.mid}dB</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400">LOW</span>
                  <input
                    type="range"
                    min="-26"
                    max="6"
                    step="1"
                    value={deckBState.low}
                    onChange={(e) => handleEQChange('B', 'low', parseFloat(e.target.value))}
                    className="w-24 h-1.5 bg-neutral-800 accent-amber-400 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[9px] text-neutral-500 w-6 text-right">{deckBState.low}dB</span>
                </div>
              </div>

              {/* VU Meter & Vertical Fader */}
              <div className="flex items-center justify-between pt-1">
                {/* VU Bar */}
                <div className="w-2.5 h-24 bg-black rounded-sm overflow-hidden flex flex-col-reverse p-0.5 border border-neutral-800">
                  <div
                    className={`w-full transition-all duration-75 rounded-sm ${
                      vuDeckB > 85 ? 'bg-red-500' : vuDeckB > 60 ? 'bg-amber-400' : 'bg-amber-500'
                    }`}
                    style={{ height: `${vuDeckB}%` }}
                  />
                </div>

                {/* Level Fader */}
                <div className="flex flex-col items-center flex-1 pl-3">
                  <span className="text-[9px] text-neutral-500 mb-1">CH-2 VOL</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={deckBState.vol}
                    onChange={(e) => handleVolChange('B', parseFloat(e.target.value))}
                    className="w-full h-2 bg-neutral-800 accent-amber-400 rounded appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Deck B Transport */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80">
                <button
                  onClick={() => toggleDeckCue('B')}
                  className={`py-2 rounded font-black text-xs tracking-wider border ${
                    deckBState.isCue
                      ? 'bg-red-500 text-white border-red-400 shadow-[0_0_10px_#ef4444]'
                      : 'bg-neutral-900 text-red-400 border-red-500/40 hover:bg-neutral-800'
                  }`}
                >
                  CUE
                </button>
                <button
                  onClick={() => toggleDeckPlay('B')}
                  className={`py-2 rounded font-black text-xs tracking-wider border ${
                    deckBState.isPlaying
                      ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_12px_#f59e0b]'
                      : 'bg-neutral-900 text-amber-400 border-amber-500/40 hover:bg-neutral-800'
                  }`}
                >
                  {deckBState.isPlaying ? 'PAUSE' : 'PLAY ▶'}
                </button>
              </div>
            </div>
          </div>

          {/* Master Hardware Crossfader */}
          <div className="mt-4 bg-neutral-950 border border-neutral-800 rounded-lg p-3">
            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 mb-1">
              <span className="text-cyan-400">◄ DECK A</span>
              <span className="text-neutral-500">CROSSFADER // MAGVEL PRO</span>
              <span className="text-amber-400">DECK B ►</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={crossfader}
              onChange={(e) => handleCrossfaderChange(parseFloat(e.target.value))}
              className="w-full h-3 bg-neutral-900 accent-emerald-400 rounded appearance-none cursor-pointer"
            />
          </div>

          {/* Sound Color FX & Time Engine */}
          <div className="mt-3 grid grid-cols-3 gap-2 bg-neutral-950/80 p-2.5 rounded-lg border border-neutral-800/80">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-neutral-400 mb-1">COLOR FX (HPF/LPF)</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.02"
                value={colorFX}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setColorFX(val);
                  audio.setColorFX(val);
                }}
                className="w-full h-1.5 bg-neutral-800 accent-emerald-400 rounded appearance-none cursor-pointer"
              />
              <span className="text-[8px] text-neutral-500 mt-1">
                {colorFX < -0.05 ? `LPF ${Math.round(Math.abs(colorFX) * 100)}%` : colorFX > 0.05 ? `HPF ${Math.round(colorFX * 100)}%` : 'OFF'}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-neutral-400 mb-1">ECHO DELAY</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={delayWet}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setDelayWet(val);
                  audio.setDelayWet(val);
                }}
                className="w-full h-1.5 bg-neutral-800 accent-cyan-400 rounded appearance-none cursor-pointer"
              />
              <span className="text-[8px] text-neutral-500 mt-1">{Math.round(delayWet * 100)}%</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-neutral-400 mb-1">REVERB SPACE</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={reverbWet}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setReverbWet(val);
                  audio.setReverbWet(val);
                }}
                className="w-full h-1.5 bg-neutral-800 accent-purple-400 rounded appearance-none cursor-pointer"
              />
              <span className="text-[8px] text-neutral-500 mt-1">{Math.round(reverbWet * 100)}%</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION B: 16-PAD PERFORMANCE DRUM MATRIX & SEQUENCER (Columns 6 to 12) */}
        {/* ========================================================================= */}
        <section className="lg:col-span-6 bg-gradient-to-b from-[#121216] to-[#0c0c0e] border border-neutral-800/90 rounded-xl p-3 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/80">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-neutral-400 tracking-wider">PERFORMANCE PADS</span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50">
                ZERO LATENCY ENGINE
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSeqPlaying(!isSeqPlaying)}
                className={`px-3 py-1 rounded text-xs font-black tracking-wider transition-all border ${
                  isSeqPlaying
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_10px_#10b981]'
                    : 'bg-neutral-800 text-emerald-400 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                {isSeqPlaying ? 'STOP LOOP ■' : 'START SEQ ▶'}
              </button>
            </div>
          </div>

          {/* 4x4 High-Fidelity Finger Drumming Grid */}
          <div className="grid grid-cols-4 gap-2 my-1">
            {PAD_CONFIG.map((pad) => {
              const isHit = activePad === pad.id;
              return (
                <button
                  key={pad.id}
                  onMouseDown={(e) => handlePadPress(pad.id, e)}
                  onTouchStart={(e) => handlePadPress(pad.id, e)}
                  className={`h-16 sm:h-20 rounded-lg flex flex-col items-center justify-between p-2 border-2 transition-transform transform active:scale-95 select-none ${pad.color} ${
                    isHit ? 'brightness-150 scale-95 shadow-[0_0_15px_currentColor]' : 'shadow-md'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  <span className="text-[10px] font-black tracking-tight">{pad.label}</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-[8px] text-neutral-400 opacity-60">PAD {pad.id + 1}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isHit ? 'bg-white shadow-[0_0_6px_#ffffff]' : 'bg-neutral-800'}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* 16-Step Mini Sequencer Matrix Bar */}
          <div className="mt-3 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                16-STEP SEQUENCER // ACTIVE: STEP {seqStep + 1}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] text-neutral-500">TEMPO</span>
                <input
                  type="range"
                  min="80"
                  max="160"
                  step="1"
                  value={bpm}
                  onChange={(e) => {
                    const newBpm = parseInt(e.target.value, 10);
                    setBpm(newBpm);
                    audio.tempo = newBpm;
                  }}
                  className="w-20 h-1.5 bg-neutral-800 accent-amber-400 rounded appearance-none cursor-pointer"
                />
                <span className="text-[10px] font-bold text-amber-400 w-8">{bpm}</span>
              </div>
            </div>

            {/* 16 Step Indicators with Step Toggle */}
            <div className="grid grid-cols-16 gap-1">
              {Array.from({ length: 16 }).map((_, stepIdx) => {
                const isCurrent = seqStep === stepIdx && isSeqPlaying;
                const isKickActive = seqGrid[0] && seqGrid[0][stepIdx] === 1;

                return (
                  <button
                    key={stepIdx}
                    onClick={() => toggleSeqStep(0, stepIdx)}
                    className={`h-7 rounded-sm flex flex-col items-center justify-between py-1 transition-all ${
                      isCurrent
                        ? 'bg-amber-400 text-black font-bold shadow-[0_0_8px_#f59e0b]'
                        : isKickActive
                        ? 'bg-red-600/70 border border-red-500 text-white'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <span className="text-[7px]">{stepIdx + 1}</span>
                    <span className={`w-1 h-1 rounded-full ${isKickActive ? 'bg-white' : 'bg-transparent'}`} />
                  </button>
                );
              })}
            </div>
            <span className="text-[8px] text-neutral-500 mt-1 block text-right">
              Tap step buttons to toggle KICK pattern
            </span>
          </div>
        </section>
      </main>

      {/* iOS Standalone Fixed Bottom Navigation & Meta Constraints */}
      <footer className="mt-3 px-4 py-2 border-t border-neutral-800/80 bg-neutral-950/80 flex items-center justify-between text-[11px] text-neutral-500">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          <span>iOS AUDIO ENGINE READY (100% STANDALONE WEB AUDIO)</span>
        </div>
        <div className="flex space-x-3 text-neutral-400">
          <span>ZERO EXTERNAL ASSETS</span>
          <span>44.1kHz / 32-BIT FLOAT</span>
        </div>
      </footer>
    </div>
  );
}
