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
  type: "mood" | "wellness";
  date: string;
  mood?: number;
  note?: string;
  text?: string;
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
        return {
          id: doc.id,
          type: "mood" as const,
          date: d.createdAt
            ? new Date(d.createdAt.toDate()).toLocaleString()
            : "Today",
          mood: d.mood ? moodValueToNumber(d.mood) : 3,
          note: d.note || "",
        };
      });
      mergeAndSort(moodData, null);
    });

    const unsubWellness = onSnapshot(wellnessQuery, (snapshot) => {
      const wellnessData = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          type: "wellness" as const,
          date: d.createdAt
            ? new Date(d.createdAt.toDate()).toLocaleString()
            : "Today",
          text: d.text || "",
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
      case "happy":
        return 5;
      case "grateful":
        return 4;
      case "neutral":
        return 3;
      case "sad":
        return 2;
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
        LifeSync History
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
                <span className="col-span-12 sm:col-span-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                  Mood: {item.note}
                </span>
              </div>
            );
          } else {
            return (
              <div
                key={`wellness-${item.id}`}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.date} — Wellness Log
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