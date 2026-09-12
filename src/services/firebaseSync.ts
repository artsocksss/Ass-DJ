import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BankId, CustomKitPreset } from '../types';

export interface CloudUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  djName?: string;
  customAccent?: string | null;
  soundProfile?: string;
  updatedAt: string;
}

export interface CloudPattern {
  id: string;
  name: string;
  bank: BankId;
  bpm: number;
  gridData: boolean[][];
  updatedAt: string;
}

export async function saveUserProfileToCloud(profile: CloudUserProfile) {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), {
      ...profile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserProfileFromCloud(uid: string): Promise<CloudUserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as CloudUserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export async function savePatternToCloud(
  uid: string,
  patternId: string,
  name: string,
  bank: BankId,
  bpm: number,
  gridData: boolean[][]
) {
  const path = `users/${uid}/patterns/${patternId}`;
  try {
    await setDoc(doc(db, 'users', uid, 'patterns', patternId), {
      presetId: patternId,
      userId: uid,
      name,
      bank,
      bpm,
      gridJson: JSON.stringify(gridData),
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserPatternsFromCloud(uid: string): Promise<CloudPattern[]> {
  const path = `users/${uid}/patterns`;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'patterns'));
    const results: CloudPattern[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        name: data.name || 'Pattern',
        bank: data.bank || 'A',
        bpm: data.bpm || 128,
        gridData: data.gridJson ? JSON.parse(data.gridJson) : [],
        updatedAt: data.updatedAt || '',
      });
    });
    return results;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function deletePatternFromCloud(uid: string, patternId: string) {
  const path = `users/${uid}/patterns/${patternId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'patterns', patternId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveKitToCloud(
  uid: string,
  kit: CustomKitPreset
) {
  const path = `users/${uid}/kits/${kit.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'kits', kit.id), {
      kitId: kit.id,
      userId: uid,
      name: kit.name,
      description: kit.description || '',
      mappingJson: JSON.stringify(kit.mappings),
      createdAt: kit.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserKitsFromCloud(uid: string): Promise<CustomKitPreset[]> {
  const path = `users/${uid}/kits`;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'kits'));
    const results: CustomKitPreset[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        name: data.name || 'Custom Kit',
        description: data.description || '',
        mappings: data.mappingJson ? JSON.parse(data.mappingJson) : [],
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
      });
    });
    return results;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function deleteKitFromCloud(uid: string, kitId: string) {
  const path = `users/${uid}/kits/${kitId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'kits', kitId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
