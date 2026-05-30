'use client';

import { useEmployeeActiveFlow } from '@/hooks/useEmployeeActiveFlow';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useUserAccess } from '@/hooks/useUserAccess';
import {
  BookOpenCheck,
  ClipboardCheck,
  HeartPulse,
  MessageSquare,
  ReceiptText,
  Users,
} from 'lucide-react';

const quickLinks = [
  {
    title: 'Onboarding',
    description: 'Continue assigned tasks and milestones.',
    href: '/dashboard/onboarding',
    icon: BookOpenCheck,
  },
  {
    title: 'Payslips',
    description: 'View payroll documents issued by HR.',
    href: '/dashboard/payslips',
    icon: ReceiptText,
  },
  {
    title: 'Compliance',
    description: 'Complete required policy training.',
    href: '/dashboard/compliance',
    icon: ClipboardCheck,
  },
  {
    title: 'LifeSync',
    description: 'Track wellbeing and workplace support.',
    href: '/dashboard/lifesync',
    icon: HeartPulse,
  },
];

export default function DashboardHome() {
  const { loading, role, user } = useUserAccess();

  const { flowId } = useEmployeeActiveFlow();

  if (loading) return <p className="p-6">Loading...</p>;
  if (!role)
    return <p className="p-6 text-red-600">Please sign in to continue.</p>;

 return (
   <div className="mx-auto max-w-7xl space-y-6">
     <section className="rounded-2xl bg-gradient-to-r from-[#004d59] to-[#00798a] p-6 text-white shadow-sm">
       <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
         Employee hub
       </p>
       <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
         <div>
           <h1 className="text-3xl font-bold">
             Welcome{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}.
           </h1>
           <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-50">
             Track onboarding, compliance, payslips, messages, and wellbeing from
             your employee workspace.
           </p>
         </div>
         <Link
           href={flowId ? '/dashboard/onboarding' : '/dashboard/payslips'}
           className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#004d59] transition hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-white"
         >
           {flowId ? (
             <>
               <BookOpenCheck size={16} aria-hidden="true" />
               Continue onboarding
             </>
           ) : (
             <>
               <ReceiptText size={16} aria-hidden="true" />
               View payslips
             </>
           )}
         </Link>
       </div>
     </section>

     {flowId && (
       <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-[#004d59]">
         <h2 className="text-lg font-semibold">Your onboarding is in progress</h2>
         <p className="mt-1 text-sm leading-6">
           Complete your assigned tasks to get fully set up in your role.
         </p>
       </section>
     )}

     <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
       {quickLinks.map((item) => {
         const Icon = item.icon;

         return (
           <Link
             key={item.href}
             href={item.href}
             className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:border-slate-800 dark:bg-slate-900"
           >
             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-[#008FA1]">
               <Icon size={20} aria-hidden="true" />
             </div>
             <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
               {item.title}
             </h2>
             <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
               {item.description}
             </p>
           </Link>
         );
       })}
     </section>

     <section className="grid gap-4 lg:grid-cols-2">
       <InfoCard
         icon={<Users size={20} aria-hidden="true" />}
         title="Collaborate"
         description="Meet teammates, buddies, and company contacts."
         href="/dashboard/collaborate"
       />
       <InfoCard
         icon={<MessageSquare size={20} aria-hidden="true" />}
         title="Messages"
         description="Keep HR and team conversations in one place."
         href="/dashboard/messages"
       />
     </section>
   </div>
 );
}

function InfoCard({
  icon,
  title,
  description,
  href,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#00ACC1] dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#004d59]">
        {icon}
      </div>
      <div>
        <h2 className="font-semibold text-slate-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>
    </Link>
  );
}
