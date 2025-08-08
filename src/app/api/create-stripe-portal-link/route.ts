// src/app/api/create-stripe-portal-link/route.ts

import { stripe } from "@/lib/stripe";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

// Initialize Firestore
const db = getFirestore(app);

export async function POST(req: NextRequest) {
  try {
    // ✅ Extract Bearer token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid auth token" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1];

    // ✅ Decode Firebase token to get UID
    const decodedToken = await getAuth(app).verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // ✅ Get user document from Firestore
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { error: "User not found in Firestore" },
        { status: 404 }
      );
    }

   const userData = userSnap.data() as { stripeCustomerId?: string };

   if (!userData?.stripeCustomerId) {
     return NextResponse.json(
       { error: "Stripe customer ID missing or invalid for user." },
       { status: 400 }
     );
   }

    const stripeCustomerId = userData.stripeCustomerId;
    
    console.log("[DEBUG] Stripe Customer ID:", stripeCustomerId);



    // ✅ Create Stripe billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("[STRIPE_PORTAL_ERROR]", err.message, err.stack);
    } else {
      console.error("[STRIPE_PORTAL_ERROR]", err);
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }

}