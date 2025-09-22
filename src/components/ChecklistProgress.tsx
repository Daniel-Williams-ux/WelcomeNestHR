"use client";

import { motion } from "framer-motion";
import { CheckCircle, Circle } from "lucide-react";
import clsx from "clsx";

const journeySteps = ["Preboarding", "Day 1", "Week 1", "30 Days", "Beyond"];

interface Props {
  completionPercent: number; // 0-100
  currentPhaseIndex: number; // 0-based
}

export const ChecklistProgress = ({
  completionPercent,
  currentPhaseIndex,
}: Props) => {
  return (
    <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-6 transition-colors">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
        Your Progress
      </h3>

      {/* Journey steps */}
      <div className="space-y-3">
        {journeySteps.map((label, index) => {
          const isComplete = index < currentPhaseIndex;
          const isCurrent = index === currentPhaseIndex;

          return (
            <motion.div
              key={index}
              className={clsx(
                "flex items-center gap-3 text-sm font-medium transition-colors",
                !isComplete && !isCurrent && "text-gray-600 dark:text-gray-400",
                isCurrent && "text-[#FB8C00]",
                isComplete && "text-green-600 dark:text-green-400"
              )}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <span className="w-5 h-5 flex items-center justify-center">
                {isComplete ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                )}
              </span>
              {label}
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#FFB300] to-[#FB8C00] shadow-sm"
          style={{ width: `${completionPercent}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${completionPercent}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  );
};