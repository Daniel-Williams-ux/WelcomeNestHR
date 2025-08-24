"use client";

import { Milestone } from "@/hooks/useMilestones";

interface Props {
  milestones: Milestone[];
}

export function MilestonesTimeline({ milestones }: Props) {
  if (!milestones.length) {
    return <p className="text-gray-500">No milestones yet.</p>;
  }

  return (
    <div className="space-y-8">
      {milestones
        .sort((a, b) => a.order - b.order)
        .map((m) => (
          <div
            key={m.id}
            className="relative flex items-start space-x-4 border-l-2 border-gray-200 pl-6"
          >
            {/* Dot indicator */}
            <span
              className={`absolute -left-[9px] top-2 w-4 h-4 rounded-full ${
                m.status === "complete"
                  ? "bg-green-500"
                  : m.status === "in_progress"
                  ? "bg-yellow-500"
                  : "bg-gray-400"
              }`}
            />

            {/* Milestone content */}
            <div>
              <h3 className="text-lg font-semibold">{m.title}</h3>
              <p className="text-gray-600">{m.description}</p>
              {m.startDate && m.endDate && (
                <p className="text-sm text-gray-400">
                  {m.startDate.toDate().toLocaleDateString()} –{" "}
                  {m.endDate.toDate().toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}