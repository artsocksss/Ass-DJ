export interface PresetPattern {
  name: string;
  genre: string;
  bpm: number;
  pattern: boolean[][]; // 16 pads x 16 steps
}

export function createEmptyPattern(): boolean[][] {
  return Array.from({ length: 16 }, () => Array(16).fill(false));
}

// Preset A: 808 Trap Roll
export function getTrap808Preset(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Kick Punch (steps 0, 7, 10)
  p[0][0] = true;
  p[0][7] = true;
  p[0][10] = true;

  // Pad 1: Sub 808 (steps 0, 4, 10, 14)
  p[1][0] = true;
  p[1][4] = true;
  p[1][10] = true;
  p[1][14] = true;

  // Pad 3: Trap Clap (steps 4, 12 - beats 2 & 4)
  p[3][4] = true;
  p[3][12] = true;

  // Pad 5: Closed Hat (rolling trap hats)
  for (let s = 0; s < 16; s++) {
    p[5][s] = true;
  }

  // Pad 6: Open Hat (step 2, 10)
  p[6][2] = true;
  p[6][10] = true;

  // Pad 4: Rim Click (step 14)
  p[4][14] = true;

  // Pad 13: Brass Stab (step 0, 8)
  p[13][0] = true;
  p[13][8] = true;

  return p;
}

// Preset B: 909 Tech House Club
export function getTechHousePreset(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: 909 Kick (Four-on-the-floor: 0, 4, 8, 12)
  p[0][0] = true;
  p[0][4] = true;
  p[0][8] = true;
  p[0][12] = true;

  // Pad 3: Stack Clap (Beats 2 and 4: 4, 12)
  p[3][4] = true;
  p[3][12] = true;

  // Pad 6: Open 909 Hat (Offbeats: 2, 6, 10, 14)
  p[6][2] = true;
  p[6][6] = true;
  p[6][10] = true;
  p[6][14] = true;

  // Pad 5: Ticking Closed Hat (Every 16th note)
  for (let s = 0; s < 16; s++) {
    if (s % 2 === 1) p[5][s] = true;
  }

  // Pad 8: Conga Hi (steps 3, 7, 11, 15)
  p[8][3] = true;
  p[8][7] = true;
  p[8][11] = true;
  p[8][15] = true;

  // Pad 1: Acid Sub (steps 1, 2, 5, 9, 13)
  p[1][1] = true;
  p[1][2] = true;
  p[1][5] = true;
  p[1][9] = true;
  p[1][13] = true;

  return p;
}

// Preset C: 80s Synthwave Drive
export function getSynthwavePreset(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Gated Kick (0, 6, 8, 10)
  p[0][0] = true;
  p[0][6] = true;
  p[0][8] = true;
  p[0][10] = true;

  // Pad 2: Linn Snare (4, 12)
  p[2][4] = true;
  p[2][12] = true;

  // Pad 5: Digi Hat (Every 8th note)
  for (let s = 0; s < 16; s += 2) {
    p[5][s] = true;
  }

  // Pad 1: Analog Bass (0, 2, 4, 6, 8, 10, 12, 14 driving eighths)
  p[1][0] = true;
  p[1][2] = true;
  p[1][4] = true;
  p[1][6] = true;
  p[1][8] = true;
  p[1][10] = true;
  p[1][12] = true;
  p[1][14] = true;

  // Pad 12: Cyber Lead (0, 8)
  p[12][0] = true;
  p[12][8] = true;

  return p;
}

// Preset D: Afro Groove Polyrhythm
export function getAfroGroovePreset(): boolean[][] {
  const p = createEmptyPattern();
  // Pad 0: Tribal Kick (0, 3, 6, 10, 12)
  p[0][0] = true;
  p[0][3] = true;
  p[0][6] = true;
  p[0][10] = true;
  p[0][12] = true;

  // Pad 1: Log Drum (Amapiano bop: 1, 4, 7, 9, 14)
  p[1][1] = true;
  p[1][4] = true;
  p[1][7] = true;
  p[1][9] = true;
  p[1][14] = true;

  // Pad 6: Seeds Shaker (All 16 steps)
  for (let s = 0; s < 16; s++) {
    p[6][s] = true;
  }

  // Pad 4: Wood Block (3, 7, 11, 15)
  p[4][3] = true;
  p[4][7] = true;
  p[4][11] = true;
  p[4][15] = true;

  // Pad 8: Djembe Hi (2, 8, 13)
  p[8][2] = true;
  p[8][8] = true;
  p[8][13] = true;

  return p;
}

export const PRESET_LIBRARY: Record<string, PresetPattern> = {
  A: {
    name: 'TRAP 808 DRIP',
    genre: 'Trap / Hip-Hop',
    bpm: 140,
    pattern: getTrap808Preset(),
  },
  B: {
    name: 'CLUB TECHNO 909',
    genre: 'Tech House / EDM',
    bpm: 126,
    pattern: getTechHousePreset(),
  },
  C: {
    name: 'NEON SYNTHWAVE',
    genre: '80s Electro / Cyber',
    bpm: 118,
    pattern: getSynthwavePreset(),
  },
  D: {
    name: 'AFROBEAT LOG DRUM',
    genre: 'Afro House / Amapiano',
    bpm: 114,
    pattern: getAfroGroovePreset(),
  },
};
