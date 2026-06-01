"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useUserAccess } from "@/hooks/useUserAccess";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

type HistoryEntry = {
  id: string;
  type: 'mood' | 'wellness';
  date: string;
  timestamp: number;
  mood?: number;
  moodLabel?: string;
  note?: string;
  text?: string;
  confidence?: number;
  supported?: number;
  connection?: number;
  workload?: string;
  visibility?: string;
  followUpRequested?: boolean;
  urgentSupport?: boolean;
  category?: string;
};

export default function History() {
  const { user } = useUserAccess();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!user) return;

    // 🔹 Mood entries
    const moodsRef = collection(
      db,
      "users",
      user.uid,
      "lifesync",
      "moodTracker",
      "entries"
    );
    const moodsQuery = query(moodsRef, orderBy("createdAt", "desc"), limit(10));

    // 🔹 Wellness entries
    const wellnessRef = collection(
      db,
      "users",
      user.uid,
      "lifesync",
      "wellnessLog",
      "entries"
    );
    const wellnessQuery = query(
      wellnessRef,
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubMoods = onSnapshot(moodsQuery, (snapshot) => {
      const moodData = snapshot.docs.map((doc) => {
        const d = doc.data();
        const ts = d.createdAt?.toDate();

        return {
          id: doc.id,
          type: 'mood' as const,
          date: ts ? ts.toLocaleString() : 'Today',
          timestamp: ts ? ts.getTime() : Date.now(),
          mood: d.mood ? moodValueToNumber(d.mood) : 3,
          moodLabel: d.mood || 'okay',
          note: d.note || '',
          confidence: d.confidence,
          supported: d.supported,
          connection: d.connection,
          workload: d.workload,
          visibility: d.visibility,
          followUpRequested: d.followUpRequested,
          urgentSupport: d.urgentSupport,
        };
      });
      mergeAndSort(moodData, null);
    });

    const unsubWellness = onSnapshot(wellnessQuery, (snapshot) => {
      const wellnessData = snapshot.docs.map((doc) => {
        const d = doc.data();
        const ts = d.createdAt?.toDate();

        return {
          id: doc.id,
          type: 'wellness' as const,
          date: ts ? ts.toLocaleString() : 'Today',
          timestamp: ts ? ts.getTime() : Date.now(),
          text: d.text || '',
          category: d.category,
          visibility: d.visibility,
          followUpRequested: d.followUpRequested,
        };
      });
      mergeAndSort(null, wellnessData);
    });

    // helper to merge
    function mergeAndSort(
      moods: HistoryEntry[] | null,
      wellness: HistoryEntry[] | null
    ) {
      setHistory((prev) => {
        const updated = [
          ...(moods ? moods : prev.filter((h) => h.type !== "mood")),
          ...(wellness ? wellness : prev.filter((h) => h.type !== "wellness")),
        ];
        // sort all by date desc
        return [...updated].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });
    }

    return () => {
      unsubMoods();
      unsubWellness();
    };
  }, [user]);

  function moodValueToNumber(mood: string): number {
    switch (mood) {
      case "energized":
      case "happy":
      case "very_happy":
        return 5;
      case "calm":
      case "grateful":
        return 4;
      case "okay":
      case "neutral":
        return 3;
      case "stressed":
      case "sad":
        return 2;
      case "burned_out":
        return 1;
      default:
        return 3;
    }
  }

  return (
    <section
      aria-labelledby="history-title"
      className="rounded-2xl shadow-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 sm:p-6"
    >
      <h2
        id="history-title"
        className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100"
      >
        Emotional Intelligence History
      </h2>

      <div className="mt-4 space-y-3">
        {history.map((item) => {
          if (item.type === "mood") {
            const pct = Math.max(0, Math.min(100, (item.mood! / 5) * 100));
            return (
              <div
                key={`mood-${item.id}`}
                className="grid grid-cols-12 items-center gap-3"
              >
                <span className="col-span-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  {item.date}
                </span>
                <div className="col-span-7 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FFB300] to-[#FB8C00]"
                    style={{ width: `${pct}%` }}
                    role="img"
                    aria-label={`Mood level ${item.mood}/5`}
                  />
                </div>
                <span className="col-span-1 text-xs sm:text-sm text-gray-700 dark:text-gray-200">
                  {item.mood}/5
                </span>
                <div className="col-span-12 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium capitalize text-gray-700 dark:text-gray-200">
                    {item.moodLabel?.replace('_', ' ')}
                  </span>
                  {item.workload ? ` · workload: ${item.workload}` : ''}
                  {typeof item.confidence === 'number'
                    ? ` · confidence ${item.confidence}/5`
                    : ''}
                  {typeof item.supported === 'number'
                    ? ` · support ${item.supported}/5`
                    : ''}
                  {item.followUpRequested ? ' · follow-up requested' : ''}
                  {item.urgentSupport ? ' · urgent support' : ''}
                  {item.note ? ` · ${item.note}` : ''}
                </div>
              </div>
            );
          } else {
            return (
              <div
                key={`wellness-${item.id}`}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.date} — {item.category || 'Wellness Log'}
                </p>
                <p className="text-xs font-medium text-[#006e7f] dark:text-cyan-300">
                  {item.visibility === 'private'
                    ? 'Private'
                    : item.visibility === 'anonymous_hr'
                      ? 'Trend only'
                      : 'Shared with HR'}
                  {item.followUpRequested ? ' · follow-up requested' : ''}
                </p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {item.text}
                </p>
              </div>
            );
          }
        })}

        {history.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No history yet.
          </p>
        )}
      </div>
    </section>
  );
}