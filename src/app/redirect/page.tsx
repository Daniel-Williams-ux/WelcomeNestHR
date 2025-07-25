"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRedirectResult, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function GoogleRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleGoogleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);

        if (result?.user) {
          const user = result.user;

          // Optional: add default name
          if (!user.displayName) {
            await updateProfile(user, {
              displayName: user.email?.split("@")[0] || "",
            });
          }

          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              fullName: user.displayName || "",
              plan: "free",
              createdAt: new Date().toISOString(),
            });
          }

          router.push("/dashboard");
        } else {
          router.push("/signup");
        }
      } catch (err) {
        console.error("Google redirect error:", err);
        router.push("/signup");
      }
    };

    handleGoogleRedirect();
  }, [router]);

  return <p className="text-center p-6">Finishing sign-in with Google...</p>;
}