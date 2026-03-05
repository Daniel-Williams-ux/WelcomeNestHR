// src/app/hr/employees/page.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHRSession } from '@/hooks/useHRSession';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuthContext } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function HREmployeesPage() {
  console.log('HREmployeesPage rendered');
  const { companyId, loading: loadingCompany } = useHRSession();
  const router = useRouter();

  const auth = useAuthContext();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'createdAt' | 'name'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAdd, setShowAdd] = useState(false);


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

  if (loadingCompany) return <div className="p-6">Loading company…</div>;
  if (!companyId) return <div className="p-6">No company assigned.</div>;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage all employees in your organization.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="border rounded px-3 py-2 text-sm w-full md:w-48"
          />

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[#00ACC1] text-white rounded text-sm"
          >
            <Plus size={14} /> Add
          </button>

          <button
            onClick={exportCurrentPageCSV}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded text-sm"
          >
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <select
          value={statusFilter ?? ''}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="border rounded px-2 py-1"
        >
          <option value="">All statuses</option>
          <option>Active</option>
          <option>On Leave</option>
          <option>Exited</option>
        </select>

        <select
          value={departmentFilter ?? ''}
          onChange={(e) => setDepartmentFilter(e.target.value || null)}
          className="border rounded px-2 py-1"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as any)}
          className="border rounded px-2 py-1"
        >
          <option value="createdAt">Created</option>
          <option value="name">Name</option>
        </select>

        <select
          value={sortDirection}
          onChange={(e) => setSortDirection(e.target.value as any)}
          className="border rounded px-2 py-1"
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      {/* CONTENT */}
      <div className="mt-6">
        {/* MOBILE CARDS */}
        <div className="space-y-3 md:hidden">
          {employees.map((e) => (
            <div
              key={e.id}
              className="rounded-lg border bg-white p-4 space-y-2"
            >
              <div className="font-medium">{e.name}</div>
              <div className="text-sm text-gray-600">
                {e.title || '—'} · {e.department || '—'}
              </div>
              <div className="text-sm">
                Status: <span className="font-medium">{e.status}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => router.push(`/hr/employees/${e.id}`)}
                  className="flex-1 text-sm px-2 py-1 border rounded"
                >
                  View
                </button>
                <button
                  onClick={() => deleteEmployee(e.id)}
                  className="flex-1 text-sm px-2 py-1 border rounded text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block bg-white border rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
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
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3">{e.title || '—'}</td>
                  <td className="px-4 py-3">{e.department || '—'}</td>
                  <td className="px-4 py-3">
                    {(e as any).salary ? `$${(e as any).salary}` : '—'}
                  </td>
                  <td className="px-4 py-3">{e.status}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => router.push(`/hr/employees/${e.id}`)}
                      className="px-2 py-1 border rounded"
                    >
                      View
                    </button>
                    <button
                      onClick={() => deleteEmployee(e.id)}
                      className="px-2 py-1 border rounded text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between text-sm">
        <span>Page {page}</span>
        <div className="flex gap-2">
          <button
            onClick={prev}
            disabled={!hasPrev}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={next}
            disabled={!hasNext}
            className="px-3 py-1 border rounded bg-[#00ACC1] text-white disabled:opacity-50"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ADD EMPLOYEE MODAL (Restored) */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Add Employee</h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const formData = new FormData(form);

                await addEmployee({
                  name: formData.get('name') as string,
                  title: formData.get('title') as string,
                  department: formData.get('department') as string,
                  email: formData.get('email') as string,
                  status: 'Active',
                });

                setShowAdd(false);
              }}
              className="space-y-3"
            >
              <input
                name="name"
                placeholder="Name"
                required
                className="w-full border px-3 py-2 rounded"
              />

              <input
                name="title"
                placeholder="Role / Title"
                className="w-full border px-3 py-2 rounded"
              />

              <input
                name="department"
                placeholder="Department"
                className="w-full border px-3 py-2 rounded"
              />

              <input
                name="email"
                placeholder="Email"
                className="w-full border px-3 py-2 rounded"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00ACC1] text-white rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
