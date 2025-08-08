import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Initialize Admin SDK with env vars
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();

async function fixTrialEndsAt() {
  const snapshot = await db.collection("users").get();
  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    if (data.plan === "trial" && typeof data.trialEndsAt === "string") {
      const parsedDate = new Date(data.trialEndsAt);
      if (!isNaN(parsedDate.getTime())) {
        await docSnap.ref.update({
          trialEndsAt: Timestamp.fromDate(parsedDate),
        });
        console.log(`✅ Fixed trialEndsAt for ${docSnap.id}`);
        updatedCount++;
      }
    }
  }

  console.log(`🎉 Done! Updated ${updatedCount} user(s).`);
}

fixTrialEndsAt().catch(console.error);