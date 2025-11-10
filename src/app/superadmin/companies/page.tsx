'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import AddCompanyModal from '@/components/superadmin/AddCompanyModal';
import EditCompanyModal from '@/components/superadmin/EditCompanyModal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation'; // ✅ Added

interface Company {
  id: string;
  name: string;
  plan: string;
  employeeCount: number;
  modulesEnabled: string[];
  createdAt?: any;
  status?: string;
  lastPayroll?: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<{
    open: boolean;
    companyId: string | null;
    currentName: string;
  }>({ open: false, companyId: null, currentName: '' });

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Company;
    direction: 'asc' | 'desc';
  } | null>(null);

  const router = useRouter(); // ✅ Added

  // ✅ Firestore real-time listener
  useEffect(() => {
    const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Company[];
        setCompanies(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching companies:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ✅ Sorting Logic
  const sortedCompanies = [...companies].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const valA = a[key] ?? '';
    const valB = b[key] ?? '';
    if (typeof valA === 'string' && typeof valB === 'string') {
      return direction === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: keyof Company) => {
    setSortConfig((prev) => {
      if (prev?.key === key && prev.direction === 'asc') {
        return { key, direction: 'desc' };
      } else {
        return { key, direction: 'asc' };
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    try {
      await deleteDoc(doc(db, 'companies', id));
      toast({ title: 'Company deleted successfully' });
    } catch (err) {
      console.error('Error deleting company:', err);
      toast({ title: 'Error deleting company' });
    }
  };

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Company Management</h1>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#FB8C00] hover:bg-[#F57C00] text-white font-medium cursor-pointer transition"
        >
          Add Company
        </Button>
      </div>

      {/* Modals */}
      <AddCompanyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={() => setModalOpen(false)}
      />
      <EditCompanyModal
        open={editModal.open}
        onClose={() =>
          setEditModal({ open: false, companyId: null, currentName: '' })
        }
        companyId={editModal.companyId || ''}
        currentName={editModal.currentName}
      />

      {/* Loading State */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : sortedCompanies.length === 0 ? (
        <p className="text-gray-500 mt-8 text-center">
          No companies added yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-xl shadow-sm bg-white">
            <thead className="bg-gray-100 text-gray-700 text-sm uppercase font-semibold">
              <tr>
                {[
                  { label: 'Company Name', key: 'name' },
                  { label: 'Plan', key: 'plan' },
                  { label: 'Employees', key: 'employeeCount' },
                  { label: 'Status', key: 'status' },
                  { label: 'Created', key: 'createdAt' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => requestSort(col.key as keyof Company)}
                    className="py-3 px-4 text-left cursor-pointer hover:text-[#00ACC1] transition"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown
                        size={14}
                        className={`${
                          sortConfig?.key === col.key
                            ? 'text-[#00ACC1]'
                            : 'text-gray-400'
                        }`}
                      />
                    </div>
                  </th>
                ))}
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  {/* ✅ Clickable company name */}
                  <td
                    onClick={() =>
                      router.push(`/superadmin/company/${company.id}/employees`)
                    }
                    className="py-3 px-4 font-medium text-[#00ACC1] hover:underline cursor-pointer"
                  >
                    {company.name}
                  </td>

                  <td className="py-3 px-4">{company.plan}</td>
                  <td className="py-3 px-4">{company.employeeCount}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        company.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : company.status === 'suspended'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {company.status || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {company.createdAt?.seconds
                      ? new Date(
                          company.createdAt.seconds * 1000
                        ).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="py-3 px-4 flex gap-2 justify-center">
                    <Button
                      onClick={() =>
                        setEditModal({
                          open: true,
                          companyId: company.id,
                          currentName: company.name,
                        })
                      }
                      className="bg-[#00ACC1] hover:bg-[#0097A7] text-white text-xs px-3 py-1"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(company.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}