import { useState, useEffect, useCallback, useRef } from 'react';
import { BankId, CustomSavedPattern } from '../types';
import { PRESET_LIBRARY } from '../audio/presetPatterns';

const STORAGE_KEYS = {
  PATTERN: 'soundmix_persisted_pattern_v5',
  BPM: 'soundmix_persisted_bpm_v5',
  BANK: 'soundmix_persisted_bank_v5',
  NAME: 'soundmix_persisted_name_v5',
  SAVED_LIST: 'soundmix_saved_patterns_list_v5',
  AUTO_SAVED_AT: 'soundmix_auto_saved_at_v5',
};

const VALID_BANKS: BankId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

function isValidPattern(val: unknown): val is boolean[][] {
  return (
    Array.isArray(val) &&
    val.length === 16 &&
    val.every((row) => Array.isArray(row) && row.length === 16 && row.every((cell) => typeof cell === 'boolean'))
  );
}

function getInitialBank(): BankId {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.BANK);
    if (saved && (VALID_BANKS as string[]).includes(saved)) {
      return saved as BankId;
    }
  } catch (e) {
    console.warn('Failed to read bank from localStorage:', e);
  }
  return 'A';
}

function getInitialPattern(bank: BankId): boolean[][] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PATTERN);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (isValidPattern(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read pattern from localStorage:', e);
  }
  return PRESET_LIBRARY[bank]?.pattern || PRESET_LIBRARY.A.pattern;
}

function getInitialBpm(bank: BankId): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.BPM);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 40 && parsed <= 240) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read BPM from localStorage:', e);
  }
  return PRESET_LIBRARY[bank]?.bpm || 140;
}

function getInitialName(bank: BankId): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.NAME);
    if (saved && saved.trim()) {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to read name from localStorage:', e);
  }
  return PRESET_LIBRARY[bank]?.name || 'MADDIX • BIG ROOM RAVE';
}

function getInitialSavedList(): CustomSavedPattern[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_LIST);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read saved patterns from localStorage:', e);
  }
  return [];
}

/**
 * Custom hook that persists the current drum pattern, BPM, pattern name, and saved patterns list in localStorage.
 * Includes an automatic 5-second recurring background serialization loop and page lifecycle flushes
 * to guarantee that user sequences and tempo are preserved even if the tab crashes or refreshes.
 */
