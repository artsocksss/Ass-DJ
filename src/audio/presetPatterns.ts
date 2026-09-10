export interface PresetPattern {
  name: string;
  genre: string;
  bpm: number;
  pattern: boolean[][]; // 16 pads x 16 steps
}

export function createEmptyPattern(): boolean[][] {
  return Array.from({ length: 16 }, () => Array(16).fill(false));
}

// 1. NEUROFUNK ROLLER (175 BPM) - Bank A
export function getNeurofunkPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Punch Kick (steps 0, 10)
  p[0][0] = true;
  p[0][10] = true;

  // Pad 1: Reese Bass (steps 2, 6, 8, 14)
  p[1][2] = true;
  p[1][6] = true;
  p[1][8] = true;
  p[1][14] = true;

  // Pad 2: Crack Snare (beats 2 & 4: steps 4, 12)
  p[2][4] = true;
  p[2][12] = true;

  // Pad 3: Amen Ghost Snare (steps 7, 15)
  p[3][7] = true;
  p[3][15] = true;

  // Pad 4: Ride Bell (steps 2, 6, 10, 14)
  p[4][2] = true;
  p[4][6] = true;
  p[4][10] = true;
  p[4][14] = true;

  // Pad 5: Tight Hat (rolling 16ths)
  for (let s = 0; s < 16; s++) {
    p[5][s] = true;
  }

  // Pad 7: Shaker Loop (offbeats)
  for (let s = 1; s < 16; s += 2) {
    p[7][s] = true;
  }

  // Pad 8: Dirty Bass 1 (steps 3, 11)
  p[8][3] = true;
  p[8][11] = true;

  // Pad 10: Tech Stab (step 0, 8)
  p[10][0] = true;
  p[10][8] = true;

  return p;
}

// 2. AMEN JUNGLE CHOP (172 BPM) - Bank B
export function getJungleAmenPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Heavy Kick (steps 0, 7, 10)
  p[0][0] = true;
  p[0][7] = true;
  p[0][10] = true;

  // Pad 1: Sub 808 Bass (steps 0, 4, 8, 12)
  p[1][0] = true;
  p[1][4] = true;
  p[1][8] = true;
  p[1][12] = true;

  // Pad 2: Fat Snare (steps 4, 12)
  p[2][4] = true;
  p[2][12] = true;

  // Pad 3: Ghost Snare chops (steps 6, 9, 14, 15)
  p[3][6] = true;
  p[3][9] = true;
  p[3][14] = true;
  p[3][15] = true;

  // Pad 5: Trap Hat (all 16 steps)
  for (let s = 0; s < 16; s++) {
    p[5][s] = true;
  }

  // Pad 6: Open Hat (steps 2, 10)
  p[6][2] = true;
  p[6][10] = true;

  // Pad 12: Vox Pre-drop (step 0)
  p[12][0] = true;

  // Pad 15: Dub Siren (step 0)
  p[15][0] = true;

  return p;
}

// 3. JUMP UP FOGHORN (175 BPM) - Bank C
export function getJumpUpPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Bouncy Kick (2-step: steps 0, 8)
  p[0][0] = true;
  p[0][8] = true;

  // Pad 1: Foghorn Bass (screeching offbeats: steps 2, 6, 10, 14)
  p[1][2] = true;
  p[1][6] = true;
  p[1][10] = true;
  p[1][14] = true;

  // Pad 2: Crack Snare (steps 4, 12)
  p[2][4] = true;
  p[2][12] = true;

  // Pad 3: Clap (steps 4, 12)
  p[3][4] = true;
  p[3][12] = true;

  // Pad 4: Roller Sub (driving: steps 1, 5, 9, 13)
  p[4][1] = true;
  p[4][5] = true;
  p[4][9] = true;
  p[4][13] = true;

  // Pad 5: Closed Hat (eighths)
  for (let s = 0; s < 16; s += 2) {
    p[5][s] = true;
  }

  // Pad 6: Open Hat (steps 2, 6, 10, 14)
  p[6][2] = true;
  p[6][6] = true;
  p[6][10] = true;
  p[6][14] = true;

  // Pad 8: Laser Drop (step 15)
  p[8][15] = true;

  return p;
}

// 4. LIQUID SUNSET (174 BPM) - Bank D
export function getLiquidSunsetPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Warm Kick (steps 0, 10)
  p[0][0] = true;
  p[0][10] = true;

  // Pad 1: Warm Deep Sub (steps 0, 4, 8, 12)
  p[1][0] = true;
  p[1][4] = true;
  p[1][8] = true;
  p[1][12] = true;

  // Pad 2: Liquid Snare (steps 4, 12)
  p[2][4] = true;
  p[2][12] = true;

  // Pad 3: Rimshot (step 14)
  p[3][14] = true;

  // Pad 4: Rhodes Chord (steps 0, 6, 12)
  p[4][0] = true;
  p[4][6] = true;
  p[4][12] = true;

  // Pad 5: Silky Hat (all 16 steps)
  for (let s = 0; s < 16; s++) {
    p[5][s] = true;
  }

  // Pad 6: Open Hat (steps 2, 10)
  p[6][2] = true;
  p[6][10] = true;

  // Pad 7: Shaker 16th (steps 2, 6, 10, 14)
  p[7][2] = true;
  p[7][6] = true;
  p[7][10] = true;
  p[7][14] = true;

  // Pad 8: Vocal Chop (step 2, 10)
  p[8][2] = true;
  p[8][10] = true;

  return p;
}

