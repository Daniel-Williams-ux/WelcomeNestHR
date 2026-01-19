'use client';

import {
  collection,
  orderBy,
  query,
  limit,
  getDocs,
  startAfter,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PaginationControls from '@/components/common/PaginationControls';
import PayslipYearSummary from '@/components/payslips/PayslipYearSummary';
import { Button } from '@/components/ui/button';

type UserPayslip = {
  id: string;
  grossPay: number;
  netPay: number;
  currency: string;
  status: 'paid';
  issuedAt: any;
};

const PAGE_SIZE = 20;

export default function PayslipsPage() {
  const { user } = useAuth();

  const [payslips, setPayslips] = useState<UserPayslip[]>([]);
  const [loading, setLoading] = useState(true);

  const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
  const [history, setHistory] = useState<DocumentData[]>([]);

  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  async function loadPage(cursor?: DocumentData, direction?: 'next' | 'prev') {
    if (!user) return;

    setLoading(true);

    let q = query(
      collection(db, 'users', user.uid, 'payslips'),
      orderBy('issuedAt', 'desc'),
      limit(PAGE_SIZE)
    );

    if (cursor && direction === 'next') {
      q = query(q, startAfter(cursor));
    }

    const snap = await getDocs(q);
    const docs = snap.docs;

    setPayslips(docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

    setLastDoc(docs[docs.length - 1] || null);

    setHasNext(docs.length === PAGE_SIZE);
    setHasPrev(history.length > 0);

    if (direction === 'next' && cursor) {
      setHistory((h) => [...h, cursor]);
    }

    if (direction === 'prev') {
      setHistory((h) => h.slice(0, -1));
    }

    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, [user]);

  function exportCSV() {
    if (!payslips.length) return;

    const headers = ['Date', 'Gross Pay', 'Net Pay', 'Status'];
    const rows = payslips.map((p) => [
      new Date(p.issuedAt.seconds * 1000).toLocaleDateString(),
      p.grossPay,
      p.netPay,
      p.status,
    ]);

    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'payslips.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return <div className="p-6">Loading payslips…</div>;
  }

  if (payslips.length === 0) {
    return <div className="p-6 text-gray-500">No payslips yet.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Payslips</h1>
        <Button variant="outline" onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      <PayslipYearSummary />

      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Gross Pay</th>
              <th className="p-3 text-left">Net Pay</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {payslips.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  {new Date(p.issuedAt.seconds * 1000).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {p.currency} {p.grossPay.toLocaleString()}
                </td>
                <td className="p-3">
                  {p.currency} {p.netPay.toLocaleString()}
                </td>
                <td className="p-3 capitalize">{p.status}</td>
                <td className="p-3 text-right">
                  <Link
                    href={`/dashboard/payslips/${p.id}`}
                    className="text-[#00ACC1] font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationControls
        hasNext={hasNext}
        hasPrev={hasPrev}
        onNext={() => loadPage(lastDoc!, 'next')}
        onPrev={() => loadPage(history[history.length - 1], 'prev')}
      />
    </div>
  );
}