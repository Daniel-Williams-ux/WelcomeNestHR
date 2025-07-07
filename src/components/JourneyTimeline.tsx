"use client";
import { ChecklistProgress } from "@/components/ChecklistProgress";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import clsx from "clsx";

const journeySteps = [
  {
    title: "Preboarding",
    description: "Paperwork, welcome pack, and early cultural insights.",
  },
  {
    title: "Day 1",
    description: "Your buddy intro, team sync, and workspace setup.",
  },
  {
    title: "Week 1",
    description: "Understanding your role and purpose in the team.",
  },
  {
    title: "30 Days",
    description: "First feedback loop and emotional check-in.",
  },
  {
    title: "Beyond",
    description: "Long-term goals, growth tracks, and community bonding.",
  },
];

const PulseCheck = () => {
  const moods = [
    { emoji: "😔", label: "Overwhelmed" },
    { emoji: "😐", label: "Okay" },
    { emoji: "😊", label: "Comfortable" },
    { emoji: "😄", label: "Excited" },
    { emoji: "🤩", label: "Thriving" },
  ];

  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("pulseMood");
    if (saved) setSelected(parseInt(saved));
  }, []);

  const handleSelect = (index: number) => {
    setSelected(index);
    localStorage.setItem("pulseMood", index.toString());
  };

  return (
    <div className="mt-16 text-center">
      <h4 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
        How are you feeling so far?
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Select the emoji that best matches your onboarding experience.
      </p>
      <div className="flex justify-center gap-4">
        {moods.map((mood, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            className={clsx(
              "text-2xl transition-transform transform hover:scale-125 focus:outline-none",
              selected === index && "scale-150 drop-shadow-md"
            )}
            aria-label={mood.label}
          >
            <span>{mood.emoji}</span>
          </button>
        ))}
      </div>
      {selected !== null && (
        <p className="mt-4 text-sm text-[#FB8C00] font-medium">
          You’re feeling: {moods[selected].label}
        </p>
      )}
    </div>
  );
};


export default function JourneyTimeline() {
  const [expanded, setExpanded] = useState<number | null>(null);

  // Load saved step on mount
  useEffect(() => {
    const savedStep = localStorage.getItem("onboardingStep");
    if (savedStep !== null) {
      setExpanded(parseInt(savedStep));
    } else {
      setExpanded(0); // Default to step 0 if nothing is saved
    }
  }, []);

  // Save step to localStorage whenever it changes
  useEffect(() => {
    if (expanded !== null) {
      localStorage.setItem("onboardingStep", expanded.toString());
    }
  }, [expanded]);

  return (
    <section
      id="journey"
      className="relative isolate py-20 px-4 sm:px-6 lg:px-8 overflow-hidden  text-gray-800 dark:text-white dark:from-background-dark dark:via-[#1f2937] dark:to-[#111827]"
    >
      {/* Gradient Blob Behind */}
      <div className="absolute inset-0 -z-10 blur-3xl opacity-30"></div>

      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold text-center mb-4"
        >
          Your Journey with WelcomeNestHR
        </motion.h2>

        <p className="text-center max-w-2xl mx-auto text-gray-700 dark:text-gray-300 mb-6">
          From Day 0 to your first milestone – Here&apos;s how we turn
          onboarding into belonging.
        </p>

        <p className="text-sm text-center mb-6 text-[#FB8C00] font-medium">
          You’re on <strong>Step {(expanded ?? 0) + 1}</strong> of{" "}
          <strong>{journeySteps.length}</strong>
        </p>

        {/* ✅ Progress Tracker Component */}
        <div className="mb-12">
          <ChecklistProgress currentStepIndex={expanded ?? 0} />
        </div>

        <ol className="relative border-l-2 border-[#FFB300] dark:border-[#FB8C00] pl-6">
          {journeySteps.map((step, index) => (
            <li key={index} className="mb-10 ml-4 relative">
              <button
                onClick={() => setExpanded(expanded === index ? null : index)}
                className="w-full text-left focus:outline-none"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 10,
                      delay: index * 0.1,
                    }}
                    className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse"
                  >
                    <CheckCircle size={16} />
                  </motion.span>

                  <h3 className="text-lg font-semibold">{step.title}</h3>
                </motion.div>
              </button>

              <AnimatePresence>
                {expanded === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2 overflow-hidden"
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {step.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ol>

        <PulseCheck />
      </div>
    </section>
  );
}