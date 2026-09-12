// Offline Web Audio API Music Loop Generator
// Fallback when external API quotas (e.g., Lyria 429) are exceeded

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataByteCount = result.length * bytesPerSample;
  const bufferByteLength = 44 + dataByteCount;

  const arrayBuffer = new ArrayBuffer(bufferByteLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + dataByteCount, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, dataByteCount, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export async function generateSynthTrack(prompt: string, durationSeconds: number = 15): Promise<string> {
  const sampleRate = 44100;
  const totalSamples = sampleRate * durationSeconds;
  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  const promptLower = prompt.toLowerCase();
  let bpm = 138;
  if (promptLower.includes('dnb') || promptLower.includes('drum')) bpm = 174;
  else if (promptLower.includes('house')) bpm = 126;
  else if (promptLower.includes('ambient') || promptLower.includes('cinematic')) bpm = 110;

  const secondsPerBeat = 60 / bpm;
  const totalBeats = Math.floor(durationSeconds / secondsPerBeat);

  // Master Limiter
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -12;
  compressor.ratio.value = 12;
  compressor.connect(offlineCtx.destination);

  // Notes frequencies (A minor pentatonic)
  const baseFreqs = [110, 130.81, 146.83, 164.81, 196.00, 220, 261.63, 293.66, 329.63, 392.00];

  for (let b = 0; b < totalBeats; b++) {
    const startTime = b * secondsPerBeat;

    // 1. KICK DRUM (Every 1st, 2nd, 3rd, 4th beat or 1st/3rd for DnB)
    const isKickBeat = bpm === 174 ? (b % 4 === 0 || b % 4 === 2.5) : true;
    if (isKickBeat) {
      const kickOsc = offlineCtx.createOscillator();
      const kickGain = offlineCtx.createGain();
      kickOsc.frequency.setValueAtTime(140, startTime);
      kickOsc.frequency.exponentialRampToValueAtTime(38, startTime + 0.08);

      kickGain.gain.setValueAtTime(0.9, startTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      kickOsc.connect(kickGain);
      kickGain.connect(compressor);
      kickOsc.start(startTime);
      kickOsc.stop(startTime + 0.25);
    }

    // 2. SNARE (Beats 2 and 4)
    if (b % 2 === 1) {
      const snareNoise = offlineCtx.createBufferSource();
      const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * 0.15, sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      snareNoise.buffer = noiseBuffer;

      const snareGain = offlineCtx.createGain();
      snareGain.gain.setValueAtTime(0.5, startTime);
      snareGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

      snareNoise.connect(snareGain);
      snareGain.connect(compressor);
      snareNoise.start(startTime);
    }

    // 3. OFFBEAT HI-HAT
    const hatTime = startTime + secondsPerBeat / 2;
    const hatNoise = offlineCtx.createBufferSource();
    const hBuffer = offlineCtx.createBuffer(1, sampleRate * 0.05, sampleRate);
    const hData = hBuffer.getChannelData(0);
    for (let i = 0; i < hData.length; i++) hData[i] = Math.random() * 2 - 1;
    hatNoise.buffer = hBuffer;

    const hatFilter = offlineCtx.createBiquadFilter();
    hatFilter.type = 'highpass';
    hatFilter.frequency.value = 7000;

    const hatGain = offlineCtx.createGain();
    hatGain.gain.setValueAtTime(0.3, hatTime);
    hatGain.gain.exponentialRampToValueAtTime(0.001, hatTime + 0.04);

    hatNoise.connect(hatFilter);
    hatFilter.connect(hatGain);
    hatGain.connect(compressor);
    hatNoise.start(hatTime);

    // 4. SYNTH BASS / MELODY ARPEGGIATOR (16th notes)
    for (let sub = 0; sub < 4; sub++) {
      const subTime = startTime + (sub * secondsPerBeat) / 4;
      const freq = baseFreqs[(b * 3 + sub) % baseFreqs.length];

      const synthOsc = offlineCtx.createOscillator();
      synthOsc.type = promptLower.includes('acid') ? 'sawtooth' : 'triangle';
      synthOsc.frequency.setValueAtTime(freq, subTime);

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, subTime);
      filter.frequency.exponentialRampToValueAtTime(200, subTime + 0.1);

      const synthGain = offlineCtx.createGain();
      synthGain.gain.setValueAtTime(0.25, subTime);
      synthGain.gain.exponentialRampToValueAtTime(0.001, subTime + 0.12);

      synthOsc.connect(filter);
      filter.connect(synthGain);
      synthGain.connect(compressor);

      synthOsc.start(subTime);
      synthOsc.stop(subTime + 0.12);
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWav(renderedBuffer);
  return URL.createObjectURL(wavBlob);
}
