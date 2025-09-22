"use client";

import { useEffect, useState } from "react";
import { Smile, Frown, Meh, Heart } from "lucide-react";
import { db } from "@/lib/firebase";
import { useUserAccess } from "@/hooks/useUserAccess";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

type MoodValue = "happy" | "neutral" | "sad" | "grateful";

const MOODS: { value: MoodValue; label: string; Icon: any }[] = [
  { value: "happy", label: "Happy", Icon: Smile },
  { value: "neutral", label: "Okay", Icon: Meh },
  { value: "sad", label: "Low", Icon: Frown },
  { value: "grateful", label: "Grateful", Icon: Heart },
];

export default function MoodTracker() {
  const { user } = useUserAccess();
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔥 Load last saved mood
  useEffect(() => {
    if (!user) return;

    const moodsRef = collection(
      db,
      "users",
      user.uid,
      "lifesync",
      "moodTracker",
      "entries"
    );
    const q = query(moodsRef, orderBy("createdAt", "desc"), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0].data() as {
          mood: MoodValue;
          note?: string;
        };
        setMood(doc.mood);
        setNote(doc.note || "");
      } else {
        setMood(null);
        setNote("");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Save new mood entry
  async function saveMood() {
    if (!user || !mood) return;

    setSaving(true);
    try {
      await addDoc(
        collection(db, "users", user.uid, "lifesync", "moodTracker", "entries"),
        {
          mood,
          note,
          createdAt: serverTimestamp(), // use Firestore timestamp
        }
      );
      resetForm();
    } catch (error) {
      console.error("🔥 Error saving mood:", error);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setMood(null);
    setNote("");
  }

  return (
    <section
      aria-labelledby="mood-title"
      className="rounded-2xl shadow-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 sm:p-6"
    >
      <h2
        id="mood-title"
        className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100"
      >
        How are you feeling today?
      </h2>

      {/* Mood selector */}
      <div
        role="radiogroup"
        aria-label="Select your mood"
        className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {MOODS.map(({ value, label, Icon }) => {
          const selected = mood === value;
          return (
            <button
              key={value}
              role="radio"
              aria-checked={selected}
              onClick={() => setMood(value)}
              className={[
                "flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3",
                "transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FB8C00]",
                selected
                  ? "bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white border-transparent"
                  : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200",
              ].join(" ")}
            >
              <Icon className={selected ? "w-6 h-6" : "w-6 h-6 opacity-90"} />
              <span className="text-xs sm:text-sm">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Optional note */}
      <label
        htmlFor="mood-note"
        className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Add a note (optional)
      </label>
      <textarea
        id="mood-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FB8C00]"
        placeholder="Eg. Slept well, great coffee ☕"
      />

      {/* Action buttons */}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={!mood || saving}
          onClick={saveMood}
          className={[
            "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold",
            "bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FB8C00]",
          ].join(" ")}
          aria-disabled={!mood || saving}
        >
          {saving ? "Saving..." : loading ? "Loading..." : "Save Mood"}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        >
          Reset
        </button>
      </div>
    </section>
  );
}