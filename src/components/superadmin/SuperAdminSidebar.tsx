'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuperAdminSidebar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/superadmin', icon: LayoutDashboard },
    { name: 'Companies', href: '/superadmin/companies', icon: Building2 },
    { name: 'Users', href: '/superadmin/users', icon: Users },
    { name: 'Billing', href: '/superadmin/billing', icon: CreditCard },
    { name: 'Usage Metrics', href: '/superadmin/usage', icon: BarChart3 },
    { name: 'Settings', href: '/superadmin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: sidebarOpen ? 0 : -250 }}
        transition={{ duration: 0.3 }}
        className="fixed z-50 inset-y-0 left-0 w-64 bg-gradient-to-b from-[#FFB300] to-[#FB8C00] text-white shadow-xl md:translate-x-0 md:static md:inset-0 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/20">
          <h1 className="text-lg font-semibold tracking-wide">WelcomeNestHR</h1>
          <button
            className="md:hidden text-white hover:text-gray-100"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map(({ name, href, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={name}
                href={href}
                className={`flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/20 rounded-xl shadow-sm'
                    : 'hover:bg-white/10'
                }`}
              >
                <Icon size={18} />
                {name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 text-xs text-white/70">
          Super Admin Panel
        </div>
      </motion.aside>
    </>
  );
}
