import { BankConfig, BankId } from '../types';

export const KEYBOARD_KEYS = [
  '1', '2', '3', '4',
  'q', 'w', 'e', 'r',
  'a', 's', 'd', 'f',
  'z', 'x', 'c', 'v',
];

export const BANKS: Record<BankId, BankConfig> = {
  A: {
    id: 'A',
    name: '808 TRAP & HIP-HOP',
    subtitle: 'Punchy 808s, rolling hats & crisp claps',
    color: '#ff2d55', // iOS Neon Red/Pink
    pads: [
      { id: 0, name: 'KICK PUNCH', category: 'kick', keyShortcut: '1', color: '#ff2d55', description: 'Hard hitting punchy kick' },
      { id: 1, name: '808 SUB LOW', category: 'sub', keyShortcut: '2', color: '#ff375f', description: 'Deep sliding sub bass' },
      { id: 2, name: 'SNARE TIGHT', category: 'snare', keyShortcut: '3', color: '#ff6482', description: 'Crisp trap snare' },
      { id: 3, name: 'TRAP CLAP', category: 'clap', keyShortcut: '4', color: '#ff375f', description: 'Layered fat clap' },

      { id: 4, name: 'RIM CLICK', category: 'percussion', keyShortcut: 'Q', color: '#ff9f0a', description: 'Dry acoustic rimshot' },
      { id: 5, name: 'CLOSED HH', category: 'hihat', keyShortcut: 'W', color: '#ffd60a', description: 'Ultra fast closed hat' },
      { id: 6, name: 'OPEN SIZZLE', category: 'hihat', keyShortcut: 'E', color: '#ffd60a', description: 'Sizzling open hi-hat' },
      { id: 7, name: 'SHAKER HIT', category: 'percussion', keyShortcut: 'R', color: '#ff9f0a', description: 'Velvet shaker burst' },

      { id: 8, name: 'HI TOM', category: 'percussion', keyShortcut: 'A', color: '#30d158', description: 'Resonant high tom' },
      { id: 9, name: 'LO TOM', category: 'percussion', keyShortcut: 'S', color: '#30d158', description: 'Thumping floor tom' },
      { id: 10, name: 'RIDE CYMBAL', category: 'percussion', keyShortcut: 'D', color: '#64d2ff', description: 'Clean bell ride' },
      { id: 11, name: 'CRASH DROP', category: 'percussion', keyShortcut: 'F', color: '#64d2ff', description: 'Explosive crash cymbal' },

      { id: 12, name: '808 COWBELL', category: 'synth', keyShortcut: 'Z', color: '#bf5af2', description: 'Classic Memphis cowbell' },
      { id: 13, name: 'BRASS STAB', category: 'synth', keyShortcut: 'X', color: '#bf5af2', description: 'Detuned trap horn stab' },
      { id: 14, name: 'VOX CHANT', category: 'vocal', keyShortcut: 'C', color: '#5e5ce6', description: 'Trap vocal shout "HEY"' },
      { id: 15, name: 'LASER RISER', category: 'fx', keyShortcut: 'V', color: '#0a84ff', description: 'FM laser zap fx' },
    ],
  },
  B: {
    id: 'B',
    name: '909 TECHNO & CLUB',
    subtitle: 'Pumping four-on-the-floor & warehouse stabs',
    color: '#0a84ff', // iOS Electric Blue
    pads: [
      { id: 0, name: '909 PUNCH', category: 'kick', keyShortcut: '1', color: '#0a84ff', description: 'Heavy warehouse 909 kick' },
      { id: 1, name: 'ACID SUB', category: 'sub', keyShortcut: '2', color: '#0071e3', description: 'Resonant 303 low bass' },
      { id: 2, name: '909 SNARE', category: 'snare', keyShortcut: '3', color: '#5ac8fa', description: 'Analog snap snare' },
      { id: 3, name: 'STACK CLAP', category: 'clap', keyShortcut: '4', color: '#0071e3', description: 'Bright club clap' },

      { id: 4, name: 'CHIP CLICK', category: 'percussion', keyShortcut: 'Q', color: '#64d2ff', description: 'Minimal wood tick' },
      { id: 5, name: 'TICKING HH', category: 'hihat', keyShortcut: 'W', color: '#ffd60a', description: 'Tight 16th hat' },
      { id: 6, name: 'OPEN 909 HH', category: 'hihat', keyShortcut: 'E', color: '#ffd60a', description: 'Sustained 909 open hat' },
      { id: 7, name: 'PEDAL HAT', category: 'hihat', keyShortcut: 'R', color: '#ff9f0a', description: 'Foot chick hat' },

      { id: 8, name: 'CONGA HI', category: 'percussion', keyShortcut: 'A', color: '#30d158', description: 'Tuned Latin conga' },
      { id: 9, name: 'CONGA LO', category: 'percussion', keyShortcut: 'S', color: '#30d158', description: 'Low warm conga' },
      { id: 10, name: 'RIDE BELL', category: 'percussion', keyShortcut: 'D', color: '#64d2ff', description: 'Bright metal ride' },
      { id: 11, name: 'DARK CRASH', category: 'percussion', keyShortcut: 'F', color: '#64d2ff', description: 'Filtered dark impact' },

      { id: 12, name: 'RAVE CHORD', category: 'synth', keyShortcut: 'Z', color: '#bf5af2', description: 'Euro minor rave chord' },
      { id: 13, name: 'SAW PLUCK', category: 'synth', keyShortcut: 'X', color: '#bf5af2', description: 'Fast filter decay saw' },
      { id: 14, name: 'VOX DROP', category: 'vocal', keyShortcut: 'C', color: '#ff375f', description: 'Club voice "GO!"' },
      { id: 15, name: 'NOISE SWEEP', category: 'fx', keyShortcut: 'V', color: '#ff9f0a', description: 'White noise riser' },
    ],
  },
  C: {
    id: 'C',
    name: 'RETRO SYNTHWAVE',
    subtitle: '80s analog drums, gated snares & cyber arps',
    color: '#bf5af2', // iOS Purple
    pads: [
      { id: 0, name: 'GATED KICK', category: 'kick', keyShortcut: '1', color: '#bf5af2', description: 'Heavy 80s gated kick' },
      { id: 1, name: 'ANALOG BASS', category: 'sub', keyShortcut: '2', color: '#af52de', description: 'Punchy Moog bass note' },
      { id: 2, name: 'LINN SNARE', category: 'snare', keyShortcut: '3', color: '#da8fff', description: 'LinnDrum gated snare' },
      { id: 3, name: 'RETRO CLAP', category: 'clap', keyShortcut: '4', color: '#af52de', description: 'Synthetic electronic clap' },

      { id: 4, name: 'WOOD RIM', category: 'percussion', keyShortcut: 'Q', color: '#ff9f0a', description: 'Warm vintage rim' },
      { id: 5, name: 'DIGI HAT', category: 'hihat', keyShortcut: 'W', color: '#ffd60a', description: 'Short digital hat' },
      { id: 6, name: 'OPEN SYNTH HH', category: 'hihat', keyShortcut: 'E', color: '#ffd60a', description: 'Lush 80s open hat' },
      { id: 7, name: 'TAMBOURINE', category: 'percussion', keyShortcut: 'R', color: '#ff9f0a', description: 'Metallic jingle hit' },

      { id: 8, name: 'SYNTH TOM HI', category: 'percussion', keyShortcut: 'A', color: '#30d158', description: 'Simmons descending tom' },
      { id: 9, name: 'SYNTH TOM LO', category: 'percussion', keyShortcut: 'S', color: '#30d158', description: 'Simmons low boom tom' },
      { id: 10, name: 'CHIME CRASH', category: 'percussion', keyShortcut: 'D', color: '#64d2ff', description: 'Glassy shimmering crash' },
      { id: 11, name: 'CYBER REVERSE', category: 'fx', keyShortcut: 'F', color: '#64d2ff', description: 'Reverse cymbal swell' },

      { id: 12, name: 'CYBER LEAD', category: 'synth', keyShortcut: 'Z', color: '#ff2d55', description: 'Brass synthwave lead' },
      { id: 13, name: 'NEON ARP', category: 'synth', keyShortcut: 'X', color: '#ff2d55', description: 'Dual oscillator arp pluck' },
      { id: 14, name: 'ROBOT VOX', category: 'vocal', keyShortcut: 'C', color: '#5e5ce6', description: 'Vocoded cyber voice' },
      { id: 15, name: 'GLITCH ZAP', category: 'fx', keyShortcut: 'V', color: '#32ade6', description: 'Digital bitcrush zap' },
    ],
  },
  D: {
    id: 'D',
    name: 'AFRO GROOVE & PERCUSSION',
    subtitle: 'Organic log drums, shakers & polyrhythms',
    color: '#30d158', // iOS Mint/Green
    pads: [
      { id: 0, name: 'TRIBAL KICK', category: 'kick', keyShortcut: '1', color: '#30d158', description: 'Deep organic kick drum' },
      { id: 1, name: 'LOG DRUM', category: 'sub', keyShortcut: '2', color: '#34c759', description: 'Warm Amapiano pitched log' },
      { id: 2, name: 'WOOD SNARE', category: 'snare', keyShortcut: '3', color: '#70e58c', description: 'Organic snare hit' },
      { id: 3, name: 'SLAP CLAP', category: 'clap', keyShortcut: '4', color: '#34c759', description: 'Real handclap sample' },

      { id: 4, name: 'WOOD BLOCK', category: 'percussion', keyShortcut: 'Q', color: '#ffd60a', description: 'Hollow teak woodblock' },
      { id: 5, name: 'CABASA TICK', category: 'hihat', keyShortcut: 'W', color: '#ffd60a', description: 'Metallic cabasa loop' },
      { id: 6, name: 'SEEDS SHAKER', category: 'hihat', keyShortcut: 'E', color: '#ff9f0a', description: 'Natural seed shaker' },
      { id: 7, name: 'AGOGO BELL', category: 'percussion', keyShortcut: 'R', color: '#ff9f0a', description: 'High pitched agogo iron' },

      { id: 8, name: 'DJEMBE HI', category: 'percussion', keyShortcut: 'A', color: '#ff375f', description: 'Crisp djembe rim tone' },
      { id: 9, name: 'DJEMBE BASS', category: 'percussion', keyShortcut: 'S', color: '#ff375f', description: 'Low resonant djembe center' },
      { id: 10, name: 'BONGO HI', category: 'percussion', keyShortcut: 'D', color: '#64d2ff', description: 'Tight bongo machito' },
      { id: 11, name: 'BONGO LO', category: 'percussion', keyShortcut: 'F', color: '#64d2ff', description: 'Open bongo hembra' },

      { id: 12, name: 'KALIMBA TINE', category: 'synth', keyShortcut: 'Z', color: '#bf5af2', description: 'Resonant thumb piano' },
      { id: 13, name: 'BAMBOO FLUTE', category: 'synth', keyShortcut: 'X', color: '#bf5af2', description: 'Blown bamboo harmonic' },
      { id: 14, name: 'TRIBAL CHANT', category: 'vocal', keyShortcut: 'C', color: '#ff9f0a', description: 'Energetic vocal "YEAH"' },
      { id: 15, name: 'WIND CHIME', category: 'fx', keyShortcut: 'V', color: '#32ade6', description: 'Cascading resonant chimes' },
    ],
  },
};
