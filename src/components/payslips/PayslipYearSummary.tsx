'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export default function PayslipYearSummary() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    gross: 0,
    net: 0,
    count: 0,
  });

  useEffect(() => {
    if (!user) return;

    async function loadSummary() {
      setLoading(true);

      const ref = collection(db, 'users', user.uid, 'payslips');
      const snap = await getDocs(ref);

      let gross = 0;
      let net = 0;
      let count = 0;

      snap.forEach((doc) => {
        const data = doc.data();
        const issuedYear = data.issuedAt?.toDate().getFullYear();

        if (issuedYear === year) {
          gross += data.grossPay;
          net += data.netPay;
          count++;
        }
      });

      setSummary({ gross, net, count });
      setLoading(false);
    }

    loadSummary();
  }, [user, year]);

  return (
    <div className="border rounded-lg p-4 bg-gray-50 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Yearly Summary</h2>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        >
          {[currentYear, currentYear - 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading summary…</p>
      ) : (
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Payslips</p>
            <p className="font-semibold">{summary.count}</p>
          </div>
          <div>
            <p className="text-gray-500">Gross Total</p>
            <p className="font-semibold">{summary.gross.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Net Total</p>
            <p className="font-semibold">{summary.net.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}