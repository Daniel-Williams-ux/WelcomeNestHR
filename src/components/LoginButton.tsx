"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      // 🔥 Create user doc in Firestore if it doesn't exist
      const userRef = doc(db, "users", loggedInUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: loggedInUser.uid,
          name: loggedInUser.displayName,
          email: loggedInUser.email,
          photoURL: loggedInUser.photoURL,
          createdAt: new Date().toISOString(),
          onboarded: false,
          role: "employee",
        });
      }

      router.push("/dashboard"); // ✅ Redirect after login
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return user ? (
    <button
      onClick={handleLogout}
      className="text-sm text-orange-600 hover:text-orange-800"
    >
      Logout ({user.displayName?.split(" ")[0]})
    </button>
  ) : (
    <button
      onClick={handleLogin}
      className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#00ACC1]"
    >
      Login
    </button>
  );
}