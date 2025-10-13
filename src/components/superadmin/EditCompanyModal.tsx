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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Edit Company
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <Input
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