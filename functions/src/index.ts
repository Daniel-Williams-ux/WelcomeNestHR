import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Stripe with your secret key
const stripe = new Stripe("your_stripe_secret_key", {
  apiVersion: "2024-04-10",
});

const endpointSecret = "your_stripe_webhook_secret"; // from Stripe dashboard

export const handleStripeWebhook = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const sig = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook signature verification failed.", err);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    const data = event.data.object as Stripe.Subscription;

    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.created":
      case "customer.subscription.deleted": {
        const customerId = data.customer as string;
        const subscriptionStatus = data.status;
        const priceId = data.items.data[0]?.price.id;

        // Optional: Map priceId to plan (e.g. "pro", "enterprise")
        const plan =
          priceId === "price_1RhCvxD1HsOrcNPUUDdvsuV9" ? "pro" : "free"; // Update this logic

        // Lookup Firebase UID by Stripe customer ID
        const customersRef = admin.firestore().collection("customers");
        const querySnap = await customersRef
          .where("stripeCustomerId", "==", customerId)
          .get();

        if (!querySnap.empty) {
          const userDoc = querySnap.docs[0];
          await userDoc.ref.update({
            plan: subscriptionStatus === "active" ? plan : "free",
          });
          console.log(`Updated plan for UID ${userDoc.id} to ${plan}`);
        }

        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send({ received: true });
  }
);