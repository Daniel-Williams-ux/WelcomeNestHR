"use client";

import { useUserAccess } from "@/hooks/useUserAccess";
import UpgradeToContinue from "./UpgradeToContinue";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, canAccessPremium } = useUserAccess();

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please sign in</p>;
  if (!canAccessPremium) return <UpgradeToContinue />;

  return <>{children}</>;
}