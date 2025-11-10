'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/hooks/useEmployees';
import { toast } from '@/components/ui/use-toast';

export default function EmployeesPage() {
  const { companyId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { employees, loading, error } = useEmployees(user?.uid, companyId);
  const [companyName, setCompanyName] = useState<string>('Loading...');

  // ✅ Fetch company name from Firestore
  useEffect(() => {
    if (!companyId) return;

    const fetchCompanyName = async () => {
      try {
        const companyRef = doc(db, 'companies', companyId as string);
        const companySnap = await getDoc(companyRef);

        if (companySnap.exists()) {
          const data = companySnap.data();
          setCompanyName(data.name || 'Unnamed Company');
        } else {
          setCompanyName('Unknown Company');
        }
      } catch (err) {
        console.error('Error fetching company name:', err);
        setCompanyName('Error loading company');
      }
    };

    fetchCompanyName();
  }, [companyId]);

  if (authLoading) return null;

  return (
    <motion.main
      className="p-6 max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push('/superadmin/companies')}
            variant="ghost"
            className="text-gray-600 hover:text-[#00ACC1] flex items-center gap-2"
          >
            <ArrowLeft size={18} /> Back to Companies
          </Button>

          <h1 className="text-2xl font-bold text-gray-800">
            Employees — {companyName}
          </h1>
        </div>

        <Button
          onClick={() =>
            router.push(`/superadmin/company/${companyId}/employees/new`)
          }
          style={{ backgroundColor: '#00ACC1', color: 'white' }}
          className="flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Add Employee
        </Button>
      </div>

      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-0">
          {loading || authLoading ? (
            <div className="space-y-3 p-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : employees.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No employees added yet.{' '}
              <span
                style={{ color: '#00ACC1', fontWeight: 500 }}
                className="mx-1 cursor-pointer"
                onClick={() =>
                  router.push(`/superadmin/company/${companyId}/employees/new`)
                }
              >
                Add Employee
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border-t border-gray-100">
                <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Job Title</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Start Date</th>
                    <th className="px-6 py-3">End Date</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {emp.name}
                      </td>
                      <td className="px-6 py-3">{emp.title}</td>
                      <td className="px-6 py-3">{emp.department}</td>
                      <td className="px-6 py-3 text-gray-600">{emp.email}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            emp.status === 'Active'
                              ? 'bg-green-100 text-green-700'
                              : emp.status === 'On Leave'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
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
                      <td className="px-6 py-3 text-center flex justify-center gap-2">
                        <Button
                          style={{ backgroundColor: '#00ACC1', color: 'white' }}
                          className="flex items-center gap-1"
                          onClick={() =>
                            router.push(
                              `/superadmin/company/${companyId}/employees/${emp.id}/edit`
                            )
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          style={{ backgroundColor: '#e53e3e', color: 'white' }}
                          className="flex items-center gap-1"
                          onClick={() =>
                            toast({
                              title: 'Delete employee',
                              description: 'Action not wired yet',
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
          )}
        </CardContent>
      </Card>
    </motion.main>
  );
}