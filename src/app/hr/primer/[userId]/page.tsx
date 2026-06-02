'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/components/AuthProvider';
import {
  calculatePrimerGamification,
  getPrimerPhaseCelebrations,
} from '@/lib/primerGamification';

export default function EmployeePrimerDetail() {
  const { companyId } = useAuthContext();
  const params = useParams();
  const userId = params.userId as string;

  const [goals, setGoals] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!companyId || !userId) {
        setLoading(false);
        return;
      }

      try {
        // 🔹 Fetch employee
        // STEP 1: get employee by docId
        const empDocRef = doc(db, `companies/${companyId}/employees/${userId}`);
        const empDocSnap = await getDoc(empDocRef);

        if (!empDocSnap.exists()) {
          console.log('Employee not found');
          setLoading(false);
          return;
        }

        const employeeData = empDocSnap.data();

        // Goals may be keyed by Firebase auth uid in newer records, or by
        // employee document id in older records. Read both to keep legacy data visible.
        const uid = employeeData.uid;

        // STEP 3: set employee + ref
        setEmployee({
          ref: empDocRef,
          ...employeeData,
        });

        
        const goalsRef = collection(db, `companies/${companyId}/primerGoals`);
        const identityKeys = Array.from(
          new Set([uid, userId].filter(Boolean) as string[]),
        );
        const goalSnapshots = await Promise.all(
          identityKeys.map((identity) =>
            getDocs(query(goalsRef, where('userId', '==', identity))),
          ),
        );

        const rawGoals = goalSnapshots.flatMap((goalsSnap) =>
          goalsSnap.docs.map((doc) => ({
            id: doc.id,
            ref: doc.ref,
            ...doc.data(),
          })),
        );
        const data = Array.from(
          new Map(
            rawGoals.map((goal: any) => [
              `${goal.phase}:${goal.title}`,
              goal,
            ]),
          ).values(),
        );

        setGoals(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [companyId, userId]);
    
  useEffect(() => {
    if (employee?.primerNotes !== undefined) {
      setNotes(employee.primerNotes);
    }
  }, [employee]);

  const groupedGoals = {
    '30': goals.filter((g) => g.phase === '30'),
    '60': goals.filter((g) => g.phase === '60'),
    '90': goals.filter((g) => g.phase === '90'),
  };

  const getProgress = (items: any[]) => {
    if (!items.length) return 0;
    const completed = items.filter((g) => g.status === 'completed').length;
    return Math.round((completed / items.length) * 100);
    };

  const isPhaseLocked = (phase: '30' | '60' | '90') => {
    if (phase === '30') return false;

    if (phase === '60') {
      return getProgress(groupedGoals['30']) < 100;
    }

    if (phase === '90') {
      return getProgress(groupedGoals['60']) < 100;
    }

    return false;
  };  

 

  if (loading) {
    return <div className="p-6">Loading employee primer...</div>;
    }
    
    const saveNotes = async () => {
      if (!employee?.ref) return;

      try {
        setSaving(true);
        setSaved(false);

        await updateDoc(employee.ref, {
          primerNotes: notes,
        });

        // keep UI in sync
        setEmployee((prev: any) => ({
          ...prev,
          primerNotes: notes,
        }));

        setSaved(true);

        // optional: hide "Saved" after 2s
        setTimeout(() => setSaved(false), 2000);

        console.log('Notes saved');
      } catch (err) {
        console.error(err);
      } finally {
        setSaving(false);
      }
    };

    const toggleGoal = async (goal: any) => {
      try {
        const newStatus = goal.status === 'completed' ? 'pending' : 'completed';

        await updateDoc(goal.ref, {
          status: newStatus,
          updatedAt: new Date(),
        });

        //  update UI instantly (no refetch)
        setGoals((prev: any[]) =>
          prev.map((g) => (g.id === goal.id ? { ...g, status: newStatus } : g)),
        );
      } catch (err) {
        console.error(err);
      }
    };

    const allGoals = goals;
    const overallProgress = getProgress(allGoals);
    const gamification = calculatePrimerGamification(allGoals);
    const celebrations = getPrimerPhaseCelebrations(gamification.phaseProgress);
    const getRiskLevel = (progress: number) => {
      if (progress >= 70) return 'on-track';
      if (progress >= 40) return 'needs-attention';
      return 'at-risk';
    };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#FB8C00] mb-4">
        Employee Primer
      </h1>

      {employee && (
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold">{employee.name}</p>

            <span
              className={`text-xs px-2 py-1 rounded-full ${
                getRiskLevel(overallProgress) === 'on-track'
                  ? 'bg-green-100 text-green-700'
                  : getRiskLevel(overallProgress) === 'needs-attention'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {getRiskLevel(overallProgress).replace('-', ' ')}
            </span>
          </div>

          <p className="text-sm text-gray-500">{employee.title}</p>
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Primer Level
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            Level {gamification.level}
          </p>
          <p className="text-sm text-gray-500">{gamification.levelName}</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            XP
          </p>
          <p className="mt-2 text-2xl font-bold text-[#FB8C00]">
            {gamification.xp}
          </p>
          <p className="text-sm text-gray-500">
            {gamification.completedGoals} of {gamification.totalGoals} goals complete
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Badges
          </p>
          <p className="mt-2 text-2xl font-bold text-[#006e7f]">
            {gamification.badges.length}
          </p>
          <p className="text-sm text-gray-500">Recognition earned</p>
        </div>
      </div>

      {gamification.badges.length > 0 && (
        <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Badges earned</p>
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

      <div className="mb-6">
        <label className="text-sm text-gray-600">HR Notes</label>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this employee..."
          className="w-full mt-2 p-3 rounded-lg border border-gray-200 bg-white text-sm"
        />

        <button
          onClick={saveNotes}
          disabled={saving}
          className="bg-[#FB8C00] text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Notes'}
        </button>
      </div>

      <div className="space-y-6">
        {(['30', '60', '90'] as const).map((phase) => (
          <div key={phase}>
            <div className="flex justify-between mb-2">
              <h2 className="font-semibold">
                {phase === '30'
                  ? 'First 30 Days'
                  : phase === '60'
                    ? '30–60 Days'
                    : '60–90 Days'}
              </h2>

              <span className="text-sm text-gray-500">
                {getProgress(groupedGoals[phase])}% complete
              </span>
            </div>

            <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
              <div
                className="h-2 bg-[#FB8C00] rounded-full"
                style={{
                  width: `${getProgress(groupedGoals[phase])}%`,
                }}
              />
            </div>

            {groupedGoals[phase].map((goal) => (
              <div
                key={goal.id}
                className={`p-4 rounded-xl shadow mb-2 ${
                  isPhaseLocked(goal.phase)
                    ? 'bg-gray-100 opacity-60 cursor-not-allowed'
                    : 'bg-white'
                }`}
              >
                <p className="font-medium">{goal.title}</p>
                <p className="text-sm text-gray-500">{goal.description}</p>
                {isPhaseLocked(goal.phase) && (
                  <p className="text-xs text-red-500 mt-1">
                    Complete previous phase to unlock
                  </p>
                )}

                <button
                  onClick={() => {
                    if (!isPhaseLocked(goal.phase)) {
                      toggleGoal(goal);
                    }
                  }}
                  className={`text-xs mt-2 px-2 py-1 rounded-full transition ${
                    goal.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {goal.status === 'completed' ? 'Completed ✓' : 'Pending'}
                </button>
              </div>
            ))}

            {groupedGoals[phase].length === 0 && (
              <p className="text-sm text-gray-400">No goals</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}