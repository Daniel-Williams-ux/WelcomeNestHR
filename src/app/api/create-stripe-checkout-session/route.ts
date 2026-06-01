import { stripe } from "@/lib/stripe";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { app } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_TRIAL_DAYS,
  appPlanFromBillingPlanId,
  getBillingPlan,
  type BillingPlanId,
} from "@/lib/billingPlans";

const db = getFirestore(app);

type BillingUser = {
  role?: string;
  companyId?: string;
  stripeCustomerId?: string;
  email?: string;
};

async function countBillableEmployees(companyId: string) {
  const employeesSnap = await db
    .collection("companies")
    .doc(companyId)
    .collection("employees")
    .get();

  const activeEmployees = employeesSnap.docs.filter((doc) => {
    const status = String(doc.get("status") ?? "active").toLowerCase();
    return status !== "inactive" && status !== "terminated" && status !== "archived";
  });

  return activeEmployees.length;
}

async function resolveCompanyCustomerId(
  uid: string,
  userData: BillingUser,
  companyId: string,
) {
  const companyRef = db.collection("companies").doc(companyId);
  const companySnap = await companyRef.get();

  if (!companySnap.exists) {
    throw new Error("Company billing profile not found.");
  }

  const companyCustomerId = companySnap.get("stripeCustomerId");
  if (companyCustomerId) {
    return {
      companyRef,
      company: companySnap.data() ?? {},
      stripeCustomerId: String(companyCustomerId),
    };
  }

  if (userData.stripeCustomerId) {
    await companyRef.set(
      { stripeCustomerId: userData.stripeCustomerId },
      { merge: true },
    );
    return {
      companyRef,
      company: companySnap.data() ?? {},
      stripeCustomerId: userData.stripeCustomerId,
    };
  }

  const customerSnap = await db.collection("customers").doc(uid).get();
  const customerId = customerSnap.get("stripeCustomerId");

  if (customerId) {
    await companyRef.set({ stripeCustomerId: String(customerId) }, { merge: true });
    return {
      companyRef,
      company: companySnap.data() ?? {},
      stripeCustomerId: String(customerId),
    };
  }

  const customer = await stripe.customers.create({
    email: userData.email,
    metadata: {
      companyId,
      ownerUid: uid,
      app: "WelcomeNestHR",
    },
  });

  await companyRef.set({ stripeCustomerId: customer.id }, { merge: true });
  await db
    .collection("customers")
    .doc(uid)
    .set({ stripeCustomerId: customer.id, companyId }, { merge: true });

  return {
    companyRef,
    company: companySnap.data() ?? {},
    stripeCustomerId: customer.id,
  };
}

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

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const userData = {
      ...(userDoc.data() as BillingUser),
      email: (userDoc.get("email") as string | undefined) ?? decodedToken.email,
    };
    const canManageBilling =
      userData.role === "hr" || userData.role === "superadmin";

    if (!canManageBilling) {
      return NextResponse.json(
        { error: "Only HR or superadmin users can manage billing." },
        { status: 403 },
      );
    }

    const { planId } = (await req.json().catch(() => ({}))) as {
      planId?: BillingPlanId;
    };

    const selectedPlan = getBillingPlan(planId);

    if (!selectedPlan) {
      return NextResponse.json(
        { error: "Choose a valid billing plan before checkout." },
        { status: 400 },
      );
    }

    const priceId = process.env[selectedPlan.envPriceKey];

    if (!priceId) {
      return NextResponse.json(
        {
          error: `${selectedPlan.envPriceKey} is not configured. Add the Stripe Price ID for the ${selectedPlan.name} plan.`,
        },
        { status: 500 },
      );
    }

    const companyId = userData.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "This account is not linked to a company billing profile." },
        { status: 400 },
      );
    }

    const { companyRef, company, stripeCustomerId } =
      await resolveCompanyCustomerId(uid, userData, companyId);

    const activeEmployeeCount = await countBillableEmployees(companyId);
    const billableSeats = Math.max(activeEmployeeCount, selectedPlan.minimumSeats);
    const existingSubscriptionId = company.stripeSubscriptionId
      ? String(company.stripeSubscriptionId)
      : null;
    const existingStatus = String(company.subscriptionStatus ?? "").toLowerCase();
    const shouldApplyTrial =
      !existingSubscriptionId &&
      (existingStatus === "" ||
        existingStatus === "trialing" ||
        String(company.plan ?? "").toLowerCase() === "trial");

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
    const returnPath =
      userData.role === "superadmin" ? "/superadmin/billing" : "/hr/billing";

    await companyRef.set(
      {
        billingPlanId: selectedPlan.id,
        pendingBillingPlan: selectedPlan.name,
        billableSeats,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: billableSeats,
        },
      ],
      allow_promotion_codes: true,
      tax_id_collection: { enabled: true },
      automatic_tax: {
        enabled: process.env.STRIPE_AUTOMATIC_TAX === "true",
      },
      client_reference_id: companyId,
      customer_update: {
        address: "auto",
        name: "auto",
      },
      subscription_data: {
        ...(shouldApplyTrial ? { trial_period_days: DEFAULT_TRIAL_DAYS } : {}),
        metadata: {
          companyId,
          ownerUid: uid,
          billingPlanId: selectedPlan.id,
          plan: appPlanFromBillingPlanId(selectedPlan.id),
          billableSeats: String(billableSeats),
        },
      },
      metadata: {
        companyId,
        ownerUid: uid,
        billingPlanId: selectedPlan.id,
        plan: appPlanFromBillingPlanId(selectedPlan.id),
        billableSeats: String(billableSeats),
      },
      success_url: `${baseUrl}${returnPath}?success=1`,
      cancel_url: `${baseUrl}${returnPath}?canceled=1`,
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