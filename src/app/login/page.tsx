"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (!remember) {
        auth.setPersistence("session"); // default browser session
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
    }
  };

  const handleForgotPassword = () => {
    router.push("/reset-password");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f9fb] dark:bg-[#0c1b1f] px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-[#1c2b2f] shadow-md rounded-2xl">
        <h2 className="text-3xl font-bold text-center text-[#0b3c49] dark:text-white">
          Welcome back to WelcomeNestHR
        </h2>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Helping you feel at home — wherever you land 🌍
        </p>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#273c42] text-gray-800 dark:text-white focus:ring-2 focus:ring-[#00ACC1] focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#273c42] text-gray-800 dark:text-white focus:ring-2 focus:ring-[#00ACC1] focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="accent-[#00ACC1]"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[#00ACC1] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#00ACC1] hover:bg-[#0097a7] text-white font-semibold py-2 rounded-lg transition"
          >
            Login
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            or continue with
          </span>
          <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full border border-gray-300 dark:border-gray-600 flex items-center justify-center gap-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <img src="/google-logo.svg" alt="Google" className="w-5 h-5" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Continue with Google
          </span>
        </button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          New to WelcomeNest?{" "}
          <a
            href="/signup"
            className="text-[#00ACC1] hover:text-[#0097a7] font-medium"
          >
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}