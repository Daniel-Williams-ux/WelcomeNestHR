'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, CalendarCheck2, BarChart3 } from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth'; // assuming you already have this

export default function PrimerPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const ref = collection(db, 'users', user.uid, 'primer');
    const unsub = onSnapshot(ref, (snapshot) => {
      setPlans(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (!user) {
    return <p className="p-6">Please sign in to view your Primer.</p>;
  }

  return (
    <div className="p-6">
      <motion.h1
        className="text-2xl font-bold text-[#FB8C00] mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Performance Primer
      </motion.h1>

      {loading && <p>Loading your 30-60-90 plan...</p>}

      {!loading && plans.length === 0 && (
        <p className="text-gray-600">
          No 30-60-90 plan found. Your manager will set this up for you.
        </p>
      )}

      <div className="space-y-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {plan.role || 'New Hire'} — 30-60-90 Plan
            </h2>
            <div className="mt-4 space-y-4">
              {plan.milestones?.map((m: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  {m.day === 30 && (
                    <Target className="h-5 w-5 text-[#FB8C00]" />
                  )}
                  {m.day === 60 && (
                    <CalendarCheck2 className="h-5 w-5 text-[#FB8C00]" />
                  )}
                  {m.day === 90 && (
                    <BarChart3 className="h-5 w-5 text-[#FB8C00]" />
                  )}

                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Day {m.day}: {m.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status: {m.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}