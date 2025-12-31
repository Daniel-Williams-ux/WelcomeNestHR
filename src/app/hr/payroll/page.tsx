'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  createPayrollRun,
  approvePayrollRun,
  markPayrollPaid,
} from '@/lib/payroll';
import { PayrollRun } from '@/types/payroll';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HRPayrollPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const companyId = user?.companyId;

  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- LOAD PAYROLL RUNS ---------------- */

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'companies', companyId, 'payrollRuns'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as PayrollRun)
      );
      setRuns(data);
      setLoading(false);
    });

    return () => unsub();
  }, [companyId]);

  if (authLoading) return null;

  /* ---------------- HARD GUARD (PRODUCTION-SAFE) ---------------- */

  if (!companyId) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6 space-y-2">
            <h1 className="text-xl font-semibold text-gray-800">
              Payroll unavailable
            </h1>
            <p className="text-sm text-gray-600">
              Your account is not linked to a company. Payroll requires a
              company context.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <main className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payroll</h1>
          <p className="text-sm text-gray-500">
            Create, approve, and manage payroll runs
          </p>
        </div>

        <Button
          className="bg-[#00ACC1] text-white"
          onClick={async () => {
            if (!user?.uid) {
              alert('Authentication error. Please reload.');
              return;
            }

            const runId = crypto.randomUUID();

            await createPayrollRun(companyId, runId, {
              frequency: 'monthly',
              periodStart: null,
              periodEnd: null,
              totalEmployees: 0,
              grossTotal: 0,
              deductionsTotal: 0,
              netTotal: 0,
              createdBy: user.uid,
            });

            router.push(`/hr/payroll/run?runId=${runId}`);
          }}
        >
          <Plus size={16} />
          Create Payroll
        </Button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            No payroll runs yet. Click <strong>Create Payroll</strong> to begin.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* MOBILE */}
          <div className="md:hidden space-y-4">
            {runs.map((run) => (
              <Card key={run.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="font-semibold text-gray-800 capitalize">
                    {run.frequency} payroll
                  </div>
                  <StatusPill status={run.status} />
                  <div className="text-sm text-gray-600">
                    Net total: {run.netTotal ?? 0}
                  </div>
                  <ActionButtons run={run} companyId={companyId} />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* DESKTOP */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-xl">
              <thead className="bg-gray-100 text-sm text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Frequency</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Net Total</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-t">
                    <td className="px-4 py-3 capitalize">{run.frequency}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={run.status} />
                    </td>
                    <td className="px-4 py-3">{run.netTotal ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <ActionButtons run={run} companyId={companyId} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

/* ---------------- HELPERS ---------------- */

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    approved: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        map[status] ?? 'bg-gray-100'
      }`}
    >
      {status}
    </span>
  );
}

function ActionButtons({
  run,
  companyId,
  compact,
}: {
  run: PayrollRun;
  companyId: string;
  compact?: boolean;
}) {
  const { user } = useAuth();

  return (
    <div className={`flex ${compact ? 'justify-center' : ''} gap-2 mt-2`}>
      {run.status === 'draft' && (
        <Button
          size="sm"
          onClick={() => approvePayrollRun(companyId, run.id, user!.uid)}
        >
          Approve
        </Button>
      )}

      {run.status === 'approved' && (
        <Button
          size="sm"
          className="bg-green-600 text-white"
          onClick={() => markPayrollPaid(companyId, run.id, user!.uid)}
        >
          Mark Paid
        </Button>
      )}
    </div>
  );
}