// 5. DARKSTEP TECHNOID (178 BPM) - Bank A
export function getDarkstepPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Punch Kick (steps 0, 6, 10)
  p[0][0] = true;
  p[0][6] = true;
  p[0][10] = true;

  // Pad 1: Reese Bass (steps 0, 4, 8, 12, 14)
  p[1][0] = true;
  p[1][4] = true;
  p[1][8] = true;
  p[1][12] = true;
  p[1][14] = true;

  // Pad 2: Crack Snare (steps 4, 12)
  p[2][4] = true;
  p[2][12] = true;

  // Pad 3: Amen Ghost (military rapid roll: steps 3, 7, 11, 14, 15)
  p[3][3] = true;
  p[3][7] = true;
  p[3][11] = true;
  p[3][14] = true;
  p[3][15] = true;

  // Pad 5: Tight Hat (16ths)
  for (let s = 0; s < 16; s++) {
    p[5][s] = true;
  }

  // Pad 9: Dirty Bass 2 (steps 2, 8, 13)
  p[9][2] = true;
  p[9][8] = true;
  p[9][13] = true;

  // Pad 12: Laser Zap (step 14)
  p[12][14] = true;

  return p;
}

// 6. MINIMAL SUB ROLLER (174 BPM) - Bank C
export function getMinimalRollerPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Bouncy Kick (steps 0, 10)
  p[0][0] = true;
  p[0][10] = true;

  // Pad 4: Roller Sub (driving syncopated: steps 2, 4, 7, 10, 12, 14)
  p[4][2] = true;
  p[4][4] = true;
  p[4][7] = true;
  p[4][10] = true;
  p[4][12] = true;
  p[4][14] = true;

  // Pad 2: Crack Snare (steps 4, 12)
  p[2][4] = true;
  p[2][12] = true;

  // Pad 5: Closed Hat (eighths)
  for (let s = 0; s < 16; s += 2) {
    p[5][s] = true;
  }

  // Pad 6: Open Hat (steps 6, 14)
  p[6][6] = true;
  p[6][14] = true;

  // Pad 9: Squeak Bass (steps 5, 13)
  p[9][5] = true;
  p[9][13] = true;

  return p;
}

// 7. HALFTIME BEATDOWN (87/174 BPM) - Bank B
export function getHalftimePattern(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Heavy Kick (steps 0, 10)
  p[0][0] = true;
  p[0][10] = true;

  // Pad 1: Sub 808 Bass (sustained: steps 0, 6, 8, 14)
  p[1][0] = true;
  p[1][6] = true;
  p[1][8] = true;
  p[1][14] = true;

  // Pad 2: Fat Snare (halftime beat 3: step 8)
  p[2][8] = true;

  // Pad 3: Clap Stack (accent: step 8)
  p[3][8] = true;

  // Pad 5: Trap Hat (quarter notes: 0, 4, 8, 12)
  p[5][0] = true;
  p[5][4] = true;
  p[5][8] = true;
  p[5][12] = true;

  // Pad 7: Growl Bass (steps 4, 12)
  p[7][4] = true;
  p[7][12] = true;

  // Pad 11: Gunshot FX (step 8)
  p[11][8] = true;

  return p;
}

// 8. SAMBA DNB FLAVA (174 BPM) - Bank D
export function getSambaDnbPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Warm Kick (steps 0, 3, 6, 10, 12)
  p[0][0] = true;
  p[0][3] = true;
  p[0][6] = true;
  p[0][10] = true;
  p[0][12] = true;

  // Pad 1: Deep Sub (steps 0, 4, 8, 12)
  p[1][0] = true;
  p[1][4] = true;
  p[1][8] = true;
  p[1][12] = true;

  // Pad 2: Liquid Snare (steps 4, 12)
  p[2][4] = true;
  p[2][12] = true;

  // Pad 4: Rhodes Chord (steps 3, 7, 11, 15)
  p[4][3] = true;
  p[4][7] = true;
  p[4][11] = true;
  p[4][15] = true;

  // Pad 7: Shaker 16th (all 16 steps)
  for (let s = 0; s < 16; s++) {
    p[7][s] = true;
  }

  // Pad 5: Silky Hat (steps 2, 6, 10, 14)
  p[5][2] = true;
  p[5][6] = true;
  p[5][10] = true;
  p[5][14] = true;

  return p;
}

