export interface PresetPattern {
  name: string;
  genre: string;
  bpm: number;
  pattern: boolean[][]; // 16 pads x 16 steps
}

export function createEmptyPattern(): boolean[][] {
  return Array.from({ length: 16 }, () => Array(16).fill(false));
}

// 1. MADDIX: BIG ROOM RAVE (140 BPM) - Bank A (Maddix)
export function getMaddixBigRoomPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Overdriven Rumble Kick 4x4
  [0, 4, 8, 12].forEach((s) => { p[0][s] = true; });
  // Screaming 303 Acid Overdrive Riff
  [0, 2, 3, 6, 8, 10, 11, 14].forEach((s) => { p[1][s] = true; });
  // Big Room Clap on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Reverse Bass Punch on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[3][s] = true; });
  // Hypnotic 7-voice Supersaw on 0, 8
  p[4][0] = true;
  p[4][8] = true;
  // Driving 909 Closed Hat 16ths
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Sizzle Open Hat on offbeats 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[6][s] = true; });
  // Hardstyle Screech on 6, 14
  p[8][6] = true;
  p[8][14] = true;
  // Maddix Rave Vox on 0
  p[14][0] = true;
  return p;
}

// 2. BORIS BREJCHA: JOKER ROLLER (127 BPM) - Bank B (Boris Brejcha)
export function getBrejchaJokerPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Brejcha Click Sub Kick 4x4 on 0, 4, 8, 12
  [0, 4, 8, 12].forEach((s) => { p[0][s] = true; });
  // Joker Bouncy 16th Bassline
  [2, 3, 6, 7, 10, 11, 14, 15].forEach((s) => { p[1][s] = true; });
  // Wood Rimshot on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Duck Quack Percussion on 3, 7, 11, 15
  [3, 7, 11, 15].forEach((s) => { p[3][s] = true; });
  // Minimal Pluck Arp on 0, 4, 8, 12
  [0, 4, 8, 12].forEach((s) => { p[4][s] = true; });
  // Micro Closed Hats on 16ths
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Swung Open Hat on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[6][s] = true; });
  // Techno Blip Bleep on 9, 13
  p[8][9] = true;
  p[8][13] = true;
  // Glitch Vocal Chop on 0, 8
  p[14][0] = true;
  p[14][8] = true;
  return p;
}

// 3. ARTBAT & KOROLOVA: PROGRESSIVE HORIZON (125 BPM) - Bank C (Melodic Techno)
export function getArtbatProgressivePattern(): boolean[][] {
  const p = createEmptyPattern();
  // Warm Progressive 909 Kick on 0, 4, 8, 12
  [0, 4, 8, 12].forEach((s) => { p[0][s] = true; });
  // Rolling Multi-Saw Progressive Bass
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach((s) => { p[1][s] = true; });
  // Stereo Tech Clap on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Analog Tom on 7, 15
  p[3][7] = true;
  p[3][15] = true;
  // Signature Artbat Brass Stab on 0, 6, 10
  p[4][0] = true;
  p[4][6] = true;
  p[4][10] = true;
  // Silky Closed Hat 16ths
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Wide Open Cymbal on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[6][s] = true; });
  // Korolova Reverb Pluck on 2, 5, 8, 11, 14
  [2, 5, 8, 11, 14].forEach((s) => { p[8][s] = true; });
  // Progressive Shaker on 16ths
  for (let s = 0; s < 16; s++) p[9][s] = true;
  // Atmospheric Space Pad on 0
  p[7][0] = true;
  return p;
}

