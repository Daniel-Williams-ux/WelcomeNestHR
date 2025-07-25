import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import * as express from "express";
import * as bodyParser from "body-parser";

admin.initializeApp();
const stripe = new Stripe("your_stripe_secret_key");

const endpointSecret = "whsec_nAe7i0yLEP4NYl2W1aO8Td0X61OnocM9";

const app = express();

//  Use raw body for Stripe webhook verification
app.use(bodyParser.raw({ type: "application/json" }));

app.post("/handleStripeWebhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  const data = event.data.object as Stripe.Subscription;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const customerId = data.customer as string;
      const subscriptionStatus = data.status;
      const priceId = data.items.data[0]?.price.id;

      //  Map priceId to plan
      let plan = "free";
      switch (priceId) {
        case "price_1RhCvxD1HsOrcNPUUDdvsuV9":
          plan = "pro";
          break;
        // Add more plans if needed
      }

      //  Only assign paid plan if active
      const finalPlan = subscriptionStatus === "active" ? plan : "free";

      // Lookup Firebase user by Stripe customer ID
      const customersRef = admin.firestore().collection("customers");
      const querySnap = await customersRef
        .where("stripeCustomerId", "==", customerId)
        .get();

      if (!querySnap.empty) {
        const userDoc = querySnap.docs[0];
        await userDoc.ref.update({
          plan: finalPlan,
        });
        console.log(`Updated plan for UID ${userDoc.id} to ${finalPlan}`);
      } else {
        console.warn(`No user found for Stripe customer ${customerId}`);
      }

      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).send({ received: true });
});

//  Final export for Firebase
export const handleStripeWebhook = functions.https.onRequest(app);