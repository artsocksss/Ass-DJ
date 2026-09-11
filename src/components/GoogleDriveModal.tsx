import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  Play,
  Square,
  Check,
  AlertCircle,
  RefreshCw,
  LogOut,
  FolderSync,
  FileMusic,
  FileCode2,
  HardDrive,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  getAccessToken,
  initAuth,
} from '../lib/firebase';
import {
  listSoundMixDriveFiles,
  uploadPatternToDrive,
  downloadPatternFromDrive,
  uploadAudioTakeToDrive,
  deleteDriveFile,
  DriveFileItem,
  DrivePatternData,
} from '../lib/googleDrive';
import { BankId, Language, RecordedTake, ThemeId } from '../types';
import { THEMES, ThemeConfig } from '../utils/theme';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPattern: boolean[][];
  currentBank: BankId;
  currentBpm: number;
  patternName: string;
  localTakes: RecordedTake[];
  onLoadPattern: (pattern: boolean[][], bpm: number, bank: BankId, name: string) => void;
  lang: Language;
  theme?: ThemeId;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  currentPattern,
  currentBank,
  currentBpm,
  patternName,
  localTakes,
  onLoadPattern,
  lang,
  theme = 'onyx',
}) => {
  const isUk = lang === 'uk';
  const themeConfig: ThemeConfig = THEMES[theme] || THEMES.onyx;

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Files State
  const [activeTab, setActiveTab] = useState<'patterns' | 'takes'>('patterns');
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Save Pattern Form State
  const [saveName, setSaveName] = useState<string>(patternName || 'My Pioneer Groove');
  const [isUploadingPattern, setIsUploadingPattern] = useState(false);

  // Upload Local Take State
  const [uploadingTakeId, setUploadingTakeId] = useState<string | null>(null);

  // Delete Confirmation Dialog State (Mandatory ABAC safety rule)
  const [deleteTarget, setDeleteTarget] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Audio Playback Preview State for Cloud Audio
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth((currentUser) => {
      setUser(currentUser);
      setAccessToken(getAccessToken());
      setAuthError(null);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Drive files when token is available or modal opens
  const fetchDriveFiles = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingFiles(true);
    try {
      const files = await listSoundMixDriveFiles(accessToken);
      setDriveFiles(files);
      setAuthError(null);
    } catch (err: any) {
      console.error('Error listing Drive files:', err);
      if (err.message?.includes('401')) {
        setAuthError(isUk ? 'Сесія Google Drive закінчилась. Будь ласка, увійдіть знову.' : 'Google Drive session expired. Please sign in again.');
        setUser(null);
        setAccessToken(null);
      } else {
        setStatusMessage({
          type: 'error',
          text: isUk ? `Помилка завантаження файлів: ${err.message}` : `Failed to load Drive files: ${err.message}`,
        });
      }
    } finally {
      setIsLoadingFiles(false);
    }
  }, [accessToken, isUk]);

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchDriveFiles();
    }
  }, [isOpen, accessToken, fetchDriveFiles]);

  useEffect(() => {
    if (patternName) {
      setSaveName(patternName);
    }
  }, [patternName]);

  // Clean up audio on unmount or close
  useEffect(() => {
    if (!isOpen && audioPlayer) {
      audioPlayer.pause();
      setPlayingAudioId(null);
    }
  }, [isOpen, audioPlayer]);

  if (!isOpen) return null;

  // Handle Google Sign-in
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const u = await googleSignIn();
      if (u) {
        setUser(u);
        const token = getAccessToken();
        setAccessToken(token);
        setStatusMessage({
          type: 'success',
          text: isUk ? `Успішно підключено Google Drive: ${u.email}` : `Connected to Google Drive: ${u.email}`,
        });
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setAuthError(err.message || (isUk ? 'Помилка авторизації Google Drive' : 'Failed to authorize Google Drive'));
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Google Sign-out
  const handleSignOut = async () => {
    try {
      if (audioPlayer) audioPlayer.pause();
      setPlayingAudioId(null);
      await logout();
      setUser(null);
      setAccessToken(null);
      setDriveFiles([]);
      setStatusMessage({
        type: 'success',
        text: isUk ? 'Google Drive успішно відключено' : 'Disconnected from Google Drive',
      });
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Handle Upload Pattern to Google Drive
  const handleUploadCurrentPattern = async () => {
    if (!accessToken) return;
    setIsUploadingPattern(true);
    setStatusMessage(null);
    try {
      const payload: DrivePatternData = {
        version: '2.0',
        name: saveName.trim() || `Groove_${currentBank}_${currentBpm}BPM`,
        bank: currentBank,
        bpm: currentBpm,
        pattern: currentPattern,
        updatedAt: Date.now(),
        source: 'SoundMix Pioneer DJ',
      };

      const newFile = await uploadPatternToDrive(accessToken, payload, saveName.trim());
      setStatusMessage({
        type: 'success',
        text: isUk ? `Паттерн "${payload.name}" успішно збережено в Google Drive!` : `Pattern "${payload.name}" saved to Google Drive!`,
      });
      fetchDriveFiles();
    } catch (err: any) {
      console.error('Failed to save pattern to Google Drive:', err);
      setStatusMessage({
        type: 'error',
        text: isUk ? `Помилка збереження: ${err.message}` : `Save failed: ${err.message}`,
      });
    } finally {
      setIsUploadingPattern(false);
    }
  };

  // Handle Load Pattern from Google Drive
  const handleLoadDrivePattern = async (file: DriveFileItem) => {
    if (!accessToken) return;
    setStatusMessage(null);
    try {
      const patternData = await downloadPatternFromDrive(accessToken, file.id);
      onLoadPattern(patternData.pattern, patternData.bpm || 128, patternData.bank || 'A', patternData.name || file.name);
      setStatusMessage({
        type: 'success',
        text: isUk ? `Паттерн "${patternData.name}" успішно завантажено в секвенсор!` : `Loaded "${patternData.name}" into Step Sequencer!`,
      });
    } catch (err: any) {
      console.error('Failed to load pattern from Drive:', err);
      setStatusMessage({
        type: 'error',
        text: isUk ? `Не вдалося завантажити паттерн: ${err.message}` : `Failed to load pattern: ${err.message}`,
      });
    }
  };

  // Handle Upload Local Take to Google Drive
  const handleUploadLocalTake = async (take: RecordedTake) => {
    if (!accessToken) return;
    setUploadingTakeId(take.id);
    setStatusMessage(null);
    try {
      let blob = take.blob;
      if (!blob && take.blobUrl) {
        const r = await fetch(take.blobUrl);
        blob = await r.blob();
      } else if (!blob && take.url) {
        const r = await fetch(take.url);
        blob = await r.blob();
      }

      if (!blob) {
        throw new Error('Audio data is missing for this take');
      }

      const fileName = `${take.name || take.title || 'SoundMix_Take'}_${take.bpm || 128}BPM.wav`;
      await uploadAudioTakeToDrive(accessToken, blob, fileName, {
        bpm: take.bpm,
        bank: take.bank,
        duration: take.duration || take.durationSeconds,
      });

      setStatusMessage({
        type: 'success',
        text: isUk ? `Запис "${take.name || 'Take'}" успішно вивантажено на Google Drive!` : `Take "${take.name || 'Take'}" uploaded to Google Drive!`,
      });
      fetchDriveFiles();
    } catch (err: any) {
      console.error('Failed to upload take to Drive:', err);
      setStatusMessage({
        type: 'error',
        text: isUk ? `Помилка вивантаження аудіо: ${err.message}` : `Failed to upload audio: ${err.message}`,
      });
    } finally {
      setUploadingTakeId(null);
    }
  };

  // Handle Play/Stop Cloud Audio Take Preview
  const handleTogglePlayCloudAudio = (file: DriveFileItem) => {
    if (playingAudioId === file.id && audioPlayer) {
      audioPlayer.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioPlayer) {
      audioPlayer.pause();
    }

    if (!accessToken) return;
    const mediaUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
    
    // We can fetch with Authorization header and create blob URL
    fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const player = new Audio(blobUrl);
        player.onended = () => setPlayingAudioId(null);
        player.play();
        setAudioPlayer(player);
        setPlayingAudioId(file.id);
      })
      .catch((err) => {
        console.error('Error playing cloud audio:', err);
        setStatusMessage({
          type: 'error',
          text: isUk ? 'Помилка відтворення хмарного аудіо' : 'Failed to stream cloud audio',
        });
      });
  };

  // Handle Confirmed Delete (Mandatory explicit user verification gate)
  const handleConfirmDelete = async () => {
    if (!deleteTarget || !accessToken) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(accessToken, deleteTarget.id);
      setDriveFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setStatusMessage({
        type: 'success',
        text: isUk ? `Файл "${deleteTarget.name}" видалено з Google Drive` : `File "${deleteTarget.name}" deleted from Google Drive`,
      });
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Failed to delete file from Drive:', err);
      setStatusMessage({
        type: 'error',
        text: isUk ? `Помилка видалення: ${err.message}` : `Delete failed: ${err.message}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const patternFiles = driveFiles.filter((f) => f.isPattern);
  const audioFiles = driveFiles.filter((f) => f.isAudio);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border flex flex-col overflow-hidden shadow-2xl transition-all"
        style={{
          backgroundColor: '#0D0E12',
          borderColor: themeConfig.borderSubtle,
          boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 30px ${themeConfig.accent}20`,
        }}
      >
        {/* Modal Header */}
        <div
          className="p-4 sm:p-5 border-b flex items-center justify-between"
          style={{ borderColor: themeConfig.borderSubtle, backgroundColor: '#13151B' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner"
              style={{
                backgroundColor: `${themeConfig.accent}15`,
                borderColor: `${themeConfig.accent}40`,
                color: themeConfig.accent,
              }}
            >
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-space font-bold text-base sm:text-lg text-white tracking-wide">
                  Google Drive Cloud Studio
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  WORKSPACE v3
                </span>
              </div>
              <p className="text-xs text-white/50 font-inter">
                {isUk
                  ? 'Збереження та синхронізація 16-степ паттернів і студійних записів у Google Drive'
                  : 'Sync & backup 16-step patterns and studio takes directly to Google Drive'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {/* Status Message Banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs font-inter transition-all ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-white/50 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>
          )}

          {/* Auth Gate / User Card */}
          {!user ? (
            <div
              className="p-6 rounded-3xl border text-center flex flex-col items-center justify-center gap-4"
              style={{
                backgroundColor: themeConfig.bgCard,
                borderColor: themeConfig.borderSubtle,
              }}
            >
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400">
                <HardDrive className="w-7 h-7" />
              </div>
              <div className="max-w-md">
                <h4 className="font-space font-bold text-base text-white">
                  {isUk ? 'Підключіть свій Google Drive' : 'Connect your Google Drive'}
                </h4>
                <p className="text-xs text-white/60 font-inter mt-1">
                  {isUk
                    ? 'Авторизуйтесь через Google для збереження аудіозаписів, пресетів драм-машини та безшовного завантаження паттернів на будь-якому пристрої.'
                    : 'Sign in to sync studio recordings, drum machine presets, and seamlessly restore patterns across all your mobile & desktop devices.'}
                </p>
              </div>

              {/* Official GSI Material Button Style */}
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="gsi-material-button inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white text-gray-900 font-medium text-sm shadow-lg hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
              >
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="font-space font-bold tracking-wide">
                  {isSigningIn
                    ? (isUk ? 'Авторизація...' : 'Signing in...')
                    : (isUk ? 'Увійти через Google' : 'Sign in with Google')}
                </span>
              </button>

              {authError && (
                <div className="text-xs text-red-400 font-inter bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl max-w-sm">
                  {authError}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Authenticated User Banner */}
              <div
                className="p-3 sm:p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3"
                style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderSubtle }}
              >
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-white/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-space font-bold text-xs sm:text-sm text-white">
                        {user.displayName || 'DJ Producer'}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {isUk ? 'Підключено' : 'Connected'}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/50 font-mono">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchDriveFiles}
                    disabled={isLoadingFiles}
                    className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white transition-all active:scale-95"
                    title={isUk ? 'Оновити список' : 'Refresh Drive'}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-space font-bold hover:bg-red-500/20 transition-all active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isUk ? 'Вийти' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Patterns vs Audio Takes */}
              <div className="flex rounded-2xl p-1 bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('patterns')}
                  className={`flex-1 py-2 px-3 rounded-xl font-space font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'patterns'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                  style={{
                    backgroundColor: activeTab === 'patterns' ? `${themeConfig.accent}20` : undefined,
                    color: activeTab === 'patterns' ? themeConfig.accent : undefined,
                  }}
                >
                  <FileCode2 className="w-4 h-4" />
                  <span>{isUk ? 'Паттерни та Біти' : 'Patterns & Grooves'}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10">
                    {patternFiles.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('takes')}
                  className={`flex-1 py-2 px-3 rounded-xl font-space font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'takes'
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                  style={{
                    backgroundColor: activeTab === 'takes' ? `${themeConfig.accentSecondary}20` : undefined,
                    color: activeTab === 'takes' ? themeConfig.accentSecondary : undefined,
                  }}
                >
                  <FileMusic className="w-4 h-4" />
                  <span>{isUk ? 'Майстер Записи (WAV)' : 'Studio Takes (WAV)'}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10">
                    {audioFiles.length}
                  </span>
                </button>
              </div>

              {/* TAB 1: PATTERNS */}
              {activeTab === 'patterns' && (
                <div className="flex flex-col gap-4">
                  {/* Upload Current Pattern Box */}
                  <div
                    className="p-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                    style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderSubtle }}
                  >
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[10px] font-space text-white/50 uppercase">
                        {isUk ? 'Зберегти поточний паттерн секвенсора' : 'Save Active Sequencer Pattern'}
                      </span>
                      <input
                        type="text"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        placeholder="My Pioneer Groove"
                        className="bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs font-space font-bold text-white focus:outline-none focus:border-cyan-400"
                      />
                      <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 mt-0.5">
                        <span>{currentBank} Bank</span>
                        <span>•</span>
                        <span>{currentBpm} BPM</span>
                        <span>•</span>
                        <span>16 Steps</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUploadCurrentPattern}
                      disabled={isUploadingPattern}
                      className="px-4 py-3 rounded-xl border flex items-center justify-center gap-2 font-space font-bold text-xs uppercase tracking-wider transition-all active:scale-95 disabled:opacity-60"
                      style={{
                        backgroundColor: themeConfig.accent,
                        borderColor: themeConfig.accent,
                        color: '#000000',
                      }}
                    >
                      {isUploadingPattern ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{isUk ? 'Зберегти на Drive' : 'Save to Drive'}</span>
                    </button>
                  </div>

                  {/* Cloud Patterns List */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-space font-bold text-white/70 uppercase tracking-wider px-1">
                      {isUk ? 'Збережені паттерни в Google Drive' : 'Saved Patterns on Google Drive'}
                    </span>

                    {isLoadingFiles ? (
                      <div className="p-8 text-center text-white/50 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                        <span className="text-xs font-inter">{isUk ? 'Завантаження з Drive...' : 'Loading from Google Drive...'}</span>
                      </div>
                    ) : patternFiles.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-dashed border-white/15 text-center text-white/40 text-xs font-inter">
                        {isUk
                          ? 'У вашому Google Drive ще немає збережених паттернів. Натисніть кнопку вище, щоб зберегти свій перший грув!'
                          : 'No saved patterns found in your Google Drive. Save your current beat using the form above!'}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {patternFiles.map((file) => (
                          <div
                            key={file.id}
                            className="p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all"
                            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderSubtle }}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                                <FileCode2 className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-space font-bold text-xs text-white truncate">
                                  {file.name.replace(/\.json$/, '')}
                                </div>
                                <div className="flex items-center gap-2 text-[9.5px] font-mono text-white/40 mt-0.5">
                                  <span>{file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Cloud'}</span>
                                  {file.size && <span>• {Math.round(Number(file.size) / 1024)} KB</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleLoadDrivePattern(file)}
                                className="px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-space font-bold uppercase transition-all active:scale-95"
                                style={{
                                  backgroundColor: `${themeConfig.accent}20`,
                                  borderColor: themeConfig.accent,
                                  color: themeConfig.accent,
                                }}
                                title={isUk ? 'Завантажити в секвенсор' : 'Load into Sequencer'}
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>{isUk ? 'Завантажити' : 'Load'}</span>
                              </button>

                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white transition-all"
                                  title="Open in Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => setDeleteTarget(file)}
                                className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-red-400 hover:border-red-500/40 transition-all"
                                title={isUk ? 'Видалити' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: STUDIO TAKES */}
              {activeTab === 'takes' && (
                <div className="flex flex-col gap-4">
                  {/* Upload Local Session Takes Section */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-space font-bold text-white/70 uppercase tracking-wider px-1">
                      {isUk ? 'Локальні записи для експорту в Drive' : 'Local Takes Ready for Drive Upload'}
                    </span>

                    {localTakes.length === 0 ? (
                      <div className="p-4 rounded-2xl border border-dashed border-white/15 text-center text-white/40 text-xs font-inter">
                        {isUk
                          ? 'Немає записаних локальних дублів. Запишіть свій виступ у вкладці "Запис"!'
                          : 'No local takes recorded yet. Capture a performance in the "Takes" tab!'}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                        {localTakes.map((take) => (
                          <div
                            key={take.id}
                            className="p-2.5 rounded-2xl border flex items-center justify-between gap-3"
                            style={{ backgroundColor: themeConfig.bgCard, borderColor: themeConfig.borderSubtle }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <FileMusic className="w-4 h-4 text-emerald-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="font-space font-bold text-xs text-white truncate block">
                                  {take.name || take.title || 'Recorded Take'}
                                </span>
                                <span className="text-[9px] font-mono text-white/40">
                                  {take.bpm || 128} BPM • WAV 16-bit
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleUploadLocalTake(take)}
                              disabled={uploadingTakeId === take.id}
                              className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-space font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60"
                            >
                              {uploadingTakeId === take.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>{isUk ? 'В Drive' : 'Sync to Drive'}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cloud Audio Takes List */}
                  <div className="flex flex-col gap-2 pt-2">
                    <span className="text-[11px] font-space font-bold text-white/70 uppercase tracking-wider px-1">
                      {isUk ? 'Аудіозаписи в Google Drive' : 'Cloud Audio Takes on Google Drive'}
                    </span>

                    {isLoadingFiles ? (
                      <div className="p-8 text-center text-white/50 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                        <span className="text-xs font-inter">{isUk ? 'Завантаження з Drive...' : 'Loading from Google Drive...'}</span>
                      </div>
                    ) : audioFiles.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-dashed border-white/15 text-center text-white/40 text-xs font-inter">
                        {isUk
                          ? 'У вашому Google Drive ще немає збережених аудіозаписів.'
                          : 'No audio files found in your Google Drive.'}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {audioFiles.map((file) => {
                          const isPlaying = playingAudioId === file.id;

                          return (
                            <div
                              key={file.id}
                              className="p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all"
                              style={{
                                backgroundColor: isPlaying ? 'rgba(16,185,129,0.15)' : themeConfig.bgCard,
                                borderColor: isPlaying ? '#10B981' : themeConfig.borderSubtle,
                              }}
                            >
                              {/* Play / Pause button */}
                              <button
                                type="button"
                                onClick={() => handleTogglePlayCloudAudio(file)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-all active:scale-95"
                                style={{
                                  backgroundColor: isPlaying ? '#10B981' : 'rgba(255,255,255,0.06)',
                                  borderColor: isPlaying ? '#10B981' : themeConfig.borderSubtle,
                                  color: isPlaying ? '#000000' : '#FFFFFF',
                                }}
                                title={isPlaying ? 'Stop' : 'Play'}
                              >
                                {isPlaying ? <Square className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="font-space font-bold text-xs text-white truncate">
                                  {file.name}
                                </div>
                                <div className="flex items-center gap-2 text-[9.5px] font-mono text-white/40 mt-0.5">
                                  <span>{file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'WAV'}</span>
                                  {file.size && <span>• {Math.round(Number(file.size) / 1024)} KB</span>}
                                  <span className="text-emerald-400 font-bold uppercase">CLOUD WAV</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {file.webViewLink && (
                                  <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white transition-all"
                                    title="Open in Google Drive"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(file)}
                                  className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-red-400 hover:border-red-500/40 transition-all"
                                  title={isUk ? 'Видалити' : 'Delete'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="p-4 border-t flex items-center justify-between text-xs font-space text-white/50"
          style={{ borderColor: themeConfig.borderSubtle, backgroundColor: '#13151B' }}
        >
          <div className="flex items-center gap-2">
            <FolderSync className="w-4 h-4 text-cyan-400" />
            <span>SoundMix Pioneer Cloud Studio</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:text-white transition-all active:scale-95"
          >
            {isUk ? 'Закрити' : 'Close'}
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Destructive Actions */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-3xl border p-6 flex flex-col gap-4 shadow-2xl"
            style={{
              backgroundColor: '#16181F',
              borderColor: '#FF003C50',
              boxShadow: '0 0 30px rgba(255, 0, 60, 0.3)',
            }}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="font-space font-bold text-base text-white">
                {isUk ? 'Видалити файл із Google Drive?' : 'Delete file from Google Drive?'}
              </h4>
            </div>

            <p className="text-xs text-white/70 font-inter leading-relaxed">
              {isUk
                ? `Ви впевнені, що хочете остаточно видалити "${deleteTarget.name}" з вашого облікового запису Google Drive? Цю дію неможливо скасувати.`
                : `Are you sure you want to permanently delete "${deleteTarget.name}" from your Google Drive account? This action cannot be undone.`}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:text-white font-space font-bold text-xs uppercase transition-all"
              >
                {isUk ? 'Скасувати' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-red-500 bg-red-500 text-white font-space font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-60"
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isUk ? 'Підтвердити видалення' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
