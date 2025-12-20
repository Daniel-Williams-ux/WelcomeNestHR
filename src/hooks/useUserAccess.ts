'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type AccessState = {
  user: User | null;
  loading: boolean;
  plan: 'free' | 'trial' | 'platinum' | null;
  role: 'superadmin' | 'hr' | 'employee' | null;
  status: 'active' | 'suspended';
  isSuspended: boolean;
  isTrialExpired: boolean;
  canAccessPremium: boolean;
  trialDaysLeft: number | null;
  trialEndsAt: Date | null;
};

export function useUserAccess(): AccessState {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<'free' | 'trial' | 'platinum' | null>(null);
  const [role, setRole] = useState<'superadmin' | 'hr' | 'employee' | null>(
    null
  );
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [isSuspended, setIsSuspended] = useState(false);

  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const timeout = setTimeout(() => {
      if (isMounted) {
        console.warn('⏳ Auth timeout: fallback to unauthenticated state.');
        setLoading(false);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      setUser(firebaseUser);

      if (!firebaseUser) {
        setPlan(null);
        setRole(null);
        setStatus('active');
        setIsSuspended(false);
        clearTimeout(timeout);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.warn('⚠️ No user document found in Firestore.');
          setPlan('free');
          setRole('employee');
          setStatus('active');
          setIsSuspended(false);
          setIsTrialExpired(false);
          setTrialDaysLeft(null);
          setTrialEndsAt(null);
        } else {
          const data = userSnap.data();

          const userPlan = data.plan || 'free';
          const userRole = data.role || 'employee';
          const userStatus: 'active' | 'suspended' =
            data.status === 'suspended' ? 'suspended' : 'active';

          setPlan(userPlan);
          setRole(userRole);
          setStatus(userStatus);
          setIsSuspended(userStatus === 'suspended');

          // ---- Trial logic (unchanged) ----
          let endsAt: Date | null = null;
          if (data.trialEndsAt instanceof Timestamp) {
            endsAt = data.trialEndsAt.toDate();
          } else if (data.trialEndsAt instanceof Date) {
            endsAt = data.trialEndsAt;
          } else if (typeof data.trialEndsAt === 'string') {
            const parsed = new Date(data.trialEndsAt);
            if (!isNaN(parsed.getTime())) endsAt = parsed;
          }

          setTrialEndsAt(endsAt);

          if (endsAt) {
            const now = new Date();
            const expired = now > endsAt;
            setIsTrialExpired(expired);

            const daysLeft = Math.max(
              0,
              Math.ceil(
                (endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              )
            );
            setTrialDaysLeft(daysLeft);
          } else {
            setIsTrialExpired(false);
            setTrialDaysLeft(null);
          }
        }
      } catch (error) {
        console.error('🔥 Error fetching user document:', error);
        setPlan(null);
        setRole(null);
        setStatus('active');
        setIsSuspended(false);
      }

      clearTimeout(timeout);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const canAccessPremium =
    plan === 'platinum' || (plan === 'trial' && !isTrialExpired);

  return {
    user,
    loading,
    plan,
    role,
    status,
    isSuspended,
    isTrialExpired,
    canAccessPremium,
    trialDaysLeft,
    trialEndsAt,
  };
}