'use client';

import { Bell, UserCircle2, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SuperAdminTopbar() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3">
      <div>
        <h1 className="text-lg font-semibold">Welcome back, Super Admin 👋</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage companies, users & billing insights
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2 bg-[#FFB300] text-white px-3 py-1.5 rounded-full text-sm">
          <UserCircle2 size={18} />
          <span>Admin</span>
        </div>
      </div>
    </div>
  );
}