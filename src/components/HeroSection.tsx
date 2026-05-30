"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const proofPoints = [
  "Role-based onboarding paths",
  "Wellness and belonging signals",
  "Compliance without busywork",
];

const HeroSection = () => {
  const reduceMotion = useReducedMotion();
  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55 },
      };

  return (
    <section
      aria-label="WelcomeNestHR introduction"
      className="relative isolate overflow-hidden bg-[#FFFDF6] pt-20 text-slate-950 dark:bg-[#121212] dark:text-white"
    >
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(0,172,193,0.16),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(251,140,0,0.16),transparent_28%)]"
        aria-hidden="true"
      />

      <div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:min-h-[calc(88svh-5rem)] lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-10">
        <motion.div {...motionProps} className="mx-auto max-w-2xl lg:mx-0">
          <Image
            src="/welcomenesthr.png"
            alt="WelcomeNestHR"
            width={220}
            height={96}
            className="mb-6 h-auto w-32 sm:w-40 lg:hidden"
            sizes="(max-width: 640px) 128px, (max-width: 1024px) 160px, 144px"
            priority
          />

          <p className="mb-3 max-w-xl text-sm font-medium uppercase tracking-[0.16em] text-[#008FA1] dark:text-[#26C6DA]">
            Human-first HR for growing teams
          </p>

          <h1 className="max-w-3xl text-4xl font-black leading-[1.05] text-slate-950 sm:text-5xl lg:text-5xl xl:text-6xl dark:text-white">
            Build onboarding that feels like{" "}
            <span className="text-[#00ACC1]">belonging</span> from the first
            click.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg dark:text-slate-300">
            WelcomeNestHR blends onboarding automation, emotional intelligence,
            and team connection so every new hire lands with clarity,
            confidence, and care.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-gradient-to-r from-[#FFB300] to-[#FB8C00] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:brightness-95"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#00ACC1] bg-white/80 px-6 py-3 text-sm font-bold text-[#008FA1] transition hover:bg-cyan-50 dark:bg-white/5 dark:text-[#26C6DA] dark:hover:bg-white/10"
            >
              Request Demo
            </Link>
          </div>

          <ul className="mt-6 grid gap-3 text-sm font-medium text-slate-700 sm:grid-cols-3 dark:text-slate-300">
            {proofPoints.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#00ACC1]"
                  aria-hidden="true"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0, scale: 0.96 },
                animate: { opacity: 1, scale: 1 },
                transition: { delay: 0.1, duration: 0.55 },
              })}
          className="relative mx-auto w-full max-w-xl lg:max-w-2xl"
        >
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-[#00ACC1]/15 via-white to-[#FB8C00]/20 blur-2xl dark:via-transparent" />
          <Image
            src="/illustrations/welcome.webp"
            alt="People collaborating during a warm onboarding experience"
            width={1000}
            height={720}
            className="h-auto w-full object-contain"
            sizes="(max-width: 1024px) 92vw, 48vw"
            priority
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
