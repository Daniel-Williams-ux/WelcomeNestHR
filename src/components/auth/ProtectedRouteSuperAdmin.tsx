'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function ProtectedRouteSuperAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.role === 'superadmin') {
            setAuthorized(true);
          } else {
            router.push('/dashboard'); // Redirect non-admin users to normal dashboard
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking superadmin role:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 dark:text-gray-200">
        Checking access...
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}