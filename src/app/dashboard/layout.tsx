"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute"; // ✅ Import this
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="flex-1 flex flex-col md:ml-64 bg-white dark:bg-gray-900 min-h-screen">
          <div className="md:hidden p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="bg-[#00ACC1] text-white px-4 py-2 rounded-lg"
            >
              Open Menu
            </button>
          </div>

          <DashboardTopbar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}