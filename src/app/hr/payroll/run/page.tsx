'use client';

import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { PayrollRun, EmployeePayrollItem } from '@/types/payroll';

export default function HRPayrollRunPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const runId = searchParams.get('runId');
  const companyId = user?.companyId;

  const [run, setRun] = useState<PayrollRun | null>(null);
  const [items, setItems] = useState<EmployeePayrollItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !runId) return;

    async function loadPreview() {
      setLoading(true);

      // Load payroll run
      const runRef = doc(db, 'companies', companyId, 'payrollRuns', runId);
      const runSnap = await getDoc(runRef);

      if (!runSnap.exists()) {
        alert('Payroll run not found');
        router.push('/hr/payroll');
        return;
      }

      setRun(runSnap.data() as PayrollRun);

      // Load payroll items
      const itemsRef = collection(
        db,
        'companies',
        companyId,
        'payrollRuns',
        runId,
        'items'
      );
      const itemsSnap = await getDocs(itemsRef);

      setItems(itemsSnap.docs.map((d) => d.data() as EmployeePayrollItem));
      setLoading(false);
    }

    loadPreview();
  }, [companyId, runId, router]);

  if (authLoading || loading) {
    return (
      <main className="p-4 md:p-6 max-w-6xl mx-auto space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </main>
    );
  }

  if (!run) return null;

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
        <h1 className="text-2xl font-bold">Payroll Run Preview</h1>
      </div>

      {/* SUMMARY */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <p className="text-sm text-gray-600">
            Frequency:{' '}
            <span className="font-semibold capitalize">{run.frequency}</span>
          </p>
          <p className="text-sm text-gray-600">
            Employees: <span className="font-semibold">{items.length}</span>
          </p>
          <p className="text-sm text-gray-600">
            Net total: <span className="font-semibold">{run.netTotal}</span>
          </p>
        </CardContent>
      </Card>

      {/* EMPLOYEES */}
      <section className="space-y-2">
        {items.map((item) => (
          <Card key={item.employeeId}>
            <CardContent className="p-4 flex justify-between">
              <span>{item.employeeName}</span>
              <span className="text-sm text-gray-600">{item.netPay}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ACTION */}
      <div className="flex justify-end pt-4">
        <Button
          className="bg-[#00ACC1] text-white"
          onClick={() => router.push('/hr/payroll')}
        >
          Done
        </Button>
      </div>
    </main>
  );
}