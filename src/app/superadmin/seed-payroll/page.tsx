'use client';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState } from 'react';

export default function SeedPayrollPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const appendLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const seed = async () => {
    try {
      setLoading(true);
      setDone(false);
      setLog([]);

      appendLog('⏳ Fetching companies…');

      const compSnap = await getDocs(collection(db, 'companies'));
      appendLog(`Found ${compSnap.docs.length} companies`);

      const tasks = compSnap.docs.map(async (comp) => {
        const companyId = comp.id;
        const data = comp.data();
        const employeesCount = data.employeeCount ?? 0;
        const name = data.name ?? 'Unknown';

        appendLog(`→ Creating payrolls for ${name}...`);

        const payrollRef = collection(db, 'companies', companyId, 'payrolls');

        const fakePayrolls = [
          {
            period: 'September 2025',
            lastRun: new Date('2025-09-30T12:30:00Z').toISOString(),
            status: 'Completed',
            employeesCount,
          },
          {
            period: 'October 2025',
            lastRun: new Date('2025-10-31T11:00:00Z').toISOString(),
            status: 'Completed',
            employeesCount,
          },
          {
            period: 'November 2025',
            lastRun: new Date('2025-11-10T09:00:00Z').toISOString(),
            status: 'Pending',
            employeesCount,
          },
        ];

        await Promise.all(
          fakePayrolls.map((p) =>
            addDoc(payrollRef, {
              ...p,
              createdAt: serverTimestamp(),
            })
          )
        );

        appendLog(`✔ Finished ${name}`);
      });

      await Promise.all(tasks);

      appendLog('✨ All payroll seeding completed successfully!');
      setDone(true);
    } catch (err: any) {
      console.error(err);
      appendLog(`❌ ERROR: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Seed Payroll Data</h1>

      <button
        onClick={seed}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Seeding...' : 'Seed Payroll Data'}
      </button>

      {done && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          Payroll seeding completed successfully.
        </div>
      )}

      <pre className="mt-4 bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-auto h-64 whitespace-pre-wrap">
        {log.join('\n')}
      </pre>
    </div>
  );
}