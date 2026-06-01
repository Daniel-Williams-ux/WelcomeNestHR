'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  BookOpenCheck,
  Bot,
  ClipboardCheck,
  HeartPulse,
  Home,
  MessageSquare,
  Network,
  Target,
  Users,
  WalletCards,
} from 'lucide-react';
import AIAssistantPanel from '@/components/dashboard/AIAssistantPanel';

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
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
    <div className="flex h-full flex-col border-r border-white/10 bg-gradient-to-b from-[#004d59] via-[#004d59] to-[#00343d] p-5 text-white shadow-2xl shadow-slate-950/10 dark:border-cyan-900/30 dark:from-[#052f38] dark:via-[#062934] dark:to-[#071923]">
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

        <button
          type="button"
          onClick={() => {
            setAiOpen(true);
            onNavigate?.();
          }}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-cyan-50 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200"
        >
          <Bot size={18} aria-hidden="true" />
          <span>NestGuide AI</span>
        </button>
      </nav>

      <div className="mt-5 border-t border-white/10 pt-4 text-xs text-cyan-100">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} aria-hidden="true" />
          Operational workspace
        </div>
      </div>
    </div>
    {aiOpen && (
      <AIAssistantPanel
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        audience="hr"
      />
    )}
    </>
  );
}