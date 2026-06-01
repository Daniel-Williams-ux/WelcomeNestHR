"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { addWellnessEntry } from '@/lib/lifesync';
import { useUserAccess } from "@/hooks/useUserAccess";
import type { LifeSyncVisibility } from '@/types/lifesync';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

type WellnessEntry = {
  text: string;
  category?: string;
  visibility?: LifeSyncVisibility;
  followUpRequested?: boolean;
  at: string;
};

const CATEGORIES = [
  { value: 'reflection', label: 'Reflection' },
  { value: 'gratitude', label: 'Gratitude' },
  { value: 'blocker', label: 'Blocker' },
  { value: 'support', label: 'Support need' },
] as const;

export default function WellnessLog() {
  const { user, companyId } = useUserAccess();
  const [entry, setEntry] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['value']>('reflection');
  const [visibility, setVisibility] = useState<LifeSyncVisibility>('private');
  const [followUpRequested, setFollowUpRequested] = useState(false);
  const [logs, setLogs] = useState<WellnessEntry[]>([]);
  const [saving, setSaving] = useState(false);

  //  Load wellness log entries in real-time
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
        category: doc.data().category as string | undefined,
        visibility: doc.data().visibility as LifeSyncVisibility | undefined,
        followUpRequested: doc.data().followUpRequested as boolean | undefined,
        at: doc.data().createdAt
          ? new Date(doc.data().createdAt.toDate()).toLocaleString()
          : "Just now",
      }));
      setLogs(data);
    });

    return () => unsubscribe();
  }, [user]);

  //  Save new log entry
  async function save() {
    if (!user || !entry.trim()) return;

    setSaving(true);
    try {
      const sharedVisibility = followUpRequested ? 'hr_visible' : visibility;

      await addWellnessEntry(user.uid, {
        text: entry.trim(),
        companyId,
        employeeId: user.employeeId ?? null,
        employeeName:
          user.fullName || user.displayName || user.name || user.email || 'Employee',
        category,
        visibility: sharedVisibility,
        followUpRequested,
      });
      setEntry("");
      setCategory('reflection');
      setVisibility('private');
      setFollowUpRequested(false);
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
        Reflection journal
      </h2>

      <label
        htmlFor="wellness-entry"
        className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Capture a thought, blocker, or support need.
      </label>
      <textarea
        id="wellness-entry"
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FB8C00]"
        placeholder="Example: I handled a tough customer conversation today and need guidance on the follow-up."
      />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Entry type
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as (typeof CATEGORIES)[number]['value'])
            }
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            {CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Sharing
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as LifeSyncVisibility)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="private">Private journal</option>
            <option value="anonymous_hr">Share trend only</option>
            <option value="hr_visible">Share with HR</option>
          </select>
        </label>
      </div>

      <label className="mt-3 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={followUpRequested}
          onChange={(event) => {
            setFollowUpRequested(event.target.checked);
            if (event.target.checked) {
              setVisibility('hr_visible');
            }
          }}
          className="mt-1"
        />
        Request HR follow-up about this entry.
      </label>

      <button
        type="button"
        onClick={save}
        disabled={saving || !entry.trim()}
        className="mt-3 w-full inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FB8C00] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save Reflection"}
      </button>

      {/* Entries List */}
      <ul className="mt-4 space-y-2" aria-label="Recent wellness entries">
        {logs.map((l, i) => (
          <li
            key={i}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">{l.at}</p>
            <p className="text-xs font-medium capitalize text-[#006e7f] dark:text-cyan-300">
              {l.category || 'reflection'} ·{' '}
              {l.visibility === 'private'
                ? 'private'
                : l.visibility === 'anonymous_hr'
                  ? 'trend only'
                  : 'shared with HR'}
              {l.followUpRequested ? ' · follow-up requested' : ''}
            </p>
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