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
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

/*
--------------------------------
MOOD TRACKER
--------------------------------
*/

export async function addMoodCheckin(
  userId: string,
  mood: string,
  note?: string,
) {
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
          mood,
          note: note || '',
        });
        return;
      }
    }
  }

  // Otherwise create a new entry
  await addDoc(ref, {
    mood,
    note: note || '',
    userId,
    createdAt: serverTimestamp(),
  });
}

/*
--------------------------------
WELLNESS LOG
--------------------------------
*/

export async function addWellnessEntry(userId: string, text: string) {
  const ref = collection(
    db,
    'users',
    userId,
    'lifesync',
    'wellnessLog',
    'entries',
  );

  await addDoc(ref, {
    text,
    userId,
    createdAt: serverTimestamp(),
  });
}
