'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

import SuperAdminTopbar from '@/components/superadmin/SuperAdminTopbar';
import StatCard from '@/components/superadmin/StatCard';

import { Building2, Users, CreditCard, BarChart3 } from 'lucide-react';
//console.log('🔥 SUPERADMIN OVERVIEW FILE LOADED');

export default function SuperAdminOverview() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayroll, setLoadingPayroll] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [platformUsersCount, setPlatformUsersCount] = useState(0);

  // -----------------------------
  // 1️⃣ FETCH COMPANIES (Realtime)
  // -----------------------------
  useEffect(() => {
    const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCompanies(data);
        setLoading(false);
      },
      (err) => {
        console.error('SuperAdmin overview fetch error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // -----------------------------------------------------------
  // 2️⃣ FETCH LATEST PAYROLL FOR EACH COMPANY (for overview table)
  // -----------------------------------------------------------
  useEffect(() => {
    if (companies.length === 0) return;

    const loadPayrolls = async () => {
      setLoadingPayroll(true);
      const results: any[] = [];

      for (const c of companies) {
        const payrollRef = collection(db, 'companies', c.id, 'payrolls');
        const q = query(payrollRef, orderBy('createdAt', 'desc'), limit(1));

        const snap = await getDocs(q);

        if (!snap.empty) {
          const p = snap.docs[0].data();
          results.push({
            companyId: c.id,
            companyName: c.name,
            employees: c.employeeCount ?? 0,
            ...p,
          });
        } else {
          results.push({
            companyId: c.id,
            companyName: c.name,
            employees: c.employeeCount ?? 0,
            period: '—',
            status: 'No Data',
            lastRun: '—',
          });
        }
      }

      setPayrolls(results);
      setLoadingPayroll(false);
    };

    loadPayrolls();
  }, [companies]);

  // -----------------------------
  // 1️⃣b FETCH PLATFORM USERS (Auth accounts)
  // -----------------------------
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setPlatformUsersCount(snap.size);
    });

    return () => unsub();
  }, []);

  // --------------------------------------------------------------
  // 3️⃣ GLOBAL RECENT PAYROLL RUNS (latest 5 runs across companies)
  // --------------------------------------------------------------
  useEffect(() => {
    if (companies.length === 0) return;

    const loadRecentRuns = async () => {
      setLoadingRecent(true);

      const allPayrolls: any[] = [];

      for (const c of companies) {
        const ref = collection(db, 'companies', c.id, 'payrolls');
        const q = query(ref, orderBy('createdAt', 'desc'), limit(5));

        const snap = await getDocs(q);

        snap.forEach((doc) => {
          allPayrolls.push({
            companyName: c.name,
            employees: c.employeeCount ?? 0,
            ...doc.data(),
          });
        });
      }

      // Sort globally by lastRun
      allPayrolls.sort((a, b) => {
        const aTime = a.lastRun ? new Date(a.lastRun).getTime() : 0;
        const bTime = b.lastRun ? new Date(b.lastRun).getTime() : 0;
        return bTime - aTime;
      });

      // keep top 5
      setRecentRuns(allPayrolls.slice(0, 5));
      setLoadingRecent(false);
    };

    loadRecentRuns();
  }, [companies]);

  // -----------------------------
  // COMPUTED STATS
  // -----------------------------
  const companyCount = companies.length;

  const totalEmployees = companies.reduce(
    (sum, c) => sum + (c.employeeCount || 0),
    0
  );

  const billingVolume = 0;
  const uptime = '99.9%';

  return (
    <div className="flex flex-col gap-6 w-full overflow-x-hidden">
      <SuperAdminTopbar />

      {/* ---------- Stats ---------- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Companies"
          value={loading ? '...' : companyCount}
          delta="+8%"
          icon={<Building2 size={20} />}
        />

        <StatCard
          title="Users"
          value={loading ? '...' : platformUsersCount}
          delta="+1.5%"
          icon={<Users size={20} />}
        />

        <StatCard
          title="Billing Volume"
          value={`$${billingVolume}`}
          delta="+12%"
          icon={<CreditCard size={20} />}
        />

        <StatCard
          title="System Uptime"
          value={uptime}
          delta="+0.1%"
          icon={<BarChart3 size={20} />}
        />
      </section>

      {/* ---------- Analytics Placeholder ---------- */}
      <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <p className="text-center px-4">
          Analytics chart placeholder (coming soon)
        </p>
      </div>

      {/* ---------- Payroll + Recent Runs ---------- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A) PAYROLL OVERVIEW (Latest per company) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 overflow-x-auto">
          <div className="px-5 py-4 border-b dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">
              Payroll Overview
            </h2>
          </div>

          {loadingPayroll ? (
            <p className="p-5 text-gray-400">Loading payroll data...</p>
          ) : (
            <table className="min-w-full text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Employees</th>
                  <th className="px-5 py-3">Last Payroll</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {payrolls.map((p) => (
                  <tr
                    key={p.companyId}
                    className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-5 py-3 font-medium">{p.companyName}</td>
                    <td className="px-5 py-3">{p.employees}</td>
                    <td className="px-5 py-3">
                      {p.period} <br />
                      <span className="text-xs text-gray-400">{p.lastRun}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          p.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : p.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : p.status === 'No Data'
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* B) RECENT PAYROLL RUNS (Across ALL companies) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 overflow-x-auto">
          <div className="px-5 py-4 border-b dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">
              Recent Payroll Runs
            </h2>
          </div>

          {loadingRecent ? (
            <p className="p-5 text-gray-400">Loading recent runs...</p>
          ) : recentRuns.length === 0 ? (
            <p className="p-5 text-gray-400">No payroll runs found.</p>
          ) : (
            <table className="min-w-full text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3">Last Run</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Employees</th>
                </tr>
              </thead>

              <tbody>
                {recentRuns.map((r, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-5 py-3 font-medium">{r.companyName}</td>
                    <td className="px-5 py-3">{r.period}</td>
                    <td className="px-5 py-3">{r.lastRun}</td>

                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          r.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : r.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="px-5 py-3">{r.employees}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}