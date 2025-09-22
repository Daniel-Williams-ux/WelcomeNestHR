"use client";

import { motion } from "framer-motion";
import BuddyCard from "./components/BuddyCard";
import OrgChart from "./components/OrgChart";
import Announcement from "./components/Announcements";

export default function CollaboratePage() {
  return (
    <motion.div
      className="space-y-8 px-6 py-8 bg-[#F9FAFB] dark:bg-[#121212] min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Collaborate 🤝
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
          Connect with your buddy, see team updates, and navigate your org with
          ease. Collaboration starts on day one.
        </p>
      </header>

      {/* Layout: BuddyCard + OrgChart + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <BuddyCard />
          <Announcement />
        </div>
        <div className="lg:col-span-2">
          <OrgChart />
        </div>
      </div>
    </motion.div>
  );
}
