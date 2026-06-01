"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Bell, CheckCircle2, HeartPulse, MessageSquare, Sparkles } from "lucide-react";

type BellMenuProps = {
  audience?: "employee" | "hr";
};

const notificationItems = {
  employee: [
    {
      title: "Onboarding checklist",
      description: "Review any pending onboarding tasks.",
      href: "/dashboard/onboarding",
      icon: CheckCircle2,
    },
    {
      title: "LifeSync check-in",
      description: "Share how you are doing when you need support.",
      href: "/dashboard/lifesync",
      icon: HeartPulse,
    },
    {
      title: "Messages",
      description: "Open HR conversations and company updates.",
      href: "/dashboard/messages",
      icon: MessageSquare,
    },
  ],
  hr: [
    {
      title: "Employee progress",
      description: "Review onboarding and compliance signals.",
      href: "/hr/compliance",
      icon: CheckCircle2,
    },
    {
      title: "LifeSync support queue",
      description: "Check wellbeing requests and at-risk trends.",
      href: "/hr/lifesync",
      icon: HeartPulse,
    },
    {
      title: "Team messages",
      description: "Continue conversations with employees.",
      href: "/hr/messages",
      icon: MessageSquare,
    },
  ],
};

export default function BellMenu({ audience = "employee" }: BellMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const items = notificationItems[audience];

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-[#00ACC1]/40 hover:text-[#00ACC1] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#00ACC1]/60"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#FB8C00] ring-2 ring-white dark:ring-slate-900" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/30"
            role="menu"
          >
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#00ACC1]" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Notifications
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Quick actions for your workspace.
              </p>
            </div>

            <div className="p-2">
              {items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setIsOpen(false)}
                    className="flex gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-[#008FA1] dark:bg-cyan-950/40 dark:text-cyan-300">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}