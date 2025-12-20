// src/app/superadmin/payroll/page.tsx
// (Original file path: src/app/superadmin/payroll/page.tsx)

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  collectionGroup,
  getDocs,
  limit,
  orderBy,
  query,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SuperAdminTopbar from '@/components/superadmin/SuperAdminTopbar';
import StatCard from '@/components/superadmin/StatCard';
import { Building2, Users, CreditCard, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

type Company = {
  id: string;
  name?: string;
  employeeCount?: number;
  status?: string;
  createdAt?: unknown;
};

type Payroll = {
  id?: string;
  companyId?: string;
  companyName?: string;
  period?: string;
  lastRun?: string | Timestamp | null | unknown;
  status?: string;
  employeesCount?: number;
  createdAt?: unknown;
};

/**
 * Normalize various incoming status representations into a canonical set
 * (Flexible mapping — handles variants like "in_progress", "failed", etc.)
 */
const normalizeStatus = (raw?: string | unknown): string | undefined => {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (!s) return undefined;
  if (s === 'completed' || s === 'complete' || s === 'done' || s === 'success')
    return 'Completed';
  if (
    s === 'pending' ||
    s === 'in_progress' ||
    s === 'in-progress' ||
    s === 'in progress'
  )
    return 'Pending';
  if (
    s === 'failed' ||
    s === 'fail' ||
    s === 'failing' ||
    s === 'error' ||
    s === 'errored'
  )
    return 'Failed';
  if (s === 'no data' || s === 'nodata' || s === 'no_data') return 'No Data';
  return raw ? String(raw) : undefined;
};

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'all' | 'company'>(
    'overview'
  );

  // Companies (realtime)
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Payrolls
  const [latestPerCompany, setLatestPerCompany] = useState<Payroll[]>([]);
  const [recentRuns, setRecentRuns] = useState<Payroll[]>([]);
  const [loadingPayrolls, setLoadingPayrolls] = useState(false);

  // All runs (for "All" tab) + filters / pagination
  const [allRuns, setAllRuns] = useState<Payroll[]>([]);
  const [loadingAllRuns, setLoadingAllRuns] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // By company expanded state
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(
    null
  );
  const [companyPayrolls, setCompanyPayrolls] = useState<
    Record<string, Payroll[]>
  >({});
  const [loadingCompanyPayrolls, setLoadingCompanyPayrolls] = useState<
    Record<string, boolean>
  >({});

  // ---------- Fetch companies (realtime) ----------
  useEffect(() => {
    setLoadingCompanies(true);
    const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr: Company[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Record<string, unknown>),
        }));
        setCompanies(arr);
        setLoadingCompanies(false);
      },
      (err) => {
        console.error('companies onSnapshot error', err);
        setLoadingCompanies(false);
      }
    );
    return () => unsub();
  }, []);

  // ---------- Helper to format date (human friendly, locale aware) ----------
  const formatDate = (v?: unknown) => {
    try {
      if (!v) return '—';
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object' && 'seconds' in (v as any)) {
        // Firestore Timestamp
        const t = v as Timestamp;
        return new Date(t.seconds * 1000).toLocaleString();
      }
      if (v instanceof Date) return v.toLocaleString();
      // fallback
      return String(v);
    } catch {
      return String(v);
    }
  };

  // Helper: resolve companyId to human name using local companies cache
  const getCompanyName = (companyId?: string | undefined) => {
    if (!companyId) return '—';
    const found = companies.find((c) => c.id === companyId);
    return found?.name ?? companyId;
  };

  // ---------- Overview: latest payroll per company ----------
  useEffect(() => {
    if (!companies || companies.length === 0) {
      setLatestPerCompany([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingPayrolls(true);
      const rows: Payroll[] = [];

      for (const c of companies) {
        try {
          const payrollRef = collection(db, 'companies', c.id, 'payrolls');
          const q = query(payrollRef, orderBy('createdAt', 'desc'), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const doc = snap.docs[0];
            const p = doc.data() as Record<string, unknown>;
            rows.push({
              id: doc.id,
              companyId: c.id,
              companyName: c.name,
              employeesCount: c.employeeCount ?? 0,
              period: (p.period as string) ?? '—',
              lastRun: p.lastRun ?? p.createdAt ?? null,
              status: normalizeStatus(p.status as string | undefined) ?? '—',
              createdAt: p.createdAt,
            });
          } else {
            rows.push({
              companyId: c.id,
              companyName: c.name,
              employeesCount: c.employeeCount ?? 0,
              period: '—',
              lastRun: null,
              status: 'No Data',
            });
          }
        } catch (err) {
          console.error('latest payroll per company error', err);
          rows.push({
            companyId: c.id,
            companyName: c.name,
            employeesCount: c.employeeCount ?? 0,
            period: '—',
            lastRun: null,
            status: 'Error',
          });
        }
      }

      if (!cancelled) setLatestPerCompany(rows);
      setLoadingPayrolls(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [companies]);

  // ---------- Recent runs (global last 10) using collectionGroup ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = query(
          collectionGroup(db, 'payrolls'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        const runs: Payroll[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const pathParts = d.ref.path.split('/');
          const companyId = pathParts.length >= 2 ? pathParts[1] : undefined;
          return {
            id: d.id,
            companyId,
            companyName: (data.companyName as string | undefined) ?? undefined,
            period: (data.period as string | undefined) ?? undefined,
            lastRun: data.lastRun ?? data.createdAt ?? null,
            status: normalizeStatus(data.status as string | undefined),
            employeesCount:
              (data.employeesCount as number | undefined) ?? undefined,
            createdAt: data.createdAt,
          } as Payroll;
        });
        if (!cancelled) setRecentRuns(runs);
      } catch (err) {
        console.error('fetch recent payroll runs error', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- All runs (for All tab) - fetch recent 200 runs (client-side paging) ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingAllRuns(true);
      try {
        const q = query(
          collectionGroup(db, 'payrolls'),
          orderBy('createdAt', 'desc'),
          limit(200)
        );
        const snap = await getDocs(q);
        const list: Payroll[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const pathParts = d.ref.path.split('/');
          const companyId = pathParts.length >= 2 ? pathParts[1] : undefined;
          return {
            id: d.id,
            companyId,
            companyName: (data.companyName as string | undefined) ?? undefined,
            period: (data.period as string | undefined) ?? undefined,
            lastRun: data.lastRun ?? data.createdAt ?? null,
            status: normalizeStatus(data.status as string | undefined),
            employeesCount:
              (data.employeesCount as number | undefined) ?? undefined,
            createdAt: data.createdAt,
          } as Payroll;
        });
        if (!cancelled) setAllRuns(list);
      } catch (err) {
        console.error('fetch all runs error', err);
      } finally {
        if (!cancelled) setLoadingAllRuns(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- By company: load payrolls for a company (on-demand) ----------
  const loadPayrollsForCompany = async (companyId: string) => {
    if (!companyId) return;
    // already loaded?
    if (companyPayrolls[companyId]) {
      setExpandedCompanyId(companyId === expandedCompanyId ? null : companyId);
      return;
    }

    setLoadingCompanyPayrolls((s) => ({ ...s, [companyId]: true }));

    try {
      const payrollRef = collection(db, 'companies', companyId, 'payrolls');
      const q = query(payrollRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          period: (data.period as string | undefined) ?? undefined,
          lastRun: data.lastRun ?? data.createdAt ?? null,
          status: normalizeStatus(data.status as string | undefined),
          employeesCount:
            (data.employeesCount as number | undefined) ?? undefined,
          createdAt: data.createdAt,
        } as Payroll;
      });
      setCompanyPayrolls((s) => ({ ...s, [companyId]: docs }));
      setExpandedCompanyId(companyId);
    } catch (err) {
      console.error('loadPayrollsForCompany error', err);
      setCompanyPayrolls((s) => ({ ...s, [companyId]: [] }));
      setExpandedCompanyId(companyId);
    } finally {
      setLoadingCompanyPayrolls((s) => ({ ...s, [companyId]: false }));
    }
  };

  // ---------- All runs: filters & pagination ----------
 const filteredRuns = useMemo(() => {
   return allRuns.filter((r) => {
     // Always resolve companyName using companies[] fallback
     const resolvedCompanyName =
       r.companyName || companies.find((c) => c.id === r.companyId)?.name || '';

     // Normalize current run status safely
     const normalizedStatus = normalizeStatus(r.status);

     // Status filter
     if (statusFilter && normalizedStatus !== statusFilter) return false;

     // Company filter
     if (
       companyFilter &&
       !resolvedCompanyName.toLowerCase().includes(companyFilter.toLowerCase())
     ) {
       return false;
     }

     return true;
   });
 }, [allRuns, companies, statusFilter, companyFilter]);


  const pagedRuns = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRuns.slice(start, start + PAGE_SIZE);
  }, [filteredRuns, page]);

  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / PAGE_SIZE));

  // ---------- Stats ----------
  const companyCount = companies.length;
  const totalEmployees = companies.reduce(
    (s, c) => s + (c.employeeCount ?? 0),
    0
  );
  const billingVolume = 0;
  const uptime = '99.9%';

  // ---------- Small UI helpers ----------
  const statusBadge = (status?: string) => {
    if (!status) return '—';
    if (status === 'Completed')
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          {status}
        </span>
      );
    if (status === 'Pending')
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          {status}
        </span>
      );
    if (status === 'No Data')
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {status}
        </span>
      );
    if (status === 'Failed')
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          {status}
        </span>
      );
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full overflow-x-hidden">
      <SuperAdminTopbar />

      {/* Stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Companies"
          value={companyCount}
          delta="+8%"
          icon={<Building2 size={20} />}
        />
        <StatCard
          title="Users"
          value={totalEmployees}
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

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'overview'
                ? 'bg-[#00ACC1] text-white'
                : 'bg-white text-gray-700 border'
            }`}
            aria-pressed={activeTab === 'overview'}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'all'
                ? 'bg-[#00ACC1] text-white'
                : 'bg-white text-gray-700 border'
            }`}
            aria-pressed={activeTab === 'all'}
          >
            All Runs
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'company'
                ? 'bg-[#00ACC1] text-white'
                : 'bg-white text-gray-700 border'
            }`}
            aria-pressed={activeTab === 'company'}
          >
            By Company
          </button>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.18 }}
          className="mt-4"
        >
          {/* ---------- OVERVIEW TAB ---------- */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Latest per company table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                  <div className="px-5 py-4 border-b">
                    <h3 className="font-semibold text-gray-800">
                      Payroll Overview
                    </h3>
                  </div>
                  <div>
                    {loadingPayrolls ? (
                      <div className="p-6 text-gray-500">
                        Loading payrolls...
                      </div>
                    ) : (
                      <table className="min-w-full text-sm text-gray-600">
                        <thead className="bg-gray-50 text-left text-xs text-gray-700 uppercase">
                          <tr>
                            <th scope="col" className="px-5 py-3">
                              Company
                            </th>
                            <th scope="col" className="px-5 py-3">
                              Employees
                            </th>
                            <th scope="col" className="px-5 py-3">
                              Last Payroll
                            </th>
                            <th scope="col" className="px-5 py-3">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {latestPerCompany.map((r) => (
                            <tr
                              key={r.companyId}
                              className="border-t hover:bg-gray-50"
                            >
                              <td className="px-5 py-3 font-medium">
                                {r.companyName ?? getCompanyName(r.companyId)}
                              </td>
                              <td className="px-5 py-3">
                                {r.employeesCount ?? 0}
                              </td>
                              <td className="px-5 py-3">
                                {r.period ?? '—'}
                                <div className="text-xs text-gray-400 mt-1">
                                  {formatDate(r.lastRun)}
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                {statusBadge(r.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Recent payroll runs (global) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                  <div className="px-5 py-4 border-b">
                    <h3 className="font-semibold text-gray-800">
                      Recent Payroll Runs
                    </h3>
                  </div>
                  <div>
                    {recentRuns.length === 0 ? (
                      <div className="p-6 text-gray-500">No recent runs.</div>
                    ) : (
                      <table className="min-w-full text-sm text-gray-600">
                        <thead className="bg-gray-50 text-left text-xs text-gray-700 uppercase">
                          <tr>
                            <th scope="col" className="px-5 py-3">
                              Company
                            </th>
                            <th scope="col" className="px-5 py-3">
                              Period
                            </th>
                            <th scope="col" className="px-5 py-3">
                              Last Run
                            </th>
                            <th scope="col" className="px-5 py-3">
                              Status
                            </th>
                            <th scope="col" className="px-5 py-3">
                              Employees
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentRuns.map((r, idx) => (
                            <tr
                              key={r.id ?? idx}
                              className="border-t hover:bg-gray-50"
                            >
                              <td className="px-5 py-3 font-medium">
                                {r.companyName ?? getCompanyName(r.companyId)}
                              </td>
                              <td className="px-5 py-3">{r.period ?? '—'}</td>
                              <td className="px-5 py-3 text-xs text-gray-400">
                                {formatDate(r.lastRun)}
                              </td>
                              <td className="px-5 py-3">
                                {statusBadge(r.status)}
                              </td>
                              <td className="px-5 py-3">
                                {r.employeesCount ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ---------- ALL RUNS TAB ---------- */}
          {activeTab === 'all' && (
            <>
              <div className="flex flex-col gap-3 mb-3">
                <div className="flex gap-2 items-center">
                  <label htmlFor="statusFilter" className="sr-only">
                    Filter by status
                  </label>
                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => {
                      // Keep our internal filter canonical (Normalized)
                      const v = e.target.value || '';
                      setStatusFilter(v);
                      setPage(1);
                    }}
                    className="border rounded px-3 py-2 text-sm"
                    aria-label="Filter by payroll status"
                    title="Filter by payroll status"
                  >
                    <option value="">All statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>

                  <label htmlFor="companyFilter" className="sr-only">
                    Filter by company
                  </label>
                  <input
                    id="companyFilter"
                    placeholder="Filter company..."
                    value={companyFilter}
                    onChange={(e) => {
                      setCompanyFilter(e.target.value);
                      setPage(1);
                    }}
                    className="border rounded px-3 py-2 text-sm"
                    aria-label="Filter by company name"
                    title="Filter by company name"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {filteredRuns.length} runs found
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                {loadingAllRuns ? (
                  <div className="p-6 text-gray-500">Loading runs...</div>
                ) : (
                  <table className="min-w-full text-sm text-gray-600">
                    <thead className="bg-gray-50 text-left text-xs text-gray-700 uppercase">
                      <tr>
                        <th scope="col" className="px-5 py-3">
                          Company
                        </th>
                        <th scope="col" className="px-5 py-3">
                          Period
                        </th>
                        <th scope="col" className="px-5 py-3">
                          Last Run
                        </th>
                        <th scope="col" className="px-5 py-3">
                          Status
                        </th>
                        <th scope="col" className="px-5 py-3">
                          Employees
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedRuns.map((r) => (
                        <tr key={r.id} className="border-t hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium">
                            {r.companyName ?? getCompanyName(r.companyId)}
                          </td>
                          <td className="px-5 py-3">{r.period ?? '—'}</td>
                          <td className="px-5 py-3 text-xs text-gray-400">
                            {formatDate(r.lastRun)}
                          </td>
                          <td className="px-5 py-3">{statusBadge(r.status)}</td>
                          <td className="px-5 py-3">
                            {r.employeesCount ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* pagination */}
                <div className="p-4 flex items-center justify-between border-t">
                  <div className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                      aria-label="Previous page"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="px-3 py-1 rounded bg-[#00ACC1] text-white disabled:opacity-50"
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ---------- BY COMPANY TAB ---------- */}
          {activeTab === 'company' && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b">
                  <h3 className="font-semibold text-gray-800">Companies</h3>
                </div>

                <div>
                  {loadingCompanies ? (
                    <div className="p-6 text-gray-500">
                      Loading companies...
                    </div>
                  ) : (
                    <div className="divide-y">
                      {companies.map((c) => {
                        const payrolls = companyPayrolls[c.id] ?? [];
                        const loadingThis = !!loadingCompanyPayrolls[c.id];
                        return (
                          <div key={c.id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="font-medium text-gray-800">
                                  {c.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {c.employeeCount ?? 0} employees
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => loadPayrollsForCompany(c.id)}
                                  className="px-3 py-1 rounded bg-[#00ACC1] text-white text-sm"
                                >
                                  {expandedCompanyId === c.id
                                    ? 'Hide'
                                    : loadingThis
                                    ? 'Loading...'
                                    : 'View payrolls'}
                                </button>
                              </div>
                            </div>

                            {expandedCompanyId === c.id && (
                              <div className="mt-3 bg-gray-50 p-3 rounded">
                                {loadingThis ? (
                                  <div className="text-sm text-gray-500">
                                    Loading payrolls...
                                  </div>
                                ) : payrolls.length === 0 ? (
                                  <div className="text-sm text-gray-500">
                                    No payroll runs for this company.
                                  </div>
                                ) : (
                                  <table className="min-w-full text-sm text-gray-600">
                                    <thead className="text-xs text-gray-700 uppercase">
                                      <tr>
                                        <th scope="col" className="px-3 py-2">
                                          Period
                                        </th>
                                        <th scope="col" className="px-3 py-2">
                                          Last Run
                                        </th>
                                        <th scope="col" className="px-3 py-2">
                                          Status
                                        </th>
                                        <th scope="col" className="px-3 py-2">
                                          Employees
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {payrolls.map((p) => (
                                        <tr
                                          key={p.id}
                                          className="border-t hover:bg-white"
                                        >
                                          <td className="px-3 py-2">
                                            {p.period ?? '—'}
                                          </td>
                                          <td className="px-3 py-2 text-xs text-gray-400">
                                            {formatDate(p.lastRun)}
                                          </td>
                                          <td className="px-3 py-2">
                                            {statusBadge(p.status)}
                                          </td>
                                          <td className="px-3 py-2">
                                            {p.employeesCount ?? '—'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}