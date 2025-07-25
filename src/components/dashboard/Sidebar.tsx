// components/dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Heart,
  Users,
  ShieldCheck,
  Target,
  CreditCard,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

const navItems = [
  {
    name: "Smart Onboarding",
    path: "/dashboard/onboarding",
    icon: <Home size={18} />,
  },
  { name: "LifeSync", path: "/dashboard/lifesync", icon: <Heart size={18} /> },
  {
    name: "Collaborate",
    path: "/dashboard/collaborate",
    icon: <Users size={18} />,
  },
  {
    name: "Compliance",
    path: "/dashboard/compliance",
    icon: <ShieldCheck size={18} />,
  },
  { name: "Primer", path: "/dashboard/primer", icon: <Target size={18} /> },
  {
    name: "Billing",
    path: "/dashboard/billing",
    icon: <CreditCard size={18} />,
  },
  {
    name: "Settings",
    path: "/dashboard/settings",
    icon: <Settings size={18} />,
  },
];

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-[#004d59] text-white p-6 space-y-4 fixed h-screen z-40">
        <h2 className="text-2xl font-semibold mb-4">WelcomeNestHR</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-[#006e7f]",
                pathname === item.path && "bg-[#006e7f]"
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#004d59] text-white transform transition-transform duration-300 p-6 space-y-4",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">WelcomeNestHR</h2>
          <button onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-[#006e7f]",
                pathname === item.path && "bg-[#006e7f]"
              )}
              onClick={() => setSidebarOpen(false)} // Auto-close after click
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}