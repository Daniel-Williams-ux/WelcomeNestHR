'use client';

import { useCurrentCompany } from '@/hooks/useCurrentCompany';
import { useUserAccess } from '@/hooks/useUserAccess';

export default function HRTopbar() {
  const { company } = useCurrentCompany();
  const { user } = useUserAccess();

  const initial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U';

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6">
      {/* LEFT */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">HR Dashboard</span>

        {company?.name && (
          <>
            <span className="text-gray-300">/</span>
            <span className="font-medium">{company.name}</span>
          </>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        {/* Avatar only — email intentionally hidden */}
        <div
          className="w-8 h-8 rounded-full bg-[#00ACC1] text-white
                     flex items-center justify-center text-sm font-semibold
                     cursor-pointer"
          title={user?.email}
        >
          {initial.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
