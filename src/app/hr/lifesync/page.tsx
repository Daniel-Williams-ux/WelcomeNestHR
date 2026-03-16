'use client';

import { useEffect, useState } from 'react';
import {
  collectionGroup,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAccess } from '@/hooks/useUserAccess';

type MoodEntry = {
  id: string;
  mood: string;
  note?: string;
  userId?: string;
  employeeName?: string;
  createdAt?: any;
};

type WellnessEntry = {
  id: string;
  text: string;
  createdAt?: any;
};

export default function HRLifeSyncPage() {
  const { user } = useUserAccess();

  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [wellness, setWellness] = useState<WellnessEntry[]>([]);

  useEffect(() => {
    if (!user) return;

    // Query ALL entries across users
    const entriesQuery = query(
      collectionGroup(db, 'entries'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );

      const userCache: Record<string, string> = {};

    const unsubscribe = onSnapshot(entriesQuery, (snap) => {
      const moodData: MoodEntry[] = [];
      const wellnessData: WellnessEntry[] = [];

      snap.docs.forEach((entryDoc) => {
        const data = entryDoc.data() as any;
        const path = entryDoc.ref.path;

        if (data.mood) {
          let employeeName = 'Employee';

          if (data.userId && userCache[data.userId]) {
            employeeName = userCache[data.userId];
          }

          const entry: MoodEntry = {
            id: entryDoc.id,
            mood: data.mood,
            note: data.note,
            userId: data.userId,
            employeeName,
            createdAt: data.createdAt,
          };

          moodData.push(entry);

          if (data.userId && !userCache[data.userId]) {
            const userRef = doc(db, 'users', data.userId);

            getDoc(userRef).then((userSnap) => {
              if (!userSnap.exists()) return;

              const name =
                userSnap.data().fullName ||
                userSnap.data().displayName ||
                userSnap.data().name ||
                'Employee';

              userCache[data.userId] = name;

              setMoods((prev) =>
                prev.map((m) =>
                  m.userId === data.userId ? { ...m, employeeName: name } : m,
                ),
              );
            });
          }
        }

        if (path.includes('wellnessLog')) {
          wellnessData.push({
            id: entryDoc.id,
            text: data.text,
            createdAt: data.createdAt,
          });
        }
      });
      setMoods(moodData.slice(0, 5));
      setWellness(wellnessData.slice(0, 5));
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          LifeSync Insights
        </h1>
        <p className="text-gray-600 mt-1">
          HR wellness overview and recent employee activity.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Recent Mood Check-ins</p>
          <p className="text-2xl font-semibold">{moods.length}</p>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Recent Wellness Logs</p>
          <p className="text-2xl font-semibold">{wellness.length}</p>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">LifeSync Activity</p>
          <p className="text-2xl font-semibold">
            {moods.length + wellness.length}
          </p>
        </div>
      </div>

      {/* Recent mood entries */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">
          Recent Mood Check-ins
        </h2>

        {moods.length === 0 && (
          <p className="text-gray-500 text-sm">No mood activity yet.</p>
        )}

        <div className="space-y-2">
          {moods.map((m) => (
            <div
              key={m.id}
              className="border rounded-md p-3 text-sm bg-gray-50"
            >
              <p className="font-medium capitalize">
                {m.employeeName || 'Employee'} — {m.mood}
              </p>
              {m.note && <p className="text-gray-600 mt-1">{m.note}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Recent wellness logs */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">
          Recent Wellness Logs
        </h2>

        {wellness.length === 0 && (
          <p className="text-gray-500 text-sm">No wellness logs yet.</p>
        )}

        <div className="space-y-2">
          {wellness.map((w) => (
            <div
              key={w.id}
              className="border rounded-md p-3 text-sm bg-gray-50"
            >
              {w.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
