"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link sent! Check your inbox.");
    } catch (err: any) {
      setMessage(err.message || "Failed to send reset email.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f9fb] dark:bg-[#0c1b1f] px-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1c2b2f] p-8 rounded-2xl shadow space-y-5">
        <h2 className="text-2xl font-bold text-center text-[#0b3c49] dark:text-white">
          Reset your password
        </h2>

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#273c42] text-gray-800 dark:text-white focus:ring-2 focus:ring-[#00ACC1] focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-[#00ACC1] hover:bg-[#0097a7] text-white font-semibold py-2 rounded-lg transition"
          >
            Send reset link
          </button>
        </form>

        {message && (
          <p className="text-sm text-center text-[#00ACC1] dark:text-green-400">
            {message}
          </p>
        )}

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Back to{" "}
          <a
            href="/login"
            className="text-[#00ACC1] hover:text-[#0097a7] font-medium"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}