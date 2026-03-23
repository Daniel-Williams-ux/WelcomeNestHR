'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type Role = 'superadmin' | 'hr' | 'employee';
type Plan = 'Trial' | 'Platinum';

type AuthContextType = {
  user: any | null;
  companyId: string | null;
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
    companyId: null,
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

      if (!firebaseUser) {
        setState({
          user: null,
          companyId: null,
          role: null,
          plan: null,
          trialEndsAt: null,
          trialDaysLeft: null,
          loading: false,
        });
        return;
      }

      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!snap.exists()) {
        setState({
          user: firebaseUser,
          companyId: null,
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

      let employeeId: string | null = null;

      if (companyId && firebaseUser.email) {
        const employeesSnap = await getDocs(
          collection(db, 'companies', companyId, 'employees'),
        );

        employeesSnap.forEach((docSnap) => {
          const data = docSnap.data();

          if (data.uid === firebaseUser.uid) {
            employeeId = docSnap.id;
          }
        });

        // Always sync back (fix stale data forever)
        if (employeeId && userData.employeeId !== employeeId) {
          await setDoc(
            doc(db, 'users', firebaseUser.uid),
            { employeeId },
            { merge: true },
          );
        }
      }

      let plan: Plan | null = null;
      let trialEndsAt: Date | null = null;
      let trialDaysLeft: number | null = null;

      if (companyId) {
        const companySnap = await getDoc(doc(db, 'companies', companyId));

        if (companySnap.exists()) {
          const company = companySnap.data();

          if (company.plan === 'Trial' || company.plan === 'Platinum') {
            plan = company.plan;
          }

          if (company.trialEndsAt) {
            const ts =
              company.trialEndsAt instanceof Timestamp
                ? company.trialEndsAt
                : Timestamp.fromMillis(new Date(company.trialEndsAt).getTime());

            trialEndsAt = ts.toDate();

            const diff = trialEndsAt.getTime() - Date.now();
            trialDaysLeft = Math.max(
              0,
              Math.ceil(diff / (1000 * 60 * 60 * 24)),
            );
          }
        }
      }

      setState({
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...userData,
          employeeId, 
        },
        companyId,
        role,
        plan,
        trialEndsAt,
        trialDaysLeft,
        loading: false,
      });
    });

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