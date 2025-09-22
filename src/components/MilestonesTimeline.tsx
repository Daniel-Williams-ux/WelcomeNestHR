"use client";

import { Milestone } from "@/hooks/useMilestones";
import { motion } from "framer-motion";

interface Props {
  milestones: Milestone[];
}

export function MilestonesTimeline({ milestones }: Props) {
  if (!milestones.length) {
    return (
      <p className="text-gray-500 dark:text-gray-400" role="status">
        No milestones yet.
      </p>
    );
  }

  return (
    <div
      className="space-y-8"
      role="list"
      aria-label="Onboarding milestones timeline"
    >
      {milestones
        .sort((a, b) => a.order - b.order)
        .map((m, index) => {
          const start = m.startDate?.toDate();
          const end = m.endDate?.toDate();
          const dateLabel =
            start && end
              ? `${new Intl.DateTimeFormat(undefined, {
                  month: "short",
                  day: "numeric",
                }).format(start)} – ${new Intl.DateTimeFormat(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(end)}`
              : "";

          return (
            <motion.div
              key={m.id}
              role="listitem"
              tabIndex={0}
              className="relative flex items-start space-x-4 border-l-2 border-gray-200 dark:border-gray-700 pl-6 focus:outline-none focus:ring-2 focus:ring-[#FB8C00] rounded-md"
              aria-label={`${m.title}, ${m.status.replace("_", " ")}${
                dateLabel ? `, ${dateLabel}` : ""
              }`}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              {/* Dot indicator */}
              <motion.span
                aria-hidden="true"
                className={`absolute -left-[9px] top-2 w-4 h-4 rounded-full ${
                  m.status === "complete"
                    ? "bg-green-500"
                    : m.status === "in_progress"
                    ? "bg-yellow-500"
                    : "bg-gray-400"
                }`}
                animate={
                  m.status === "in_progress"
                    ? { scale: [1, 1.3, 1] } // pulsing
                    : m.status === "complete"
                    ? { scale: [0.6, 1.4, 1], opacity: [0.5, 1, 1] } // pop effect
                    : { scale: 1, opacity: 1 }
                }
                transition={
                  m.status === "in_progress"
                    ? { repeat: Infinity, duration: 1.2 }
                    : m.status === "complete"
                    ? { duration: 0.6, ease: "easeOut" }
                    : {}
                }
              />

              {/* Milestone content */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {m.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {m.description}
                </p>

                {dateLabel && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {dateLabel}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
    </div>
  );
}