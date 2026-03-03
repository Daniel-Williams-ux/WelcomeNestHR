'use client';

import { useUserAccess } from '@/hooks/useUserAccess';
import UpgradeToContinue from './UpgradeToContinue';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, plan } = useUserAccess();

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please sign in</p>;

  const canAccessPremium = plan === 'platinum' || plan === 'trial';

  if (!canAccessPremium) {
    return <UpgradeToContinue plan={plan} />;
  }

  return <>{children}</>;
}