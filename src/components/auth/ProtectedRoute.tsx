'use client';

import { useUserAccess } from '@/hooks/useUserAccess';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import UpgradeToContinue from './UpgradeToContinue';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, plan, isTrialExpired } = useUserAccess();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login'); //  proper redirect
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 dark:text-gray-200">
        Checking access...
      </div>
    );
  }

  const canAccessPremium = plan === 'Platinum' || (plan === 'Trial' && !isTrialExpired);

  if (!canAccessPremium) {
    return <UpgradeToContinue plan={plan} isTrialExpired={isTrialExpired} />;
  }

  return <>{children}</>;
}
