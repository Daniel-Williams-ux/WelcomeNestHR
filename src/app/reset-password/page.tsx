"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from "lucide-react";

function getResetErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("auth/invalid-email")) {
      return "Enter a valid email address.";
    }

    if (error.message.includes("auth/too-many-requests")) {
      return "Too many reset attempts. Please wait a moment before trying again.";
    }
  }

  return "We could not send a reset link. Please try again.";
}

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSending(true);

    try {
      const resetUrl = `${window.location.origin}/login`;

      await sendPasswordResetEmail(auth, email.trim().toLowerCase(), {
        url: resetUrl,
        handleCodeInApp: false,
      });
      setMessage(
        "If an account exists for that email, a password reset link has been sent.",
      );
    } catch (err) {
      setError(getResetErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F2FCFD] via-white to-[#FFF4DF] px-4 py-10 text-slate-950 dark:from-[#071316] dark:via-[#0c1b1f] dark:to-[#1f1605] dark:text-white">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl shadow-orange-500/10 backdrop-blur dark:border-white/10 dark:bg-[#152226]/95 sm:p-8">
          <Image
            src="/welcomenesthr.png"
            alt="WelcomeNestHR"
            width={150}
            height={66}
            className="mx-auto h-auto w-36"
            priority
          />

          <div className="mt-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7FAFC] text-[#008FA1] dark:bg-white/10">
              <Mail className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-black text-[#0b3c49] dark:text-white">
              Reset your password
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Enter your account email and we’ll send a secure link to create a
              new password.
            </p>
          </div>

          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#00ACC1] focus:ring-4 focus:ring-[#00ACC1]/15 dark:border-white/10 dark:bg-white/5 dark:text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {message && (
              <div
                className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                role="status"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div
                className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="min-h-12 w-full rounded-xl bg-gradient-to-r from-[#00ACC1] to-[#008FA1] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>

          <Link
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-bold text-[#008FA1] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}