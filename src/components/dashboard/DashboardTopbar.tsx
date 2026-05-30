"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Sun, Moon } from "lucide-react";
import { signOut } from "firebase/auth";
import { useUserAccess } from "@/hooks/useUserAccess";
import BellMenu from "@/components/dashboard/BellMenu";
import { useTheme } from "next-themes";
import { auth } from "@/lib/firebase";

export default function DashboardTopbar() {
  const router = useRouter();
 const { user } = useUserAccess();
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

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const getInitials = () => {
    const name = user?.fullName ?? user?.displayName;

    if (!name) return 'U';

    return name
      .trim()
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="relative z-10 hidden items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-700 dark:bg-[#121212] md:flex">
      {/* Left Section */}
      <Link
        href="/dashboard"
        className="text-lg font-semibold text-[#004d59] hover:text-[#00ACC1] dark:text-white"
      >
        Employee Dashboard
      </Link>

      {/* Right Section */}
      <div className="flex items-center gap-4 relative">
        {/* Bell icon */}
        <BellMenu />

        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="text-gray-700 dark:text-gray-300 hover:text-[#00ACC1] transition"
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Moon className="w-5 h-5" aria-hidden="true" />
          )}
        </button>

        {/* Avatar Dropdown */}
        <div className="relative" ref={avatarRef}>
          <button
            type="button"
            onClick={() => setAvatarOpen((prev) => !prev)}
            className="flex items-center gap-1 bg-[#00ACC1] text-white w-8 h-8 rounded-full justify-center font-semibold text-sm focus:outline-none"
            title={user?.fullName ?? user?.displayName ?? 'User'}
            aria-label="Open user menu"
            aria-expanded={avatarOpen}
          >
            {getInitials()}
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>

          {avatarOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-2 z-50 text-sm text-gray-800 dark:text-gray-200">
              <button type="button" className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                View Profile
              </button>
              <button type="button" className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                Settings
              </button>
              <button
                type="button"
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