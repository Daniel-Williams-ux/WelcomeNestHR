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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import AddCompanyModal from '@/components/superadmin/AddCompanyModal';
import EditCompanyModal from '@/components/superadmin/EditCompanyModal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

interface Company {
  id: string;
  name: string;
  plan: string;
  employeeCount: number;
  modulesEnabled: string[];
  createdAt?: Date;
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

  // ✅ Real-time Firestore listener (auto-updates when collection changes)
  useEffect(() => {
    const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const companyData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Company[];
        setCompanies(companyData);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to companies:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
        <h1 className="text-2xl font-bold text-gray-800">Companies</h1>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#FB8C00] hover:bg-[#F57C00] text-white font-medium cursor-pointer transition"
        >
          Add Company
        </Button>
      </div>

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

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <p className="text-gray-500 mt-8 text-center">
          No companies added yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card
              key={company.id}
              className="hover:shadow-md transition bg-white rounded-xl"
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {company.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  <strong>Plan:</strong> {company.plan}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Employees:</strong> {company.employeeCount}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> {company.status || '—'}
                </p>

                <div className="flex justify-between mt-4">
                  <Button
                    onClick={() =>
                      setEditModal({
                        open: true,
                        companyId: company.id,
                        currentName: company.name,
                      })
                    }
                    className="bg-[#00ACC1] hover:bg-[#0097A7] text-white text-sm px-3 py-1"
                  >
                    Edit
                  </Button>

                  <Button
                    onClick={() => handleDelete(company.id)}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}