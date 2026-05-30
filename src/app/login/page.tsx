"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { FirebaseError } from "firebase/app";
import { doc, getDoc } from "firebase/firestore";
import { AlertCircle, CheckCircle2, EyeIcon, EyeOffIcon, LockKeyhole } from "lucide-react";

function getLoginErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password"
    ) {
      return "The email or password is incorrect. Please check your details and try again.";
    }

    if (error.code === "auth/too-many-requests") {
      return "Too many attempts. Please wait a moment or reset your password.";
    }

    if (error.code === "auth/popup-closed-by-user") {
      return "Google sign-in was closed before it finished.";
    }
  }

  if (error instanceof Error) return error.message;

  return "Login failed. Please try again.";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const checkAndSeedUser = async (uid: string) => {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new Error(
        'Account not found. Please sign up using your invitation link.',
      );
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const persistence = remember
        ? browserLocalPersistence
        : browserSessionPersistence;

      await setPersistence(auth, persistence);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      await checkAndSeedUser(userCredential.user.uid);
      router.push('/route-router');
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setError("");
    setLoading(true);

    try {
      const persistence = remember
        ? browserLocalPersistence
        : browserSessionPersistence;

      await setPersistence(auth, persistence);
      const result = await signInWithPopup(auth, provider);

      await checkAndSeedUser(result.user.uid);
      router.push('/route-router');
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/reset-password");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F2FCFD] via-white to-[#FFF4DF] px-4 py-10 text-slate-950 dark:from-[#071316] dark:via-[#0c1b1f] dark:to-[#1f1605] dark:text-white sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:block">
          <Image
            src="/welcomenesthr.png"
            alt="WelcomeNestHR"
            width={190}
            height={84}
            className="h-auto w-40"
            priority
          />
          <p className="mt-10 text-sm font-bold uppercase tracking-[0.16em] text-[#008FA1]">
            Secure workspace access
          </p>
          <h1 className="mt-4 max-w-xl text-5xl font-black leading-tight">
            Sign in to the right dashboard automatically.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-8 text-slate-600 dark:text-slate-300">
            WelcomeNestHR routes every verified user to their workspace based on
            their assigned role: employee, HR, or superadmin.
          </p>
          <div className="mt-8 space-y-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#00ACC1]" aria-hidden="true" />
              Remember me keeps trusted devices signed in.
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#00ACC1]" aria-hidden="true" />
              Forgot password sends a Firebase reset email.
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#00ACC1]" aria-hidden="true" />
              Invite-created accounts use the same normal login page.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl shadow-orange-500/10 backdrop-blur dark:border-white/10 dark:bg-[#152226]/95 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7FAFC] text-[#008FA1] dark:bg-white/10">
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-black text-[#0b3c49] dark:text-white">
              Welcome back
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Sign in with the account you created from your invitation.
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
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

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-slate-900 shadow-sm outline-none transition focus:border-[#00ACC1] focus:ring-4 focus:ring-[#00ACC1]/15 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#00ACC1]"
                />
                Keep me signed in on this device
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-semibold text-[#008FA1] hover:underline"
              >
                Forgot password?
              </button>
            </div>

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
              disabled={loading}
              className="min-h-12 w-full rounded-xl bg-gradient-to-r from-[#00ACC1] to-[#008FA1] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            <span className="text-xs font-medium text-slate-500">or continue with</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <Image src="/google-logo.svg" alt="" width={20} height={20} />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
            New to WelcomeNestHR?{" "}
            <Link
              href="/signup"
              className="font-bold text-[#008FA1] hover:underline"
            >
              Use your invitation link
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