export function usePersistentPatternAndBpm(defaultBank: BankId = 'A') {
  const [currentBank, setCurrentBankState] = useState<BankId>(getInitialBank);
  const [history, setHistory] = useState<{ past: boolean[][][], present: boolean[][], future: boolean[][][] }>(() => {
    const initial = getInitialPattern(currentBank);
    return {
      past: [],
      present: initial,
      future: [],
    };
  });
  const pattern = history.present;
  const [bpm, setBpmState] = useState<number>(() => getInitialBpm(currentBank));
  const [patternName, setPatternNameState] = useState<string>(() => getInitialName(currentBank));
  const [savedPatterns, setSavedPatterns] = useState<CustomSavedPattern[]>(getInitialSavedList);
  const [hasCustomEdits, setHasCustomEdits] = useState<boolean>(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<number>(Date.now());

  // Refs to always hold latest values for interval timer and unload events without tearing down listeners
  const patternRef = useRef(pattern);
  const bpmRef = useRef(bpm);
  const bankRef = useRef(currentBank);
  const nameRef = useRef(patternName);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    bankRef.current = currentBank;
  }, [currentBank]);

  useEffect(() => {
    nameRef.current = patternName;
  }, [patternName]);

  // Direct flush serialization function
  const flushToLocalStorage = useCallback(() => {
    try {
      const currentPat = patternRef.current;
      const currentB = bpmRef.current;
      const currentBk = bankRef.current;
      const currentNm = nameRef.current;

      localStorage.setItem(STORAGE_KEYS.PATTERN, JSON.stringify(currentPat));
      localStorage.setItem(STORAGE_KEYS.BPM, currentB.toString());
      localStorage.setItem(STORAGE_KEYS.BANK, currentBk);
      localStorage.setItem(STORAGE_KEYS.NAME, currentNm);
      localStorage.setItem(STORAGE_KEYS.AUTO_SAVED_AT, Date.now().toString());
      setLastAutoSavedAt(Date.now());
    } catch (e) {
      console.warn('Auto-save to localStorage failed:', e);
    }
  }, []);

  // ----------------------------------------------------
  // AUTO-SAVE MECHANISM: 5-SECOND BACKGROUND SERIALIZATION LOOP
  // ----------------------------------------------------
  useEffect(() => {
    // Run recurring serialization every 5000ms (5 seconds)
    const autoSaveInterval = setInterval(() => {
      flushToLocalStorage();
    }, 5000);

    // Save immediately if page is closed, refreshed, or backgrounded
    const handleBeforeUnload = () => {
      flushToLocalStorage();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushToLocalStorage();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(autoSaveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Final flush on unmount
      flushToLocalStorage();
    };
  }, [flushToLocalStorage]);

  // Sync pattern to state and immediately trigger quick write
  const setPattern = useCallback((action: boolean[][] | ((prev: boolean[][]) => boolean[][])) => {
    setHistory((prev) => {
      const next = typeof action === 'function' ? action(prev.present) : action;
      if (next === prev.present) return prev;
      
      try {
        localStorage.setItem(STORAGE_KEYS.PATTERN, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to write pattern to localStorage:', e);
      }
      
      const newPast = [...prev.past, prev.present];
      if (newPast.length > 50) newPast.shift(); // keep history size reasonable
      
      return {
        past: newPast,
        present: next,
        future: [],
      };
    });
    setHasCustomEdits(true);
  }, []);

  const undoPattern = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      
      try {
        localStorage.setItem(STORAGE_KEYS.PATTERN, JSON.stringify(previous));
      } catch (e) {
        console.warn('Failed to write pattern to localStorage:', e);
      }
      
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
    setHasCustomEdits(true);
  }, []);

  const redoPattern = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      
      try {
        localStorage.setItem(STORAGE_KEYS.PATTERN, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to write pattern to localStorage:', e);
      }
      
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
    setHasCustomEdits(true);
  }, []);

  // Sync BPM to state and immediately trigger quick write
  const setBpm = useCallback((newBpmOrFn: number | ((prev: number) => number)) => {
    setBpmState((prev) => {
      const next = typeof newBpmOrFn === 'function' ? newBpmOrFn(prev) : newBpmOrFn;
      const clamped = Math.max(40, Math.min(240, Number(next.toFixed(1))));
      try {
        localStorage.setItem(STORAGE_KEYS.BPM, clamped.toString());
        setHasCustomEdits(true);
      } catch (e) {
        console.warn('Failed to write BPM to localStorage:', e);
      }
      return clamped;
    });
  }, []);

  // Rename Pattern and persist
  const setPatternName = useCallback((name: string) => {
    setPatternNameState(name);
    try {
      localStorage.setItem(STORAGE_KEYS.NAME, name);
      setHasCustomEdits(true);
    } catch (e) {
      console.warn('Failed to write pattern name to localStorage:', e);
    }
  }, []);

  // Save current pattern configuration to local presets list
  const saveCurrentPattern = useCallback((customName?: string): CustomSavedPattern => {
    const finalName = (customName || patternName || `Custom ${currentBank} Beat`).trim();
    const newSavedItem: CustomSavedPattern = {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: finalName,
      bank: currentBank,
      bpm,
      pattern,
      updatedAt: Date.now(),
    };

    setSavedPatterns((prev) => {
      const updated = [newSavedItem, ...prev.filter((p) => p.name !== finalName)];
      try {
        localStorage.setItem(STORAGE_KEYS.SAVED_LIST, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save pattern list to localStorage:', e);
      }
      return updated;
    });

    setPatternNameState(finalName);
    try {
      localStorage.setItem(STORAGE_KEYS.NAME, finalName);
    } catch (e) {
      console.warn('Failed to write pattern name to localStorage:', e);
    }

    return newSavedItem;
  }, [patternName, currentBank, bpm, pattern]);

  // Load a saved pattern configuration
  const loadSavedPattern = useCallback((id: string) => {
    const item = savedPatterns.find((p) => p.id === id);
    if (item && isValidPattern(item.pattern)) {
      setHistory({ past: [], present: item.pattern, future: [] });
      setBpmState(item.bpm);
      setCurrentBankState(item.bank);
      setPatternNameState(item.name);
      setHasCustomEdits(true);

      try {
        localStorage.setItem(STORAGE_KEYS.PATTERN, JSON.stringify(item.pattern));
        localStorage.setItem(STORAGE_KEYS.BPM, item.bpm.toString());
        localStorage.setItem(STORAGE_KEYS.BANK, item.bank);
        localStorage.setItem(STORAGE_KEYS.NAME, item.name);
      } catch (e) {
        console.warn('Failed to load saved pattern:', e);
      }
      return true;
    }
    return false;
  }, [savedPatterns]);

  // Delete a saved pattern configuration
  const deleteSavedPattern = useCallback((id: string) => {
    setSavedPatterns((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.SAVED_LIST, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to update saved patterns list:', e);
      }
      return updated;
    });
  }, []);

  // Switch Bank with persistence
  const selectBank = useCallback((newBank: BankId, loadPreset = true) => {
    setCurrentBankState(newBank);
    try {
      localStorage.setItem(STORAGE_KEYS.BANK, newBank);
    } catch (e) {
      console.warn('Failed to persist bank to localStorage:', e);
    }

    if (loadPreset && PRESET_LIBRARY[newBank]) {
      const newPattern = PRESET_LIBRARY[newBank].pattern;
      const newBpm = PRESET_LIBRARY[newBank].bpm;
      const defaultName = PRESET_LIBRARY[newBank].name;
      setHistory({ past: [], present: newPattern, future: [] });
      setBpmState(newBpm);
      setPatternNameState(defaultName);
      try {
        localStorage.setItem(STORAGE_KEYS.PATTERN, JSON.stringify(newPattern));
        localStorage.setItem(STORAGE_KEYS.BPM, newBpm.toString());
        localStorage.setItem(STORAGE_KEYS.NAME, defaultName);
        setHasCustomEdits(false);
      } catch (e) {
        console.warn('Failed to write bank preset to localStorage:', e);
      }
    }
  }, []);

  // Reset to factory preset for current or specified bank
  const resetToFactoryPreset = useCallback((bank: BankId = currentBank) => {
    if (PRESET_LIBRARY[bank]) {
      const presetPattern = PRESET_LIBRARY[bank].pattern;
      const presetBpm = PRESET_LIBRARY[bank].bpm;
      const presetName = PRESET_LIBRARY[bank].name;
      setHistory({ past: [], present: presetPattern, future: [] });
      setBpmState(presetBpm);
      setPatternNameState(presetName);
      try {
        localStorage.setItem(STORAGE_KEYS.PATTERN, JSON.stringify(presetPattern));
        localStorage.setItem(STORAGE_KEYS.BPM, presetBpm.toString());
        localStorage.setItem(STORAGE_KEYS.NAME, presetName);
        setHasCustomEdits(false);
      } catch (e) {
        console.warn('Failed to reset localStorage:', e);
      }
    }
  }, [currentBank]);

  return {
    currentBank,
    setCurrentBank: selectBank,
    pattern,
    setPattern,
    undoPattern,
    redoPattern,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    bpm,
    setBpm,
    patternName,
    setPatternName,
    saveCurrentPattern,
    savedPatterns,
    loadSavedPattern,
    deleteSavedPattern,
    resetToFactoryPreset,
    hasCustomEdits,
    lastAutoSavedAt,
    flushToLocalStorage,
  };
}


