'use client';

import { motion } from 'framer-motion';
import BuddyCard from './components/BuddyCard';
import OrgChart from './components/OrgChart';
import Announcement from './components/Announcements';
import { useUserAccess } from '@/hooks/useUserAccess';

export default function CollaboratePage() {
  const { user, companyId } = useUserAccess();

  console.log('USER:', user);
  console.log('companyId:', companyId);
  console.log('employeeId being passed:', user?.employeeId);

  if (!user || !companyId) return null;

  return (
    <motion.div className="space-y-8 px-6 py-8">
      <header>
        <h1 className="text-3xl font-bold">Collaborate 🤝</h1>
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