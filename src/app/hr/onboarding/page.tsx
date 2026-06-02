'use client';

import { useRouter } from 'next/navigation';
import { BookOpenCheck, ChevronLeft, ChevronRight, Plus, Workflow } from 'lucide-react';
import { useHROnboardingState } from '@/hooks/useHROnboardingState';
import { useHROnboardingFlows } from '@/hooks/useHROnboardingFlows';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function HROnboardingPage() {
  const router = useRouter();

  const { state, loading } = useHROnboardingState();
  const { flows, error, page, hasNext, hasPrev, nextPage, prevPage } =
    useHROnboardingFlows({ pageSize: 9 });

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-36 w-full rounded-2xl" />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // NO COMPANY
  // ─────────────────────────────────────────────
  if (state === 'NO_COMPANY') {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h1 className="text-xl font-semibold">Company setup required</h1>

        <p className="mt-2 text-sm leading-6">
          Before creating onboarding flows, this HR account needs to be linked to
          a company workspace.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // NO FLOWS
  // ─────────────────────────────────────────────
  if (state === 'NO_FLOWS') {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader onNew={() => router.push('/hr/onboarding/new')} />

        <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <BookOpenCheck
            className="mx-auto h-10 w-10 text-slate-400"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
            No onboarding flows yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Create a reusable onboarding flow for a role, department, or hiring
            cohort.
          </p>
          <Button
            onClick={() => router.push('/hr/onboarding/new')}
            className="mt-5 bg-[#00ACC1] text-white hover:bg-[#0097A7]"
          >
            Create onboarding flow
          </Button>
        </section>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // HAS FLOWS (REAL DATA)
  // ─────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader onNew={() => router.push('/hr/onboarding/new')} />

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {flows.map((flow) => (
          <button
            type="button"
            key={flow.id}
            onClick={() => router.push(`/hr/onboarding/${flow.id}`)}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#008FA1]">
                <Workflow size={18} aria-hidden="true" />
              </div>

              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  flow.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {flow.isActive ? 'Active' : 'Draft'}
              </span>
            </div>

            <h2 className="mt-4 font-semibold text-slate-950 dark:text-white">
              {flow.name}
            </h2>

            <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {flow.description || 'No description added yet.'}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {page} · showing up to 9 onboarding flows
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={prevPage}
            disabled={!hasPrev}
            aria-label="Previous onboarding flow page"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            Previous
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={nextPage}
            disabled={!hasNext}
            className="bg-[#00ACC1] text-white hover:bg-[#0097A7]"
            aria-label="Next onboarding flow page"
          >
            Next
            <ChevronRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#008FA1]">
          Onboarding
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
          Onboarding flows
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Build reusable journeys that guide new hires from invite to impact.
        </p>
      </div>

      <Button
        onClick={onNew}
        className="inline-flex items-center justify-center gap-2 bg-[#00ACC1] text-white hover:bg-[#0097A7]"
      >
        <Plus size={14} aria-hidden="true" />
        New flow
      </Button>
    </div>
  );
}