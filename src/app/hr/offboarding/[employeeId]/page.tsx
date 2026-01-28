'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOffboarding } from '@/hooks/useOffboarding';

export default function HROffboardingManagementPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.employeeId as string;

  const { user } = useAuth();
  const { offboarding, tasks, loading, completeTask, finalizeOffboarding } =
    useOffboarding(employeeId);

  /**
   * ------------------------------------------------------
   * Derived state
   * ------------------------------------------------------
   */
  const isCompleted = offboarding?.status === 'completed';

  const completedCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );

  const progressPercent = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((completedCount / tasks.length) * 100);
  }, [completedCount, tasks.length]);

  /**
   * ------------------------------------------------------
   * Guards
   * ------------------------------------------------------
   */
  useEffect(() => {
    if (!user) return;
    if (user.role !== 'hr' && user.role !== 'superadmin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  /**
   * ------------------------------------------------------
   * Early returns
   * ------------------------------------------------------
   */
  if (loading) {
    return <div className="p-6 text-sm">Loading offboarding…</div>;
  }

  if (!offboarding) {
    return (
      <div className="p-6 text-sm text-gray-600">
        No offboarding record found.
      </div>
    );
  }

  /**
   * ------------------------------------------------------
   * UI
   * ------------------------------------------------------
   */
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
      {isCompleted && (
        <div
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          role="status"
        >
          This employee has been successfully offboarded. All exit tasks were
          completed and the employee is now marked as exited.
        </div>
      )}

      <header>
        <h1 className="text-xl sm:text-2xl font-semibold">
          Offboarding Management
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Track and complete required exit tasks.
        </p>
      </header>

      <div
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs sm:text-sm ${
          isCompleted
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {isCompleted ? 'Completed' : 'In Progress'}
      </div>

      {/* Progress */}
      <section className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {completedCount} of {tasks.length} tasks completed
          </span>
          <span>{progressPercent}%</span>
        </div>

        <div
          className="h-2 w-full rounded-full bg-gray-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div
            className="h-2 rounded-full bg-teal-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {/* Tasks */}
      <section className="divide-y rounded-lg border bg-white">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <p className="font-medium text-sm">{task.title}</p>
              {task.description && (
                <p className="text-xs text-gray-500">{task.description}</p>
              )}
            </div>

            <div className="shrink-0">
              {task.completed ? (
                <span className="text-sm text-green-600">Completed</span>
              ) : isCompleted ? (
                <span className="text-sm text-gray-400">Locked</span>
              ) : (
                <button
                  onClick={() => completeTask(task.id)}
                  className="rounded bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* FINALIZATION BUTTON */}
      {!isCompleted && tasks.length > 0 && tasks.every((t) => t.completed) && (
        <div className="pt-4">
          <button
            onClick={finalizeOffboarding}
            className="w-full rounded bg-red-600 px-4 py-2 text-white text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Finish Offboarding
          </button>
        </div>
      )}
    </div>
  );
}