import { stripe } from "@/lib/stripe";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

const db = getFirestore(app);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing auth token" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth(app).verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await db.collection("users").doc(uid).get();
    const stripeCustomerId = userDoc.get("stripeCustomerId");

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "Stripe customer ID not found" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: process.env.STRIPE_PLATINUM_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[CHECKOUT_SESSION_ERROR]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}