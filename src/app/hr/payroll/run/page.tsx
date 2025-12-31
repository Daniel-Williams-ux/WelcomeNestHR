'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import { createPayrollRun, snapshotPayrollRunEmployees } from '@/lib/payroll';
import { PayrollFrequency } from '@/types/payroll';

type Employee = {
  id: string;
  name: string;
  status?: string;
  salary?: number;
  payFrequency?: PayrollFrequency;
};

export default function HRPayrollRunPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const companyId = user?.companyId;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    async function loadEmployees() {
      setLoading(true);
      const snap = await getDocs(
        collection(db, 'companies', companyId, 'employees')
      );

      const list = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Employee)
      );

      setEmployees(list);
      setLoading(false);
    }

    loadEmployees();
  }, [companyId]);

  const payableEmployees = useMemo(
    () =>
      employees.filter(
        (e) =>
          e.status === 'active' &&
          typeof e.salary === 'number' &&
          !!e.payFrequency
      ),
    [employees]
  );

  const excludedEmployees = useMemo(
    () => employees.filter((e) => !payableEmployees.includes(e)),
    [employees, payableEmployees]
  );

  const frequency = useMemo<PayrollFrequency | null>(() => {
    const unique = new Set(payableEmployees.map((e) => e.payFrequency));
    return unique.size === 1 ? [...unique][0]! : null;
  }, [payableEmployees]);

  async function handleCreatePayroll() {
    if (!companyId || !frequency) return;

    try {
      setSubmitting(true);

      const runId = uuidv4();

      await createPayrollRun(companyId, runId, {
        frequency,
        totalGross: 0,
        totalNet: 0,
      });

      await snapshotPayrollRunEmployees(companyId, runId, frequency);

      router.push(`/hr/payroll/approve/${runId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create payroll run. Check console.');
    } finally {
      setSubmitting(false);
    }
  }

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
        <h1 className="text-2xl font-bold text-gray-800">
          Payroll Run Preview
        </h1>
      </div>

      {loading ? (
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
                Pay frequency:{' '}
                <span className="font-semibold">
                  {frequency ?? 'Mixed (Not Allowed)'}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Payable employees:{' '}
                <span className="font-semibold">{payableEmployees.length}</span>
              </p>
              <p className="text-sm text-gray-600">
                Excluded:{' '}
                <span className="font-semibold">
                  {excludedEmployees.length}
                </span>
              </p>
            </CardContent>
          </Card>

          {/* PAYABLE */}
          <section className="space-y-2">
            {payableEmployees.map((emp) => (
              <Card key={emp.id}>
                <CardContent className="p-4 flex justify-between">
                  <span>{emp.name}</span>
                  <span className="text-sm text-gray-600">
                    {emp.salary} · {emp.payFrequency}
                  </span>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push('/hr/payroll')}
            >
              Cancel
            </Button>

            <Button
              className="bg-[#00ACC1] text-white"
              disabled={
                payableEmployees.length === 0 || !frequency || submitting
              }
              onClick={handleCreatePayroll}
            >
              {submitting ? 'Creating…' : 'Create Payroll Run'}
            </Button>
          </div>
        </>
      )}
    </main>
  );
}