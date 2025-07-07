"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section
      aria-label="WelcomeNest Hero Section"
      className="relative isolate overflow-hidden pt-32 pb-24 bg-white dark:bg-background-dark text-text-light dark:text-text-dark"
    >
      {/* Gradient blob background */}
      <div className="absolute inset-0 -z-10 blur-3xl" aria-hidden="true">
        <div className="w-full h-full bg-gradient-to-br from-brand-light via-accent-light to-[#FFD54F] opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col-reverse lg:flex-row items-center justify-between gap-16">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-xl text-center lg:text-left flex-1"
        >
          {/* Logo */}
          <div className="mb-6 flex justify-center lg:justify-start">
            <Image
              src="/welcomenesthr.webp"
              alt="WelcomeNestHR Logo"
              width={220}
              height={80}
              className="h-auto w-auto max-w-[220px] sm:max-w-[280px]"
              priority
            />
          </div>

          {/* Tagline */}
          <div className="text-sm text-gray-500 dark:text-gray-400 italic mb-4">
            Trusted by teams who care about more than just paperwork
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
            Onboarding that builds{" "}
            <span className="text-brand-light">belonging</span> — from the very
            first click.
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg text-gray-700 dark:text-gray-300">
            WelcomeNestHR is the first onboarding platform that fuses
            automation, emotional intelligence, and community — to help every
            new hire thrive from day one.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/get-started"
              className="px-6 py-3 bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white font-semibold rounded-lg shadow hover:brightness-95 transition text-sm sm:text-base"
            >
              Get Started
            </motion.a>
            <Link
              href="#features"
              className="text-brand-light font-medium hover:underline text-sm sm:text-base"
            >
              Explore Features
            </Link>
          </div>
        </motion.div>

        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex-1 w-full max-w-2xl"
        >
          <Image
            src="/illustrations/welcomenesthr.webp"
            alt="Illustration showing WelcomeNestHR platform"
            width={1000}
            height={720}
            className="w-full h-auto object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;