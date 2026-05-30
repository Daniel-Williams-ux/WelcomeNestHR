"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useUserAccess } from "@/hooks/useUserAccess";

export default function EmployeeBillingRoute() {
  const router = useRouter();
  const { role, loading } = useUserAccess();

  useEffect(() => {
    if (loading) return;

    if (role === "hr") {
      router.replace("/hr/billing");
    } else if (role === "superadmin") {
      router.replace("/superadmin/billing");
    }
  }, [loading, role, router]);

  if (loading || role === "hr" || role === "superadmin") {
    return <p className="p-6 text-sm text-slate-500">Checking billing access...</p>;
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <ShieldAlert className="mx-auto h-10 w-10 text-[#FB8C00]" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-bold text-slate-950 dark:text-white">
        Billing is managed by HR
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Employee accounts do not have access to company subscription or payment
        settings. You can still view payslips from your dashboard.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#00ACC1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0097A7]"
      >
        Back to dashboard
      </Link>
    </div>
  );
}