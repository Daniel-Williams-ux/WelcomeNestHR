'use client';

import { motion } from 'framer-motion';
import BuddyCard from './components/BuddyCard';
import OrgChart from './components/OrgChart';
import Announcement from './components/Announcements';
import { useUserAccess } from '@/hooks/useUserAccess';

export default function CollaboratePage() {
  const { user, companyId } = useUserAccess();

  if (!user || !companyId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Loading your collaboration workspace...
      </div>
    );
  }

  return (
    <motion.div className="space-y-8 px-6 py-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Collaborate</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Connect with your buddy, read announcements, and understand your team.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <BuddyCard companyId={companyId} employeeId={user.employeeId} />
          <Announcement companyId={companyId} employeeId={user.employeeId} />
        </div>

        <div className="lg:col-span-2">
          <OrgChart companyId={companyId} employeeId={user.employeeId} />
        </div>
      </div>
    </motion.div>
  );
}