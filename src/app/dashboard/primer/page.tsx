'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/components/AuthProvider';
import { createPrimerPlan } from '@/lib/primer';
import { serverTimestamp } from 'firebase/firestore';
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  calculatePrimerGamification,
  getPrimerPhaseCelebrations,
} from '@/lib/primerGamification';

export default function PrimerPage() {
  const { user, companyId, role, loading } = useAuthContext();

  const [planId, setPlanId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);

  const groupedGoals = {
    '30': goals.filter((g) => g.phase === '30'),
    '60': goals.filter((g) => g.phase === '60'),
    '90': goals.filter((g) => g.phase === '90'),
  };

  const allGoals = goals;
  const gamification = calculatePrimerGamification(allGoals);
  const celebrations = getPrimerPhaseCelebrations(gamification.phaseProgress);

  const overallProgress = (() => {
    if (allGoals.length === 0) return 0;

    const completed = allGoals.filter((g) => g.status === 'completed').length;

    return Math.round((completed / allGoals.length) * 100);
  })();

  const getProgress = (goals: any[]) => {
    if (!goals.length) return 0;

    const completed = goals.filter((g) => g.status === 'completed').length;

    return Math.round((completed / goals.length) * 100);
  };

  const isPhaseUnlocked = (phase: '30' | '60' | '90') => {
    if (phase === '30') return true;

    if (phase === '60') {
      return getProgress(groupedGoals['30']) === 100;
    }

    if (phase === '90') {
      return getProgress(groupedGoals['60']) === 100;
    }

    return false;
  };

  useEffect(() => {
    async function initPrimer() {
      if (loading || initialized) return;

      if (!user || !companyId || !role) {
        return;
      }

      try {
        // 🔹 Fetch employee first
        // 🔹 Find employee by UID (correct way)
        const empRef = collection(db, `companies/${companyId}/employees`);

        const empQuery = query(empRef, where('uid', '==', user.uid));

        const empSnap = await getDocs(empQuery);

        if (empSnap.empty) return;

        const employee = empSnap.docs[0].data();
        
        const result = await createPrimerPlan({
          userId: employee.uid,
          companyId: companyId,
          role: role,
        });

        setPlanId(result.planId);

        const goalsRef = collection(db, `companies/${companyId}/primerGoals`);

        const goalsQuery = query(goalsRef, where('userId', '==', employee.uid));

        const goalsSnap = await getDocs(goalsQuery);

        const rawGoals = goalsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const uniqueGoalsMap = new Map();
        rawGoals.forEach((goal) => {
          uniqueGoalsMap.set(goal.id, goal);
        });

        const uniqueGoalsByTemplate = new Map();

        Array.from(uniqueGoalsMap.values()).forEach((goal: any) => {
          const key = `${goal.phase}:${goal.title}`;
          const existing = uniqueGoalsByTemplate.get(key);

          if (!existing || goal.status === 'completed') {
            uniqueGoalsByTemplate.set(key, goal);
          }
        });

        const fetchedGoals = Array.from(uniqueGoalsByTemplate.values());

        setGoals(fetchedGoals);
        setInitialized(true);
      } catch (error) {
        console.error('Primer error:', error);
      } finally {
        setInitializing(false);
      }
    }

    initPrimer();
  }, [user, companyId, role, loading, initialized]);

  const toggleGoalStatus = async (goal: any) => {
    try {
      const goalRef = doc(db, `companies/${companyId}/primerGoals/${goal.id}`);

      const newStatus = goal.status === 'completed' ? 'pending' : 'completed';

      await updateDoc(goalRef, {
        status: newStatus,
        progress: newStatus === 'completed' ? 100 : 0,
        updatedAt: serverTimestamp(),
      });

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goal.id
            ? {
                ...g,
                status: newStatus,
                progress: newStatus === 'completed' ? 100 : 0,
              }
            : g,
        ),
      );
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  if (loading || initializing) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#FB8C00] mb-4">
          Performance Primer
        </h1>
        <p>Loading your 30-60-90 plan...</p>
      </div>
    );
  }

  if (!user) {
    return <p className="p-6">Please sign in to view your Primer.</p>;
  }

  return (
    <div className="p-6">
      <motion.h1
        className="text-2xl font-bold text-[#FB8C00] mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Performance Primer
      </motion.h1>

      {!planId && (
        <p className="text-gray-600">
          No plan found. Initializing your onboarding plan...
        </p>
      )}

      {planId && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-900 rounded-xl shadow">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-medium text-gray-600">
              Overall Progress
            </h2>
            <span className="text-sm text-gray-500">
              {overallProgress}% complete
            </span>
          </div>

          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#FB8C00] h-2 transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {allGoals.filter((g) => g.status === 'completed').length} of{' '}
            {allGoals.length} goals completed
          </p>
        </div>
      )}

      {planId && (
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 shadow dark:border-orange-900 dark:from-orange-950/20 dark:to-gray-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#FB8C00]">
              Primer Level
            </p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-black text-gray-900 dark:text-white">
                  Level {gamification.level}
                </p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {gamification.levelName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#FB8C00]">
                  {gamification.xp} XP
                </p>
                <p className="text-xs text-gray-500">
                  {gamification.nextLevelXp
                    ? `${gamification.nextLevelXp - gamification.xp} XP to next level`
                    : 'Top level reached'}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-[#FB8C00]"
                style={{ width: `${gamification.progressToNextLevel}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Badges earned
            </p>
            {gamification.badges.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">
                Complete your first Primer goal to earn your first badge.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {gamification.badges.map((badge) => (
                  <span
                    key={badge.id}
                    title={badge.description}
                    className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-[#006e7f]"
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {celebrations.length > 0 && (
        <div className="mb-6 space-y-2">
          {celebrations.map((celebration) => (
            <div
              key={celebration.phase}
              className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-900"
            >
              <p className="font-semibold">{celebration.title}</p>
              <p className="mt-1">{celebration.message}</p>
            </div>
          ))}
        </div>
      )}

      {planId && (
        <div className="space-y-6">
          {/* 30 Days */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">First 30 Days</h2>

              <span className="text-sm text-gray-500">
                {getProgress(groupedGoals['30'])}% complete
              </span>
            </div>

            <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
              <div
                className="h-2 bg-[#FB8C00] rounded-full transition-all"
                style={{
                  width: `${getProgress(groupedGoals['30'])}%`,
                }}
              />
            </div>

            {groupedGoals['30'].map((goal) => (
              <div
                key={goal.id}
                className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow mb-2"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={goal.status === 'completed'}
                    onChange={() => toggleGoalStatus(goal)}
                    disabled={!isPhaseUnlocked(goal.phase)}
                    className="mt-1 h-4 w-4 accent-[#FB8C00]"
                  />

                  <div>
                    <p
                      className={`font-medium ${
                        goal.status === 'completed'
                          ? 'line-through text-gray-400'
                          : ''
                      }`}
                    >
                      {goal.title}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {goal.description}
                    </p>

                    <span
                      className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                        goal.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {goal.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                    <span className="ml-2 inline-block rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-[#FB8C00]">
                      +25 XP
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 60 Days */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">30–60 Days</h2>

              <span className="text-sm text-gray-500">
                {getProgress(groupedGoals['60'])}% complete
              </span>
            </div>

            <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
              <div
                className="h-2 bg-[#FB8C00] rounded-full transition-all"
                style={{
                  width: `${getProgress(groupedGoals['60'])}%`,
                }}
              />
            </div>

            {groupedGoals['60'].map((goal) => (
              <div
                key={goal.id}
                className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow mb-2"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={goal.status === 'completed'}
                    onChange={() => toggleGoalStatus(goal)}
                    disabled={!isPhaseUnlocked(goal.phase)}
                    className="mt-1 h-4 w-4 accent-[#FB8C00]"
                  />

                  <div>
                    <p
                      className={`font-medium ${
                        goal.status === 'completed'
                          ? 'line-through text-gray-400'
                          : ''
                      }`}
                    >
                      {goal.title}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {goal.description}
                    </p>

                    <span
                      className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                        goal.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {goal.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                    <span className="ml-2 inline-block rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-[#FB8C00]">
                      +25 XP
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {!isPhaseUnlocked('60') ? (
              <p className="text-sm text-gray-400">
                 Complete First 30 Days to unlock
              </p>
            ) : groupedGoals['60'].length === 0 ? (
              <p className="text-sm text-gray-500">No goals yet</p>
            ) : null}
          </div>

          {/* 90 Days */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">60–90 Days</h2>

              <span className="text-sm text-gray-500">
                {getProgress(groupedGoals['90'])}% complete
              </span>
            </div>

            <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
              <div
                className="h-2 bg-[#FB8C00] rounded-full transition-all"
                style={{
                  width: `${getProgress(groupedGoals['90'])}%`,
                }}
              />
            </div>

            {groupedGoals['90'].map((goal) => (
              <div
                key={goal.id}
                className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow mb-2"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={goal.status === 'completed'}
                    onChange={() => toggleGoalStatus(goal)}
                    disabled={!isPhaseUnlocked(goal.phase)}
                    className="mt-1 h-4 w-4 accent-[#FB8C00]"
                  />

                  <div>
                    <p
                      className={`font-medium ${
                        goal.status === 'completed'
                          ? 'line-through text-gray-400'
                          : ''
                      }`}
                    >
                      {goal.title}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {goal.description}
                    </p>

                    <span
                      className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                        goal.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {goal.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                    <span className="ml-2 inline-block rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-[#FB8C00]">
                      +25 XP
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {groupedGoals['90'].length === 0 && (
              <p className="text-sm text-gray-500">No goals yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}