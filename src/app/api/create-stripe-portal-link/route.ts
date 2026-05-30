import { app } from "@/lib/firebase-admin";
import { stripe } from "@/lib/stripe";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

const db = getFirestore(app);

type BillingUser = {
  role?: string;
  companyId?: string;
  stripeCustomerId?: string;
};

async function resolveStripeCustomerId(uid: string, userData: BillingUser) {
  if (userData.role === "hr" && userData.companyId) {
    const companySnap = await db.collection("companies").doc(userData.companyId).get();
    const companyCustomerId = companySnap.get("stripeCustomerId");

    if (companyCustomerId) return String(companyCustomerId);
  }

  if (userData.stripeCustomerId) return userData.stripeCustomerId;

  const customerSnap = await db.collection("customers").doc(uid).get();
  const customerId = customerSnap.get("stripeCustomerId");

  return customerId ? String(customerId) : null;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid auth token" },
        { status: 401 },
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth(app).verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userSnap = await db.collection("users").doc(uid).get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { error: "User not found in Firestore" },
        { status: 404 },
      );
    }

    const userData = userSnap.data() as BillingUser;
    const canManageBilling =
      userData.role === "hr" || userData.role === "superadmin";

    if (!canManageBilling) {
      return NextResponse.json(
        { error: "Only HR or superadmin users can manage billing." },
        { status: 403 },
      );
    }

    const stripeCustomerId = await resolveStripeCustomerId(uid, userData);

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "Stripe customer ID missing or invalid for this billing account." },
        { status: 400 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
    const returnPath =
      userData.role === "superadmin" ? "/superadmin/billing" : "/hr/billing";

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}${returnPath}`,
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
      { status: 500 },
    );
  }
}