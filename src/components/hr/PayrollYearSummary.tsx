'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export default function PayrollYearSummary() {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState({
    total: 0,
    runs: 0,
  });

  useEffect(() => {
    if (!companyId) return;

    async function loadSummary() {
      const ref = collection(db, 'companies', companyId, 'payrollRuns');
      const snap = await getDocs(ref);

      let total = 0;
      let runs = 0;

      snap.forEach((doc) => {
        const data = doc.data();
        const paidAt = data.paidAt?.toDate();

        if (paidAt && paidAt.getFullYear() === year) {
          total += data.netTotal || 0;
          runs++;
        }
      });

      setSummary({ total, runs });
    }

    loadSummary();
  }, [companyId, year]);

  return (
    <div className="border rounded-lg p-4 bg-gray-50 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Payroll Summary</h2>
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

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Paid Payroll Runs</p>
          <p className="font-semibold">{summary.runs}</p>
        </div>
        <div>
          <p className="text-gray-500">Net Payroll Total</p>
          <p className="font-semibold">{summary.total.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
