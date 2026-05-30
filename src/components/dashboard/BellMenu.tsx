"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";

export default function BellMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        className="relative text-gray-500 hover:text-[#00ACC1] transition"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {/* Optional red dot */}
        <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
            role="menu"
          >
            <div className="p-4 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold mb-2">Notifications</p>
              <ul className="space-y-2">
                <li className="hover:bg-gray-100 dark:hover:bg-[#2A2A2A] p-2 rounded transition">
                  Welcome to your dashboard!
                </li>
                <li className="hover:bg-gray-100 dark:hover:bg-[#2A2A2A] p-2 rounded transition">
                  Don’t forget to complete onboarding steps.
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}