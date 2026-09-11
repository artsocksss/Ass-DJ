import React, { useState } from 'react';
import { ThemeId } from '../types';
import { THEMES } from '../utils/theme';

interface AIStudioGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  theme: ThemeId;
  onAudioLoaded: (url: string, name: string) => void;
}

const IconMusic = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const AIStudioGenerator: React.FC<AIStudioGeneratorProps> = ({
  isOpen,
  onClose,
  lang,
  theme,
  onAudioLoaded
}) => {
  const [prompt, setPrompt] = useState('Generate a 30-second cinematic orchestral track.');
  const [isFullTrack, setIsFullTrack] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeThemeConfig = THEMES[theme] || THEMES.onyx;

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, isFullTrack }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate music');
      }
      
      // Decode base64 audio into a playable Blob URL
      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType });
      const audioUrl = URL.createObjectURL(blob);
      
      onAudioLoaded(audioUrl, `AI: ${prompt.substring(0, 20)}...`);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during generation');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col border shadow-2xl relative"
        style={{ 
          backgroundColor: activeThemeConfig.bgPanel,
          borderColor: activeThemeConfig.borderSubtle
        }}
      >
        <div 
          className="px-5 py-4 border-b flex justify-between items-center"
          style={{ borderColor: activeThemeConfig.borderSubtle, backgroundColor: `${activeThemeConfig.bgMain}50` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${activeThemeConfig.accent}20`, color: activeThemeConfig.accent }}>
              <IconMusic />
            </div>
            <h2 className="font-space font-bold text-sm tracking-widest uppercase">
              Generate Music
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-white/50 hover:text-white transition-colors"
          >
            <IconClose />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div>
            <label className="block text-[11px] font-space text-white/50 mb-2 tracking-wider">
              PROMPT
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-24 bg-black/40 border rounded-xl p-3 text-sm text-white resize-none focus:outline-none transition-colors"
              style={{ borderColor: activeThemeConfig.borderSubtle }}
              placeholder="Describe the track you want to generate..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFullTrack(false)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold font-space transition-colors border ${!isFullTrack ? 'border-transparent text-white' : 'text-white/50 bg-transparent'}`}
              style={{
                backgroundColor: !isFullTrack ? activeThemeConfig.accent : 'transparent',
                borderColor: isFullTrack ? activeThemeConfig.borderSubtle : 'transparent',
                color: !isFullTrack ? '#000' : undefined
              }}
            >
              Short Clip (30s)
            </button>
            <button
              onClick={() => setIsFullTrack(true)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold font-space transition-colors border ${isFullTrack ? 'border-transparent text-white' : 'text-white/50 bg-transparent'}`}
              style={{
                backgroundColor: isFullTrack ? activeThemeConfig.accent : 'transparent',
                borderColor: !isFullTrack ? activeThemeConfig.borderSubtle : 'transparent',
                color: isFullTrack ? '#000' : undefined
              }}
            >
              Full Track
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center font-inter">
              {error}
            </div>
          )}
          
          <p className="text-[10px] text-white/40 text-center px-4 font-inter leading-relaxed">
            Music generation powered by Lyria 3. Generation may take up to 2-3 minutes. Make sure you have set a GEMINI_API_KEY with access to Lyria.
          </p>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-4 rounded-2xl font-space font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:scale-100 active:scale-95 flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: isGenerating ? activeThemeConfig.borderSubtle : activeThemeConfig.accent,
              color: isGenerating ? 'white' : '#000'
            }}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              'Generate Audio'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