// 4. DRUM & BASS: NOISIA NEUROFUNK (175 BPM) - Bank D (Neuro & DnB)
export function getNoisiaNeurofunkPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Punch DnB Kick on 0, 10
  p[0][0] = true;
  p[0][10] = true;
  // Distorted Multi-Saw Reese Bass on 2, 6, 8, 14
  [2, 6, 8, 14].forEach((s) => { p[1][s] = true; });
  // Piercing 200Hz Snare Crack on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Amen Ghost Break Chops on 7, 13, 15
  [7, 13, 15].forEach((s) => { p[3][s] = true; });
  // Nasty Jump Up Foghorn on 3, 11
  p[4][3] = true;
  p[4][11] = true;
  // Rolling 16th Hats
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Ride Cymbal Bell on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[6][s] = true; });
  // Deep Sine Sub Roller on 0, 4, 8, 12
  [0, 4, 8, 12].forEach((s) => { p[7][s] = true; });
  // Neuro FM Growl on 1, 9
  p[8][1] = true;
  p[8][9] = true;
  // MC Vocal on 0
  p[14][0] = true;
  return p;
}

// 5. MADDIX: ACID TECHNO DROP (144 BPM) - Bank A (Maddix)
export function getMaddixAcidPattern(): boolean[][] {
  const p = createEmptyPattern();
  // 4x4 Kick
  [0, 4, 8, 12].forEach((s) => { p[0][s] = true; });
  // Screaming Overdrive 303 Riff
  [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15].forEach((s) => { p[1][s] = true; });
  // Big Room Clap on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // 909 Closed Hat on all 16ths
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Sizzle Open Hat on offbeats
  [2, 6, 10, 14].forEach((s) => { p[6][s] = true; });
  // Laser Zap on 7, 15
  p[11][7] = true;
  p[11][15] = true;
  // Maddix Rave Vox on 0
  p[14][0] = true;
  return p;
}

// 6. BORIS BREJCHA: HIGH-TECH MINIMAL (128 BPM) - Bank B (Boris Brejcha)
export function getBrejchaHighTechPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Click Kick 4x4
  [0, 4, 8, 12].forEach((s) => { p[0][s] = true; });
  // Modulated Sub Bass
  [2, 5, 8, 11, 14].forEach((s) => { p[7][s] = true; });
  // Wood Rimshot on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Duck Quack on 1, 5, 9, 13
  [1, 5, 9, 13].forEach((s) => { p[3][s] = true; });
  // Minimal Pluck on 0, 3, 6, 9, 12
  [0, 3, 6, 9, 12].forEach((s) => { p[4][s] = true; });
  // Micro Closed Hats
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Swung Open Hat on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[6][s] = true; });
  // High Wood Perc on 15
  p[9][15] = true;
  return p;
}

// 7. KOROLOVA: MELODIC VOYAGE (124 BPM) - Bank C (Melodic Techno)
export function getKorolovaMelodicPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Progressive Kick 4x4
  [0, 4, 8, 12].forEach((s) => { p[0][s] = true; });
  // Melodic Saw Bass 16ths
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach((s) => { p[1][s] = true; });
  // Stereo Clap on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Korolova Reverb Pluck Melody
  [0, 3, 5, 8, 10, 12, 14].forEach((s) => { p[8][s] = true; });
  // Warm Pad on 0
  p[7][0] = true;
  // Silky Closed Hat 16ths
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Open Cymbal on 2, 10
  p[6][2] = true;
  p[6][10] = true;
  // Shaker on 16ths
  for (let s = 0; s < 16; s++) p[9][s] = true;
  // Soulful Echo Vox on 0
  p[14][0] = true;
  return p;
}

// 8. SUB FOCUS: JUMP UP ROLLER (174 BPM) - Bank D (Drum & Bass)
export function getSubFocusJumpUpPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Punch DnB Kick on 0, 6, 10
  p[0][0] = true;
  p[0][6] = true;
  p[0][10] = true;
  // Nasty Foghorn Screamer on 2, 4, 8, 12, 14
  [2, 4, 8, 12, 14].forEach((s) => { p[4][s] = true; });
  // 200Hz Snare Crack on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Amen Ghost Chop on 7, 15
  p[3][7] = true;
  p[3][15] = true;
  // Rolling Hat 16ths
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Ride Bell on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[6][s] = true; });
  // Rave Chord 90s on 0, 8
  p[10][0] = true;
  p[10][8] = true;
  // Pre-Drop Shout on 0
  p[14][0] = true;
  return p;
}

