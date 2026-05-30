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
  Landmark,
} from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Overview', href: '/superadmin', icon: LayoutDashboard },
  { name: 'Companies', href: '/superadmin/companies', icon: Building2 },
  { name: 'Users', href: '/superadmin/users', icon: Users },
  { name: 'Billing', href: '/superadmin/billing', icon: CreditCard },
  { name: 'Usage', href: '/superadmin/usage', icon: BarChart3 },
  { name: 'Settings', href: '/superadmin/settings', icon: Settings },
  { name: 'Payroll', href: '/superadmin/payroll', icon: Landmark },
];

type NavItem = (typeof navItems)[number];

export default function SuperAdminSidebar({
  sidebarOpen = false,
  setSidebarOpen = () => undefined,
}: {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}) {
  const pathname = usePathname();

  const NavLink = ({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) => {
    const active =
      pathname === item.href ||
      (item.href !== '/superadmin' && pathname.startsWith(`${item.href}/`));
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={`flex min-h-11 items-center gap-3 rounded-lg px-5 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/80
        ${
          active
            ? 'bg-white/25 text-white shadow-inner'
            : 'text-white/85 hover:text-white hover:bg-white/10 hover:translate-x-[2px]'
        }`}
      >
        <Icon size={18} aria-hidden="true" />
        <span className="truncate">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-gradient-to-b from-[#FFB300] to-[#FB8C00] text-white shadow-2xl dark:from-[#FB8C00] dark:to-[#FFB300] lg:flex"
        aria-label="Super admin navigation"
      >
        <div className="border-b border-white/20 px-6 py-5 text-lg font-bold tracking-wide">
          WelcomeNestHR
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="border-t border-white/20 px-4 py-4 text-xs text-white/80">
          Super Admin Panel
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      <motion.aside
        id="superadmin-mobile-sidebar"
        initial={{ x: '-100%' }}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col rounded-r-2xl bg-gradient-to-b from-[#FFB300] to-[#FB8C00] text-white shadow-2xl dark:from-[#FB8C00] dark:to-[#FFB300] lg:hidden"
        aria-hidden={!sidebarOpen}
        aria-label="Super admin mobile navigation"
      >
        <div className="flex items-center justify-between border-b border-white/20 px-5 py-4">
          <div className="font-semibold text-base">WelcomeNestHR</div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-2 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/80"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              onNavigate={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        <div className="border-t border-white/20 px-5 py-4 text-xs text-white/80">
          Super Admin Panel
        </div>
      </motion.aside>
    </>
  );
}