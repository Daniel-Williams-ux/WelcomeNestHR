// src/app/hr/employees/page.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { useEmployees, Employee } from '@/hooks/useEmployees';

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
      {children}
    </span>
  );
}

export default function HREmployeesPage() {
  // get current company (client-only hook)
  const { companyId, loading: loadingCompany } = useCurrentCompany();

  // local UI state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'createdAt' | 'name'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [showAdd, setShowAdd] = useState(false);

  // wire up employees hook (returns functions for export, paging, add, delete)
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
    setDepartmentFilter: setDeptFilterHook, // ← rename hook version
    setSortOption,
    addEmployee,
    deleteEmployee,
    exportCurrentPageCSV,
    exportFilteredEmployees,
    exportAllEmployees,
    reload,
  } = useEmployees(companyId ?? undefined, 10);


  // sync local UI inputs into hook when changed
  React.useEffect(() => {
    setSearchName(search);
  }, [search, setSearchName]);

  React.useEffect(() => {
    setStatus(statusFilter);
  }, [statusFilter, setStatus]);

  React.useEffect(() => {
    setDeptFilterHook(departmentFilter);
  }, [departmentFilter, setDeptFilterHook]);


  React.useEffect(() => {
    setSortOption({ field: sortField, direction: sortDirection });
  }, [sortField, sortDirection, setSortOption]);

  // Derived lists for filter dropdowns (simple client-side collect)
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => e.department && set.add(e.department));
    return Array.from(set).slice(0, 20);
  }, [employees]);

  // Add employee form state (minimal)
  const [form, setForm] = useState({
    name: '',
    title: '',
    email: '',
    department: '',
    status: 'Active',
    startDate: '',
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!form.name || !form.email) {
      setAddError('Name and email are required.');
      return;
    }
    if (!companyId) {
      setAddError('No company selected.');
      return;
    }

    try {
      setAdding(true);
      await addEmployee({
        name: form.name,
        title: form.title,
        email: form.email,
        department: form.department,
        status: form.status as any,
        startDate: form.startDate || new Date().toISOString(),
      } as any);
      setShowAdd(false);
      setForm({
        name: '',
        title: '',
        email: '',
        department: '',
        status: 'Active',
        startDate: '',
      });
      reload();
    } catch (err: any) {
      console.error(err);
      setAddError((err && err.message) || 'Failed to add employee.');
    } finally {
      setAdding(false);
    }
  };

  if (loadingCompany) {
    return <div className="p-6">Loading company…</div>;
  }
  if (!companyId) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">No company assigned</h2>
        <p className="text-sm text-gray-600 mt-2">
          Your account is not connected to a company. Please ask your admin to
          assign you.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage all employees in your organization.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex items-center bg-white border rounded shadow-sm px-3 py-1">
            <input
              aria-label="Search employees"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="outline-none w-48 text-sm"
            />
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[#00ACC1] text-white rounded shadow-sm text-sm"
            aria-label="Add employee"
          >
            <Plus size={14} /> Add employee
          </button>

          <div className="relative inline-block">
            <button
              onClick={() => exportCurrentPageCSV()}
              className="inline-flex items-center gap-2 px-3 py-2 border rounded text-sm bg-white"
              aria-label="Export current page"
              title="Export current page"
            >
              <Download size={14} /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters & sort */}
      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600">Status</label>
          <select
            value={statusFilter ?? ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="border rounded px-2 py-1 text-sm"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Exited">Exited</option>
          </select>

          <label className="text-sm text-gray-600 ml-3">Department</label>
          <select
            value={departmentFilter ?? ''}
            onChange={(e) => setDepartmentFilter(e.target.value || null)}
            className="border rounded px-2 py-1 text-sm"
            aria-label="Filter by department"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600">Sort</label>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="border rounded px-2 py-1 text-sm"
            aria-label="Sort field"
          >
            <option value="createdAt">Created</option>
            <option value="name">Name</option>
          </select>

          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as any)}
            className="border rounded px-2 py-1 text-sm"
            aria-label="Sort direction"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>

          <button
            onClick={() => exportFilteredEmployees()}
            className="text-sm px-3 py-1 border rounded bg-white"
            title="Export filtered employees (all pages)"
          >
            Export filtered
          </button>
          <button
            onClick={() => exportAllEmployees()}
            className="text-sm px-3 py-1 border rounded bg-white"
            title="Export all employees (ignores filters)"
          >
            Export all
          </button>
        </div>
      </div>

      {/* Table / content */}
      <div className="mt-6 bg-white rounded-lg border shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-6 text-gray-500">Loading employees…</div>
        ) : error ? (
          <div className="p-6 text-red-600">Error: {error}</div>
        ) : employees.length === 0 ? (
          <div className="p-6 text-gray-600">
            No employees found.{' '}
            <button
              onClick={() => setShowAdd(true)}
              className="ml-2 text-[#00ACC1]"
            >
              Add your first employee
            </button>
          </div>
        ) : (
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-50 text-left text-xs text-gray-600 uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Salary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3">{e.title ?? '—'}</td>
                  <td className="px-4 py-3">{e.department ?? '—'}</td>
                  <td className="px-4 py-3">
                    {(e as any).salary ? `$${(e as any).salary}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {e.status === 'Active' ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700">
                        {e.status}
                      </span>
                    ) : e.status === 'On Leave' ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-50 text-yellow-700">
                        {e.status}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        {e.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // open detail view — (for now use alert)
                          alert(`Open employee: ${e.name}`);
                        }}
                        className="text-sm px-2 py-1 rounded border bg-white"
                      >
                        View
                      </button>
                      <button
                        onClick={async () => {
                          if (
                            !confirm(`Delete ${e.name}? This is a soft-delete.`)
                          )
                            return;
                          try {
                            await deleteEmployee(e.id);
                          } catch (err) {
                            console.error(err);
                            alert('Failed to delete');
                          }
                        }}
                        className="text-sm px-2 py-1 rounded border bg-red-50 text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>
          {typeof totalEmployees === 'number' ? (
            <span>
              Showing page {page} — {totalEmployees} total
            </span>
          ) : (
            <span>Page {page}</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => prev()}
            disabled={!hasPrev}
            className="inline-flex items-center gap-2 px-3 py-1 rounded border disabled:opacity-50"
            aria-disabled={!hasPrev}
            title="Previous page"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            onClick={() => next()}
            disabled={!hasNext}
            className="inline-flex items-center gap-2 px-3 py-1 rounded border bg-[#00ACC1] text-white disabled:opacity-50"
            aria-disabled={!hasNext}
            title="Next page"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Add employee modal (simple) */}
      {showAdd && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={() => setShowAdd(false)}
            className="absolute inset-0 bg-black/40"
            aria-hidden
          />
          <form
            onSubmit={handleAdd}
            className="relative w-full max-w-xl bg-white rounded shadow-lg p-6 z-10"
          >
            <h3 className="text-lg font-semibold">Add employee</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <label className="flex flex-col">
                <span className="text-sm text-gray-600">Full name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, name: e.target.value }))
                  }
                  className="border rounded px-3 py-2 text-sm mt-1"
                />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-600">Email</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, email: e.target.value }))
                  }
                  className="border rounded px-3 py-2 text-sm mt-1"
                />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-600">Title</span>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, title: e.target.value }))
                  }
                  className="border rounded px-3 py-2 text-sm mt-1"
                />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-600">Department</span>
                <input
                  value={form.department}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, department: e.target.value }))
                  }
                  className="border rounded px-3 py-2 text-sm mt-1"
                />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-600">Start date</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, startDate: e.target.value }))
                  }
                  className="border rounded px-3 py-2 text-sm mt-1"
                />
              </label>

              <label className="flex flex-col">
                <span className="text-sm text-gray-600">Status</span>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, status: e.target.value }))
                  }
                  className="border rounded px-3 py-2 text-sm mt-1"
                >
                  <option>Active</option>
                  <option>On Leave</option>
                  <option>Exited</option>
                </select>
              </label>
            </div>

            {addError && (
              <div className="mt-3 text-sm text-red-600">{addError}</div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded border text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding}
                className="px-4 py-2 rounded bg-[#00ACC1] text-white text-sm"
              >
                {adding ? 'Adding…' : 'Add employee'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}