'use client';

import { motion } from 'framer-motion';
import { Coffee, Mail } from 'lucide-react';
import { useCollaborate } from '@/hooks/useCollaborate';

export default function BuddyCard({
  companyId,
  employeeId,
}: {
  companyId: string;
  employeeId: string;
}) {
  const { buddy, loading } = useCollaborate(companyId, employeeId);

  if (loading) {
    return (
      <section className="rounded-2xl p-6 bg-white dark:bg-gray-900 border">
        <p className="text-sm text-gray-500">Loading buddy...</p>
      </section>
    );
  }

  if (!buddy) {
    return (
      <motion.section className="rounded-2xl shadow-sm bg-white dark:bg-gray-900 border p-6">
        <h2 className="text-lg font-semibold mb-4">Your Buddy 🎉</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No buddy assigned yet.
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section className="rounded-2xl shadow-sm bg-white dark:bg-gray-900 border p-6">
      <h2 className="text-lg font-semibold mb-4">Your Buddy 🎉</h2>

      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#FFB300] to-[#FB8C00] flex items-center justify-center text-white font-bold">
          {buddy.buddyId?.charAt(0).toUpperCase() || 'B'}
        </div>

        <div>
          <p className="text-sm font-medium">Buddy Assigned</p>
          <p className="text-xs text-gray-500">ID: {buddy.buddyId}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#00ACC1]/10 text-[#00ACC1] text-sm">
          <Coffee className="h-4 w-4" /> Coffee Chat
        </button>

        <a
          href="#"
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#FB8C00]/10 text-[#FB8C00] text-sm"
        >
          <Mail className="h-4 w-4" /> Message
        </a>
      </div>
    </motion.section>
  );
}