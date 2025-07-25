"use client";

import { usePathname } from "next/navigation";
import NavigationBar from "@/components/NavigationBar";
import Footer from "@/components/Footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <>
      {!isDashboard && <NavigationBar />}
      {children}
      {!isDashboard && <Footer />}
    </>
  );
}
