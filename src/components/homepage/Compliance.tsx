"use client";

import { motion } from "framer-motion";
import { ShieldCheck, BookOpenCheck, Trophy } from "lucide-react";

export const Compliance = () => {
  return (
    <section
      id="compliance"
      className="relative py-24 px-6 bg-white dark:bg-[#0F172A] overflow-hidden"
    >
      {/* Background glow shapes */}
      <div
        className="absolute left-0 top-0 w-80 h-80  blur-3xl rounded-full"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 bottom-0 w-96 h-96  rounded-full"
        aria-hidden="true"
      />

      <div className="max-w-4xl mx-auto text-left">
        <motion.h2
          className="text-4xl sm:text-5xl font-bold text-[#FB8C00] mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Gamified Compliance
        </motion.h2>

        <motion.p
          className="text-gray-700 dark:text-gray-300 max-w-2xl mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Say goodbye to boring paperwork. Our playful policy paths and quiz
          challenges turn mandatory training into a rewarding experience.
        </motion.p>

        {/* Timeline */}
        <div className="relative border-l-4 border-dashed border-[#FB8C00] pl-6 space-y-12">
          <TimelineItem
            icon={<ShieldCheck className="w-6 h-6 text-[#FB8C00]" />}
            title="Secure & Compliant"
            desc="Ensure every new hire meets your organization's legal and ethical standards."
          />
          <TimelineItem
            icon={<BookOpenCheck className="w-6 h-6 text-[#00ACC1]" />}
            title="Interactive Training"
            desc="Learn policies through bite-sized, interactive modules and real-world scenarios."
          />
          <TimelineItem
            icon={<Trophy className="w-6 h-6 text-[#FBC02D]" />}
            title="Policy Quizzes & Badges"
            desc="Gamified quizzes track mastery and reward completion with digital badges."
          />
        </div>
      </div>
    </section>
  );
};

const TimelineItem = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <motion.div
    className="relative pl-6"
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4 }}
  >
    {/* Icon bullet */}
    <div className="absolute -left-[38px] top-1">
      <div className="flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 border border-[#FB8C00] rounded-full shadow-md">
        {icon}
      </div>
    </div>

    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
      {title}
    </h3>
    <p className="text-sm text-gray-600 dark:text-gray-300">{desc}</p>
  </motion.div>
);
