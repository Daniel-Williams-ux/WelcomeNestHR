"use client";

import MoodTracker from "./components/MoodTracker";
import WellnessLog from "./components/WellnessLog";
import History from "./components/History";

export default function LifeSyncPage() {
  return (
    <main className="min-h-screen p-6 bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            LifeSync — Wellness & Mood
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track your daily mood and jot quick reflections. (UI-only; we’ll
            hook this to Firestore next.)
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <MoodTracker />
            <WellnessLog />
          </div>
          <div className="lg:col-span-2">
            <History />
          </div>
        </section>
      </div>
    </main>
  );
}