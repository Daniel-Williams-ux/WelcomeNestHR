"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { useUserAccess } from "@/hooks/useUserAccess";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

type WellnessEntry = {
  text: string;
  at: string;
};

export default function WellnessLog() {
  const { user } = useUserAccess();
  const [entry, setEntry] = useState("");
  const [logs, setLogs] = useState<WellnessEntry[]>([]);
  const [saving, setSaving] = useState(false);

  // 🔥 Load wellness log entries in real-time
  useEffect(() => {
    if (!user) return;

    const logsRef = collection(
      db,
      "users",
      user.uid,
      "lifesync",
      "wellnessLog", // fixed doc
      "entries" // subcollection
    );

    const q = query(logsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        text: doc.data().text as string,
        at: doc.data().createdAt
          ? new Date(doc.data().createdAt.toDate()).toLocaleString()
          : "Just now",
      }));
      setLogs(data);
    });

    return () => unsubscribe();
  }, [user]);

  // ✅ Save new log entry
  async function save() {
    if (!user || !entry.trim()) return;

    setSaving(true);
    try {
      await addDoc(
        collection(db, "users", user.uid, "lifesync", "wellnessLog", "entries"),
        {
          text: entry.trim(),
          createdAt: serverTimestamp(),
        }
      );
      setEntry("");
    } catch (err) {
      console.error("🔥 Error saving wellness entry:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="wellness-title"
      className="rounded-2xl shadow-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 sm:p-6"
    >
      <h2
        id="wellness-title"
        className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100"
      >
        Quick Wellness Log
      </h2>

      <label
        htmlFor="wellness-entry"
        className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        What’s on your mind?
      </label>
      <textarea
        id="wellness-entry"
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FB8C00]"
        placeholder="Short reflection…"
      />

      <button
        type="button"
        onClick={save}
        disabled={saving || !entry.trim()}
        className="mt-3 w-full inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FB8C00] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save Entry"}
      </button>

      {/* Entries List */}
      <ul className="mt-4 space-y-2" aria-label="Recent wellness entries">
        {logs.map((l, i) => (
          <li
            key={i}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">{l.at}</p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{l.text}</p>
          </li>
        ))}
        {logs.length === 0 && (
          <li className="text-sm text-gray-500 dark:text-gray-400">
            No entries yet.
          </li>
        )}
      </ul>
    </section>
  );
}