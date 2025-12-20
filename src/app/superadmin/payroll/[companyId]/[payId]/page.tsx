// src/app/superadmin/payroll/[companyId]/[payId]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SuperAdminTopbar from '@/components/superadmin/SuperAdminTopbar';
import PayrollStatusBadge from '@/components/superadmin/PayrollStatusBadge';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PayrollDetailPage() {
  const params = useParams() as { companyId?: string; payId?: string };
  const router = useRouter();
  const { companyId, payId } = params;

  const [loading, setLoading] = useState(true);
  const [payroll, setPayroll] = useState<any | null>(null);
  const [company, setCompany] = useState<any | null>(null);

  useEffect(() => {
    if (!companyId || !payId) return;
    setLoading(true);

    const load = async () => {
      try {
        const payrollRef = doc(db, 'companies', companyId, 'payrolls', payId);
        const payrollSnap = await getDoc(payrollRef);

        const companyRef = doc(db, 'companies', companyId);
        const companySnap = await getDoc(companyRef);

        if (companySnap.exists()) setCompany(companySnap.data());
        if (payrollSnap.exists())
          setPayroll({ id: payrollSnap.id, ...(payrollSnap.data() as any) });
        else setPayroll(null);
      } catch (err) {
        console.error('load payroll detail', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [companyId, payId]);

  return (
    <div className="flex flex-col gap-6 w-full">
      <SuperAdminTopbar />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payroll Detail</h1>
          <p className="text-sm text-gray-500">{company?.name ?? companyId}</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => router.back()}
            className="bg-white border text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={14} /> Back
          </Button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow border p-6"
      >
        {loading ? (
          <p className="text-gray-400">Loading payroll...</p>
        ) : !payroll ? (
          <p className="text-gray-500">Payroll not found.</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold">
                  {payroll.period ?? 'Payroll'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {payroll.lastRun
                    ? new Date(payroll.lastRun).toLocaleString()
                    : '—'}
                </p>
              </div>
              <div>
                <PayrollStatusBadge status={payroll.status} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Employees processed</p>
                <p className="font-medium">{payroll.employeesCount ?? '—'}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Total gross</p>
                <p className="font-medium">
                  {payroll.totalGross ? `$${payroll.totalGross}` : '—'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">Created</p>
                <p className="font-medium">
                  {payroll.createdAt?.toDate
                    ? payroll.createdAt.toDate().toLocaleString()
                    : payroll.createdAt
                    ? String(payroll.createdAt)
                    : '—'}
                </p>
              </div>
            </div>

            {/* Minimal details list - expand as needed */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-2">Notes / Metadata</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(payroll, null, 2)}
              </pre>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}