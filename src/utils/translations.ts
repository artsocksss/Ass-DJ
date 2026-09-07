import { BankId } from '../types';

export type Language = 'uk' | 'en';

export const TRANSLATIONS = {
  uk: {
    appName: 'soundARTSSmixer',
    appSubtitle: 'DJ Дрампед для iPhone',
    audioActive: 'Аудіо активне',
    engineReady: 'Рушій 96kHz готовий',
    savedNotification: 'Збережено в памʼять',
    customPattern: 'Власний патерн',
    presetPattern: 'Фабричний пресет',
    patternNameLabel: 'Назва патерну',
    patternNamePlaceholder: 'Мій кастомний біт...',
    savePattern: 'Зберегти',
    savedStatus: 'Збережено',
    savePatternTooltip: 'Зберегти кастомну конфігурацію локально',
    savedPatternsList: 'Збережені пресети',
    noSavedPatterns: 'Немає збережених',
    deletePattern: 'Видалити',
    loadPattern: 'Завантажити',
    
    // Status Bar & OLED
    tempo: 'Темп',
    bpm: 'BPM',
    key: 'Тональність',
    tap: 'ТАП',
    bar: 'Такт',
    beat: 'Доля',
    
    // Banks
    banks: {
      A: { short: '808 Треп', full: '808 ТРЕП & ХІП-ХОП', desc: 'Потужний 808 саб, хрусткі клепи й треп-хети' },
      B: { short: '909 Техно', full: '909 ТЕХНО & КЛАБ', desc: 'Пряма бочка 4x4, ейсід 303 і клубні стеби' },
      C: { short: 'Синтвейв', full: 'РЕТРО СИНТВЕЙВ', desc: 'Аналогові барабани 80-х, гейтований снейр' },
      D: { short: 'Афробіт', full: 'АФРО ГРУВ & ПЕРКУСІЯ', desc: 'Органічні лог-драми, шейкери та поліритми' },
    },
    
    // Transport Controls
    cue: 'CUE',
    play: 'СТАРТ',
    pause: 'ПАУЗА',
    rec: 'ЗАПИС',
    sync: 'СИНХР',
    quantize: 'КВАНТ',
    quantizeOff: 'ВИМК',
    
    // Tabs
    tabs: {
      pads: 'Педи',
      sequencer: 'Секвенсор',
      fx: 'FX та EQ',
    },
    
    // Step Sequencer
    sequencerTitle: 'Покроковий Секвенсор',
    clearSequence: 'Очистити',
    resetPreset: 'Скинути пресет',
    stepNumber: 'Крок',
    selectPadToEdit: 'Оберіть пад для редагування сітки',
    activeSteps: 'Активних кроків',
    
    // Performance FX & EQ
    fxHeader: 'Керування виконанням',
    midiLearn: 'MIDI Навчання',
    pitchBend: 'Пітч-зсув / Тональність',
    pitchSemitones: 'Півтони (+/- 12)',
    pitchReset: 'Скинути (0)',
    pitchSemitonesUnit: 'пвт',
    colorFx: 'Колірний ефект (Color FX)',
    fxTypes: {
      FILTER: 'ФІЛЬТР',
      CRUSH: 'БІТКРАШ',
      ECHO: 'ЕХО',
      SPACE: 'ПРОСТІР',
      NOISE: 'ШУМ',
    },
    threeBandEq: '3-смуговий Еквалайзер',
    eqHigh: 'ВЧ (Високі)',
    eqMid: 'СЧ (Середні)',
    eqLow: 'НЧ (Низькі)',
    masterVolume: 'Загальна гучність',
    
    // MIDI Mapping Modal
    midiModalTitle: 'MIDI Призначення',
    midiModalSubtitle: 'Торкніться параметра для навчання, потім поверніть ручку або фейдер на контролері.',
    listening: 'Слухаю...',
    learn: 'Навчити',
    clear: 'Очистити',
    done: 'Готово',
    params: {
      master_volume: 'Загальна гучність',
      fx_param: 'Параметр FX ефекту',
      eq_high: 'Високі частоти (High EQ)',
      eq_mid: 'Середні частоти (Mid EQ)',
      eq_low: 'Низькі частоти (Low EQ)',
      pitch_bend: 'Пітч-бенд (Швидкість)',
    },

    // iPhone Scale & View
    iphoneMode: 'iPhone 12 Pro',
    scaleMode: 'Масштаб 390×844',
  },
  en: {
    appName: 'soundARTSSmixer',
    appSubtitle: 'iPhone DJ Drumpad',
    audioActive: 'Audio Active',
    engineReady: '96kHz Engine Ready',
    savedNotification: 'Saved in memory',
    customPattern: 'Custom Pattern',
    presetPattern: 'Factory Preset',
    patternNameLabel: 'Pattern Name',
    patternNamePlaceholder: 'My Custom Beat...',
    savePattern: 'Save',
    savedStatus: 'Saved',
    savePatternTooltip: 'Save custom pattern configuration locally',
    savedPatternsList: 'Saved Presets',
    noSavedPatterns: 'No saved patterns',
    deletePattern: 'Delete',
    loadPattern: 'Load',
    
    // Status Bar & OLED
    tempo: 'Tempo',
    bpm: 'BPM',
    key: 'Key',
    tap: 'TAP',
    bar: 'Bar',
    beat: 'Beat',
    
    // Banks
    banks: {
      A: { short: '808 Trap', full: '808 TRAP & HIP-HOP', desc: 'Punchy 808s, rolling hats & crisp claps' },
      B: { short: '909 Techno', full: '909 TECHNO & CLUB', desc: 'Pumping four-on-the-floor & warehouse stabs' },
      C: { short: 'Synthwave', full: 'RETRO SYNTHWAVE', desc: '80s analog drums, gated snares & cyber arps' },
      D: { short: 'Afro Groove', full: 'AFRO GROOVE & PERCUSSION', desc: 'Organic log drums, shakers & polyrhythms' },
    },
    
    // Transport Controls
    cue: 'CUE',
    play: 'PLAY',
    pause: 'PAUSE',
    rec: 'REC',
    sync: 'SYNC',
    quantize: 'QUANT',
    quantizeOff: 'OFF',
    
    // Tabs
    tabs: {
      pads: 'Pads',
      sequencer: 'Sequencer',
      fx: 'FX & EQ',
    },
    
    // Step Sequencer
    sequencerTitle: 'Step Sequencer',
    clearSequence: 'Clear',
    resetPreset: 'Reset Preset',
    stepNumber: 'Step',
    selectPadToEdit: 'Select pad to edit step pattern',
    activeSteps: 'Active Steps',
    
    // Performance FX & EQ
    fxHeader: 'Performance Controls',
    midiLearn: 'MIDI Learn',
    pitchBend: 'Pitch Shift / Tuning',
    pitchSemitones: 'Semitones (+/- 12)',
    pitchReset: 'Reset (0)',
    pitchSemitonesUnit: 'st',
    colorFx: 'Sound Color FX',
    fxTypes: {
      FILTER: 'FILTER',
      CRUSH: 'CRUSH',
      ECHO: 'ECHO',
      SPACE: 'SPACE',
      NOISE: 'NOISE',
    },
    threeBandEq: '3-Band EQ',
    eqHigh: 'High',
    eqMid: 'Mid',
    eqLow: 'Low',
    masterVolume: 'Master Volume',
    
    // MIDI Mapping Modal
    midiModalTitle: 'MIDI Mappings',
    midiModalSubtitle: 'Tap a parameter to learn, then twist a knob or slider on your MIDI controller.',
    listening: 'Listening...',
    learn: 'Learn',
    clear: 'Clear',
    done: 'Done',
    params: {
      master_volume: 'Master Volume',
      fx_param: 'FX Parameter',
      eq_high: 'EQ High',
      eq_mid: 'EQ Mid',
      eq_low: 'EQ Low',
      pitch_bend: 'Pitch Bend',
    },

    // iPhone Scale & View
    iphoneMode: 'iPhone 12 Pro',
    scaleMode: 'Scale 390×844',
  },
};

