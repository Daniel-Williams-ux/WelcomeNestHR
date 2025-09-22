'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // adjust based on your setup
import { useAuth } from '@/hooks/useAuth'; // assumes you have an auth hook

interface ComplianceModule {
  id: string;
  title: string;
  description: string;
  type: 'policy' | 'quiz';
}

export default function CompliancePage({ params }: { params?: any }) {
  const { user } = useAuth();
  const [modules, setModules] = useState<ComplianceModule[]>([]);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const orgId = params?.orgId || 'defaultOrg'; // adjust how you resolve orgId

  useEffect(() => {
    if (!orgId || !user) return;

    const fetchData = async () => {
      // Fetch compliance modules
      const snap = await getDocs(
        collection(db, 'organizations', orgId, 'complianceModules')
      );
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ComplianceModule[];
      setModules(list);

      // Fetch user progress
      const ref = doc(
        db,
        'organizations',
        orgId,
        'complianceProgress',
        user.uid
      );
      const progSnap = await getDoc(ref);
      if (progSnap.exists()) {
        setProgress(progSnap.data() as Record<string, any>);
      }
    };

    fetchData();
  }, [orgId, user]);

  return (
    <motion.section
      className="rounded-2xl shadow-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      aria-labelledby="compliance-title"
    >
      <h2
        id="compliance-title"
        className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2"
      >
        <ShieldCheck className="h-5 w-5 text-[#FB8C00]" /> Compliance Training
      </h2>

      {modules.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No compliance modules yet. Please check back later.
        </p>
      ) : (
        <ul className="space-y-4">
          {modules.map((m) => {
            const status = progress[m.id]?.status || 'not_started';
            const score = progress[m.id]?.score ?? null;

            return (
              <li
                key={m.id}
                className="p-4 rounded-lg bg-[#F9FAFB] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {m.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {m.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </span>
                    {score !== null && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Score: {score}%
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}