import React, { useState, useEffect, useMemo } from 'react';
import { BankId, CustomKitPreset, CustomPadMapping, Language, ThemeId } from '../types';
import { THEMES } from '../utils/theme';
import { BANKS } from '../audio/soundPresets';
import { saveKitToCloud, deleteKitFromCloud, getUserKitsFromCloud } from '../services/firebaseSync';

interface KitPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  theme: ThemeId;
  customAccent?: string | null;
  currentBank: BankId;
  activeKit: CustomKitPreset | null;
  onApplyKit: (kit: CustomKitPreset | null) => void;
  onAuditionSound: (bank: BankId, padId: number, pitchShift?: number, gain?: number) => void;
  user?: any;
}

const LOCAL_KITS_STORAGE_KEY = 'soundmix_custom_kit_presets';

export const FACTORY_HYBRID_KIT: CustomKitPreset = {
  id: 'factory_hybrid_rave_1',
  name: 'HYBRID RAVE SUPERKIT',
  description: 'Maddix Kick + Brejcha Bass + Korolova Stab + Noisia Snare',
  baseBank: 'A',
  createdAt: '2026-09-11T00:00:00.000Z',
  mappings: [
    { padId: 0, sourceBank: 'A', sourcePadId: 0, customName: 'MADDIX RUMBLE', category: 'kick', color: '#00F0FF', pitchShift: 0, gain: 1.0 },
    { padId: 1, sourceBank: 'B', sourcePadId: 1, customName: 'JOKER ROLLING BASS', category: 'sub', color: '#30D158', pitchShift: 0, gain: 1.1 },
    { padId: 2, sourceBank: 'A', sourcePadId: 2, customName: 'BIG ROOM CLAP', category: 'clap', color: '#5AC8FA', pitchShift: 0, gain: 1.0 },
    { padId: 3, sourceBank: 'A', sourcePadId: 1, customName: 'ACID 303 MADDIX', category: 'sub', color: '#39FF14', pitchShift: 0, gain: 1.0 },
    { padId: 4, sourceBank: 'C', sourcePadId: 4, customName: 'ARTBAT BRASS STAB', category: 'synth', color: '#FF375F', pitchShift: 0, gain: 1.0 },
    { padId: 5, sourceBank: 'A', sourcePadId: 5, customName: '909 DRIVING HAT', category: 'hihat', color: '#FFD60A', pitchShift: 0, gain: 1.0 },
    { padId: 6, sourceBank: 'A', sourcePadId: 6, customName: 'SIZZLE OPEN HAT', category: 'hihat', color: '#FFD60A', pitchShift: 0, gain: 1.0 },
    { padId: 7, sourceBank: 'D', sourcePadId: 0, customName: 'NOISIA NEURO SUB', category: 'sub', color: '#30D158', pitchShift: 0, gain: 1.0 },
    { padId: 8, sourceBank: 'E', sourcePadId: 1, customName: 'KAZANTIP ACID 303', category: 'synth', color: '#39FF14', pitchShift: 2, gain: 1.0 },
    { padId: 9, sourceBank: 'A', sourcePadId: 9, customName: 'ANVIL DROP', category: 'percussion', color: '#32ADE6', pitchShift: 0, gain: 1.0 },
    { padId: 10, sourceBank: 'F', sourcePadId: 4, customName: 'FUTURE RAVE LEAD', category: 'synth', color: '#00F0FF', pitchShift: 0, gain: 1.0 },
    { padId: 11, sourceBank: 'A', sourcePadId: 11, customName: 'MADDIX LASER', category: 'fx', color: '#64D2FF', pitchShift: 0, gain: 1.0 },
    { padId: 12, sourceBank: 'A', sourcePadId: 12, customName: 'SUB BOMB 808', category: 'sub', color: '#0071E3', pitchShift: -2, gain: 1.2 },
    { padId: 13, sourceBank: 'A', sourcePadId: 13, customName: 'NOISE RISER', category: 'fx', color: '#BF5AF2', pitchShift: 0, gain: 1.0 },
    { padId: 14, sourceBank: 'A', sourcePadId: 14, customName: 'MADDIX VOX', category: 'vocal', color: '#FF9F0A', pitchShift: 0, gain: 1.0 },
    { padId: 15, sourceBank: 'G', sourcePadId: 15, customName: 'INDUSTRIAL EXPLOSION', category: 'fx', color: '#FF2D55', pitchShift: 0, gain: 1.2 },
  ],
};

