'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAccess } from '@/hooks/useUserAccess';

export default function SuspendedPage() {
  const router = useRouter();
  const { loading, isSuspended, user } = useUserAccess();

  // If user is NOT suspended, push them back safely
  useEffect(() => {
    if (!loading && user && !isSuspended) {
      router.replace('/dashboard');
    }
  }, [loading, isSuspended, user, router]);

  if (loading) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div
        className="max-w-md w-full bg-white shadow-md rounded-lg p-6 text-center"
        role="alert"
        aria-live="polite"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Account Suspended
        </h1>

        <p className="text-gray-600 mb-4">
          Your account has been temporarily suspended by an administrator.
        </p>

        <p className="text-sm text-gray-500 mb-6">
          If you believe this is a mistake or need assistance, please contact
          your organization administrator or support.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/logout"
            className="inline-flex justify-center items-center rounded-md bg-gray-900 px-4 py-2 text-white text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            Sign out
          </Link>

          <Link href="/" className="text-sm text-gray-600 hover:underline">
            Go to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}