export const UKRAINIAN_PAD_NAMES: Record<BankId, Record<number, string>> = {
  A: {
    0: 'КІК ПАНЧ',
    1: '808 САБ',
    2: 'СНЕЙР',
    3: 'ТРЕП КЛЕП',
    4: 'РІМШОТ',
    5: 'ЗАКР. ХЕТ',
    6: 'ВІДКР. ХЕТ',
    7: 'ШЕЙКЕР',
    8: 'ВИС. ТОМ',
    9: 'НИЗ. ТОМ',
    10: 'РАЙД',
    11: 'КРЕШ',
    12: 'КОВБЕЛ',
    13: 'БРАС СТЕБ',
    14: 'ВОКАЛ ГЕЙ',
    15: 'ЛАЗЕР FX',
  },
  B: {
    0: '909 КІК',
    1: 'ЕЙСІД САБ',
    2: '909 СНЕЙР',
    3: 'СТЕК КЛЕП',
    4: 'ЧІП КЛІК',
    5: 'ТІК ХЕТ',
    6: 'ВІДКР. 909',
    7: 'ПЕДАЛЬ ХЕТ',
    8: 'КОНҐА ВЧ',
    9: 'КОНҐА НЧ',
    10: 'РАЙД ДЗВІН',
    11: 'ДАРК КРЕШ',
    12: 'РЕЙВ АКОРД',
    13: 'ПИЛА ПЛАК',
    14: 'ВОКАЛ ГОУ',
    15: 'НОЙЗ СВІП',
  },
  C: {
    0: 'ГЕЙТ КІК',
    1: 'МУГ БАС',
    2: 'ЛІНН СНЕЙР',
    3: 'РЕТРО КЛЕП',
    4: 'ВУД РІМ',
    5: 'ДІДЖІ ХЕТ',
    6: 'СИНТ ХЕТ',
    7: 'ТАМБУРИН',
    8: 'СИНТ ТОМ В',
    9: 'СИНТ ТОМ Н',
    10: 'ЧАЙМ КРЕШ',
    11: 'РЕВЕРС СВЕЛ',
    12: 'КІБЕР ЛІД',
    13: 'НЕОН АРП',
    14: 'РОБОТ ВОКС',
    15: 'ГЛІТЧ ЗАП',
  },
  D: {
    0: 'ТРАЙБЛ КІК',
    1: 'ЛОГ ДРАМ',
    2: 'ВУД СНЕЙР',
    3: 'СЛЕП КЛЕП',
    4: 'ВУД БЛОК',
    5: 'КАБАСА',
    6: 'СІДС ШЕЙКЕР',
    7: 'АГОГО',
    8: 'ДЖЕМБЕ ВЧ',
    9: 'ДЖЕМБЕ БАС',
    10: 'БОНГО ВЧ',
    11: 'БОНГО НЧ',
    12: 'КАЛІМБА',
    13: 'БАМБУК',
    14: 'ТРАЙБЛ ЧАНТ',
    15: 'ВІТР. ЧАЙМ',
  },
};
