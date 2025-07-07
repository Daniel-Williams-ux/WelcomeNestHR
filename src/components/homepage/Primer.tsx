"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, CalendarCheck2, BarChart3 } from "lucide-react";

export const Primer = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const features = [
    {
      title: "Role-Based Milestones",
      desc: "Set expectations from day one with smart goal templates tailored by role and team.",
      icon: <Target className="h-6 w-6 text-[#FB8C00]" />,
    },
    {
      title: "30-60-90 Roadmaps",
      desc: "Track early wins and long-term growth with guided check-ins and feedback.",
      icon: <CalendarCheck2 className="h-6 w-6 text-[#FB8C00]" />,
    },
    {
      title: "Progress Visibility",
      desc: "Managers and employees can both see progress — aligning effort and feedback.",
      icon: <BarChart3 className="h-6 w-6 text-[#FB8C00]" />,
    },
  ];

  return (
    <section
      id="primer"
      className="relative py-24 px-6 bg-[#FFFDE7] dark:bg-[#1A1A1A] overflow-hidden"
    >
      {/* Decorative glow elements */}
      <div className="absolute -top-24 left-0 w-80 h-80 bg-[#FB8C00]/10 blur-3xl rounded-full z-0" />
      <div className="absolute -bottom-20 right-0 w-80 h-80  rounded-full z-0" />

      <div className="max-w-4xl mx-auto relative z-10 text-left">
        <motion.h2
          className="text-4xl sm:text-5xl font-bold text-[#FB8C00] mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Performance Primer
        </motion.h2>

        <motion.p
          className="text-gray-700 dark:text-gray-300 max-w-2xl mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Empower new hires with personalized 30-60-90 day plans and
          role-specific goals. Because day one should also be day one of growth.
        </motion.p>

        <div className="relative border-l-2 border-dashed border-[#FB8C00]/50 pl-6 space-y-6">
          {features.map((item, i) => (
            <motion.div
              key={i}
              className="group cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              onClick={() => setActiveIndex(activeIndex === i ? null : i)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 shadow flex items-center justify-center border border-[#FB8C00]/30">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
              </div>

              <AnimatePresence initial={false}>
                {activeIndex === i && (
                  <motion.p
                    className="text-sm text-gray-600 dark:text-gray-300 ml-12 pr-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {item.desc}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};