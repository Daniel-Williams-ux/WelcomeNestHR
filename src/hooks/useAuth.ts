// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type AppUser = {
  uid: string;
  email: string | null;
  companyId?: string;
  role?: string;
  plan?: string;
  trialEndsAt?: any;
};

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // 🔑 Fetch Firestore profile
      const ref = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.error('Firestore user document missing');
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...(snap.data() as any),
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}