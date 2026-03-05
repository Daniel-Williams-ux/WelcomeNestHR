'use client';

import { useEmployeeActiveFlow } from '@/hooks/useEmployeeActiveFlow';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useUserAccess } from '@/hooks/useUserAccess';

export default function DashboardHome() {
  const { loading, role, plan } = useUserAccess();

  const { flowId } = useEmployeeActiveFlow();

  if (loading) return <p className="p-6">Loading...</p>;
  if (!role)
    return <p className="p-6 text-red-600">Please sign in to continue.</p>;

  // ROLE-BASED REDIRECTION
  if (role === 'superadmin') redirect('/superadmin');
  if (role === 'hr') redirect('/hr');

 return (
   <div className="p-6 space-y-6">
     <h1 className="text-2xl font-semibold text-[#004d59] dark:text-white">
       Welcome to your dashboard!
     </h1>

     {role !== 'employee' && (
       <p className="mt-2 text-gray-600 dark:text-gray-400">
         Your plan: <strong>{plan}</strong>
       </p>
     )}

     {role === 'employee' && flowId && (
       <div className="p-6 rounded-xl border bg-white dark:bg-[#1c1c1c] shadow-sm">
         <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
           Your onboarding is in progress
         </h2>

         <p className="text-gray-600 dark:text-gray-400 mb-4">
           Complete your onboarding tasks to get fully set up.
         </p>

         <Link
           href="/dashboard/onboarding"
           className="inline-block px-4 py-2 rounded bg-[#00ACC1] text-white hover:opacity-90"
         >
           Continue Onboarding
         </Link>
       </div>
     )}
   </div>
 );
}
