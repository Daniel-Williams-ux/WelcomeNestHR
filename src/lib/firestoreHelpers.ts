import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function cloneOnboardingTemplateTasks(userId: string) {
  try {
    console.log(`🔍 Fetching onboarding templates for user: ${userId}`);

    const templateRef = collection(db, "onboardingTemplates");
    const snapshot = await getDocs(templateRef);

    if (snapshot.empty) {
      console.warn("⚠️ No onboarding templates found.");
      return;
    }

    console.log(`📋 Found ${snapshot.size} template(s). Starting clone...`);

    const promises = snapshot.docs.map(async (taskDoc) => {
      const taskData = taskDoc.data();
      console.log(`➡️ Cloning task: ${taskDoc.id}`, taskData);

      await setDoc(doc(db, "users", userId, "onboarding", taskDoc.id), {
        ...taskData,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    });

    await Promise.all(promises);

    console.log(
      `✅ Successfully cloned ${snapshot.size} onboarding task(s) for user: ${userId}`
    );
  } catch (error) {
    console.error("❌ Error cloning onboarding template tasks:", error);
    // Not rethrowing so signup flow can continue
  }
}