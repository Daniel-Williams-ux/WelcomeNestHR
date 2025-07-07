"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  {
    icon: "🌱",
    title: "Human-Centric Design",
    description:
      "Craft onboarding journeys that prioritize connection, clarity, and care—not just compliance.",
  },
  {
    icon: "🧠",
    title: "Smart Meets Heart",
    description:
      "Our AI adapts to each role and person, while emotional intelligence drives lasting engagement.",
  },
  {
    icon: "🌐",
    title: "Cultural Immersion",
    description:
      "From rituals to values, help new hires feel part of the team before their first meeting.",
  },
  {
    icon: "💡",
    title: "Frictionless Compliance",
    description:
      "Turn policies into experiences—gamified, personalized, and never a chore.",
  },
];

// Framer motion variants
const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function WhyWelcomeNestHR() {
  return (
    <section
      id="why"
      className="py-24 bg-[#F9FAFB] dark:bg-[#121212] scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={item}
          className="text-center"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-[#00ACC1]">
            Why WelcomeNestHR?
          </h2>
          <p className="mt-4 text-gray-700 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            More than onboarding—create belonging, from offer to impact.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          className="mt-16 grid gap-10 sm:grid-cols-2"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {features.map(({ icon, title, description }) => (
            <motion.div
              key={title}
              variants={item}
              className="flex items-start gap-4"
            >
              <div className="text-3xl">{icon}</div>
              <div>
                <h4 className="text-lg font-semibold text-[#00ACC1]">
                  {title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-16 flex flex-col sm:flex-row justify-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Link href="/demo">
            <button className="px-6 py-3 text-white bg-gradient-to-r from-[#FFB300] to-[#FB8C00] hover:brightness-90 transition rounded-lg text-sm font-semibold shadow">
              Request a Demo
            </button>
          </Link>
          <Link href="#onboarding">
            <button className="px-6 py-3 border border-[#00ACC1] text-[#00ACC1] font-medium rounded-lg hover:bg-[#E0F7FA] dark:hover:bg-gray-800 transition">
              Explore the Platform
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}