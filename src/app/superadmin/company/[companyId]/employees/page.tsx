'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ArrowLeft,
  Search as SearchIcon,
  Download,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/hooks/useEmployees';
import { Input } from '@/components/ui/input';

const departments = [
  'HR',
  'Finance',
  'Sales',
  'Marketing',
  'IT',
  'Operations',
  'Support',
  'Design',
  'Software',
  'Management',
  'Executive',
  'Legal',
  'Product',
];

export default function EmployeesPage() {
  // -----------------------------
  // HOOKS (must stay at the top)
  // -----------------------------
  const params = useParams();
  const router = useRouter();
  const { loading: authLoading } = useAuth();

  const companyId = Array.isArray(params.companyId)
    ? params.companyId[0]
    : params.companyId;

  const PAGE_SIZE = 8;

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
    setStatusFilter,
    setDepartmentFilter,
    setSearchName,
    setSortOption,
    deleteEmployee,
    exportCurrentPageCSV,
    exportFilteredEmployees,
    exportAllEmployees,
  } = useEmployees(companyId, PAGE_SIZE);

  const [companyName, setCompanyName] = useState('Loading...');
  const [searchValue, setSearchValue] = useState('');
  const [statusValue, setStatusValue] = useState('');
  const [departmentValue, setDepartmentValue] = useState('');
  const [sortValue, setSortValue] = useState('createdAt:desc');
  const [exportOpen, setExportOpen] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    id: '',
    name: '',
  });

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const deptInputRef = useRef<HTMLInputElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  // -----------------------------
  // EFFECTS
  // -----------------------------

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearchName(searchValue.trim()), 350);
    return () => clearTimeout(t);
  }, [searchValue]);

  // Load company name
  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const ref = doc(db, 'companies', companyId);
      const snap = await getDoc(ref);
      if (snap.exists()) setCompanyName(snap.data().name || 'Company');
      else setCompanyName('Unknown');
    })();
  }, [companyId]);

  // Filters + sorting
  useEffect(() => {
    setStatusFilter(statusValue || null);
  }, [statusValue]);

  useEffect(() => {
    setDepartmentFilter(departmentValue || null);
  }, [departmentValue]);

  useEffect(() => {
    const [field, dir] = sortValue.split(':');
    setSortOption({ field, direction: dir });
  }, [sortValue]);

  // Click outside export dropdown
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    if (exportOpen) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [exportOpen]);

  // -----------------------------
  // EARLY EXIT (auth loading)
  // -----------------------------
  if (authLoading) return null;

  // -----------------------------
  // HANDLERS
  // -----------------------------
  const handleSearchKey = (e: any) => {
    if (e.key === 'Enter') {
      setSearchName(searchValue.trim());
      searchInputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setSearchValue('');
      setSearchName('');
      searchInputRef.current?.blur();
    }
  };

  const handleDeptKey = (e: any) => {
    if (e.key === 'Enter') {
      setDepartmentFilter(departmentValue || null);
      deptInputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setDepartmentValue('');
      setDepartmentFilter(null);
      deptInputRef.current?.blur();
    }
  };

  // -----------------------------
  // RETURN (no hooks below)
  // -----------------------------
  return (
    <motion.main
      className="p-6 max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* DELETE MODAL */}
      <AnimatePresence>
        {confirmDelete.open && (
          <motion.div
            key="delete-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            aria-modal="true"
            role="dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
            >
              <h2 className="text-xl font-semibold mb-4">
                Delete {confirmDelete.name}?
              </h2>

              <div className="flex justify-end gap-3">
                <Button
                  className="bg-gray-200 text-gray-700"
                  onClick={() =>
                    setConfirmDelete({ open: false, id: '', name: '' })
                  }
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 text-white"
                  onClick={async () => {
                    await deleteEmployee(confirmDelete.id);
                    setConfirmDelete({ open: false, id: '', name: '' });
                  }}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <Button
          onClick={() => router.push('/superadmin/companies')}
          className="flex items-center gap-2 bg-transparent text-gray-600 hover:text-[#00ACC1]"
        >
          <ArrowLeft size={18} /> Back to Companies
        </Button>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Employees — {companyName}
          </h1>
          <p className="text-sm text-gray-500">
            {typeof totalEmployees === 'number'
              ? `${totalEmployees} employees`
              : employees.length
              ? `${employees.length} visible`
              : 'No employees'}
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* Search */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
            <SearchIcon size={16} className="text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder="Search name..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKey}
              className="w-48"
            />
          </div>

          {/* Status */}
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            className="border rounded-md p-2 text-sm"
          >
            <option value="">All status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Exited">Exited</option>
          </select>

          {/* Department */}
          <div>
            <input
              list="dept-list"
              ref={deptInputRef}
              value={departmentValue}
              onChange={(e) => setDepartmentValue(e.target.value)}
              onKeyDown={handleDeptKey}
              placeholder="Department"
              className="border rounded-md px-3 py-2 text-sm w-40 bg-white"
            />
            <datalist id="dept-list">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>

          {/* Sort */}
          <select
            value={sortValue}
            onChange={(e) => setSortValue(e.target.value)}
            className="border rounded-md p-2 text-sm"
          >
            <option value="createdAt:desc">Newest</option>
            <option value="createdAt:asc">Oldest</option>
            <option value="name:asc">A → Z</option>
            <option value="name:desc">Z → A</option>
          </select>

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <Button
              onClick={() => setExportOpen((s) => !s)}
              className="bg-white border text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Download size={14} /> Export <ChevronDown size={14} />
            </Button>

            <AnimatePresence>
              {exportOpen && (
                <motion.div
                  key="export-menu"
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border p-2 z-40"
                >
                  <button
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                    onClick={() => {
                      exportCurrentPageCSV();
                      setExportOpen(false);
                    }}
                  >
                    Export current page
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                    onClick={async () => {
                      setExportOpen(false);
                      await exportFilteredEmployees();
                    }}
                  >
                    Export filtered results
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                    onClick={async () => {
                      setExportOpen(false);
                      await exportAllEmployees();
                    }}
                  >
                    Export all employees
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add employee */}
          <Button
            onClick={() =>
              router.push(`/superadmin/company/${companyId}/employees/new`)
            }
            className="bg-[#00ACC1] text-white hover:bg-[#0094a8]"
          >
            <Plus size={14} /> Add Employee
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : employees.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No employees found.
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Job Title</th>
                      <th className="px-6 py-3">Dept</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Start</th>
                      <th className="px-6 py-3">End</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id} className="border-t">
                        <td className="px-6 py-3 font-medium text-gray-800 max-w-[180px] truncate">
                          {emp.name}
                        </td>
                        <td className="px-6 py-3">{emp.title}</td>
                        <td className="px-6 py-3">{emp.department}</td>
                        <td className="px-6 py-3 text-gray-600 truncate max-w-[200px]">
                          {emp.email}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              emp.status === 'Active'
                                ? 'bg-green-100 text-green-700'
                                : emp.status === 'On Leave'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {emp.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-500">
                          {emp.startDate
                            ? new Date(emp.startDate).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-6 py-3 text-gray-500">
                          {emp.endDate
                            ? new Date(emp.endDate).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-6 py-3 flex justify-center gap-2">
                          <Button
                            className="bg-[#00ACC1] text-white hover:bg-[#0094a8]"
                            onClick={() =>
                              router.push(
                                `/superadmin/company/${companyId}/employees/${emp.id}/edit`
                              )
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() =>
                              setConfirmDelete({
                                open: true,
                                id: emp.id,
                                name: emp.name,
                              })
                            }
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              <div className="p-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-500">
                  Page {page} of{' '}
                  {typeof totalEmployees === 'number'
                    ? Math.ceil(totalEmployees / PAGE_SIZE)
                    : '?'}
                </div>

                <div className="flex gap-2">
                  <Button
                    className="bg-gray-200 hover:bg-gray-300"
                    disabled={!hasPrev}
                    onClick={prev}
                  >
                    Previous
                  </Button>
                  <Button
                    className="bg-[#00ACC1] text-white hover:bg-[#0094a8]"
                    disabled={!hasNext}
                    onClick={next}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.main>
  );
}