import * as functions from "firebase-functions/v1"; // ✅ v1 import for .document()
import * as admin from "firebase-admin";
import Stripe from "stripe";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";

admin.initializeApp();
const db = admin.firestore();

const stripeSecret =
  process.env.STRIPE_SECRET || functions.config().stripe?.secret || "";
const stripeWebhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET ||
  functions.config().stripe?.webhook_secret ||
  "";

if (!stripeSecret) {
  console.warn(
    "⚠️ STRIPE_SECRET is not set. Stripe calls will fail until you configure env."
  );
}

// ✅ Cast API version to any to avoid type error
const stripe = new Stripe(stripeSecret, {
  apiVersion: "2025-06-30.basil" as any,
});

const DEFAULT_ORG_TASKS = [
  {
    title: "Set up work tools",
    description: "Get access to Slack, email and workspace tools.",
    autoComplete: false,
    trigger: null,
  },
  {
    title: "Read the company handbook",
    description: "Review policies, code of conduct and benefits.",
    autoComplete: false,
    trigger: null,
  },
  {
    title: "Meet your onboarding buddy",
    description: "Get introduced to your assigned buddy.",
    autoComplete: true,
    trigger: "buddyAssigned",
  },
  {
    title: "Schedule your 30-day check-in",
    description: "Book your first feedback meeting with your manager.",
    autoComplete: false,
    trigger: null,
  },
  {
    title: "Complete your profile",
    description: "Fill in your name, role, and contact details.",
    autoComplete: true,
    trigger: "profileCompleted",
  },
];

// 1) Org creation: seed org tasks
export const seedOnboardingTasksForOrg = functions.firestore
  .document("organizations/{orgId}")
  .onCreate(
    async (
      snap: FirebaseFirestore.DocumentSnapshot,
      context: functions.EventContext
    ) => {
      const orgId = context.params.orgId;
      try {
        const tasksRef = db
          .collection("organizations")
          .doc(orgId)
          .collection("onboardingTasks");
        const batch = db.batch();
        for (const task of DEFAULT_ORG_TASKS) {
          const newDoc = tasksRef.doc();
          batch.set(newDoc, {
            ...task,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        await batch.commit();
        console.log(
          `✅ Seeded ${DEFAULT_ORG_TASKS.length} tasks for org ${orgId}`
        );
      } catch (err) {
        console.error("🔥 Failed to seed org tasks", err);
      }
    }
  );

// 2) User creation: clone org tasks to user onboarding
export const cloneOrgTasksToUser = functions.firestore
  .document("users/{userId}")
  .onCreate(
    async (
      snap: FirebaseFirestore.DocumentSnapshot,
      context: functions.EventContext
    ) => {
      const userId = context.params.userId;
      const userData = snap.data() || {};
      const orgId = userData.orgId;

      if (!orgId) {
        console.warn(`⚠️ User ${userId} has no orgId — skipping clone.`);
        return;
      }

      try {
        const orgTasksSnap = await db
          .collection("organizations")
          .doc(orgId)
          .collection("onboardingTasks")
          .get();

        if (orgTasksSnap.empty) {
          console.warn(`⚠️ No onboarding tasks for org ${orgId}.`);
          return;
        }

        const batch = db.batch();
        orgTasksSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const userTaskRef = db
            .collection("users")
            .doc(userId)
            .collection("onboarding")
            .doc();
          batch.set(userTaskRef, {
            title: data.title || "Untitled task",
            description: data.description || "",
            completed: !!data.autoComplete,
            trigger: data.trigger || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            order: data.order ?? null,
          });
        });

        await batch.commit();
        console.log(
          `✅ Cloned ${orgTasksSnap.size} tasks from org ${orgId} to user ${userId}`
        );
      } catch (err) {
        console.error("🔥 Failed to clone org tasks to user", err);
      }
    }
  );

// 3) Stripe webhook (express)
const app = express();
app.use(bodyParser.raw({ type: "application/json" }));

app.post("/handleStripeWebhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  if (!sig) {
    res.status(400).send("Missing stripe-signature header");
    return;
  }

  if (!stripeWebhookSecret) {
    console.error("Stripe webhook secret not configured");
    res.status(500).send("Stripe webhook not configured");
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      stripeWebhookSecret
    );
  } catch (err) {
    console.error("Webhook verification failed", err);
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = subscription.customer as string;
      const subscriptionStatus = subscription.status;
      const priceId = subscription.items?.data?.[0]?.price?.id;

      let plan = "free";
      switch (priceId) {
        case "price_1RhCvxD1HsOrcNPUUDdvsuV9":
          plan = "platinum";
          break;
        default:
          plan = "free";
      }

      const finalPlan = subscriptionStatus === "active" ? plan : "free";
      const customersRef = db.collection("customers");
      const q = await customersRef
        .where("stripeCustomerId", "==", stripeCustomerId)
        .get();

      if (!q.empty) {
        const userDoc = q.docs[0];
        await userDoc.ref.update({ plan: finalPlan });
        console.log(`Updated plan for UID ${userDoc.id} -> ${finalPlan}`);
      } else {
        console.warn(
          `No local user found for stripe customer ${stripeCustomerId}`
        );
      }
    } else {
      console.log(`Unhandled stripe event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Error processing Stripe event", err);
  }

  res.json({ received: true });
});

export const handleStripeWebhook = functions.https.onRequest(app);
