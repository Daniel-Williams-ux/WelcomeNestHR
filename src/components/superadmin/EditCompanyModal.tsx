'use client';

import { useState, useEffect } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

interface EditCompanyModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  currentName: string;
}

export default function EditCompanyModal({
  open,
  onClose,
  companyId,
  currentName,
}: EditCompanyModalProps) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

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

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Company name is required' });
      return;
    }

    try {
      setLoading(true);
      await updateDoc(doc(db, 'companies', companyId), { name: name.trim() });
      toast({ title: 'Company updated successfully' });
      onClose();
    } catch (err) {
      console.error('Error updating company:', err);
      toast({ title: 'Error updating company' });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-company-title"
    >
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900">
        <h2
          id="edit-company-title"
          className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100"
        >
          Edit Company
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="company-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Company Name
            </label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new name"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button
            onClick={onClose}
            disabled={loading}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#00ACC1] hover:bg-[#0097A7] text-white"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}