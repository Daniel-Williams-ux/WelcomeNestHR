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
  const [creating, setCreating] = useState(false);

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
          type="button"
          disabled={!companyId || creating}
          className="bg-[#00ACC1] text-white flex items-center gap-2"
          onClick={async () => {
            if (!companyId || !user?.uid) {
              alert('Payroll unavailable: company context missing.');
              return;
            }

            try {
              setCreating(true);

              const runId = crypto.randomUUID();

              await createPayrollRun(companyId, runId, {
                frequency: 'monthly',
                periodStart: new Date() as any,
                periodEnd: new Date() as any,
                totalEmployees: 0,
                grossTotal: 0,
                deductionsTotal: 0,
                netTotal: 0,
                createdBy: user.uid,
              });

              router.push(`/hr/payroll/run?runId=${runId}`);
            } finally {
              setCreating(false);
            }
          }}
        >
          <Plus size={18} />
          {creating ? 'Creating…' : 'Create Payroll'}
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
        <div className="space-y-4">
          {runs.map((run) => (
            <Card key={run.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold capitalize">
                    {run.frequency} payroll
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: <span className="font-medium">{run.status}</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  {run.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() =>
                        approvePayrollRun(companyId!, run.id, user!.uid)
                      }
                    >
                      Approve
                    </Button>
                  )}

                  {run.status === 'approved' && (
                    <Button
                      size="sm"
                      className="bg-green-600 text-white"
                      onClick={() =>
                        markPayrollPaid(companyId!, run.id, user!.uid)
                      }
                    >
                      Mark Paid
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
