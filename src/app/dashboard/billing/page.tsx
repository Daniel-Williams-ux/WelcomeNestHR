"use client";

import { useUserAccess } from "@/hooks/useUserAccess";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion } from "framer-motion";
import { getAuth } from "firebase/auth"; //Import getAuth from client SDK
import "@/lib/firebase"; // Make sure Firebase is initialized
import { redirectToBillingPortal } from "@/lib/createBillingPortalSession";

export default function BillingPage() {
  const { user, plan, trialEndsAt, loading } = useUserAccess();
  const [redirecting, setRedirecting] = useState(false);

 const handleManageBilling = async () => {
   setRedirecting(true);
   try {
     const auth = getAuth();
     const user = auth.currentUser;

     if (!user) throw new Error("User not signed in");

     const idToken = await user.getIdToken();
     await redirectToBillingPortal(idToken);
   } catch (err) {
     console.error("Redirect failed:", err);
     alert("Failed to redirect to billing portal.");
     setRedirecting(false);
   }
 };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <motion.h1
        className="text-3xl font-bold text-gray-800 dark:text-white mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Billing & Subscription
      </motion.h1>

      {user && (
        <motion.div
          className="mb-6 p-5 rounded-2xl bg-[#F9FAFB] dark:bg-[#181818] border border-gray-200 dark:border-gray-700 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Welcome, {user.displayName || "there"}!
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Email: {user.email}
          </p>

          {/* UID hidden from regular UI */}
          <div className="sr-only">{user.uid}</div>
        </motion.div>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading plan info...</p>
      ) : (
        <motion.div
          className="rounded-2xl bg-white dark:bg-[#1c1c1c] shadow-lg p-6 space-y-6 border border-gray-200 dark:border-gray-800"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Current Plan
              </h2>
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                {plan === "platinum" ? (
                  <span className="font-medium text-[#00ACC1]">Platinum</span>
                ) : (
                  <span className="font-medium text-orange-500">
                    Free Trial
                  </span>
                )}
              </p>

              {plan === "trial" && trialEndsAt && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Trial ends on{" "}
                  <strong>{formatDate(trialEndsAt.getTime())}</strong>
                </p>
              )}
            </div>

            <div>
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  plan === "platinum"
                    ? "bg-[#00ACC1]/10 text-[#00ACC1]"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                {plan === "platinum" ? "Active" : "Trial"}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button
              onClick={handleManageBilling}
              disabled={redirecting}
              className="bg-gradient-to-r from-[#FFB300] to-[#FB8C00] text-white hover:opacity-90 transition rounded-xl px-6 py-2"
            >
              {redirecting ? "Redirecting..." : "Manage Billing"}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}