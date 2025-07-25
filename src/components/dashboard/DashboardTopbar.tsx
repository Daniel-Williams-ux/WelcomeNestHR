"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Sun, Moon } from "lucide-react";
import { useUserAccess } from "@/hooks/useUserAccess";
import BellMenu from "@/components/dashboard/BellMenu";
import { useTheme } from "next-themes";

export default function DashboardTopbar() {
  const router = useRouter();
  const { user, plan, trialDaysLeft } = useUserAccess();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  const avatarRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setAvatarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    router.push("/login");
  };

  const getInitials = () => {
    if (!user?.displayName) return "U";
    return user.displayName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121212] shadow-sm z-10 relative">
      {/* Left Section */}
      <Link
        href="/"
        className="text-lg font-semibold text-[#00ACC1] hover:underline"
      >
        ← Back to Home
      </Link>

      {/* Center Section (Plan Info) */}
      <div className="hidden md:flex flex-col items-center text-sm text-gray-700 dark:text-gray-300">
        {plan === "platinum" ? (
          <span className="font-medium text-[#FB8C00]">Platinum Plan</span>
        ) : (
          <span>
            Trial –{" "}
            <span className="text-red-500 font-semibold">
              {trialDaysLeft ?? "?"} days left
            </span>
          </span>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 relative">
        {/* Bell icon */}
        <BellMenu />

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="text-gray-700 dark:text-gray-300 hover:text-[#00ACC1] transition"
          title="Toggle theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Avatar Dropdown */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setAvatarOpen((prev) => !prev)}
            className="flex items-center gap-1 bg-[#00ACC1] text-white w-8 h-8 rounded-full justify-center font-semibold text-sm focus:outline-none"
            title={user?.displayName ?? "User"}
          >
            {getInitials()}
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>

          {avatarOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-2 z-50 text-sm text-gray-800 dark:text-gray-200">
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                View Profile
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}