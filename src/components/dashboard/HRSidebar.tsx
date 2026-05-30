'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  HeartPulse,
  Home,
  MessageSquare,
  Network,
  Target,
  Users,
  WalletCards,
} from 'lucide-react';

const navItems = [
  { name: 'Overview', href: '/hr', icon: Home },
  { name: 'Employees', href: '/hr/employees', icon: Users },
  { name: 'Onboarding', href: '/hr/onboarding', icon: BookOpenCheck },
  { name: 'Primer', href: '/hr/primer', icon: Target },
  { name: 'Payroll', href: '/hr/payroll', icon: WalletCards },
  { name: 'Billing', href: '/hr/billing', icon: WalletCards },
  { name: 'Compliance', href: '/hr/compliance', icon: ClipboardCheck },
  { name: 'Collaborate', href: '/hr/collaborate', icon: Network },
  { name: 'Messages', href: '/hr/messages', icon: MessageSquare },
  { name: 'LifeSync', href: '/hr/lifesync', icon: HeartPulse },
];

export function HRSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[#004d59] p-5 text-white">
      <div className="mb-6 border-b border-white/10 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
          WelcomeNestHR
        </p>
        <h2 className="mt-1 text-xl font-bold">HR Dashboard</h2>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="HR navigation">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/hr' && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-200 ${
                active
                  ? 'bg-white text-[#004d59] shadow-sm'
                  : 'text-cyan-50 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 border-t border-white/10 pt-4 text-xs text-cyan-100">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} aria-hidden="true" />
          Operational workspace
        </div>
      </div>
    </div>
  );
}