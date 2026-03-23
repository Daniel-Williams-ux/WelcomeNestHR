'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAccess } from '@/hooks/useUserAccess';
import { query, where } from 'firebase/firestore';

interface ComplianceModule {
  id: string;
  title: string;
  description: string;
  type: 'policy' | 'training';
  status?: 'pending' | 'completed';
}

export default function CompliancePage() {
  const { user } = useUserAccess();

  const [modules, setModules] = useState<ComplianceModule[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
   if (!user?.uid) return;

   const init = async () => {
     try {
       //  ALWAYS fetch fresh user doc
       const userRef = doc(db, 'users', user.uid);
       const userSnap = await getDoc(userRef);


       const data = userSnap.data();

       const companyId = data.companyId;
      if (!companyId) {
        setModules([]);
        setLoading(false);
        return;
      }

      //  get employeeId from employees collection (CORRECT SOURCE)
      const empQuery = query(
        collection(db, 'companies', companyId, 'employees'),
        where('uid', '==', user.uid),
      );

       const empSnap = await getDocs(empQuery);
       
       if (empSnap.empty) {
         console.log('⏳ employee not ready yet, retrying...');
         return; // ❗ REMOVE setLoading(false)
       }

      if (empSnap.empty) {
        setModules([]);
        setLoading(false);
        return;
      }

      const employeeId = empSnap.docs[0].id;

      console.log('employeeId resolved:', employeeId);

       // =========================
       // FETCH ASSIGNMENTS
       // =========================
       const assignSnap = await getDocs(
         collection(db, 'companies', companyId, 'complianceAssignments'),
       );

       const myAssignments = assignSnap.docs
         .map((doc) => {
           const data = doc.data();

           return {
             id: doc.id,
             employeeId: String(data.employeeId),
             moduleId: data.moduleId,
             status: data.status,
           };
         })
         .filter((a) => {
           console.log('Comparing:', a.employeeId, employeeId);
           return a.employeeId === String(employeeId);
         });

       console.log('Filtered assignments:', myAssignments);

       if (myAssignments.length === 0) {
         setModules([]);
         setLoading(false);
         return;
       }

       // =========================
       // FETCH MODULES
       // =========================
       const moduleSnap = await getDocs(
         collection(db, 'companies', companyId, 'complianceModules'),
       );

       const moduleMap: Record<string, any> = {};

       moduleSnap.docs.forEach((doc) => {
         moduleMap[doc.id] = {
           id: doc.id,
           ...doc.data(),
         };
       });

       // =========================
       // MERGE
       // =========================
       const seen = new Set();

       const assignedModules = myAssignments
         .filter((a: any) => {
           if (seen.has(a.moduleId)) return false;
           seen.add(a.moduleId);
           return true;
         })
         .map((a: any) => {
           const moduleItem = moduleMap[a.moduleId];

           if (!moduleItem) return null;

           return {
             ...moduleItem,
             status: a.status || 'pending',
             assignmentId: a.id,
           };
         })
         .filter(Boolean);

       setModules(assignedModules);
     } catch (err) {
       console.error('Compliance load error:', err);
     } finally {
       setLoading(false);
     }
   };

   init();
 }, [user?.uid]);
  
  const markAsCompleted = async (assignmentId: string) => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      const companyId = userSnap.data()?.companyId;
      if (!companyId) return;

      await updateDoc(
        doc(db, 'companies', companyId, 'complianceAssignments', assignmentId),
        {
          status: 'completed',
        },
      );

      // 🔄 refresh
      setModules((prev) =>
        prev.map((m: any) =>
          m.assignmentId === assignmentId ? { ...m, status: 'completed' } : m,
        ),
      );
    } catch (err) {
      console.error('Mark complete error:', err);
    }
  };
  
  
  // =========================
  // LOADING STATE
  // =========================
  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading compliance modules...
      </div>
    );
  }

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
          No compliance modules assigned to you yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {modules.map((m) => {
            const status = m.status || 'pending';

            return (
              <li
                key={`${m.id}-${m.status}`}
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
                          : status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </span>
                    {status === 'pending' && (
                      <button
                        onClick={() => markAsCompleted(m.assignmentId)}
                        className="text-xs px-2 py-1 rounded bg-[#00ACC1] text-white hover:opacity-90"
                      >
                        Mark Complete
                      </button>
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