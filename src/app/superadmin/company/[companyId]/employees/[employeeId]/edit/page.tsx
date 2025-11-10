'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

export default function EditEmployeePage() {
  const { companyId, employeeId } = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const ref = doc(
          db,
          'companies',
          companyId as string,
          'employees',
          employeeId as string
        );
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setFormData(snap.data());
        } else {
          toast({ title: 'Employee not found' });
          router.push(`/superadmin/companies/${companyId}/employees`);
        }
      } catch (err) {
        console.error(err);
        toast({ title: 'Error loading employee data' });
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [companyId, employeeId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ref = doc(
        db,
        'companies',
        companyId as string,
        'employees',
        employeeId as string
      );
      await updateDoc(ref, formData);
      toast({ title: 'Employee updated successfully' });
      router.push(`/superadmin/companies/${companyId}/employees`);
    } catch (err) {
      console.error('Error updating employee:', err);
      toast({ title: 'Failed to update employee' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6 text-gray-500">Loading employee...</p>;

  return (
    <motion.div
      className="p-6 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Employee</h1>

      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label>Job Title</Label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label>Department</Label>
              <Input
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label>Status</Label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#00ACC1]"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Exited">Exited</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-[#00ACC1] hover:bg-[#0097A7] text-white font-semibold"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}