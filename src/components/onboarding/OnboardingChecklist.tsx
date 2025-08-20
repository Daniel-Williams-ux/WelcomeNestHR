"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { onboardingChecklist } from "@/constants/onboardingChecklist";
import { useUserAccess } from "@/hooks/useUserAccess";
import {
  getUserChecklist,
  saveUserChecklist,
} from "@/lib/firestore/onboardingChecklist";

export default function OnboardingChecklist() {
  const { user, loading: accessLoading } = useUserAccess();
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's saved checklist
  useEffect(() => {
    if (accessLoading) return;
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    getUserChecklist(user.uid).then((data) => {
      setCompleted(data);
      setLoading(false);
    });
  }, [user, accessLoading]);

  const toggleStep = async (id: string, checked: boolean) => {
    if (!user?.uid) return;

    const updated = checked
      ? [...completed, id]
      : completed.filter((item) => item !== id);

    setCompleted(updated);
    await saveUserChecklist(user.uid, updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-gray-500">Loading checklist...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onboardingChecklist.map((step) => (
        <label
          key={step.id}
          className="flex items-center space-x-3 cursor-pointer"
        >
          <Checkbox
            id={step.id}
            checked={completed.includes(step.id)}
            onCheckedChange={(checked) => toggleStep(step.id, checked === true)}
          />
          <span className="text-gray-800 dark:text-gray-100">{step.label}</span>
        </label>
      ))}
    </div>
  );
}
