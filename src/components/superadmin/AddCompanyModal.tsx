'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { DEFAULT_TRIAL_DAYS } from '@/lib/billingPlans';

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

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loading, onClose, open]);

  const handleAdd = async () => {
    if (!name.trim()) {
      toast({ title: 'Company name required' });
      return;
    }

    setLoading(true);

    try {
      const trialDurationDays = DEFAULT_TRIAL_DAYS;

      let trialEndsAt = null;

      if (plan === 'Trial') {
        const now = new Date();
        now.setDate(now.getDate() + trialDurationDays);
        trialEndsAt = Timestamp.fromDate(now);
      }

      await addDoc(collection(db, 'companies'), {
        name: name.trim(),
        plan,
        billingPlanId: plan === 'Trial' ? null : plan.toLowerCase(),
        subscriptionStatus: plan === 'Trial' ? 'trialing' : 'active',
        trialEndsAt: trialEndsAt ? trialEndsAt : null,
        employeeCount: 0,
        createdAt: serverTimestamp(),
        status: 'active',
      });

      toast({ title: 'Company added successfully' });
      setName('');
      setPlan('Trial');
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-company-title"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-[#1e1e1e]"
      >
        <h2 id="add-company-title" className="mb-4 text-lg font-semibold">
          Add Company
        </h2>

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
              <option value="Starter">Starter</option>
              <option value="Growth">Growth</option>
              <option value="Pro">Pro</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              onClick={onClose}
              disabled={loading}
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