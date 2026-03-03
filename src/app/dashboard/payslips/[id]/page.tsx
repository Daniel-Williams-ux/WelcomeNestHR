'use client';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAccess } from '@/hooks/useUserAccess';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PayslipViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUserAccess();
  const [payslip, setPayslip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    async function loadPayslip() {
      const ref = doc(db, 'users', user.uid, 'payslips', id as string);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert('Payslip not found');
        router.push('/dashboard/payslips');
        return;
      }

      setPayslip(snap.data());
      setLoading(false);
    }

    loadPayslip();
  }, [user, id, router]);

  if (loading) {
    return <div className="p-6">Loading payslip…</div>;
  }

  if (!payslip) return null;

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 border print:border-0 print:p-0">
      {/* HEADER (hidden on print) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/payslips')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>

        <Button
          className="bg-[#00ACC1] text-white flex items-center gap-2"
          onClick={() => window.print()}
        >
          <Download size={16} />
          Download PDF
        </Button>
      </div>

      {/* PAYSLIP CONTENT */}
      <div className="space-y-6">
        <div className="text-center border-b pb-4">
          <h1 className="text-xl font-bold">Payslip</h1>
          <p className="text-sm text-gray-500">
            Pay Period: {payslip.periodStart?.toDate().toLocaleDateString()} –{' '}
            {payslip.periodEnd?.toDate().toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Gross Pay</p>
            <p className="font-semibold">
              {payslip.currency} {payslip.grossPay.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Net Pay</p>
            <p className="font-semibold">
              {payslip.currency} {payslip.netPay.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Deductions</p>
            <p className="font-semibold">
              {payslip.currency} {payslip.deductionsTotal.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-semibold capitalize">{payslip.status}</p>
          </div>
        </div>

        <div className="pt-6 border-t text-xs text-gray-400 text-center">
          This is a system-generated payslip.
        </div>
      </div>
    </div>
  );
}
