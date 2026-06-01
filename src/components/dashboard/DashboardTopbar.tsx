"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Sun,
  UserCircle,
} from "lucide-react";
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
    router.replace("/login");
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/dashboard");
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
    <header className="relative z-10 hidden min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:flex">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-[#00ACC1]/40 hover:text-[#00ACC1] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <Link
          href="/dashboard"
          className="group min-w-0"
        >
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-[#008FA1]">
            Employee workspace
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-base font-semibold text-slate-950 group-hover:text-[#00ACC1] dark:text-white">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </span>
        </Link>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 relative">
        {/* Bell icon */}
        <BellMenu audience="employee" />

        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-[#00ACC1]/40 hover:text-[#00ACC1] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
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
            className="flex h-10 items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 py-1 pl-1 pr-3 text-sm font-semibold text-[#006e7f] shadow-sm transition hover:bg-cyan-100 dark:border-cyan-900/70 dark:bg-cyan-950/50 dark:text-cyan-100"
            title={user?.fullName ?? user?.displayName ?? 'User'}
            aria-label="Open user menu"
            aria-expanded={avatarOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00ACC1] text-white">
              {getInitials()}
            </span>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          {avatarOpen && (
            <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {user?.fullName ?? user?.displayName ?? 'Employee'}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user?.email}
                </p>
              </div>
              <Link
                href="/dashboard"
                onClick={() => setAvatarOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <UserCircle className="h-4 w-4" aria-hidden="true" />
                View dashboard
              </Link>
              <Link
                href="/dashboard/messages"
                onClick={() => setAvatarOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Messages
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-slate-800 dark:hover:bg-red-950/40"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}