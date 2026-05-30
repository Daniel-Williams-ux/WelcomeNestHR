"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Brain, HeartHandshake, Lightbulb, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: HeartHandshake,
    title: "Human-Centric Design",
    description:
      "Craft onboarding journeys that prioritize connection, clarity, and care, not just compliance.",
  },
  {
    icon: Brain,
    title: "Smart Meets Heart",
    description:
      "Adapt every journey to the role and person while keeping emotional intelligence at the center.",
  },
  {
    icon: Lightbulb,
    title: "Cultural Immersion",
    description:
      "Help new hires understand rituals, values, and team norms before their first meeting.",
  },
  {
    icon: ShieldCheck,
    title: "Frictionless Compliance",
    description:
      "Turn policies into guided experiences that are clear, trackable, and easier to complete.",
  },
];

export default function WhyWelcomeNestHR() {
  const reduceMotion = useReducedMotion();
  const viewport = { once: true, amount: 0.25 };

  return (
    <section
      id="why"
      aria-labelledby="why-heading"
      className="scroll-mt-24 bg-white py-20 text-slate-950 dark:bg-[#121212] dark:text-white sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          viewport={viewport}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#FB8C00]">
            Why WelcomeNestHR
          </p>
          <h2
            id="why-heading"
            className="mt-3 text-3xl font-black tracking-normal text-[#00ACC1] sm:text-4xl"
          >
            Onboarding should create momentum, not confusion.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
            From offer to impact, WelcomeNestHR gives teams a calm,
            measurable way to turn admin tasks into belonging.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }, index) => (
            <motion.article
              key={title}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.4 }}
              viewport={viewport}
              className="rounded-lg border border-slate-200 bg-[#F9FAFB] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md dark:border-white/10 dark:bg-white/5"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-cyan-50 text-[#00ACC1] dark:bg-cyan-400/10 dark:text-[#26C6DA]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {description}
              </p>
            </motion.article>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/demo"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-gradient-to-r from-[#FFB300] to-[#FB8C00] px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:brightness-95"
          >
            Request a Demo
          </Link>
          <Link
            href="#onboarding"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#00ACC1] px-6 py-3 text-sm font-bold text-[#008FA1] transition hover:bg-cyan-50 dark:text-[#26C6DA] dark:hover:bg-white/10"
          >
            Explore the Platform
          </Link>
        </div>
      </div>
    </section>
  );
}
