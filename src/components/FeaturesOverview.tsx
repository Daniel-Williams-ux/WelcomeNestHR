"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const features = [
  {
    title: "Smart Onboarding Engine",
    description:
      "An adaptive roadmap tailored to each role, team, and individual—so every new hire lands with clarity and confidence.",
    icon: "/icons/roadmap1.jpg",
  },
  {
    title: "LifeSync Wellness",
    description:
      "Daily mood tracking, well-being nudges, and emotional check-ins that support the whole human—because people aren't just profiles.",
    icon: "/icons/wellness.jpg",
  },
  {
    title: "Connect & Collaborate",
    description:
      "Build human connections from day one with AI-powered buddy matches, dynamic org charts, and vibrant team intros.",
    icon: "/icons/connect.jpg",
  },
  {
    title: "Gamified Compliance",
    description:
      "Turn training into a journey—not a chore—with interactive policy quizzes and unlockable progress milestones.",
    icon: "/icons/gamified1.jpg",
  },
  {
    title: "Performance Primer",
    description:
      "Guide growth with 30-60-90 day goal-setting and reflective check-ins. Progress with purpose, not pressure.",
    icon: "/icons/goals.jpg",
  },
];

const FeaturesOverview = () => {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="py-20 bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold mb-4"
        >
          Where Technology Meets Humanity
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto"
        >
          WelcomeNestHR transforms onboarding into a deeply human experience—
          blending emotional intelligence, culture, and community into every
          click.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white dark:bg-background-dark rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 text-left"
            >
              <div className="w-24 h-12 mb-4">
                <Image
                  src={feature.icon}
                  alt={`${feature.title} icon`}
                  width={98}
                  height={98}
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesOverview;