"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "If WelcomeNest had existed when I joined, I wouldn’t have felt so lost.",
    name: "New Hire Persona",
    role: "Software Engineer, Beta Interview",
  },
  {
    quote:
      "This solves our biggest onboarding headache—people not knowing who to turn to.",
    name: "HR Director",
    role: "Mid-size Tech Company (Pilot Feedback)",
  },
  {
    quote:
      "This is exactly the onboarding experience I wished I had at my last company.",
    name: "Jessica Lee",
    role: "Co-founder, WelcomeNest",
  },
];

export default function TestimonialsSlider() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
  const prev = () =>
    setCurrent(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );

  // Optional: auto-rotate every 7 seconds
  useEffect(() => {
    const interval = setInterval(next, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full py-12 px-4 md:px-12 bg-gradient-to-br from-[#f9fafb] to-[#f0f4f8] dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-4">
          What People Are Saying
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Early reflections from internal testers and future users
        </p>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 text-left space-y-4 mx-auto max-w-md"
              aria-live="polite"
            >
              <Quote className="text-pink-500 w-6 h-6" />
              <blockquote className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                “{testimonials[current].quote}”
              </blockquote>
              <footer className="text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                — <strong>{testimonials[current].name}</strong>,{" "}
                {testimonials[current].role}
              </footer>
            </motion.div>
          </AnimatePresence>

          {/* Arrows */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            <button
              aria-label="Previous testimonial"
              onClick={prev}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              aria-label="Next testimonial"
              onClick={next}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring"
            >
              <ArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Dots */}
        <div className="mt-6 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full ${
                i === current ? "bg-pink-500" : "bg-gray-300 dark:bg-gray-600"
              } focus:outline-none`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}