// 9. MADDIX: REVERSE BASS SLAM (145 BPM) - Bank A (Maddix)
export function getMaddixReverseBassPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Rumble Kick 4x4
  [0, 4, 8, 12].forEach((s) => { p[0][s] = true; });
  // Reverse Bass Slam on offbeats 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[3][s] = true; });
  // Big Room Clap on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Hypnotic Supersaw on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[4][s] = true; });
  // 909 Closed Hat 16ths
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Sizzle Open Hat on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[6][s] = true; });
  // Stadium Reverb Bomb on 0
  p[15][0] = true;
  return p;
}

// 10. BORIS BREJCHA: SPACE MINIMAL DUB (126 BPM) - Bank B (Boris Brejcha)
export function getBrejchaSpaceDubPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Click Kick 4x4
  [0, 4, 8, 12].forEach((s) => { p[0][s] = true; });
  // Joker Bass on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[1][s] = true; });
  // Wood Rimshot on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Brejcha Space Chord on 0, 6, 12
  [0, 6, 12].forEach((s) => { p[10][s] = true; });
  // Micro Closed Hats 16ths
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Swung Open Hat on 2, 10
  p[6][2] = true;
  p[6][10] = true;
  // Glitch Noise on 14
  p[11][14] = true;
  return p;
}

// 11. ARTBAT: ANALOG BRASS HYMN (125 BPM) - Bank C (Artbat)
export function getArtbatBrassHymnPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Progressive Kick 4x4
  [0, 4, 8, 12].forEach((s) => { p[0][s] = true; });
  // Melodic Saw Bass 16ths
  for (let s = 0; s < 16; s++) p[1][s] = true;
  // Stereo Clap on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Signature Artbat Brass Stabs
  [0, 3, 6, 8, 11, 14].forEach((s) => { p[4][s] = true; });
  // Korolova Reverb Pluck on 2, 5, 8, 11, 14
  [2, 5, 8, 11, 14].forEach((s) => { p[8][s] = true; });
  // Silky Closed Hat
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Wide Open Cymbal on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[6][s] = true; });
  // Space Impact on 0
  p[15][0] = true;
  return p;
}

// 12. CHASE & STATUS: JUNGLE AMEN BREAK (175 BPM) - Bank D (Chase & Status)
export function getChaseStatusJunglePattern(): boolean[][] {
  const p = createEmptyPattern();
  // Punch DnB Kick on 0, 7, 10
  p[0][0] = true;
  p[0][7] = true;
  p[0][10] = true;
  // 808 Sub Slide on 0, 4, 8, 12
  [0, 4, 8, 12].forEach((s) => { p[12][s] = true; });
  // 200Hz Snare Crack on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Amen Ghost Break Chops on 3, 6, 9, 14, 15
  [3, 6, 9, 14, 15].forEach((s) => { p[3][s] = true; });
  // Rolling Hat 16ths
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Ride Bell on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[6][s] = true; });
  // Authentic Dub Siren on 0
  p[9][0] = true;
  // MC Pre-Drop Shout on 0
  p[14][0] = true;
  return p;
}

// 13. KAZANTIP: ICONIC ORANGE ANTHEM (142 BPM) - Bank E (Acid Kazantip)
export function getKazantipAnthemPattern(): boolean[][] {
  const p = createEmptyPattern();
  // 909 Acid Rumble Kick 4x4
  [0, 4, 8, 12].forEach((s) => { p[0][s] = true; });
  // Screaming TB-303 Acid Line
  [0, 3, 4, 6, 8, 11, 12, 14].forEach((s) => { p[1][s] = true; });
  // 90s Stadium Clap on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Kazantip Rave Piano / Chord on offbeats 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[4][s] = true; });
  // Sizzling 909 Closed Hat 16ths
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Driving Open Hat on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[6][s] = true; });
  // Reverse Bass Slam on 3, 7, 11, 15
  [3, 7, 11, 15].forEach((s) => { p[3][s] = true; });
  // Kazantip Vocal Vox on 0, 8
  p[14][0] = true;
  p[14][8] = true;
  return p;
}

