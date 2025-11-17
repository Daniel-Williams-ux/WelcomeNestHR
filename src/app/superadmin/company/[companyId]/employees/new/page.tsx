'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { db } from '@/lib/firebase';
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';

export default function AddEmployeePage() {
  const router = useRouter();
  const { companyId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    department: '',
    email: '',
    status: 'Active',
    startDate: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      toast({ title: 'Company not found' });
      return;
    }

    setLoading(true);
    try {
      // ✅ Prepare employee data
      const payload = {
        ...formData,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : '',
        endDate: formData.status === 'Exited' ? new Date().toISOString() : null,
        createdAt: serverTimestamp(),
      };

      // ✅ Add new employee under companies/{companyId}/employees
      const companyRef = doc(db, 'companies', companyId as string);
      const employeesRef = collection(companyRef, 'employees');
      await addDoc(employeesRef, payload);

      // ✅ Increment employee count in company doc
      await updateDoc(companyRef, {
        employeeCount: increment(1),
      });

      toast({ title: 'Employee added successfully' });
      router.push(`/superadmin/company/${companyId}/employees`);
    } catch (err) {
      console.error('Add employee error:', err);
      toast({
        title: 'Failed to add employee',
        description: (err as any)?.message || '',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="p-6 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Add New Employee
      </h1>

      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                name="name"
                required
                onChange={handleChange}
                value={formData.name}
              />
            </div>

            <div>
              <Label>Job Title</Label>
              <Input
                name="title"
                required
                onChange={handleChange}
                value={formData.title}
              />
            </div>

            <div>
              <Label>Department</Label>
              <Input
                name="department"
                required
                onChange={handleChange}
                value={formData.department}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                required
                onChange={handleChange}
                value={formData.email}
              />
            </div>

            <div>
              <Label>Status</Label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ACC1]"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Exited">Exited</option>
              </select>
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                name="startDate"
                onChange={handleChange}
                value={formData.startDate}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#FB8C00] to-[#00ACC1] text-white font-semibold hover:opacity-90 transition"
            >
              {loading ? 'Saving...' : 'Add Employee'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}