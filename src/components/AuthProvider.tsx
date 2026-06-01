'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  limit,
  query,
  Timestamp,
  setDoc,
  onSnapshot,
  where,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { type AppPlan, isPaidAppPlan, normalizeAppPlan } from '@/lib/billingPlans';

type Role = 'superadmin' | 'hr' | 'employee';
type Plan = AppPlan;

type AuthContextType = {
  user: any | null;
  companyId: string | null;
  role: Role | null;
  plan: Plan | null;
  trialEndsAt: Date | null;
  trialDaysLeft: number | null;
  isTrial: boolean;
  isPlatinum: boolean;
  isTrialExpired: boolean;
  isSuspended: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

const buildState = (
  value: Omit<AuthContextType, 'isTrial' | 'isPlatinum' | 'isTrialExpired'>,
): AuthContextType => {
  const isTrial = value.plan === 'Trial';
  const isPlatinum = isPaidAppPlan(value.plan);
  const isTrialExpired = isTrial && value.trialDaysLeft === 0;

  return {
    ...value,
    isTrial,
    isPlatinum,
    isTrialExpired,
  };
};

const normalizeRole = (value: unknown): Role | null => {
  if (value === 'superadmin' || value === 'hr' || value === 'employee') {
    return value;
  }

  return null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthContextType>({
    user: null,
    companyId: null,
    role: null,
    plan: null,
    trialEndsAt: null,
    trialDaysLeft: null,
    isTrial: false,
    isPlatinum: false,
    isTrialExpired: false,
    isSuspended: false,
    loading: true,
  });

  useEffect(() => {
    let userDocUnsub: (() => void) | null = null;

    const resetUserState = () => {
      setState(buildState({
        user: null,
        companyId: null,
        role: null,
        plan: null,
        trialEndsAt: null,
        trialDaysLeft: null,
        isSuspended: false,
        loading: false,
      }));
    };

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      userDocUnsub?.();
      userDocUnsub = null;

      if (!firebaseUser) {
        resetUserState();
        return;
      }

      setState((current) => ({
        ...current,
        user: firebaseUser,
        loading: true,
      }));

      userDocUnsub = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        async (snap) => {
          if (!snap.exists()) {
            setState(buildState({
              user: firebaseUser,
              companyId: null,
              role: null,
              plan: null,
              trialEndsAt: null,
              trialDaysLeft: null,
              isSuspended: false,
              loading: false,
            }));
            return;
          }

          const userData = snap.data();
          const role = normalizeRole(userData.role);
          const companyId = userData.companyId ?? null;

          let plan: Plan | null = null;
          let trialEndsAt: Date | null = null;
          let trialDaysLeft: number | null = null;
          let employeeId: string | null = userData.employeeId ?? null;

          const employeeLookupPromise =
            role === 'employee' && companyId && !employeeId
              ? getDocs(
                  query(
                    collection(db, 'companies', companyId, 'employees'),
                    where('uid', '==', firebaseUser.uid),
                    limit(1),
                  ),
                )
              : Promise.resolve(null);

          const companyLookupPromise = companyId
            ? getDoc(doc(db, 'companies', companyId))
            : Promise.resolve(null);

          const [employeesSnap, companySnap] = await Promise.all([
            employeeLookupPromise,
            companyLookupPromise,
          ]);

          employeeId = employeesSnap?.docs[0]?.id ?? employeeId;

          if (employeeId && userData.employeeId !== employeeId) {
            await setDoc(
              doc(db, 'users', firebaseUser.uid),
              { employeeId },
              { merge: true },
            );
          }

          if (companySnap?.exists()) {
            const company = companySnap.data();

            plan = normalizeAppPlan(company.plan);

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

          setState(buildState({
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
            isSuspended: userData.status === 'suspended' || userData.isSuspended === true,
            loading: false,
          }));
        },
        (error) => {
          console.error('Auth user document listener failed:', error);
          setState(buildState({
            user: firebaseUser,
            companyId: null,
            role: null,
            plan: null,
            trialEndsAt: null,
            trialDaysLeft: null,
            isSuspended: false,
            loading: false,
          }));
        },
      );
    });

    return () => {
      userDocUnsub?.();
      unsub();
    };
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