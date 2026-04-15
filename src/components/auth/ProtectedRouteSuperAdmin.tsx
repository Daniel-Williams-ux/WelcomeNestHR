'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAccess } from '@/hooks/useUserAccess';

export default function ProtectedRouteSuperAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, loading } = useUserAccess();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (role !== 'superadmin') {
      router.replace('/route-router'); //  smart redirect
    }
  }, [role, loading, router]);

  if (loading || role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 dark:text-gray-200">
        Checking access...
      </div>
    );
  }

  return <>{children}</>;
}
