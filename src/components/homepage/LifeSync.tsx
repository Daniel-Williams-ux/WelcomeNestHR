"use client";

import { motion } from "framer-motion";
import { HeartPulse, Smile, CalendarCheck } from "lucide-react";

export const LifeSync = () => {
  return (
    <section
      id="lifesync"
      className="relative isolate overflow-hidden py-24 bg-white dark:bg-[#0F172A] text-text-light dark:text-text-dark"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 -z-10">
        <div
          className="w-full h-full bg-gradient-radial from-[#FBC02D]/10 via-transparent to-transparent blur-3xl"
          aria-hidden="true"
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 text-center">
        <motion.h2
          className="text-4xl sm:text-5xl font-bold text-[#00ACC1] mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          LifeSync: Support That Grows With You
        </motion.h2>

        <motion.p
          className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          LifeSync is your personal wellness ally during onboarding. From
          AI-guided nudges to gentle mood reflections, we care for every part of
          you — not just your role. It seamlessly integrates with your
          onboarding roadmap to support emotional well-being at every step.
        </motion.p>

        <div className="space-y-8 max-w-3xl mx-auto">
          <FeatureCard
            icon={<HeartPulse className="h-7 w-7 text-[#FB8C00]" />}
            title="Mood Tracker"
            desc="Daily emotional check-ins that prioritize how you feel, not just what you do."
          />
          <FeatureCard
            icon={<Smile className="h-7 w-7 text-[#00ACC1]" />}
            title="Wellness Nudges"
            desc="Subtle, meaningful reminders to breathe, reflect, and stay grounded."
          />
          <FeatureCard
            icon={<CalendarCheck className="h-7 w-7 text-[#FBC02D]" />}
            title="Personalized Support"
            desc="AI-powered insights and actions that adapt to your emotional rhythm."
          />
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <motion.div
    className="flex items-start gap-4 bg-white/90 dark:bg-gray-900/90 border border-gray-100 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition text-left"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <div className="shrink-0">{icon}</div>
    <div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">{desc}</p>
    </div>
  </motion.div>
);