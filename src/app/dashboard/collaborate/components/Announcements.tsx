'use client';

import { motion } from 'framer-motion';
import { Megaphone } from 'lucide-react';
import { useCollaborate } from '@/hooks/useCollaborate';

export default function Announcement({
  companyId,
  employeeId,
}: {
  companyId: string;
  employeeId: string;
}) {
  const { announcements, loading } = useCollaborate(companyId, employeeId);

  return (
    <motion.section className="rounded-2xl shadow-sm bg-white dark:bg-gray-900 border p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-[#FB8C00]" />
        Announcements
      </h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <p className="text-sm text-gray-500">No announcements yet.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((item: any) => (
            <li key={item.id} className="p-4 rounded-lg bg-[#F9FAFB] border">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-gray-500">
                {item.createdAt?.toDate?.().toLocaleDateString?.() ?? ''}
              </p>
              <p className="mt-1 text-sm">{item.message}</p>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}