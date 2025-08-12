"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { cloneOnboardingTemplateTasks } from "@/lib/firestoreHelpers"; // new helper
import { onAuthStateChanged } from "firebase/auth";

const signupSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId"); // Grab orgId from URL if present

  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  // Email/Password Signup
  const onSubmit = async (values: SignupFormValues) => {
    try {
      setLoading(true);

      const userCred = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCred.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: values.fullName,
        plan: "free",
        createdAt: new Date().toISOString(),
        orgId: orgId || null,
      });

      // Ensure auth is ready
      await new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth, (authUser) => {
          if (authUser) {
            unsub();
            resolve();
          }
        });
      });

      await cloneOnboardingTemplateTasks(user.uid);

      router.push("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);
      alert("Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Google Signup
  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      // Only create + clone if user doc doesn't exist
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || "",
          plan: "free",
          createdAt: new Date().toISOString(),
          orgId: orgId || null,
        });

        await cloneOnboardingTemplateTasks(user.uid);
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Google signup error:", error);
      alert("Google signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>

      {/* Email Signup Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Full Name</label>
          <input
            type="text"
            {...register("fullName")}
            className="w-full border p-2 rounded"
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            {...register("email")}
            className="w-full border p-2 rounded"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            {...register("password")}
            className="w-full border p-2 rounded"
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>

      {/* Divider */}
      <div className="my-4 flex items-center">
        <hr className="flex-grow border-t border-gray-300" />
        <span className="mx-2 text-gray-500 text-sm">OR</span>
        <hr className="flex-grow border-t border-gray-300" />
      </div>

      {/* Google Signup */}
      <button
        onClick={handleGoogleSignup}
        disabled={loading}
        className="w-full bg-red-500 text-white p-2 rounded"
      >
        {loading ? "Signing in..." : "Sign up with Google"}
      </button>
    </div>
  );
}