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
  Menu,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function SuperAdminSidebar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024); // ⬅️ slightly higher breakpoint
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const navItems = [
    { name: 'Overview', href: '/superadmin', icon: LayoutDashboard },
    { name: 'Companies', href: '/superadmin/companies', icon: Building2 },
    { name: 'Users', href: '/superadmin/users', icon: Users },
    { name: 'Billing', href: '/superadmin/billing', icon: CreditCard },
    { name: 'Usage', href: '/superadmin/usage', icon: BarChart3 },
    { name: 'Settings', href: '/superadmin/settings', icon: Settings },
  ];

  const NavLink = ({
    name,
    href,
    icon: Icon,
  }: {
    name: string;
    href: string;
    icon: React.ComponentType<{ size?: number }>;
  }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => !isDesktop && setSidebarOpen(false)}
        className={`flex items-center gap-3 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-200
        ${
          active
            ? 'bg-white/25 text-white shadow-inner'
            : 'text-white/85 hover:text-white hover:bg-white/10 hover:translate-x-[2px]'
        }`}
      >
        <Icon size={18} />
        <span className="truncate">{name}</span>
      </Link>
    );
  };

  // ---------- DESKTOP ----------
  if (isDesktop) {
    return (
      <aside
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64
                   bg-gradient-to-b from-[#FFB300] to-[#FB8C00] dark:from-[#FB8C00] dark:to-[#FFB300]
                   text-white shadow-2xl"
      >
        <div className="px-6 py-5 font-bold text-lg tracking-wide border-b border-white/20">
          WelcomeNestHR
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.name} {...item} />
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/20 text-xs text-white/80">
          Super Admin Panel
        </div>
      </aside>
    );
  }

  // ---------- MOBILE ----------
  return (
    <>
      {/* top header (mobile only) */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white shadow-lg sticky top-0 z-40">
        <div className="font-semibold tracking-wide">WelcomeNestHR</div>
        <button onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </header>

      {/* dark backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* mobile sidebar */}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col
                   bg-gradient-to-b from-[#FFB300] to-[#FB8C00]
                   dark:from-[#FB8C00] dark:to-[#FFB300]
                   text-white shadow-2xl lg:hidden rounded-r-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/20">
          <div className="font-semibold text-base">WelcomeNestHR</div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="text-white"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.name} {...item} />
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/20 text-xs text-white/80">
          Super Admin Panel
        </div>
      </motion.aside>
    </>
  );
}