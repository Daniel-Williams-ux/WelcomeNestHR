'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface CurrentCompanyData {
  companyId: string | null;
  role: string | null;
  loading: boolean;
  error: string | null;
}

export function useCurrentCompany(): CurrentCompanyData {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        setCompanyId(null);
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Only read the canonical users/{uid} doc (invite-only flow ensures companyId is present)
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data() as any;
          // canonical field is companyId
          if (data.companyId && typeof data.companyId === 'string') {
            setCompanyId(data.companyId);
            setRole((data.role as string) ?? 'employee');
          } else {
            // not assigned to a company yet
            setCompanyId(null);
            setRole((data.role as string) ?? 'unassigned');
          }
          setLoading(false);
          return;
        }

        // No user doc found
        setError('User profile not found in Firestore.');
      } catch (err) {
        console.error(err);
        setError('Failed to load company information');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { companyId, role, loading, error };
}