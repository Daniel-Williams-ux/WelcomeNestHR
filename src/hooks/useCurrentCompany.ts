import { useEffect, useState } from 'react';

export function useCurrentCompany(user: any | null) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCompanyId(null);
      setLoading(false);
      return;
    }

    if (!user.companyId) {
      setCompanyId(null);
      setLoading(false);
      return;
    }

    setCompanyId(user.companyId);
    setLoading(false);
  }, [user]);

  return { companyId, loading, error };
}