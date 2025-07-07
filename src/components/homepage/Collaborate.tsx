"use client";

import { motion } from "framer-motion";
import { Users, MessageCircle, ThumbsUp } from "lucide-react";

export const Collaborate = () => {
  return (
    <section
      id="collaborate"
      className="relative isolate overflow-hidden py-24 bg-[#FFFDF6] dark:bg-[#0B1120] text-gray-800 dark:text-white"
    >
      {/* Subtle background stripes */}
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#FB8C00]/5 via-[#00ACC1]/10 to-transparent"
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-6">
        <motion.h2
          className="text-4xl sm:text-5xl font-bold text-center text-[#00ACC1] mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Collaborate from Day One
        </motion.h2>

        <motion.p
          className="text-gray-700 dark:text-gray-300 text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          WelcomeNestHR jumpstarts connection with built-in tools for dialogue,
          bonding, and real teamwork — because collaboration isn’t a task, it’s
          a culture.
        </motion.p>

        {/* Grid layout for features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <FeatureTile
            icon={<Users className="h-6 w-6 text-[#00ACC1]" />}
            title="Peer Introductions"
            desc="Meet the people who matter most — teammates — in a warm, guided way."
          />
          <FeatureTile
            icon={<MessageCircle className="h-6 w-6 text-[#FB8C00]" />}
            title="Dialogue Channels"
            desc="Spaces for questions, culture chats, and real conversations that build trust."
          />
          <FeatureTile
            icon={<ThumbsUp className="h-6 w-6 text-[#FBC02D]" />}
            title="Shared Wins"
            desc="Celebrate early milestones and small wins to build team spirit."
          />
        </div>
      </div>
    </section>
  );
};

const FeatureTile = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <motion.div
    className="flex items-start gap-4 p-5 bg-white/80 dark:bg-white/5 rounded-lg shadow-sm backdrop-blur border border-gray-200/50 dark:border-white/10 transition hover:shadow-md"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="shrink-0 bg-[#F1F1F1] dark:bg-gray-800 p-3 rounded-full">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{desc}</p>
    </div>
  </motion.div>
);