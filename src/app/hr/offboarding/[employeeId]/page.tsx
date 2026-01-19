'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOffboarding } from '@/hooks/useOffboarding';

export default function HROffboardingManagementPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.employeeId as string;

  const { user } = useAuth();
  const { offboarding, tasks, loading, completeTask, completeOffboarding } =
    useOffboarding(employeeId);

  // Guard: only HR / superadmin
  useEffect(() => {
    if (!user) return;
    if (user.role !== 'hr' && user.role !== 'superadmin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (loading) {
    return <div className="p-6">Loading offboarding…</div>;
  }

  if (!offboarding) {
    return (
      <div className="p-6 text-sm text-gray-600">
        No offboarding record found.
      </div>
    );
  }

  const allTasksCompleted = tasks.every((t) => t.completed);
  const isCompleted = offboarding.status === 'completed';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Offboarding Management</h1>
        <p className="text-gray-500 mt-1">
          Manage exit tasks and finalize offboarding.
        </p>
      </div>

      {/* Status */}
      <div
        className="inline-flex items-center px-3 py-1 rounded-full text-sm
        bg-yellow-100 text-yellow-800"
      >
        {isCompleted ? 'Completed' : 'In Progress'}
      </div>

      {/* Tasks */}
      <div className="bg-white border rounded-lg divide-y">
        {tasks.map((task) => {
          const isHrTask = task.assignedTo === 'hr';

          return (
            <div
              key={task.id}
              className="flex items-center justify-between p-4"
            >
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-gray-500">
                  Assigned to {task.assignedTo.toUpperCase()}
                </p>
              </div>

              {task.completed ? (
                <span className="text-green-600 text-sm">Completed</span>
              ) : isHrTask ? (
                <button
                  onClick={() => completeTask(task.id)}
                  className="px-3 py-1 text-sm rounded bg-teal-600 text-white hover:bg-teal-700"
                >
                  Mark Complete
                </button>
              ) : (
                <span className="text-gray-400 text-sm">
                  Waiting on employee
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion */}
      {!isCompleted && (
        <div className="pt-4 border-t">
          <button
            disabled={!allTasksCompleted}
            onClick={completeOffboarding}
            className={`px-4 py-2 rounded text-white ${
              allTasksCompleted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Complete Offboarding
          </button>

          {!allTasksCompleted && (
            <p className="text-xs text-gray-500 mt-2">
              All tasks must be completed before finalizing.
            </p>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="text-sm text-green-700">
          Offboarding has been completed. The employee is now inactive.
        </div>
      )}
    </div>
  );
}