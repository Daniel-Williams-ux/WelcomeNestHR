'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  limit,
  onSnapshot,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAccess } from '@/hooks/useUserAccess';

type TimestampLike = {
  toDate?: () => Date;
};

type MoodEntry = {
  id: string;
  mood: string;
  note?: string;
  userId?: string;
  employeeName?: string;
  confidence?: number;
  supported?: number;
  connection?: number;
  workload?: string;
  visibility?: string;
  followUpRequested?: boolean;
  urgentSupport?: boolean;
  createdAt?: TimestampLike;
};

type WellnessEntry = {
  id: string;
  text: string;
  category?: string;
  visibility?: string;
  followUpRequested?: boolean;
  userId?: string;
  employeeName?: string;
  createdAt?: TimestampLike;
};

type CompanyLifeSyncEntry = {
  id: string;
  entryType?: 'mood' | 'wellness';
  mood?: string;
  note?: string;
  text?: string;
  category?: string;
  userId?: string;
  employeeName?: string | null;
  confidence?: number;
  supported?: number;
  connection?: number;
  workload?: string;
  visibility?: string;
  followUpRequested?: boolean;
  urgentSupport?: boolean;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
};

function moodScore(mood: string) {
  switch (mood) {
    case 'energized':
    case 'very_happy':
    case 'happy':
      return 5;
    case 'calm':
    case 'grateful':
      return 4;
    case 'okay':
    case 'neutral':
      return 3;
    case 'sad':
    case 'stressed':
      return 2;
    case 'burned_out':
      return 1;
    default:
      return 3;
  }
}

function formatDate(value?: TimestampLike) {
  const date = value?.toDate?.();
  return date ? date.toLocaleString() : 'Recently';
}

function displayName(entry: { visibility?: string; employeeName?: string }) {
  return entry.visibility === 'anonymous_hr'
    ? 'Anonymous employee'
    : entry.employeeName || 'Employee';
}

async function loadLegacyLifeSyncEntries(companyId: string) {
  const employeesSnap = await getDocs(collection(db, 'companies', companyId, 'employees'));
  const employees = employeesSnap.docs
    .map((employeeDoc) => {
      const data = employeeDoc.data();
      return {
        id: employeeDoc.id,
        uid: data.uid as string | undefined,
        name: (data.name || data.fullName || data.email || 'Employee') as string,
      };
    })
    .filter((employee) => employee.uid)
    .slice(0, 50);

  const moodResults = await Promise.all(
    employees.map(async (employee) => {
      const snap = await getDocs(
        query(
          collection(db, 'users', employee.uid!, 'lifesync', 'moodTracker', 'entries'),
          orderBy('createdAt', 'desc'),
          limit(3),
        ),
      );

      return snap.docs
        .map((entryDoc) => {
          const data = entryDoc.data();
          return {
            id: `legacy-mood-${entryDoc.id}`,
            mood: String(data.mood ?? ''),
            note: data.visibility === 'anonymous_hr' ? '' : data.note,
            userId: employee.uid,
            employeeName:
              data.visibility === 'anonymous_hr' ? undefined : employee.name,
            confidence: data.confidence,
            supported: data.supported,
            connection: data.connection,
            workload: data.workload,
            visibility: data.visibility ?? 'hr_visible',
            followUpRequested: data.followUpRequested,
            urgentSupport: data.urgentSupport,
            createdAt: data.updatedAt ?? data.createdAt,
          } as MoodEntry;
        })
        .filter((entry) =>
          ['hr_visible', 'anonymous_hr'].includes(String(entry.visibility)),
        );
    }),
  );

  const wellnessResults = await Promise.all(
    employees.map(async (employee) => {
      const snap = await getDocs(
        query(
          collection(db, 'users', employee.uid!, 'lifesync', 'wellnessLog', 'entries'),
          orderBy('createdAt', 'desc'),
          limit(3),
        ),
      );

      return snap.docs
        .map((entryDoc) => {
          const data = entryDoc.data();
          return {
            id: `legacy-wellness-${entryDoc.id}`,
            text: data.visibility === 'anonymous_hr' ? '' : String(data.text ?? ''),
            category: data.category,
            visibility: data.visibility ?? 'hr_visible',
            followUpRequested: data.followUpRequested,
            userId: employee.uid,
            employeeName:
              data.visibility === 'anonymous_hr' ? undefined : employee.name,
            createdAt: data.updatedAt ?? data.createdAt,
          } as WellnessEntry;
        })
        .filter((entry) =>
          ['hr_visible', 'anonymous_hr'].includes(String(entry.visibility)),
        );
    }),
  );

  return {
    moods: moodResults.flat().filter((entry) => entry.mood),
    wellness: wellnessResults.flat(),
  };
}

