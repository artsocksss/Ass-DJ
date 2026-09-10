export type ThemeId = 'onyx' | 'amber' | 'acid' | 'titanium' | 'tokyo';

export type FpsTarget = 30 | 60 | 120;

export interface ThemeConfig {
  id: ThemeId;
  nameUk: string;
  nameEn: string;
  tag: string;
  accent: string;
  accentSecondary: string;
  accentTertiary: string;
  accentGlow: string;
  bgMain: string;
  bgPanel: string;
  bgCard: string;
  bgPad: string;
  borderSubtle: string;
  borderActive: string;
  textPrimary: string;
  textMuted: string;
  oledAccent: string;
  waveformColor: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  onyx: {
    id: 'onyx',
    nameUk: 'Онікс Стелс',
    nameEn: 'Onyx Stealth',
    tag: 'CYAN / SLATE',
    accent: '#00F0FF',
    accentSecondary: '#00FF66',
    accentTertiary: '#FF007F',
    accentGlow: 'rgba(0, 240, 255, 0.35)',
    bgMain: '#08090C',
    bgPanel: '#0F1117',
    bgCard: '#151822',
    bgPad: '#181C28',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderActive: 'rgba(0, 240, 255, 0.5)',
    textPrimary: '#F1F5F9',
    textMuted: '#64748B',
    oledAccent: '#00F0FF',
    waveformColor: '#00F0FF',
  },
  amber: {
    id: 'amber',
    nameUk: 'Ретро Бурштин',
    nameEn: 'Amber Studio',
    tag: 'WARM OLED',
    accent: '#FFB703',
    accentSecondary: '#FB8500',
    accentTertiary: '#FF5400',
    accentGlow: 'rgba(255, 183, 3, 0.35)',
    bgMain: '#0B0906',
    bgPanel: '#15110A',
    bgCard: '#1E1810',
    bgPad: '#241D13',
    borderSubtle: 'rgba(255, 183, 3, 0.12)',
    borderActive: 'rgba(255, 183, 3, 0.6)',
    textPrimary: '#FEF3C7',
    textMuted: '#927848',
    oledAccent: '#FFB703',
    waveformColor: '#FFB703',
  },
  acid: {
    id: 'acid',
    nameUk: 'Ейсід Матриця',
    nameEn: 'Acid Matrix',
    tag: 'TOXIC LIME',
    accent: '#39FF14',
    accentSecondary: '#CCFF00',
    accentTertiary: '#00F0FF',
    accentGlow: 'rgba(57, 255, 20, 0.35)',
    bgMain: '#060A06',
    bgPanel: '#0C140C',
    bgCard: '#132013',
    bgPad: '#182918',
    borderSubtle: 'rgba(57, 255, 20, 0.12)',
    borderActive: 'rgba(57, 255, 20, 0.55)',
    textPrimary: '#ECFDF5',
    textMuted: '#4B7A56',
    oledAccent: '#39FF14',
    waveformColor: '#39FF14',
  },
  titanium: {
    id: 'titanium',
    nameUk: 'Титан Мінімал',
    nameEn: 'Titanium Pro',
    tag: 'PURE MONO',
    accent: '#FFFFFF',
    accentSecondary: '#94A3B8',
    accentTertiary: '#CBD5E1',
    accentGlow: 'rgba(255, 255, 255, 0.25)',
    bgMain: '#0A0A0B',
    bgPanel: '#121214',
    bgCard: '#18181B',
    bgPad: '#202024',
    borderSubtle: 'rgba(255, 255, 255, 0.1)',
    borderActive: 'rgba(255, 255, 255, 0.6)',
    textPrimary: '#FFFFFF',
    textMuted: '#71717A',
    oledAccent: '#E4E4E7',
    waveformColor: '#E4E4E7',
  },
  tokyo: {
    id: 'tokyo',
    nameUk: 'Токіо Неон',
    nameEn: 'Tokyo Midnight',
    tag: 'MAGENTA / VIOLET',
    accent: '#FF007F',
    accentSecondary: '#A855F7',
    accentTertiary: '#00F0FF',
    accentGlow: 'rgba(255, 0, 127, 0.35)',
    bgMain: '#0B060F',
    bgPanel: '#140A1C',
    bgCard: '#1D1028',
    bgPad: '#251534',
    borderSubtle: 'rgba(255, 0, 127, 0.12)',
    borderActive: 'rgba(255, 0, 127, 0.55)',
    textPrimary: '#FDF4FF',
    textMuted: '#865E99',
    oledAccent: '#FF007F',
    waveformColor: '#FF007F',
  },
};
