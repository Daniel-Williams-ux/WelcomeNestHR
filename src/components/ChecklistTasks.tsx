// src/components/onboarding/ChecklistTasks.tsx
"use client";

import { motion } from "framer-motion";
import { CheckSquare, Square } from "lucide-react";
import { OnboardingStep } from "@/hooks/useOnboardingChecklist";

interface Props {
  steps: OnboardingStep[];
  onToggle: (id: string, completed: boolean) => void;
}

export const ChecklistTasks = ({ steps, onToggle }: Props) => {
  const handleKey = (e: React.KeyboardEvent, step: OnboardingStep) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle(step.id, step.completed);
    }
  };

  return (
    <div className="bg-white dark:bg-background-dark shadow-md rounded-xl p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
        Onboarding Tasks
      </h3>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className="flex items-center gap-3 text-sm font-medium cursor-pointer"
            onClick={() => onToggle(step.id, step.completed)}
            onKeyDown={(e) => handleKey(e, step)}
            role="checkbox"
            aria-checked={step.completed}
            tabIndex={0}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {step.completed ? (
              <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
            <span
              className={step.completed ? "line-through text-gray-500" : ""}
            >
              {step.title}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