export default function HRLifeSyncPage() {
  const { user, companyId } = useUserAccess();

  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [wellness, setWellness] = useState<WellnessEntry[]>([]);

  useEffect(() => {
    if (!user || !companyId) return;
    let cancelled = false;

    const feedQuery = query(
      collection(db, 'companies', companyId, 'lifesyncEntries'),
      orderBy('updatedAt', 'desc'),
      limit(100),
    );

    const unsubscribe = onSnapshot(feedQuery, async (snap) => {
      const entries = snap.docs.map(
        (entryDoc) =>
          ({
            id: entryDoc.id,
            ...entryDoc.data(),
          }) as CompanyLifeSyncEntry,
      );

      if (entries.length === 0) {
        try {
          const legacy = await loadLegacyLifeSyncEntries(companyId);
          if (!cancelled) {
            setMoods(legacy.moods);
            setWellness(legacy.wellness);
          }
        } catch (error) {
          console.error('Failed to load legacy LifeSync entries:', error);
        }
        return;
      }

      setMoods(
        entries
          .filter((entry) => entry.entryType === 'mood' && entry.mood)
          .map((entry) => ({
            id: entry.id,
            mood: String(entry.mood),
            note: entry.note,
            userId: entry.userId,
            employeeName: entry.employeeName ?? undefined,
            confidence: entry.confidence,
            supported: entry.supported,
            connection: entry.connection,
            workload: entry.workload,
            visibility: entry.visibility,
            followUpRequested: entry.followUpRequested,
            urgentSupport: entry.urgentSupport,
            createdAt: entry.updatedAt ?? entry.createdAt,
          })),
      );

      setWellness(
        entries
          .filter((entry) => entry.entryType === 'wellness')
          .map((entry) => ({
            id: entry.id,
            text: String(entry.text ?? ''),
            category: entry.category,
            visibility: entry.visibility,
            followUpRequested: entry.followUpRequested,
            userId: entry.userId,
            employeeName: entry.employeeName ?? undefined,
            createdAt: entry.updatedAt ?? entry.createdAt,
          })),
      );
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [companyId, user]);

  const averageMood =
    moods.length === 0
      ? 0
      : moods.reduce((sum, entry) => sum + moodScore(entry.mood), 0) / moods.length;
  const lowMoodEntries = moods.filter(
    (entry) =>
      moodScore(entry.mood) <= 2 ||
      entry.workload === 'overloaded' ||
      entry.urgentSupport,
  );
  const supportRequests = [
    ...moods
      .filter((entry) => entry.followUpRequested || entry.urgentSupport)
      .map((entry) => ({ type: 'mood' as const, ...entry })),
    ...wellness
      .filter((entry) => entry.followUpRequested)
      .map((entry) => ({ type: 'reflection' as const, ...entry })),
  ].slice(0, 8);
  const trendSummary =
    moods.length === 0
      ? 'No emotional intelligence signals have been submitted yet.'
      : averageMood >= 4
        ? 'Recent sentiment is healthy. Keep reinforcing connection, clarity, and recognition.'
        : averageMood >= 3
          ? 'Sentiment is mixed. Watch workload, confidence, and repeated support requests.'
          : 'Sentiment needs attention. Prioritize follow-up with employees showing stress or burnout signals.';

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Emotional Intelligence Center
        </h1>
        <p className="text-gray-600 mt-1">
          Track wellbeing trends, support requests, and early people-risk signals.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Average Sentiment</p>
          <p className="text-2xl font-semibold">
            {moods.length === 0 ? 'N/A' : `${averageMood.toFixed(1)}/5`}
          </p>
          <p className="mt-1 text-xs text-gray-500">{moods.length} recent check-ins</p>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Support Requests</p>
          <p className="text-2xl font-semibold">{supportRequests.length}</p>
          <p className="mt-1 text-xs text-gray-500">Follow-up or urgent support</p>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">At-Risk Signals</p>
          <p className="text-2xl font-semibold">{lowMoodEntries.length}</p>
          <p className="mt-1 text-xs text-gray-500">Stress, burnout, or overload</p>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 shadow-sm">
        <p className="text-sm font-semibold text-[#006e7f]">People insight summary</p>
        <p className="mt-1 text-sm text-gray-700">{trendSummary}</p>
      </div>

      {supportRequests.length > 0 && (
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">HR Follow-up Queue</h2>
          <div className="space-y-2">
            {supportRequests.map((entry) => (
              <div
                key={`${entry.type}-${entry.id}`}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-amber-950">
                    {displayName(entry)}
                    {'urgentSupport' in entry && entry.urgentSupport ? ' · Urgent' : ''}
                  </p>
                  <span className="text-xs text-amber-800">{formatDate(entry.createdAt)}</span>
                </div>
                <p className="mt-1 text-amber-900">
                  {entry.type === 'mood'
                    ? `${entry.mood.replace('_', ' ')} check-in`
                    : `${entry.category || 'reflection'} entry`}
                </p>
                {entry.visibility !== 'anonymous_hr' && 'note' in entry && entry.note && (
                  <p className="mt-1 text-gray-700">{entry.note}</p>
                )}
                {entry.visibility !== 'anonymous_hr' && 'text' in entry && entry.text && (
                  <p className="mt-1 text-gray-700">{entry.text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent mood entries */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-3">
          Recent Emotional Check-ins
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
                {displayName(m)} — {m.mood.replace('_', ' ')}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Score {moodScore(m.mood)}/5
                {typeof m.confidence === 'number' ? ` · confidence ${m.confidence}/5` : ''}
                {typeof m.supported === 'number' ? ` · support ${m.supported}/5` : ''}
                {typeof m.connection === 'number' ? ` · connection ${m.connection}/5` : ''}
                {m.workload ? ` · workload ${m.workload}` : ''}
                {m.followUpRequested ? ' · follow-up requested' : ''}
              </p>
              {m.visibility !== 'anonymous_hr' && m.note && (
                <p className="text-gray-600 mt-1">{m.note}</p>
              )}
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
              <p className="font-medium">{displayName(w)}</p>
              <p className="text-xs capitalize text-gray-500">
                {w.category || 'reflection'}
                {w.followUpRequested ? ' · follow-up requested' : ''}
              </p>
              {w.visibility === 'anonymous_hr' ? (
                <p className="mt-1 text-gray-600">
                  Shared as a trend-only reflection.
                </p>
              ) : (
                <p className="mt-1 text-gray-700">{w.text}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
