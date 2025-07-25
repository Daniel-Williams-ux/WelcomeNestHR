"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Image from "next/image";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

 const handleGoogleSignup = async () => {
   try {
     const provider = new GoogleAuthProvider();
     await signInWithPopup(auth, provider);
     router.push("/dashboard");
     await signInWithRedirect(auth, provider);
   } catch (err: unknown) {
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
              const nameParts = values.fullName.trim().split(" ");
              const firstName = nameParts[0];
              const lastName =
                nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

              await updateProfile(user, {
                displayName: `${firstName} ${lastName}`,
              });

              // Save user data to Firestore
              await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                fullName: values.fullName,
                plan: "free",
                createdAt: new Date().toISOString(),
              });

              await setDoc(doc(db, "customers", user.uid), {
                email: user.email,
                name: values.fullName,
                stripeCustomerId: "",
                plan: "free",
                createdAt: new Date(),
              });

              router.push("/dashboard");
            } catch (err: unknown) {
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

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            or continue with
          </span>
          <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
        </div>

        <button
          onClick={handleGoogleSignup}
          className="w-full border border-gray-300 dark:border-gray-600 flex items-center justify-center gap-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <Image
            src="/google-logo.svg"
            alt="Google"
            width={20}
            height={20}
            className="w-5 h-5"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Continue with Google
          </span>
        </button>

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