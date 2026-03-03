'use client';

import { useRouter } from 'next/navigation';
import { useHROnboardingState } from '@/hooks/useHROnboardingState';
import { useHROnboardingFlows } from '@/hooks/useHROnboardingFlows';

export default function HROnboardingPage() {
  const router = useRouter();

  const { state, loading } = useHROnboardingState();
  const { flows } = useHROnboardingFlows();

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading onboarding…</div>;
  }

  // ─────────────────────────────────────────────
  // NO COMPANY
  // ─────────────────────────────────────────────
  if (state === 'NO_COMPANY') {
    return (
      <div className="p-6 max-w-xl">
        <h1 className="text-xl font-semibold mb-2">Create your company</h1>

        <p className="text-gray-600 mb-4">
          Before creating onboarding flows, you need to set up your company.
        </p>

        <button
          onClick={() => router.push('/hr/onboarding/new')}
          className="px-4 py-2 bg-[#00ACC1] text-white rounded-md"
        >
          Create company
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // NO FLOWS
  // ─────────────────────────────────────────────
  if (state === 'NO_FLOWS') {
    return (
      <div className="p-6 max-w-xl">
        <h1 className="text-xl font-semibold mb-2">Onboarding</h1>

        <p className="text-gray-600 mb-4">No onboarding flows created yet.</p>

        <button
          onClick={() => router.push('/hr/onboarding/new')}
          className="px-4 py-2 bg-black text-white rounded-md"
        >
          Create onboarding flow
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // HAS FLOWS (REAL DATA)
  // ─────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Onboarding flows</h1>

        <button
          onClick={() => router.push('/hr/onboarding/new')}
          className="px-4 py-2 bg-black text-white rounded-md"
        >
          New flow
        </button>
      </div>

      <div className="space-y-3">
        {flows.map((flow) => (
          <div
            key={flow.id}
            onClick={() => router.push(`/hr/onboarding/${flow.id}`)}
            className="border rounded-md p-4 flex justify-between items-start cursor-pointer hover:bg-gray-50"
          >
            <div>
              <h2 className="font-medium">{flow.name}</h2>

              {flow.description && (
                <p className="text-sm text-gray-600">{flow.description}</p>
              )}
            </div>

            <span className="text-xs text-gray-500">
              {flow.isActive ? 'Active' : 'Draft'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}