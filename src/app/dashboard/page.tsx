'use client';

import { redirect } from 'next/navigation';
import { useUserAccess } from '@/hooks/useUserAccess';

export default function DashboardHome() {
  const { loading, role, plan } = useUserAccess();

  if (loading) return <p className="p-6">Loading...</p>;
  if (!role)
    return <p className="p-6 text-red-600">Please sign in to continue.</p>;

  // ROLE-BASED REDIRECTION
  if (role === 'superadmin') redirect('/superadmin');
  if (role === 'hr') redirect('/hr');

 return (
   <div className="p-6">
     <h1 className="text-2xl font-semibold text-[#004d59] dark:text-white">
       Welcome to your dashboard!
     </h1>

     {role !== 'employee' && (
       <p className="mt-2 text-gray-600 dark:text-gray-400">
         Your plan: <strong>{plan}</strong>
       </p>
     )}
   </div>
 );
}
