'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export default function AddCompanyModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('Trial');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast({ title: 'Company name required' });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'companies'), {
        name,
        plan,
        employeeCount: 0,
        modulesEnabled: [],
        createdAt: serverTimestamp(),
        status: 'Active',
      });

      toast({ title: 'Company added successfully' });
      setName('');
      onAdded();
      onClose();
    } catch (err) {
      console.error('Error adding company:', err);
      toast({ title: 'Error adding company' });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#1e1e1e] rounded-xl p-6 w-[90%] max-w-md shadow-xl"
      >
        <h2 className="text-lg font-semibold mb-4">Add Company</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              placeholder="e.g. TechNova Ltd"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="plan">Plan</Label>
            <select
              id="plan"
              aria-label="Plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ACC1]"
            >
              <option value="Trial">Trial</option>
              <option value="Platinum">Platinum</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={loading}
              className="bg-[#00ACC1] text-white hover:bg-[#0097A7]"
            >
              {loading ? 'Adding...' : 'Add Company'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}