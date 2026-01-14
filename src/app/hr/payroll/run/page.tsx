'use client';

import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Printer } from 'lucide-react';
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

      const runRef = doc(db, 'companies', companyId, 'payrollRuns', runId);
      const runSnap = await getDoc(runRef);

      if (!runSnap.exists()) {
        alert('Payroll run not found');
        router.push('/hr/payroll');
        return;
      }

      setRun(runSnap.data() as PayrollRun);

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

  const totalGross = items.reduce((sum, i) => sum + i.grossPay, 0);
  const totalNet = items.reduce((sum, i) => sum + i.netPay, 0);

  return (
    <main className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push('/hr/payroll')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Payroll Preview</h1>
        </div>

        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => window.print()}
        >
          <Printer size={16} />
          Print / Save PDF
        </Button>
      </div>

      {/* SUMMARY */}
      <Card>
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Frequency</p>
            <p className="font-semibold capitalize">{run.frequency}</p>
          </div>
          <div>
            <p className="text-gray-500">Employees</p>
            <p className="font-semibold">{items.length}</p>
          </div>
          <div>
            <p className="text-gray-500">Gross Total</p>
            <p className="font-semibold">{totalGross.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Net Total</p>
            <p className="font-semibold">{totalNet.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* EMPLOYEE TABLE */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-right">Gross</th>
                <th className="p-3 text-right">Net</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.employeeId} className="border-b">
                  <td className="p-3">{item.employeeName}</td>
                  <td className="p-3 text-right">
                    {item.grossPay.toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    {item.netPay.toLocaleString()}
                  </td>
                  <td className="p-3 text-center capitalize">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* FOOTER */}
      <div className="flex justify-end pt-2">
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