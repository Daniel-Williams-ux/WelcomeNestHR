// app/superadmin/layout.tsx
import React from 'react';
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar';
import SuperAdminTopbar from '@/components/superadmin/SuperAdminTopbar';

/**
 * SuperAdmin layout (Next.js app-router layout)
 * - put this at /app/superadmin/layout.tsx
 * - Wraps all SuperAdmin pages
 */

export const metadata = {
  title: 'WelcomeNest — Super Admin',
  description: 'WelcomeNestHQ — Super Admin Dashboard',
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F9FAFB] text-gray-800">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="hidden md:block w-72 bg-white border-r border-gray-200">
            <div className="h-full sticky top-0 overflow-auto">
              <SuperAdminSidebar />
            </div>
          </aside>

          {/* Mobile top bar & drawer area */}
          <div className="md:hidden fixed top-0 left-0 right-0 z-30">
            <SuperAdminTopbar />
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="pt-16 md:pt-6 lg:pt-6 px-4 md:px-8 lg:px-12">
              {/* Topbar for desktop */}
              <div className="hidden md:block">
                <SuperAdminTopbar />
              </div>

              {/* Page content */}
              <div className="mt-6">{children}</div>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}