export const KitPresetModal: React.FC<KitPresetModalProps> = ({
  isOpen,
  onClose,
  lang,
  theme,
  customAccent,
  currentBank,
  activeKit,
  onApplyKit,
  onAuditionSound,
  user,
}) => {
  if (!isOpen) return null;

  const themeConfig = THEMES[theme] || THEMES.onyx;
  const activeAccent = customAccent || themeConfig.accent;
  const isUk = lang === 'uk';

  const [savedKits, setSavedKits] = useState<CustomKitPreset[]>([]);
  const [editingKit, setEditingKit] = useState<CustomKitPreset>(() => {
    if (activeKit) return JSON.parse(JSON.stringify(activeKit));
    // Default kit initialized from active bank pads
    const currentPads = BANKS[currentBank]?.pads || BANKS.A.pads;
    return {
      id: `kit_custom_${Date.now()}`,
      name: `${BANKS[currentBank]?.artist || 'CUSTOM'} PAD KIT`,
      description: isUk ? 'Кастомний набір прусів' : 'Custom pad sound configuration',
      baseBank: currentBank,
      createdAt: new Date().toISOString(),
      mappings: currentPads.map((p) => ({
        padId: p.id,
        sourceBank: currentBank,
        sourcePadId: p.id,
        customName: p.name,
        category: p.category,
        color: p.color,
        pitchShift: 0,
        gain: 1.0,
      })),
    };
  });

  const [selectedPadIndex, setSelectedPadIndex] = useState<number>(0);
  const [kitNameInput, setKitNameInput] = useState<string>(editingKit.name);
  const [activeTab, setActiveTab] = useState<'presets' | 'editor'>('presets');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load custom kits from localStorage & cloud
  useEffect(() => {
    const loadKits = async () => {
      let local: CustomKitPreset[] = [];
      try {
        const stored = localStorage.getItem(LOCAL_KITS_STORAGE_KEY);
        if (stored) local = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }

      if (user) {
        try {
          const cloud = await getUserKitsFromCloud(user.uid);
          // Merge cloud & local unique by id
          const map = new Map<string, CustomKitPreset>();
          local.forEach((k) => map.set(k.id, k));
          cloud.forEach((k) => map.set(k.id, k));
          const combined = Array.from(map.values());
          setSavedKits(combined);
          localStorage.setItem(LOCAL_KITS_STORAGE_KEY, JSON.stringify(combined));
          return;
        } catch (err) {
          console.error(err);
        }
      }
      setSavedKits(local);
    };
    loadKits();
  }, [user]);

  const bankIds: BankId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  const selectedMapping = useMemo(() => {
    return (
      editingKit.mappings.find((m) => m.padId === selectedPadIndex) || {
        padId: selectedPadIndex,
        sourceBank: currentBank,
        sourcePadId: selectedPadIndex,
        customName: BANKS[currentBank]?.pads[selectedPadIndex]?.name || `Pad ${selectedPadIndex + 1}`,
        category: BANKS[currentBank]?.pads[selectedPadIndex]?.category || 'synth',
        color: BANKS[currentBank]?.pads[selectedPadIndex]?.color || activeAccent,
        pitchShift: 0,
        gain: 1.0,
      }
    );
  }, [editingKit, selectedPadIndex, currentBank, activeAccent]);

  const updateSelectedPadMapping = (partial: Partial<CustomPadMapping>) => {
    setEditingKit((prev) => {
      const updated = prev.mappings.map((m) => {
        if (m.padId === selectedPadIndex) {
          return { ...m, ...partial };
        }
        return m;
      });
      return { ...prev, mappings: updated };
    });
  };

  const handleSaveKit = async () => {
    const finalName = kitNameInput.trim() || `Custom Kit ${savedKits.length + 1}`;
    const newKit: CustomKitPreset = {
      ...editingKit,
      name: finalName,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = savedKits.filter((k) => k.id !== newKit.id);
    updatedList.unshift(newKit);
    setSavedKits(updatedList);
    localStorage.setItem(LOCAL_KITS_STORAGE_KEY, JSON.stringify(updatedList));

    if (user) {
      await saveKitToCloud(user.uid, newKit);
    }

    onApplyKit(newKit);
    setStatusMessage(isUk ? 'Пресет збережено та застосовано!' : 'Preset saved and applied!');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleDeleteKit = async (kitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = savedKits.filter((k) => k.id !== kitId);
    setSavedKits(filtered);
    localStorage.setItem(LOCAL_KITS_STORAGE_KEY, JSON.stringify(filtered));

    if (user) {
      await deleteKitFromCloud(user.uid, kitId);
    }

    if (activeKit?.id === kitId) {
      onApplyKit(null);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(editingKit, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${editingKit.name.replace(/\s+/g, '_')}_Kit.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && Array.isArray(parsed.mappings)) {
          setEditingKit(parsed);
          setKitNameInput(parsed.name || 'Imported Kit');
          onApplyKit(parsed);
          setStatusMessage(isUk ? 'Пресет імпортовано!' : 'Kit imported successfully!');
          setTimeout(() => setStatusMessage(null), 2500);
        }
      } catch (err) {
        alert(isUk ? 'Помилка зчитування JSON' : 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden font-inter text-white"
        style={{
          backgroundColor: themeConfig.bgPanel,
          borderColor: activeAccent,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎛️</span>
            <div className="flex flex-col">
              <h2 className="text-sm font-space font-bold tracking-wider text-white uppercase flex items-center gap-2">
                {isUk ? 'Пресмети Маппінгу Прусів' : 'Drum Pad Mapping Presets'}
              </h2>
              <span className="text-[10px] text-white/50 font-mono">
                {isUk ? 'Створення, збереження та налаштування власного набору звуків' : 'Customize, save and recall your sound configurations'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all text-xs font-mono"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-white/10 bg-black/20 shrink-0 text-xs font-space font-bold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'presets'
                  ? 'text-black shadow-lg'
                  : 'text-white/60 hover:text-white bg-white/5'
              }`}
              style={{
                backgroundColor: activeTab === 'presets' ? activeAccent : undefined,
              }}
            >
              {isUk ? '📚 Бібліотека Пресетів' : '📚 Preset Library'}
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'editor'
                  ? 'text-black shadow-lg'
                  : 'text-white/60 hover:text-white bg-white/5'
              }`}
              style={{
                backgroundColor: activeTab === 'editor' ? activeAccent : undefined,
              }}
            >
              {isUk ? '✏️ Редактор Маппінгу' : '✏️ Mapping Editor'}
            </button>
          </div>

          {activeKit && (
            <button
              onClick={() => onApplyKit(null)}
              className="text-[10px] font-mono text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all"
            >
              {isUk ? 'Скинути до Bank' : 'Reset to Bank'}
            </button>
          )}
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div className="bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30 px-4 py-1.5 text-[11px] font-mono text-center animate-fade-in">
            ✓ {statusMessage}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'presets' && (
            <div className="space-y-4">
              {/* Active Kit Info Banner */}
              <div
                className="p-3.5 rounded-2xl border flex items-center justify-between gap-3"
                style={{ backgroundColor: themeConfig.bgCard, borderColor: activeAccent }}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono uppercase text-white/50 tracking-wider">
                    {isUk ? 'Активний Набір Звуків:' : 'Active Applied Sound Kit:'}
                  </span>
                  <span className="text-xs font-space font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeAccent }} />
                    {activeKit ? activeKit.name : `${BANKS[currentBank]?.name || 'Standard Bank'} (Factory)`}
                  </span>
                </div>
                {!activeKit && (
                  <button
                    onClick={() => {
                      onApplyKit(FACTORY_HYBRID_KIT);
                      setEditingKit(JSON.parse(JSON.stringify(FACTORY_HYBRID_KIT)));
                      setKitNameInput(FACTORY_HYBRID_KIT.name);
                    }}
                    className="px-3 py-1.5 rounded-xl font-space font-bold text-[11px] text-black shadow-md hover:scale-105 active:scale-95 transition-all"
                    style={{ backgroundColor: activeAccent }}
                  >
                    {isUk ? 'Завантажити СуперКіт 🚀' : 'Load SuperKit 🚀'}
                  </button>
                )}
              </div>

              {/* Factory SuperKit */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-space uppercase font-bold text-white/60 tracking-wider">
                  {isUk ? '⭐ Заводський СуперКіт (Factory Preset)' : '⭐ Featured Factory Kit'}
                </span>
                <div
                  onClick={() => {
                    onApplyKit(FACTORY_HYBRID_KIT);
                    setEditingKit(JSON.parse(JSON.stringify(FACTORY_HYBRID_KIT)));
                    setKitNameInput(FACTORY_HYBRID_KIT.name);
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all hover:border-white/40 flex items-center justify-between ${
                    activeKit?.id === FACTORY_HYBRID_KIT.id ? 'bg-white/15 border-emerald-400' : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-space font-bold text-emerald-400">
                        {FACTORY_HYBRID_KIT.name}
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        PRO HYBRID
                      </span>
                    </div>
                    <span className="text-[10px] text-white/60">
                      {FACTORY_HYBRID_KIT.description}
                    </span>
                  </div>
                  <button
                    className={`px-3 py-1 text-[11px] font-space font-bold rounded-xl transition-all ${
                      activeKit?.id === FACTORY_HYBRID_KIT.id
                        ? 'bg-emerald-500 text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {activeKit?.id === FACTORY_HYBRID_KIT.id ? (isUk ? 'АКТИВНИЙ' : 'ACTIVE') : (isUk ? 'Застосувати' : 'Apply')}
                  </button>
                </div>
              </div>

              {/* User Saved Presets */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-space uppercase font-bold text-white/60 tracking-wider">
                    {isUk ? '💾 Ваші Кастомні Пресети' : '💾 Your Custom Saved Kits'} ({savedKits.length})
                  </span>
                  <button
                    onClick={() => setActiveTab('editor')}
                    className="text-[10px] font-mono text-cyan-400 hover:text-white transition-all flex items-center gap-1"
                  >
                    <span>+ {isUk ? 'Створити Новий' : 'Create New'}</span>
                  </button>
                </div>

                {savedKits.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-white/10 bg-black/20 text-white/40 text-xs font-mono space-y-2">
                    <p>{isUk ? 'У вас поки немає збережених кастомних наборів.' : 'No custom kits saved yet.'}</p>
                    <p className="text-[10px]">
                      {isUk ? 'Перейдіть на вкладку "Редактор Маппінгу", збережіть свій перший кіт!' : 'Switch to the "Mapping Editor" tab to create your first kit!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {savedKits.map((kit) => {
                      const isActive = activeKit?.id === kit.id;
                      return (
                        <div
                          key={kit.id}
                          onClick={() => {
                            onApplyKit(kit);
                            setEditingKit(JSON.parse(JSON.stringify(kit)));
                            setKitNameInput(kit.name);
                          }}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            isActive
                              ? 'bg-white/15 border-cyan-400'
                              : 'bg-black/40 border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="text-xs font-space font-bold text-white truncate">
                              {kit.name}
                            </span>
                            <span className="text-[9px] font-mono text-white/40">
                              {new Date(kit.createdAt).toLocaleDateString()} • {kit.mappings.length} Pads
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingKit(JSON.parse(JSON.stringify(kit)));
                                setKitNameInput(kit.name);
                                setActiveTab('editor');
                              }}
                              className="px-2.5 py-1 text-[10px] font-mono text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                            >
                              ✏️ {isUk ? 'Редагувати' : 'Edit'}
                            </button>
                            <button
                              onClick={(e) => handleDeleteKit(kit.id, e)}
                              className="px-2 py-1 text-[10px] font-mono text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/30 rounded-lg transition-all"
                              title={isUk ? 'Видалити' : 'Delete'}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="space-y-4">
              {/* Kit Name & Save Controls */}
              <div className="flex flex-col gap-2 p-3 rounded-2xl border bg-black/30 border-white/10">
                <label className="text-[10px] font-space uppercase font-bold text-white/50 tracking-wider">
                  {isUk ? 'Назва Набору / Кіта:' : 'Kit Preset Name:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={kitNameInput}
                    onChange={(e) => {
                      setKitNameInput(e.target.value);
                      setEditingKit((prev) => ({ ...prev, name: e.target.value }));
                    }}
                    placeholder="E.g., Acid Heavy Custom Kit"
                    className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-space font-bold text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleSaveKit}
                    className="px-4 py-1.5 rounded-xl font-space font-bold text-xs text-black shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0"
                    style={{ backgroundColor: activeAccent }}
                  >
                    💾 {isUk ? 'Зберегти' : 'Save Kit'}
                  </button>
                </div>
              </div>

              {/* 4x4 Pad Grid Selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-space uppercase font-bold text-white/50 tracking-wider">
                  {isUk ? 'Оберіть пад для налаштування (16 Pads):' : 'Select Pad to Reassign (16 Pads):'}
                </span>

                <div className="grid grid-cols-4 gap-2 p-2 rounded-2xl bg-black/40 border border-white/10">
                  {editingKit.mappings.map((m) => {
                    const isSelected = m.padId === selectedPadIndex;
                    return (
                      <button
                        key={m.padId}
                        onClick={() => {
                          setSelectedPadIndex(m.padId);
                          onAuditionSound(m.sourceBank, m.sourcePadId, m.pitchShift, m.gain);
                        }}
                        className={`aspect-square rounded-xl p-1.5 flex flex-col justify-between transition-all border relative overflow-hidden text-left ${
                          isSelected ? 'ring-2 ring-white scale-98 shadow-lg' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: themeConfig.bgPad,
                          borderColor: isSelected ? '#ffffff' : (m.color || activeAccent),
                        }}
                      >
                        <div className="flex items-center justify-between w-full text-[9px] font-mono text-white/60">
                          <span>#{m.padId + 1}</span>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: m.color || activeAccent }}
                          />
                        </div>
                        <span className="text-[10px] font-space font-bold text-white truncate leading-tight">
                          {m.customName || `Pad ${m.padId + 1}`}
                        </span>
                        <span className="text-[8px] font-mono text-white/40 uppercase truncate">
                          Bank {m.sourceBank} #{m.sourcePadId + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Individual Pad Sound Tuning Panel */}
              <div className="p-3.5 rounded-2xl border bg-black/40 border-white/15 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-space font-bold text-cyan-400">
                      PAD #{selectedPadIndex + 1}:
                    </span>
                    <input
                      type="text"
                      value={selectedMapping.customName || ''}
                      onChange={(e) => updateSelectedPadMapping({ customName: e.target.value })}
                      placeholder="Custom Pad Title"
                      className="bg-black/60 border border-white/20 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    onClick={() =>
                      onAuditionSound(
                        selectedMapping.sourceBank,
                        selectedMapping.sourcePadId,
                        selectedMapping.pitchShift,
                        selectedMapping.gain
                      )
                    }
                    className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-1 active:scale-95"
                  >
                    ▶️ {isUk ? 'Прослухати' : 'Test Sound'}
                  </button>
                </div>

                {/* Source Bank & Sound Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono uppercase text-white/50">
                      {isUk ? 'Джерело Банку (Source Bank):' : 'Source Sound Bank:'}
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {bankIds.map((bId) => (
                        <button
                          key={bId}
                          onClick={() => updateSelectedPadMapping({ sourceBank: bId })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-space font-bold transition-all border ${
                            selectedMapping.sourceBank === bId
                              ? 'bg-cyan-500 text-black border-cyan-400 shadow-md'
                              : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/15'
                          }`}
                        >
                          {bId}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono uppercase text-white/50">
                      {isUk ? 'Звуковий інструмент:' : 'Source Sound Instrument:'}
                    </label>
                    <select
                      value={selectedMapping.sourcePadId}
                      onChange={(e) => {
                        const newPadId = Number(e.target.value);
                        const sourcePads = BANKS[selectedMapping.sourceBank]?.pads || BANKS.A.pads;
                        const originalPad = sourcePads[newPadId];
                        updateSelectedPadMapping({
                          sourcePadId: newPadId,
                          customName: originalPad?.name || `Pad ${newPadId + 1}`,
                          category: originalPad?.category || 'synth',
                          color: originalPad?.color || activeAccent,
                        });
                      }}
                      className="bg-black/80 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs font-space font-bold text-white focus:outline-none focus:border-cyan-400"
                    >
                      {(BANKS[selectedMapping.sourceBank]?.pads || BANKS.A.pads).map((pad) => (
                        <option key={pad.id} value={pad.id} className="bg-slate-900 text-white">
                          #{pad.id + 1}: {pad.name} ({pad.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pitch & Gain Sliders */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/10">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-white/50">{isUk ? 'Тональність (Pitch):' : 'Pitch Tuning:'}</span>
                      <span className="text-cyan-400 font-bold">
                        {(selectedMapping.pitchShift || 0) > 0 ? `+${selectedMapping.pitchShift}` : selectedMapping.pitchShift || 0} st
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={selectedMapping.pitchShift || 0}
                      onChange={(e) => updateSelectedPadMapping({ pitchShift: Number(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-white/50">{isUk ? 'Гучність Паду (Gain):' : 'Pad Volume:'}</span>
                      <span className="text-emerald-400 font-bold">
                        {Math.round((selectedMapping.gain ?? 1.0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1.5}
                      step={0.05}
                      value={selectedMapping.gain ?? 1.0}
                      onChange={(e) => updateSelectedPadMapping({ gain: Number(e.target.value) })}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* File Import / Export JSON */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 font-mono text-[11px] transition-all flex items-center gap-1.5"
                >
                  📤 {isUk ? 'Експорт JSON' : 'Export JSON'}
                </button>

                <label className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 font-mono text-[11px] transition-all cursor-pointer flex items-center gap-1.5">
                  📥 {isUk ? 'Імпорт JSON' : 'Import JSON'}
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
