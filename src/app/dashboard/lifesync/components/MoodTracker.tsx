"use client";

import { useEffect, useState } from "react";
import {
  BatteryMedium,
  Flame,
  Frown,
  HandHeart,
  Heart,
  LucideIcon,
  Meh,
  Smile,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { addMoodCheckin } from '@/lib/lifesync';
import { useUserAccess } from "@/hooks/useUserAccess";
import type { LifeSyncVisibility, MoodLevel, WorkloadLevel } from '@/types/lifesync';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

type MoodValue = Extract<
  MoodLevel,
  'energized' | 'happy' | 'okay' | 'stressed' | 'burned_out' | 'grateful'
>;

const MOODS: { value: MoodValue; label: string; Icon: LucideIcon }[] = [
  { value: "energized", label: "Energized", Icon: Flame },
  { value: "happy", label: "Positive", Icon: Smile },
  { value: "okay", label: "Okay", Icon: Meh },
  { value: "grateful", label: "Grateful", Icon: Heart },
  { value: "stressed", label: "Stressed", Icon: BatteryMedium },
  { value: "burned_out", label: "Burned out", Icon: Frown },
];

const SCALE_OPTIONS = [1, 2, 3, 4, 5];
const WORKLOAD_OPTIONS: { value: WorkloadLevel; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'manageable', label: 'Manageable' },
  { value: 'heavy', label: 'Heavy' },
  { value: 'overloaded', label: 'Overloaded' },
];
const VISIBILITY_OPTIONS: { value: LifeSyncVisibility; label: string; description: string }[] = [
  {
    value: 'private',
    label: 'Private journal',
    description: 'Only you can read this entry.',
  },
  {
    value: 'anonymous_hr',
    label: 'Share trend only',
    description: 'HR can use it for team insight without showing your note.',
  },
  {
    value: 'hr_visible',
    label: 'Share with HR',
    description: 'HR can see this check-in and follow up if needed.',
  },
];

export default function MoodTracker() {
  const { user, companyId } = useUserAccess();
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [note, setNote] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [supported, setSupported] = useState(3);
  const [connection, setConnection] = useState(3);
  const [workload, setWorkload] = useState<WorkloadLevel>('manageable');
  const [visibility, setVisibility] = useState<LifeSyncVisibility>('hr_visible');
  const [followUpRequested, setFollowUpRequested] = useState(false);
  const [urgentSupport, setUrgentSupport] = useState(false);
  const [saving, setSaving] = useState(false);

  //  Load last saved mood
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
          confidence?: number;
          supported?: number;
          connection?: number;
          workload?: WorkloadLevel;
          visibility?: LifeSyncVisibility;
          followUpRequested?: boolean;
          urgentSupport?: boolean;
        };
        setMood(doc.mood);
        setNote(doc.note || "");
        setConfidence(doc.confidence ?? 3);
        setSupported(doc.supported ?? 3);
        setConnection(doc.connection ?? 3);
        setWorkload(doc.workload ?? 'manageable');
        setVisibility(doc.visibility ?? 'hr_visible');
        setFollowUpRequested(doc.followUpRequested ?? false);
        setUrgentSupport(doc.urgentSupport ?? false);
      } else {
        setMood(null);
        setNote("");
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Save new mood entry
  async function saveMood() {
    if (!user || !mood) return;

    setSaving(true);
    try {
      const sharedVisibility =
        followUpRequested || urgentSupport ? 'hr_visible' : visibility;

      await addMoodCheckin(user.uid, {
        mood,
        note,
        companyId,
        employeeId: user.employeeId ?? null,
        employeeName:
          user.fullName || user.displayName || user.name || user.email || 'Employee',
        confidence,
        supported,
        connection,
        workload,
        visibility: sharedVisibility,
        followUpRequested,
        urgentSupport,
      });
      resetForm();
    } catch (error) {
      console.error(' Error saving mood:', error);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setNote("");
    setFollowUpRequested(false);
    setUrgentSupport(false);
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
        Emotional check-in
      </h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Capture how work feels today, not just your mood. You control what HR can see.
      </p>

      {/* Mood selector */}
      <div
        role="radiogroup"
        aria-label="Select your mood"
        className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3"
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
                'flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FB8C00]',
                selected
                  ? 'bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white border-transparent'
                  : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200',
              ].join(' ')}
            >
              <Icon className={selected ? 'w-6 h-6' : 'w-6 h-6 opacity-90'} />
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
        What is shaping that feeling?
      </label>
      <textarea
        id="mood-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FB8C00]"
        placeholder="Example: I feel supported, but I am unclear about one task."
      />

      <div className="mt-4 grid gap-4">
        {[
          {
            label: 'Confidence in your work',
            value: confidence,
            onChange: setConfidence,
          },
          {
            label: 'How supported you feel',
            value: supported,
            onChange: setSupported,
          },
          {
            label: 'Connection to your team',
            value: connection,
            onChange: setConnection,
          },
        ].map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>{item.label}</span>
              <span>{item.value}/5</span>
            </div>
            <div className="mt-2 flex gap-2" aria-label={item.label}>
              {SCALE_OPTIONS.map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => item.onChange(score)}
                  className={[
                    'h-9 flex-1 rounded-lg border text-sm font-semibold transition',
                    item.value === score
                      ? 'border-[#00ACC1] bg-[#E7FAFC] text-[#006e7f]'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
                  ].join(' ')}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <label
            htmlFor="workload"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Workload today
          </label>
          <select
            id="workload"
            value={workload}
            onChange={(event) => setWorkload(event.target.value as WorkloadLevel)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FB8C00] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {WORKLOAD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 dark:border-cyan-900 dark:bg-cyan-950/20">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#006e7f] dark:text-cyan-200">
          <HandHeart className="h-4 w-4" aria-hidden="true" />
          Privacy and support
        </div>
        <div className="mt-3 space-y-2">
          {VISIBILITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer gap-3 rounded-lg bg-white p-3 text-sm shadow-sm dark:bg-gray-900"
            >
              <input
                type="radio"
                name="visibility"
                value={option.value}
                checked={visibility === option.value}
                onChange={() => setVisibility(option.value)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-gray-900 dark:text-gray-100">
                  {option.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>

        <label className="mt-3 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={followUpRequested}
            onChange={(event) => setFollowUpRequested(event.target.checked)}
            className="mt-1"
          />
          I would like HR to follow up with me.
        </label>
        <label className="mt-2 flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={urgentSupport}
            onChange={(event) => {
              setUrgentSupport(event.target.checked);
              if (event.target.checked) {
                setFollowUpRequested(true);
                setVisibility('hr_visible');
              }
            }}
            className="mt-1"
          />
          This feels urgent and I need support soon.
        </label>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={!mood || saving}
          onClick={saveMood}
          className={[
            'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold',
            'bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FB8C00]',
          ].join(' ')}
          aria-disabled={!mood || saving}
        >
          {saving ? 'Saving...' : 'Save Check-in'}
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