// src/app/hr/employees/page.tsx
'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { useHRSession } from '@/hooks/useHRSession';
import { useEmployees } from '@/hooks/useEmployees';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function HREmployeesPage() {
  const { companyId, loading: loadingCompany } = useHRSession();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'createdAt' | 'name'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAdd, setShowAdd] = useState(false);
  const [creatingEmployee, setCreatingEmployee] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    employeeName: string;
    email: string;
    link: string;
    copied: boolean;
    error: string;
  } | null>(null);


  const {
    employees,
    loading,
    error,
    page,
    hasNext,
    hasPrev,
    totalEmployees,
    next,
    prev,
    setSearchName,
    setStatusFilter: setStatus,
    setDepartmentFilter: setDept,
    setSortOption,
    addEmployee,
    deleteEmployee,
    exportCurrentPageCSV,
    exportFilteredEmployees,
    exportAllEmployees,
    reload,
  } = useEmployees(companyId || '', 10);

  React.useEffect(() => setSearchName(search), [search]);
  React.useEffect(() => setStatus(statusFilter), [statusFilter]);
  React.useEffect(() => setDept(departmentFilter), [departmentFilter]);
  React.useEffect(
    () => setSortOption({ field: sortField, direction: sortDirection }),
    [sortField, sortDirection],
  );

  const departments = useMemo(() => {
    const s = new Set<string>();
    employees.forEach((e) => e.department && s.add(e.department));
    return Array.from(s);
  }, [employees]);

  const buildInviteLink = (token: string) => {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    return `${baseUrl}/signup?token=${encodeURIComponent(token)}`;
  };

  const copyInviteLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setInviteResult((prev) =>
        prev ? { ...prev, copied: true, error: '' } : prev,
      );
    } catch {
      setInviteResult((prev) =>
        prev
          ? {
              ...prev,
              copied: false,
              error: 'Copy failed. Select and copy the link manually.',
            }
          : prev,
      );
    }
  };

  if (loadingCompany) return <div className="p-6">Loading company…</div>;
  if (!companyId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <h1 className="font-semibold">No company assigned</h1>
            <p className="mt-1 text-sm">
              This HR account needs a company assignment before employees can be
              managed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#008FA1]">
            People operations
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
            Employees
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Manage all employees in your organization.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#00ACC1] text-white hover:bg-[#0097A7]"
          >
            <Plus size={14} aria-hidden="true" />
            Add employee
          </Button>

          <Button
            variant="outline"
            onClick={exportCurrentPageCSV}
            className="inline-flex items-center justify-center gap-2"
          >
            <Download size={14} aria-hidden="true" />
            Export page
          </Button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_180px_140px_120px]">
          <label className="relative block">
            <span className="sr-only">Search employees by name</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="h-11 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>

        <select
          aria-label="Filter by status"
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="">All statuses</option>
          <option>Active</option>
          <option>On Leave</option>
          <option>Exited</option>
        </select>

        <select
          aria-label="Filter by department"
          value={departmentFilter ?? ''}
          onChange={(e) => setDepartmentFilter(e.target.value || null)}
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <select
          aria-label="Sort field"
          value={sortField}
          onChange={(e) => setSortField(e.target.value as any)}
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="createdAt">Created</option>
          <option value="name">Name</option>
        </select>

        <select
          aria-label="Sort direction"
          value={sortDirection}
          onChange={(e) => setSortDirection(e.target.value as any)}
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>
      </section>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <section>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <Users className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
              No employees found
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Add your first employee or adjust the current filters.
            </p>
            <Button
              onClick={() => setShowAdd(true)}
              className="mt-5 bg-[#00ACC1] text-white hover:bg-[#0097A7]"
            >
              Add employee
            </Button>
          </div>
        ) : (
          <>
        <div className="space-y-3 md:hidden">
          {employees.map((e) => (
            <div
              key={e.id}
              className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="font-semibold text-slate-950 dark:text-white">
                  {e.name}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {e.title || '-'} · {e.department || '-'}
                </div>
              </div>
              <div className="text-sm">
                Status: <span className="font-medium">{e.status || 'Active'}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/hr/employees/${e.id}`)}
                  className="flex-1"
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  onClick={() => deleteEmployee(e.id)}
                  className="flex-1 text-red-600"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Salary</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
                  <td className="px-4 py-3 font-medium text-slate-950 dark:text-white">{e.name}</td>
                  <td className="px-4 py-3">{e.title || '-'}</td>
                  <td className="px-4 py-3">{e.department || '-'}</td>
                  <td className="px-4 py-3">
                    {(e as any).salary ? `$${(e as any).salary}` : '-'}
                  </td>
                  <td className="px-4 py-3">{e.status || 'Active'}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/hr/employees/${e.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteEmployee(e.id)}
                      className="text-red-600"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
        <span>
          Page {page}
          {typeof totalEmployees === 'number' ? ` · ${totalEmployees} employees` : ''}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prev}
            disabled={!hasPrev}
            aria-label="Previous employee page"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            onClick={next}
            disabled={!hasNext}
            aria-label="Next employee page"
            className="bg-[#00ACC1] text-white hover:bg-[#0097A7]"
          >
            <ChevronRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
          </>
        )}
      </section>

      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-employee-title"
        >
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h2 id="add-employee-title" className="text-lg font-semibold">
              Add Employee
            </h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const formData = new FormData(form);
                const employeeName = String(formData.get('name') || '').trim();
                const employeeEmail = String(formData.get('email') || '')
                  .trim()
                  .toLowerCase();

                setCreatingEmployee(true);

                try {
                  const result = await addEmployee({
                    name: employeeName,
                    title: String(formData.get('title') || '').trim(),
                    department: String(formData.get('department') || '').trim(),
                    email: employeeEmail,
                    status: 'Active',
                  });

                  const link = buildInviteLink(result.token);
                  setInviteResult({
                    employeeName,
                    email: employeeEmail,
                    link,
                    copied: false,
                    error: '',
                  });
                  setShowAdd(false);
                  await copyInviteLink(link);
                } finally {
                  setCreatingEmployee(false);
                }
              }}
              className="space-y-3"
            >
              <input
                id="employee-name"
                name="name"
                placeholder="Name"
                aria-label="Employee name"
                required
                className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              />

              <input
                id="employee-title"
                name="title"
                placeholder="Role / Title"
                aria-label="Role or title"
                className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              />

              <input
                id="employee-department"
                name="department"
                placeholder="Department"
                aria-label="Department"
                className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              />

              <input
                id="employee-email"
                name="email"
                type="email"
                placeholder="Email"
                aria-label="Employee email"
                className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  disabled={creatingEmployee}
                  variant="outline"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={creatingEmployee}
                  className="bg-[#00ACC1] text-white hover:bg-[#0097A7]"
                >
                  {creatingEmployee ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inviteResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-invite-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                <Check size={20} aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="employee-invite-title"
                  className="text-lg font-semibold text-slate-950 dark:text-white"
                >
                  Employee invite created
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Share this link with {inviteResult.employeeName || inviteResult.email}
                  {' '}so they can create their account and access the employee
                  dashboard.
                </p>
              </div>
            </div>

            <label
              htmlFor="employee-invite-link"
              className="mt-5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Signup link
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="employee-invite-link"
                readOnly
                value={inviteResult.link}
                className="min-w-0 flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              />
              <Button
                type="button"
                onClick={() => copyInviteLink(inviteResult.link)}
                className="inline-flex items-center justify-center gap-2 bg-[#00ACC1] text-white hover:bg-[#0097A7]"
              >
                <Copy size={14} aria-hidden="true" />
                {inviteResult.copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            {inviteResult.error && (
              <p className="mt-2 text-sm text-red-600" role="alert">
                {inviteResult.error}
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteResult(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
