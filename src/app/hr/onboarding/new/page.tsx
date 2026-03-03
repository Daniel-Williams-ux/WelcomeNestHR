'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { useAuthContext } from '@/components/AuthProvider';
import { useHRContext } from '@/hooks/useHRContext';

export default function CreateOnboardingFlowPage() {
  const router = useRouter();

  // SINGLE SOURCE OF TRUTH
  const { user } = useAuthContext();
  const { companyId } = useHRContext();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // OPTION B: NO COMPANY → SHOW COMPANY CREATION ENTRY
  // =====================================================
  if (!companyId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold mb-4">Create your company</h1>

        <p className="text-gray-600 mb-6">
          Before creating onboarding flows, you need to set up your company.
        </p>

        <div className="border rounded-md p-4 text-sm text-gray-500">
          Company creation form will go here.
        </div>
      </div>
    );
  }

  // =====================================================
  // ONBOARDING FLOW CREATION + AUTO DEFAULT FLOW
  // =====================================================
  async function handleCreate() {
    if (!name.trim() || !user || !companyId) return;

    try {
      setLoading(true);
      setError(null);

      // Create onboarding flow
      const flowRef = await addDoc(
        collection(db, 'companies', companyId, 'onboardingFlows'),
        {
          name: name.trim(),
          description: description.trim() || null,
          isActive: false,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        },
      );


      // Redirect back to onboarding list
      router.push('/hr/onboarding');
    } catch (err) {
      console.error(err);
      setError('Failed to create onboarding flow.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">Create onboarding flow</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Flow name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            placeholder="e.g. Standard Employee Onboarding"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            rows={3}
            placeholder="Optional"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="bg-primary text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create flow'}
          </button>

          <button
            onClick={() => router.push('/hr/onboarding')}
            className="px-4 py-2 rounded-md border"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}