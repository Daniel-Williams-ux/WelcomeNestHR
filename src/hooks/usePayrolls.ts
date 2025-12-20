// src/hooks/usePayrolls.ts
import { useEffect, useState } from 'react';
import {
  collection,
  collectionGroup,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface PayrollRun {
  id: string;
  companyId: string;
  companyName?: string;
  period?: string;
  status?: string;
  lastRun?: string; // ISO or string
  createdAt?: any;
  employeesCount?: number;
  [k: string]: any;
}

export default function usePayrolls() {
  const [latestPerCompany, setLatestPerCompany] = useState<PayrollRun[]>([]);
  const [recentRuns, setRecentRuns] = useState<PayrollRun[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch companies (static) then fetch latest payroll for each
  const fetchLatestPerCompany = async () => {
    setLoadingLatest(true);
    setError(null);
    try {
      const compsSnap = await getDocs(
        query(collection(db, 'companies'), orderBy('createdAt', 'desc'))
      );
      const companies = compsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      const results: PayrollRun[] = [];

      // Sequentially fetch latest payroll for each company (could be parallel if desired)
      for (const c of companies) {
        const payrollsRef = collection(db, 'companies', c.id, 'payrolls');
        const q = query(payrollsRef, orderBy('createdAt', 'desc'), limit(1));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const p = snap.docs[0];
          results.push({
            id: p.id,
            companyId: c.id,
            companyName: c.name,
            employeesCount: c.employeeCount ?? 0,
            ...(p.data() as any),
          });
        } else {
          results.push({
            id: `none-${c.id}`,
            companyId: c.id,
            companyName: c.name,
            employeesCount: c.employeeCount ?? 0,
            period: '—',
            status: 'No Data',
            lastRun: '—',
          });
        }
      }

      setLatestPerCompany(results);
    } catch (err: any) {
      console.error('fetchLatestPerCompany', err);
      setError('Failed to fetch latest payroll per company');
    } finally {
      setLoadingLatest(false);
    }
  };

  // Fetch recent payroll runs across ALL companies (collectionGroup)
  const fetchRecentRuns = async (limitCount = 10) => {
    setLoadingRecent(true);
    setError(null);
    try {
      const q = query(
        collectionGroup(db, 'payrolls'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);

      // collectionGroup docs don't include companyId in path, so extract from ref.path
      const runs: PayrollRun[] = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data() as any;
          // the parent path is companies/{companyId}/payrolls/{payId}
          const pathParts = d.ref.path.split('/');
          // pathParts = ["companies", "{companyId}", "payrolls", "{payId}"]
          const companyId = pathParts[1];
          let companyName: string | undefined = undefined;
          try {
            const companyDoc = await getDoc(doc(db, 'companies', companyId));
            if (companyDoc.exists())
              companyName = (companyDoc.data() as any).name;
          } catch (e) {
            // ignore
          }

          return {
            id: d.id,
            companyId,
            companyName,
            ...(data as any),
          } as PayrollRun;
        })
      );

      setRecentRuns(runs);
    } catch (err: any) {
      console.error('fetchRecentRuns', err);
      setError('Failed to fetch recent payroll runs');
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    // initial load
    fetchLatestPerCompany();
    fetchRecentRuns(8);
    // no deps – manual refresh functions can be added if needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    latestPerCompany,
    recentRuns,
    loadingLatest,
    loadingRecent,
    error,
    refreshLatest: fetchLatestPerCompany,
    refreshRecent: fetchRecentRuns,
  };
}