// 14. DAVID GUETTA & MORTEN: FUTURE RAVE TITANIUM (128 BPM) - Bank F (Future Rave)
export function getDavidGuettaFutureRavePattern(): boolean[][] {
  const p = createEmptyPattern();
  // Punchy Future Rave Kick 4x4
  [0, 4, 8, 12].forEach((s) => { p[0][s] = true; });
  // Cyberpunk Pluck Saw Riff
  [0, 2, 3, 6, 8, 10, 11, 14].forEach((s) => { p[4][s] = true; });
  // Tight Future Rave Clap on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Rolling Sub Bassline on 16ths
  [2, 3, 6, 7, 10, 11, 14, 15].forEach((s) => { p[1][s] = true; });
  // Closed Hi-Hat 16ths
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Wide Open Cymbal on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[6][s] = true; });
  // Future Rave Screech on 6, 14
  p[8][6] = true;
  p[8][14] = true;
  // Sub Bomb on 0
  p[12][0] = true;
  return p;
}

// 15. HARD TECHNO: INDUSTRIAL WAREHOUSE HAMMER (152 BPM) - Bank G (Hard Techno / Schranz)
export function getHardTechnoWarehousePattern(): boolean[][] {
  const p = createEmptyPattern();
  // Distorted Berlin Warehouse Hammer Kick on 0, 4, 8, 12
  [0, 4, 8, 12].forEach((s) => { p[0][s] = true; });
  // Anvil Metallic Strike on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[9][s] = true; });
  // Industrial Clap on 4, 12
  p[2][4] = true;
  p[2][12] = true;
  // Schranz Fast Percussion Roll on 16ths
  [1, 3, 5, 7, 9, 11, 13, 15].forEach((s) => { p[11][s] = true; });
  // Relentless Closed Hat 16ths
  for (let s = 0; s < 16; s++) p[5][s] = true;
  // Piercing Open Hat on 2, 6, 10, 14
  [2, 6, 10, 14].forEach((s) => { p[6][s] = true; });
  // Harsh Filter Screech on 7, 15
  p[8][7] = true;
  p[8][15] = true;
  // Sub Sine Drone on 0, 8
  p[7][0] = true;
  p[7][8] = true;
  return p;
}

// Default bank patterns
export const PRESET_LIBRARY: Record<string, PresetPattern> = {
  A: {
    name: 'MADDIX • BIG ROOM RAVE',
    genre: 'Big Room Techno',
    bpm: 140,
    pattern: getMaddixBigRoomPattern(),
  },
  B: {
    name: 'BORIS BREJCHA • JOKER ROLLER',
    genre: 'High-Tech Minimal',
    bpm: 127,
    pattern: getBrejchaJokerPattern(),
  },
  C: {
    name: 'ARTBAT & KOROLOVA • PROGRESSIVE HORIZON',
    genre: 'Melodic Techno',
    bpm: 125,
    pattern: getArtbatProgressivePattern(),
  },
  D: {
    name: 'DRUM & BASS • NOISIA NEUROFUNK',
    genre: 'Neurofunk DnB',
    bpm: 175,
    pattern: getNoisiaNeurofunkPattern(),
  },
  E: {
    name: 'ACID 303 • KAZANTIP ANTHEM',
    genre: 'Acid Rave',
    bpm: 142,
    pattern: getKazantipAnthemPattern(),
  },
  F: {
    name: 'DAVID GUETTA • FUTURE RAVE',
    genre: 'Future Rave',
    bpm: 128,
    pattern: getDavidGuettaFutureRavePattern(),
  },
  G: {
    name: 'GARD TECHNO • SCHRANZ WAREHOUSE',
    genre: 'Hard Techno',
    bpm: 152,
    pattern: getHardTechnoWarehousePattern(),
  },
};

