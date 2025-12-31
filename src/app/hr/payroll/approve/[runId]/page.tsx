'use client';

import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { approvePayrollRun, markPayrollPaid } from '@/lib/payroll';
import { PayrollRun } from '@/types/payroll';

type PayrollItem = {
  employeeId: string;
  employeeName: string;
  grossPay: number;
  netPay: number;
  status: 'pending' | 'paid';
};

export default function PayrollApprovePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();

  const runId = params.runId as string;
  const companyId = user?.companyId;

  const [run, setRun] = useState<PayrollRun | null>(null);
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!companyId || !runId) return;

    async function load() {
      setLoading(true);

      // Load payroll run
      const runRef = doc(db, 'companies', companyId, 'payrollRuns', runId);
      const runSnap = await getDoc(runRef);
      if (!runSnap.exists()) {
        setLoading(false);
        return;
      }

      setRun(runSnap.data() as PayrollRun);

      // Load payroll items
      const employeesSnap = await getDocs(
        collection(db, 'companies', companyId, 'employees')
      );

      const collected: PayrollItem[] = [];

      for (const emp of employeesSnap.docs) {
        const itemRef = doc(
          db,
          'companies',
          companyId,
          'employees',
          emp.id,
          'payrollItems',
          runId
        );
        const itemSnap = await getDoc(itemRef);
        if (itemSnap.exists()) {
          collected.push(itemSnap.data() as PayrollItem);
        }
      }

      setItems(collected);
      setLoading(false);
    }

    load();
  }, [companyId, runId]);

  if (authLoading) return null;

  return (
    <main className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => router.push('/hr/payroll')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">Approve Payroll</h1>
      </div>

      {loading || !run ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          {/* SUMMARY */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm text-gray-600">
                Frequency:{' '}
                <span className="font-semibold">{run.frequency}</span>
              </p>
              <p className="text-sm text-gray-600">
                Status: <span className="font-semibold">{run.status}</span>
              </p>
              <p className="text-sm text-gray-600">
                Total Net Pay:{' '}
                <span className="font-semibold">{run.netTotal ?? 0}</span>
              </p>
            </CardContent>
          </Card>

          {/* ITEMS */}
          <section className="space-y-2">
            {items.map((item) => (
              <Card key={item.employeeId}>
                <CardContent className="p-4 flex justify-between">
                  <span>{item.employeeName}</span>
                  <span className="text-sm text-gray-600">
                    Net: {item.netPay}
                  </span>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4">
            {run.status === 'draft' && (
              <Button
                className="bg-yellow-500 text-white"
                disabled={actionLoading}
                onClick={async () => {
                  try {
                    setActionLoading(true);
                    await approvePayrollRun(companyId!, runId, user!.uid);
                    router.refresh();
                  } finally {
                    setActionLoading(false);
                  }
                }}
              >
                Approve Payroll
              </Button>
            )}

            {run.status === 'approved' && (
              <Button
                className="bg-green-600 text-white"
                disabled={actionLoading}
                onClick={async () => {
                  try {
                    setActionLoading(true);
                    await markPayrollPaid(companyId!, runId, user!.uid);
                    router.push('/hr/payroll');
                  } finally {
                    setActionLoading(false);
                  }
                }}
              >
                Mark as Paid
              </Button>
            )}
          </div>
        </>
      )}
    </main>
  );
}