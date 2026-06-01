import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { LifeSyncVisibility, MoodLevel, WorkloadLevel } from '@/types/lifesync';

type MoodCheckinInput = {
  mood: MoodLevel;
  note?: string;
  companyId?: string | null;
  employeeName?: string;
  employeeId?: string | null;
  confidence?: number;
  supported?: number;
  connection?: number;
  workload?: WorkloadLevel;
  visibility?: LifeSyncVisibility;
  followUpRequested?: boolean;
  urgentSupport?: boolean;
};

type WellnessEntryInput = {
  text: string;
  companyId?: string | null;
  employeeName?: string;
  employeeId?: string | null;
  category?: 'reflection' | 'gratitude' | 'blocker' | 'support';
  visibility?: LifeSyncVisibility;
  followUpRequested?: boolean;
};

function shouldMirrorToCompanyFeed(visibility?: LifeSyncVisibility) {
  return visibility === 'hr_visible' || visibility === 'anonymous_hr';
}

async function mirrorMoodToCompanyFeed(
  companyId: string | null | undefined,
  entryId: string,
  userId: string,
  payload: MoodCheckinInput,
) {
  if (!companyId) return;

  const feedRef = doc(db, 'companies', companyId, 'lifesyncEntries', `mood_${entryId}`);
  if (!shouldMirrorToCompanyFeed(payload.visibility)) {
    await deleteDoc(feedRef).catch(() => undefined);
    return;
  }

  const isAnonymous = payload.visibility === 'anonymous_hr';

  await setDoc(
    feedRef,
    {
      id: feedRef.id,
      sourceEntryId: entryId,
      entryType: 'mood',
      userId,
      employeeId: payload.employeeId ?? null,
      employeeName: isAnonymous ? null : payload.employeeName ?? 'Employee',
      mood: payload.mood,
      note: isAnonymous ? '' : payload.note || '',
      confidence: payload.confidence ?? null,
      supported: payload.supported ?? null,
      connection: payload.connection ?? null,
      workload: payload.workload ?? null,
      visibility: payload.visibility,
      followUpRequested: payload.followUpRequested ?? false,
      urgentSupport: payload.urgentSupport ?? false,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

async function mirrorWellnessToCompanyFeed(
  companyId: string | null | undefined,
  entryId: string,
  userId: string,
  payload: WellnessEntryInput,
) {
  if (!companyId) return;

  const feedRef = doc(db, 'companies', companyId, 'lifesyncEntries', `wellness_${entryId}`);
  if (!shouldMirrorToCompanyFeed(payload.visibility)) {
    await deleteDoc(feedRef).catch(() => undefined);
    return;
  }

  const isAnonymous = payload.visibility === 'anonymous_hr';

  await setDoc(feedRef, {
    id: feedRef.id,
    sourceEntryId: entryId,
    entryType: 'wellness',
    userId,
    employeeId: payload.employeeId ?? null,
    employeeName: isAnonymous ? null : payload.employeeName ?? 'Employee',
    text: isAnonymous ? '' : payload.text,
    category: payload.category ?? 'reflection',
    visibility: payload.visibility,
    followUpRequested: payload.followUpRequested ?? false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/*
--------------------------------
MOOD TRACKER
--------------------------------
*/

export async function addMoodCheckin(
  userId: string,
  input: MoodCheckinInput | string,
  note?: string,
) {
  const payload: MoodCheckinInput =
    typeof input === 'string'
      ? {
          mood: input as MoodLevel,
          note: note || '',
          visibility: 'hr_visible' as const,
          followUpRequested: false,
          urgentSupport: false,
        }
      : {
          ...input,
          note: input.note || '',
          visibility: input.visibility ?? 'hr_visible',
          followUpRequested: input.followUpRequested ?? false,
          urgentSupport: input.urgentSupport ?? false,
        };
  const ref = collection(
    db,
    'users',
    userId,
    'lifesync',
    'moodTracker',
    'entries',
  );

  // Get latest mood entry
  const q = query(ref, orderBy('createdAt', 'desc'), limit(1));
  const snapshot = await getDocs(q);

  const today = new Date().toDateString();

  if (!snapshot.empty) {
    const lastDoc = snapshot.docs[0];
    const data = lastDoc.data();

    if (data.createdAt) {
      const lastDate = data.createdAt.toDate().toDateString();

      // If mood already logged today → update instead of creating new
      if (lastDate === today) {
        await updateDoc(doc(ref, lastDoc.id), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        await mirrorMoodToCompanyFeed(payload.companyId, lastDoc.id, userId, payload).catch(
          (error) => console.warn('LifeSync company feed mirror failed:', error),
        );
        return;
      }
    }
  }

  // Otherwise create a new entry
  const entryRef = await addDoc(ref, {
    ...payload,
    userId,
    createdAt: serverTimestamp(),
  });
  await mirrorMoodToCompanyFeed(payload.companyId, entryRef.id, userId, payload).catch((error) =>
    console.warn('LifeSync company feed mirror failed:', error),
  );
}

/*
--------------------------------
WELLNESS LOG
--------------------------------
*/

export async function addWellnessEntry(
  userId: string,
  input: WellnessEntryInput | string,
) {
  const payload: WellnessEntryInput =
    typeof input === 'string'
      ? {
          text: input,
          category: 'reflection' as const,
          visibility: 'hr_visible' as const,
          followUpRequested: false,
        }
      : {
          ...input,
          category: input.category ?? 'reflection',
          visibility: input.visibility ?? 'hr_visible',
          followUpRequested: input.followUpRequested ?? false,
        };
  const ref = collection(
    db,
    'users',
    userId,
    'lifesync',
    'wellnessLog',
    'entries',
  );

  const entryRef = await addDoc(ref, {
    ...payload,
    userId,
    createdAt: serverTimestamp(),
  });
  await mirrorWellnessToCompanyFeed(payload.companyId, entryRef.id, userId, payload).catch(
    (error) => console.warn('LifeSync company feed mirror failed:', error),
  );
}
