import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type CurrentCompany = {
  id: string;
  name?: string;
  plan?: string;
  status?: string;
};

export function useCurrentCompany(user: any | null) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<CurrentCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCompany() {
      setError(null);

      if (!user?.companyId) {
        setCompanyId(null);
        setCompany(null);
        setLoading(false);
        return;
      }

      setCompanyId(user.companyId);
      setLoading(true);

      try {
        const snap = await getDoc(doc(db, 'companies', user.companyId));

        if (cancelled) return;

        if (!snap.exists()) {
          setCompany(null);
          setError('Company not found.');
          return;
        }

        setCompany({
          id: snap.id,
          ...(snap.data() as Omit<CurrentCompany, 'id'>),
        });
      } catch (err) {
        if (!cancelled) {
          console.error('[useCurrentCompany] failed:', err);
          setCompany(null);
          setError('Unable to load company.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!user) {
      setCompanyId(null);
      setCompany(null);
      setLoading(false);
      return;
    }

    loadCompany();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { companyId, company, loading, error };
}