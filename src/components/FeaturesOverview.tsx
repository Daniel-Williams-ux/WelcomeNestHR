"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

const features = [
  {
    title: "Smart Onboarding Engine",
    description:
      "Adaptive roadmaps tailored to each role, team, and individual so every new hire lands with clarity.",
    icon: "/icons/roadmap1.jpg",
  },
  {
    title: "LifeSync Wellness",
    description:
      "Mood tracking, well-being nudges, and emotional check-ins that support the whole human.",
    icon: "/icons/wellness.jpg",
  },
  {
    title: "Connect & Collaborate",
    description:
      "AI-powered buddy matches, dynamic org charts, and team intros that make connection easier.",
    icon: "/icons/connect.jpg",
  },
  {
    title: "Gamified Compliance",
    description:
      "Interactive policy paths and progress milestones that make required training feel lighter.",
    icon: "/icons/gamified1.jpg",
  },
  {
    title: "Performance Primer",
    description:
      "30-60-90 day goals and reflective check-ins that guide growth with purpose.",
    icon: "/icons/goals.jpg",
  },
];

const FeaturesOverview = () => {
  const reduceMotion = useReducedMotion();
  const viewport = { once: true, amount: 0.25 };

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="bg-[#F9FAFB] py-20 text-slate-950 dark:bg-[#1E1E1E] dark:text-white sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          viewport={viewport}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#FB8C00]">
            Platform modules
          </p>
          <h2
            id="features-heading"
            className="mt-3 text-3xl font-black tracking-normal sm:text-4xl"
          >
            Where technology meets humanity
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
            A connected HR experience for onboarding, belonging, compliance,
            and early performance momentum.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              viewport={viewport}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md dark:border-white/10 dark:bg-[#121212]"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-md bg-cyan-50">
                <Image
                  src={feature.icon}
                  alt=""
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  sizes="56px"
                />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {feature.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesOverview;
