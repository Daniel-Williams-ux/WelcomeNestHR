"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Image from "next/image";

/** Wait until Firebase Auth is fully ready (fresh ID token) */
async function waitForAuthReady(): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      async (u) => {
        if (!u) return;
        try {
          await u.getIdToken(true); // force refresh token
          unsub();
          resolve();
        } catch (err) {
          unsub();
          reject(err);
        }
      },
      (err) => reject(err)
    );
  });
}

/** Clone onboarding template tasks */
async function cloneOnboardingTemplate(userId: string) {
  const templateRef = collection(db, "onboardingTemplates");
  const snapshot = await getDocs(templateRef);

  const promises = snapshot.docs.map((docSnap) =>
    setDoc(doc(db, `users/${userId}/onboarding`, docSnap.id), {
      ...docSnap.data(),
      status: "pending",
      createdAt: new Date().toISOString(),
    })
  );

  await Promise.all(promises);

  // Mark milestones as seeded
  await setDoc(
    doc(db, "users", userId),
    { milestonesSeeded: true },
    { merge: true }
  );
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId") || null;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");

  const togglePasswordVisibility = () => setShowPassword((p) => !p);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword((p) => !p);

  /** Default new user data */
  const getDefaultUserData = (user: any, fullName: string | null = null) => ({
    uid: user.uid,
    email: user.email,
    fullName: fullName || user.displayName || "",
    plan: "trial",
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 14 days trial
    milestonesSeeded: false,
    createdAt: new Date().toISOString(),
    orgId,
  });

  /** Google Signup */
  const handleGoogleSignup = async () => {
    setFirebaseError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await waitForAuthReady();

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        await setDoc(userRef, getDefaultUserData(user));

        await setDoc(doc(db, "customers", user.uid), {
          email: user.email,
          name: user.displayName || "",
          stripeCustomerId: "",
          plan: "trial",
          createdAt: serverTimestamp(),
        });

        await cloneOnboardingTemplate(user.uid);
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setFirebaseError("Google sign-up failed. Please try again.");
    }
  };

  const SignupSchema = Yup.object().shape({
    fullName: Yup.string().required("Full name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(8, "At least 8 characters")
      .matches(/[A-Z]/, "Uppercase letter required")
      .matches(/[a-z]/, "Lowercase letter required")
      .matches(/[0-9]/, "Number required")
      .matches(/[^a-zA-Z0-9]/, "Symbol required")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Confirm your password"),
    acceptedTerms: Yup.boolean().oneOf(
      [true],
      "Please accept terms and privacy policy"
    ),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0f7fa] to-[#f4f9fb] dark:from-[#0c1b1f] dark:to-[#1c2b2f] px-4">
      <div className="w-full max-w-lg p-8 bg-white dark:bg-[#152226] rounded-3xl shadow-xl space-y-6 mt-28">
        <div className="flex justify-center mb-2">
          <Image
            src="/welcomenesthr.png"
            alt="WelcomeNestHR"
            width={120}
            height={40}
          />
        </div>

        <h2 className="text-3xl font-bold text-center text-[#004d59] dark:text-white">
          Welcome Home 👋
        </h2>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Let&apos;s help you land smoothly — wherever you&apos;re headed.
        </p>

        <Formik
          initialValues={{
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
            acceptedTerms: false,
          }}
          validationSchema={SignupSchema}
          onSubmit={async (values, { setSubmitting }) => {
            setFirebaseError("");
            try {
              const userCredential = await createUserWithEmailAndPassword(
                auth,
                values.email,
                values.password
              );
              const user = userCredential.user;

              await updateProfile(user, { displayName: values.fullName });
              await waitForAuthReady();

              await setDoc(
                doc(db, "users", user.uid),
                getDefaultUserData(user, values.fullName)
              );

              await setDoc(doc(db, "customers", user.uid), {
                email: user.email,
                name: values.fullName,
                stripeCustomerId: "",
                plan: "trial",
                createdAt: serverTimestamp(),
              });

              await cloneOnboardingTemplate(user.uid);

              router.push("/dashboard");
            } catch (err) {
              console.error(err);
              setFirebaseError(
                "Account creation failed. Try a different email."
              );
            }
            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              {/* Full Name */}
              <div>
                <Field
                  name="fullName"
                  type="text"
                  placeholder="Full name"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#273c42] text-gray-800 dark:text-white focus:ring-2 focus:ring-[#00ACC1] focus:outline-none"
                />
                <ErrorMessage
                  name="fullName"
                  component="div"
                  className="text-sm text-red-600 dark:text-red-400 mt-1"
                />
              </div>

              {/* Email */}
              <div>
                <Field
                  name="email"
                  type="email"
                  placeholder="Email address"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#273c42] text-gray-800 dark:text-white focus:ring-2 focus:ring-[#00ACC1] focus:outline-none"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-sm text-red-600 dark:text-red-400 mt-1"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Field
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#273c42] text-gray-800 dark:text-white focus:ring-2 focus:ring-[#00ACC1] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute top-2 right-3 text-gray-500 dark:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-sm text-red-600 dark:text-red-400 mt-1"
                />
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Field
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#273c42] text-gray-800 dark:text-white focus:ring-2 focus:ring-[#00ACC1] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute top-2 right-3 text-gray-500 dark:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="text-sm text-red-600 dark:text-red-400 mt-1"
                />
              </div>

              {/* Terms */}
              <div className="flex items-center gap-2 text-sm">
                <Field type="checkbox" name="acceptedTerms" />
                <label
                  htmlFor="acceptedTerms"
                  className="text-gray-700 dark:text-gray-300"
                >
                  I agree to the{" "}
                  <a href="/terms" className="underline text-[#00ACC1]">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="underline text-[#00ACC1]">
                    Privacy Policy
                  </a>
                </label>
              </div>
              <ErrorMessage
                name="acceptedTerms"
                component="div"
                className="text-sm text-red-600 dark:text-red-400"
              />

              {firebaseError && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {firebaseError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#00ACC1] hover:bg-[#0097a7] text-white font-semibold py-2 rounded-lg transition"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </button>
            </Form>
          )}
        </Formik>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            or continue with
          </span>
          <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Google Signup */}
        <button
          onClick={handleGoogleSignup}
          className="w-full border border-gray-300 dark:border-gray-600 flex items-center justify-center gap-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Continue with Google
          </span>
        </button>

        {/* Link to Login */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-[#00ACC1] hover:text-[#0097a7] font-medium"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
