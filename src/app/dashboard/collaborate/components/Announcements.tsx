"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase"; // adjust if your firebase config path is different

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  pinned?: boolean;
}

export default function Announcement({ orgId }: { orgId: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!orgId) return;

    const ref = collection(db, "organizations", orgId, "announcements");
    const q = query(
      ref,
      orderBy("pinned", "desc"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Announcement[];
      setAnnouncements(data);
    });

    return () => unsubscribe();
  }, [orgId]);

  return (
    <motion.section
      className="rounded-2xl shadow-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      aria-labelledby="announcement-title"
    >
      <h2
        id="announcement-title"
        className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"
      >
        <Megaphone className="h-5 w-5 text-[#FB8C00]" /> Announcements
      </h2>

      {announcements.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No announcements yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((item) => (
            <li
              key={item.id}
              className="p-4 rounded-lg bg-[#F9FAFB] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-sm transition"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {item.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.createdAt?.toDate?.().toLocaleDateString?.() ?? ""}
              </p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                {item.message}
              </p>
              {item.pinned && (
                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium text-[#FB8C00] bg-[#FB8C00]/10 rounded">
                  📌 Pinned
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}