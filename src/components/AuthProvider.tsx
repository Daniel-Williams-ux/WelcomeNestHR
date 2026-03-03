'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type Role = 'superadmin' | 'hr' | 'employee';
type Plan = 'Trial' | 'Platinum';

type AuthContextType = {
  user: any | null;
  role: Role | null;
  plan: Plan | null;
  trialEndsAt: Date | null;
  trialDaysLeft: number | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('AUTH PROVIDER RENDERING');

  const [state, setState] = useState<AuthContextType>({
    user: null,
    role: null,
    plan: null,
    trialEndsAt: null,
    trialDaysLeft: null,
    loading: true,
  });

  //  CRITICAL: prevents transient null auth from killing routes

  useEffect(() => {
    console.log('[AuthProvider] effect mounted');

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AUTH CHECK]', {
        uid: firebaseUser?.uid ?? null,
        email: firebaseUser?.email ?? null,
      });

      console.log('[AuthProvider] auth resolved', {
        uid: firebaseUser?.uid ?? null,
      });

      console.log('[AuthProvider] auth resolved', {
        uid: firebaseUser?.uid ?? null,
      });

      if (!firebaseUser) {
        setState({
          user: null,
          role: null,
          plan: null,
          trialEndsAt: null,
          trialDaysLeft: null,
          loading: false,
        });
        return;
      }

      // --------------------------------------------------
      // USER EXISTS → FETCH PROFILE
      // --------------------------------------------------
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!snap.exists()) {
        setState({
          user: firebaseUser,
          role: 'employee',
          plan: null,
          trialEndsAt: null,
          trialDaysLeft: null,
          loading: false,
        });
        return;
      }

      const userData = snap.data();
      const role = userData.role ?? 'employee';
      const companyId = userData.companyId ?? null;

      let plan: Plan | null = null;
      let trialEndsAt: Date | null = null;
      let trialDaysLeft: number | null = null;

      if (companyId) {
        const companySnap = await getDoc(doc(db, 'companies', companyId));

        if (companySnap.exists()) {
          const company = companySnap.data();

          if (company.plan === 'Trial' || company.plan === 'Platinum') {
            plan = company.plan;
          } else {
            plan = null;
          }

          if (company.trialEndsAt) {
            try {
              const ts =
                company.trialEndsAt instanceof Timestamp
                  ? company.trialEndsAt
                  : Timestamp.fromMillis(
                      company.trialEndsAt.seconds
                        ? company.trialEndsAt.seconds * 1000
                        : new Date(company.trialEndsAt).getTime(),
                    );

              trialEndsAt = ts.toDate();

              const diff = trialEndsAt.getTime() - Date.now();
              trialDaysLeft = Math.max(
                0,
                Math.ceil(diff / (1000 * 60 * 60 * 24)),
              );
            } catch (e) {
              console.warn('Failed to parse company trialEndsAt', e);
            }
          }
        }
      }

      setState({
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...userData,
        },
        role,
        plan,
        trialEndsAt,
        trialDaysLeft,
        loading: false,
      });
    }); // 👈 CLOSE onAuthStateChanged

    return () => unsub();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return ctx;
}