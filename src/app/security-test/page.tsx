"use client";

import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TEST_OTHER_USER_ID = "QIpnDHwuP9UUKuM5BbN4qTo3MP83";
export default function SecurityTestPage() {
  useEffect(() => {
    const testUnauthorizedRead = async () => {
      try {
        const onboardingDocRef = doc(
          db,
          "users",
          TEST_OTHER_USER_ID,
          "onboarding",
          "checklist"
        );
        const docSnap = await getDoc(onboardingDocRef);

        if (docSnap.exists()) {
          console.log(
            "❌ SECURITY BREACH: Able to read another user's onboarding:",
            docSnap.data()
          );
        } else {
          console.log("✅ Cannot read — doc doesn't exist or access denied.");
        }
      } catch (error: any) {
        console.log("✅ Access correctly denied:", error.message);
      }
    };

    testUnauthorizedRead();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Security Test Running...</h1>
      <p>Check the browser console for results.</p>
    </div>
  );
}
