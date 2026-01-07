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
  snapshotPayrollRunEmployees, // ✅ REQUIRED IMPORT
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
  const [actionRunId, setActionRunId] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'companies', companyId, 'payrollRuns'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snap) => {
      setRuns(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PayrollRun)));
      setLoading(false);
    });
  }, [companyId]);

  if (authLoading) return null;

  if (!companyId) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            Payroll unavailable. No company context.
          </CardContent>
        </Card>
      </main>
    );
  }

  async function handleApprove(runId: string) {
    if (!confirm('Approve this payroll? This cannot be undone.')) return;
    try {
      setActionRunId(runId);
      await approvePayrollRun(companyId, runId, user!.uid);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionRunId(null);
    }
  }

  async function handleMarkPaid(runId: string) {
    if (!confirm('Mark payroll as paid and issue payslips?')) return;
    try {
      setActionRunId(runId);
      await markPayrollPaid(companyId, runId, user!.uid);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionRunId(null);
    }
  }

  return (
    <main className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="text-sm text-gray-500">
            Create, approve, and manage payroll runs
          </p>
        </div>

        <Button
          className="bg-[#00ACC1] text-white"
          onClick={async () => {
            // ✅ SAFETY GUARD (TypeScript + runtime)
            if (!companyId) return;

            const runId = crypto.randomUUID();

            await createPayrollRun(companyId, runId, {
              frequency: 'monthly',
              periodStart: null,
              periodEnd: null,
              totalEmployees: 0,
              grossTotal: 0,
              deductionsTotal: 0,
              netTotal: 0,
              createdBy: user!.uid,
            });

            // ✅ CRITICAL STEP: snapshot employees into payroll items
            await snapshotPayrollRunEmployees(companyId, runId, 'monthly');

            router.push(`/hr/payroll/run?runId=${runId}`);
          }}
        >
          <Plus size={16} />
          Create Payroll
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        runs.map((run) => (
          <Card key={run.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <div className="font-semibold capitalize">
                  {run.frequency} payroll
                </div>
                <div className="text-sm text-gray-600">
                  Status: {run.status}
                </div>
              </div>

              <div className="flex gap-2">
                {run.status === 'draft' && (
                  <Button
                    size="sm"
                    disabled={actionRunId === run.id}
                    onClick={() => handleApprove(run.id)}
                  >
                    Approve
                  </Button>
                )}

                {run.status === 'approved' && (
                  <Button
                    size="sm"
                    className="bg-green-600 text-white"
                    disabled={actionRunId === run.id}
                    onClick={() => handleMarkPaid(run.id)}
                  >
                    Mark Paid
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </main>
  );
}