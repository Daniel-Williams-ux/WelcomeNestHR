'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAccess } from '@/hooks/useUserAccess';

export default function RoleRouter() {
  const { user, role, loading } = useUserAccess();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
    } else if (role === 'superadmin') {
      router.replace('/superadmin');
    } else if (role === 'hr') {
      router.replace('/hr');
    } else if (role === 'employee') {
      router.replace('/dashboard'); // employee default
    }
  }, [user, role, loading, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">
          {user && !role ? 'Workspace setup needed' : 'Redirecting...'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {user && !role
            ? 'Your account is signed in, but no dashboard role has been linked yet. Use your invitation link or contact your company admin.'
            : 'Preparing your workspace.'}
        </p>
      </section>
    </main>
  );
}