// 9. UK DRILLSTEP (173 BPM) - Bank A
export function getUkDrillstepPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Punch Kick (syncopated: steps 0, 6, 10)
  p[0][0] = true;
  p[0][6] = true;
  p[0][10] = true;

  // Pad 1: Reese Bass glide (steps 0, 2, 5, 8, 12, 14)
  p[1][0] = true;
  p[1][2] = true;
  p[1][5] = true;
  p[1][8] = true;
  p[1][12] = true;
  p[1][14] = true;

  // Pad 2: Crack Snare (steps 4, 12)
  p[2][4] = true;
  p[2][12] = true;

  // Pad 3: Ghost Snare (steps 7, 15)
  p[3][7] = true;
  p[3][15] = true;

  // Pad 5: Tight Hat (rolling drill pattern)
  const hatSteps = [0, 1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14];
  hatSteps.forEach((s) => { p[5][s] = true; });

  // Pad 10: Tech Stab (step 0)
  p[10][0] = true;

  return p;
}

// 10. JUNGLE DUB SIREN (170 BPM) - Bank B
export function getDubJunglePattern(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Heavy Kick (steps 0, 10)
  p[0][0] = true;
  p[0][10] = true;

  // Pad 1: Sub 808 Bass (steps 0, 2, 6, 8, 12)
  p[1][0] = true;
  p[1][2] = true;
  p[1][6] = true;
  p[1][8] = true;
  p[1][12] = true;

  // Pad 2: Fat Snare (steps 4, 12)
  p[2][4] = true;
  p[2][12] = true;

  // Pad 3: Clap Stack (steps 6, 14)
  p[3][6] = true;
  p[3][14] = true;

  // Pad 10: Brass Hit / Dub Skank (offbeats: steps 2, 6, 10, 14)
  p[10][2] = true;
  p[10][6] = true;
  p[10][10] = true;
  p[10][14] = true;

  // Pad 5: Trap Hat (all 16 steps)
  for (let s = 0; s < 16; s++) {
    p[5][s] = true;
  }

  // Pad 15: Siren (step 0)
  p[15][0] = true;

  return p;
}

// 11. MAINFRAME NEURO (176 BPM) - Bank A
export function getMainframeNeuroPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Punch Kick (steps 0, 10)
  p[0][0] = true;
  p[0][10] = true;

  // Pad 1: Reese Bass (steps 0, 3, 6, 8, 12, 14)
  p[1][0] = true;
  p[1][3] = true;
  p[1][6] = true;
  p[1][8] = true;
  p[1][12] = true;
  p[1][14] = true;

  // Pad 2: Crack Snare (steps 4, 12)
  p[2][4] = true;
  p[2][12] = true;

  // Pad 3: Ghost Snare (steps 7, 15)
  p[3][7] = true;
  p[3][15] = true;

  // Pad 4: Ride Bell (steps 2, 6, 10, 14)
  p[4][2] = true;
  p[4][6] = true;
  p[4][10] = true;
  p[4][14] = true;

  // Pad 5: Tight Hat (all 16 steps)
  for (let s = 0; s < 16; s++) {
    p[5][s] = true;
  }

  // Pad 9: Dirty Bass 2 (steps 2, 10)
  p[9][2] = true;
  p[9][10] = true;

  return p;
}

// 12. FESTIVAL VIP DROP (175 BPM) - Bank C
export function getFestivalVipPattern(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Bouncy Kick (driving: steps 0, 6, 8, 10)
  p[0][0] = true;
  p[0][6] = true;
  p[0][8] = true;
  p[0][10] = true;

  // Pad 1: Foghorn Bass (steps 2, 4, 10, 12, 14)
  p[1][2] = true;
  p[1][4] = true;
  p[1][10] = true;
  p[1][12] = true;
  p[1][14] = true;

  // Pad 2: Crack Snare (steps 4, 12)
  p[2][4] = true;
  p[2][12] = true;

  // Pad 3: Clap (steps 4, 12)
  p[3][4] = true;
  p[3][12] = true;

  // Pad 7: Wobble Bass (steps 3, 7, 11, 15)
  p[7][3] = true;
  p[7][7] = true;
  p[7][11] = true;
  p[7][15] = true;

  // Pad 8: Laser Drop (step 14)
  p[8][14] = true;

  // Pad 14: MC Vocal (step 0)
  p[14][0] = true;

  return p;
}

// Default bank patterns
export const PRESET_LIBRARY: Record<string, PresetPattern> = {
  A: {
    name: 'NEUROFUNK ROLLER',
    genre: 'Neurofunk DnB',
    bpm: 175,
    pattern: getNeurofunkPattern(),
  },
  B: {
    name: 'AMEN JUNGLE CHOP',
    genre: 'Jungle Breaks',
    bpm: 172,
    pattern: getJungleAmenPattern(),
  },
  C: {
    name: 'JUMP UP FOGHORN',
    genre: 'Jump Up DnB',
    bpm: 175,
    pattern: getJumpUpPattern(),
  },
  D: {
    name: 'LIQUID SUNSET',
    genre: 'Liquid DnB',
    bpm: 174,
    pattern: getLiquidSunsetPattern(),
  },
};
