"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

// Data model for organization members
interface Member {
  id: string;
  name: string;
  role: string;
  managerId?: string | null; // root nodes have null
}

export default function OrgChart({ orgId }: { orgId: string }) {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!orgId) return;

    const membersRef = collection(db, "organizations", orgId, "members");
    const q = query(membersRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Member[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Member[];
      setMembers(data);
    });

    return () => unsubscribe();
  }, [orgId]);

  // Find root (e.g., CEO, no managerId)
  const root = members.find((m) => !m.managerId);

  if (!root) {
    return (
      <motion.section
        className="rounded-2xl shadow-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Org Chart 🏢
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No organization data yet.
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section
      className="rounded-2xl shadow-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      aria-labelledby="org-title"
    >
      <h2
        id="org-title"
        className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6"
      >
        Org Chart 🏢
      </h2>

      <div className="overflow-x-auto">
        <div className="flex flex-col items-center">
          <OrgNode node={root} members={members} />
        </div>
      </div>
    </motion.section>
  );
}

function OrgNode({ node, members }: { node: Member; members: Member[] }) {
  // Find direct reports
  const reports = members.filter((m) => m.managerId === node.id);

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <motion.div
        className="flex items-center gap-2 px-4 py-2 mb-4 rounded-lg bg-[#F9FAFB] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
        whileHover={{ scale: 1.03 }}
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#FFB300] to-[#FB8C00] flex items-center justify-center text-white text-xs font-bold">
          {node.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {node.name}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {node.role}
          </p>
        </div>
      </motion.div>

      {/* Reports */}
      {reports.length > 0 && (
        <div className="flex flex-wrap justify-center gap-6">
          {reports.map((report) => (
            <OrgNode key={report.id} node={report} members={members} />
          ))}
        </div>
      )}
    </div>
  );
}