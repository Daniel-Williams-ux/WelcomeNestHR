// components/dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Heart,
  Users,
  ShieldCheck,
  Target,
  CreditCard,
  MessageSquare,
  X,
  Bot, //  AI icon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import AIAssistantPanel from "@/components/dashboard/AIAssistantPanel";

type SidebarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

const navItems = [
  {
    name: 'Smart Onboarding',
    path: '/dashboard/onboarding',
    icon: <Home size={18} aria-hidden="true" />,
  },
  { name: 'LifeSync', path: '/dashboard/lifesync', icon: <Heart size={18} aria-hidden="true" /> },
  {
    name: 'Collaborate',
    path: '/dashboard/collaborate',
    icon: <Users size={18} aria-hidden="true" />,
  },
  {
    name: 'Compliance',
    path: '/dashboard/compliance',
    icon: <ShieldCheck size={18} aria-hidden="true" />,
  },
  { name: 'Primer', path: '/dashboard/primer', icon: <Target size={18} aria-hidden="true" /> },
  {
    name: 'Payslips',
    path: '/dashboard/payslips',
    icon: <CreditCard size={18} aria-hidden="true" />,
  },
  {
    name: 'Messages',
    path: '/dashboard/messages',
    icon: <MessageSquare size={18} aria-hidden="true" />,
  },
];

const isActivePath = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    navItems.forEach((item) => router.prefetch(item.path));
  }, [router]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-gradient-to-b from-[#004d59] via-[#004d59] to-[#00343d] p-6 text-white shadow-2xl shadow-slate-950/10 md:flex dark:border-cyan-900/30 dark:from-[#052f38] dark:via-[#062934] dark:to-[#071923]">
        <div className="mb-6 border-b border-white/10 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/90">
            WelcomeNestHR
          </p>
          <h2 className="mt-1 text-xl font-bold">Employee Hub</h2>
        </div>
        <nav className="space-y-2" aria-label="Employee navigation">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.path);

            return (
              <Link
                key={item.name}
                href={item.path}
                prefetch
                aria-current={active ? 'page' : undefined}
                onMouseEnter={() => router.prefetch(item.path)}
                onFocus={() => router.prefetch(item.path)}
                className={cn(
                  "flex min-h-11 items-center gap-2 px-3 py-2 rounded-lg text-cyan-50 transition-all duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200",
                  active && "bg-white text-[#004d59] shadow-sm hover:bg-white"
                )}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* NestGuide AI button */}
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-cyan-50 transition-all duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
          >
            <Bot size={18} aria-hidden="true" />
            <span>NestGuide AI</span>
          </button>
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <aside
          id="employee-mobile-sidebar"
          className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#004d59] via-[#004d59] to-[#00343d] p-6 text-white shadow-2xl md:hidden dark:from-[#052f38] dark:via-[#062934] dark:to-[#071923]"
          aria-label="Employee mobile navigation"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">WelcomeNestHR</h2>
            <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
              <X size={24} aria-hidden="true" />
            </button>
          </div>
          <nav className="space-y-2" aria-label="Employee navigation">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.path);

              return (
                <Link
                  key={item.name}
                  href={item.path}
                  prefetch
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-2 px-3 py-2 rounded-lg text-cyan-50 transition-all duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200",
                    active && "bg-white text-[#004d59] shadow-sm hover:bg-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                  onMouseEnter={() => router.prefetch(item.path)}
                  onFocus={() => router.prefetch(item.path)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* NestGuide AI button (mobile) */}
            <button
              type="button"
              onClick={() => {
                setAiOpen(true);
                setSidebarOpen(false);
              }}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-cyan-50 transition-all duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
            >
              <Bot size={18} aria-hidden="true" />
              <span>NestGuide AI</span>
            </button>
          </nav>
        </aside>
      )}

      {/* AI Panel */}
      {aiOpen && (
        <AIAssistantPanel
          isOpen={aiOpen}
          onClose={() => setAiOpen(false)}
          audience="employee"
        />
      )}
    </>
  );
}