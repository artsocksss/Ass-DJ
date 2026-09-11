import { BankId } from '../types';

export interface DrivePatternData {
  version: string;
  name: string;
  bank: BankId;
  bpm: number;
  pattern: boolean[][];
  updatedAt: number;
  description?: string;
  source: 'SoundMix Pioneer DJ';
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  description?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  isPattern?: boolean;
  isAudio?: boolean;
  parsedPattern?: DrivePatternData;
}

const FOLDER_NAME = 'SoundMix Pioneer DJ Sessions';

/**
 * Find or create dedicated app folder in Google Drive
 */
export async function getOrCreateAppFolder(accessToken: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    )}&fields=files(id,name)&spaces=drive`;

    const res = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.warn('Drive search folder failed, falling back to root', res.status);
      return null;
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }

    // Create folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Audio takes and step sequencer patterns from SoundMix DJ Web App',
      }),
    });

    if (createRes.ok) {
      const folderData = await createRes.json();
      return folderData.id;
    }
  } catch (err) {
    console.warn('Error creating/finding app folder on Drive:', err);
  }
  return null;
}

/**
 * List files saved by SoundMix in Google Drive
 */
export async function listSoundMixDriveFiles(accessToken: string): Promise<DriveFileItem[]> {
  const query = `trashed = false and (mimeType = 'application/json' or mimeType contains 'audio/' or name contains 'SoundMix' or name contains 'soundmix' or name contains '.wav')`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,description,createdTime,modifiedTime,size,webViewLink,webContentLink)&orderBy=modifiedTime desc&pageSize=50`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to list Google Drive files: ${res.status} ${errorBody}`);
  }

  const data = await res.json();
  const rawFiles: DriveFileItem[] = data.files || [];

  return rawFiles.map((f) => ({
    ...f,
    isPattern: f.mimeType === 'application/json' || f.name.endsWith('.json'),
    isAudio: f.mimeType.startsWith('audio/') || f.name.endsWith('.wav') || f.name.endsWith('.webm'),
  }));
}

/**
 * Upload or Save a 16-Step Pattern JSON to Google Drive
 */
export async function uploadPatternToDrive(
  accessToken: string,
  patternData: DrivePatternData,
  customFileName?: string
): Promise<DriveFileItem> {
  const parentFolderId = await getOrCreateAppFolder(accessToken);
  const fileName = customFileName
    ? (customFileName.endsWith('.json') ? customFileName : `${customFileName}.json`)
    : `SoundMix_${patternData.bank}_${patternData.bpm}BPM_${patternData.name.replace(/\s+/g, '_')}.json`;

  const metadata: Record<string, unknown> = {
    name: fileName,
    description: `SoundMix DJ 16-Step Pattern • Bank ${patternData.bank} • ${patternData.bpm} BPM`,
    mimeType: 'application/json',
    properties: {
      app: 'SoundMix Pioneer DJ',
      type: 'pattern',
      bank: patternData.bank,
      bpm: String(patternData.bpm),
    },
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const jsonContent = JSON.stringify(patternData, null, 2);

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    jsonContent +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to upload pattern to Google Drive: ${res.status} ${errText}`);
  }

  const uploadedFile = await res.json();
  return {
    ...uploadedFile,
    isPattern: true,
  };
}

/**
 * Load a pattern JSON from Google Drive
 */
export async function downloadPatternFromDrive(
  accessToken: string,
  fileId: string
): Promise<DrivePatternData> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to download pattern from Google Drive: ${res.status}`);
  }

  const data = await res.json();
  if (!data || !Array.isArray(data.pattern)) {
    throw new Error('Invalid SoundMix pattern format loaded from Drive');
  }

  return data as DrivePatternData;
}

/**
 * Upload Audio Take (WAV/WebM) to Google Drive
 */
export async function uploadAudioTakeToDrive(
  accessToken: string,
  audioBlob: Blob,
  fileName: string,
  metadataInfo: { bpm?: number; bank?: BankId; duration?: number }
): Promise<DriveFileItem> {
  const parentFolderId = await getOrCreateAppFolder(accessToken);
  const cleanName = fileName.endsWith('.wav') || fileName.endsWith('.webm') ? fileName : `${fileName}.wav`;
  const mimeType = audioBlob.type || 'audio/wav';

  const metadata: Record<string, unknown> = {
    name: cleanName,
    description: `SoundMix Master Recording Take • Bank ${metadataInfo.bank || 'A'} • ${metadataInfo.bpm || 128} BPM`,
    mimeType,
    properties: {
      app: 'SoundMix Pioneer DJ',
      type: 'audio_take',
      bank: metadataInfo.bank || 'A',
      bpm: String(metadataInfo.bpm || 128),
    },
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Read blob as ArrayBuffer or Uint8Array
  const arrayBuffer = await audioBlob.arrayBuffer();

  const metaHeader =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n`;

  const metaHeaderBytes = new TextEncoder().encode(metaHeader);
  const closeDelimiterBytes = new TextEncoder().encode(closeDelimiter);

  // Assemble full payload as binary Uint8Array
  const totalLength = metaHeaderBytes.byteLength + arrayBuffer.byteLength + closeDelimiterBytes.byteLength;
  const fullBody = new Uint8Array(totalLength);

  fullBody.set(metaHeaderBytes, 0);
  fullBody.set(new Uint8Array(arrayBuffer), metaHeaderBytes.byteLength);
  fullBody.set(closeDelimiterBytes, metaHeaderBytes.byteLength + arrayBuffer.byteLength);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: fullBody,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to upload audio take to Google Drive: ${res.status} ${errText}`);
  }

  const uploadedFile = await res.json();
  return {
    ...uploadedFile,
    isAudio: true,
  };
}

/**
 * Delete a file from Google Drive (MUST only be called after explicit user confirmation)
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete file from Google Drive: ${res.status}`);
  }
}
