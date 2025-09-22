"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Coffee, Mail } from "lucide-react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase"; // adjust if your firebase config path differs
import { useAuth } from "@/hooks/useAuth"; // assuming you already have a hook to get current user

interface Buddy {
  name: string;
  role: string;
  email?: string;
  avatar?: string; // optional: profile picture
}

export default function BuddyCard({ orgId }: { orgId: string }) {
  const { user } = useAuth();
  const [buddy, setBuddy] = useState<Buddy | null>(null);

  useEffect(() => {
    if (!user || !orgId) return;

    // Path: organizations/{orgId}/buddies/{userId}
    const buddyRef = doc(db, "organizations", orgId, "buddies", user.uid);

    const unsubscribe = onSnapshot(buddyRef, (snapshot) => {
      if (snapshot.exists()) {
        setBuddy(snapshot.data() as Buddy);
      } else {
        setBuddy(null);
      }
    });

    return () => unsubscribe();
  }, [user, orgId]);

  if (!buddy) {
    return (
      <motion.section
        className="rounded-2xl shadow-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Your Buddy 🎉
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No buddy assigned yet.
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
      aria-labelledby="buddy-title"
    >
      <h2
        id="buddy-title"
        className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4"
      >
        Your Buddy 🎉
      </h2>

      <div className="flex items-center gap-4">
        {/* Avatar */}
        {buddy.avatar ? (
          <img
            src={buddy.avatar}
            alt={buddy.name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#FFB300] to-[#FB8C00] flex items-center justify-center text-white font-bold">
            {buddy.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Info */}
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {buddy.name}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {buddy.role}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#00ACC1]/10 text-[#00ACC1] hover:bg-[#00ACC1]/20 text-sm font-medium transition"
        >
          <Coffee className="h-4 w-4" /> Coffee Chat
        </button>
        {buddy.email && (
          <a
            href={`mailto:${buddy.email}`}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#FB8C00]/10 text-[#FB8C00] hover:bg-[#FB8C00]/20 text-sm font-medium transition"
          >
            <Mail className="h-4 w-4" /> Message
          </a>
        )}
      </div>
    </motion.section>
  );
}