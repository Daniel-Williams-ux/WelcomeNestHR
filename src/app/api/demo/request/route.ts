import { app } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

const db = getFirestore(app);

type DemoRequestPayload = {
  fullName?: string;
  workEmail?: string;
  companyName?: string;
  role?: string;
  companySize?: string;
  country?: string;
  interest?: string;
  message?: string;
  website?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitize = (value: unknown, maxLength = 500) =>
  String(value ?? "")
    .trim()
    .slice(0, maxLength);

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as DemoRequestPayload;

    // Honeypot field. Real users never see this input.
    if (payload.website) {
      return NextResponse.json({ ok: true });
    }

    const fullName = sanitize(payload.fullName, 120);
    const workEmail = sanitize(payload.workEmail, 160).toLowerCase();
    const companyName = sanitize(payload.companyName, 160);
    const role = sanitize(payload.role, 120);
    const companySize = sanitize(payload.companySize, 80);
    const country = sanitize(payload.country, 100);
    const interest = sanitize(payload.interest, 160);
    const message = sanitize(payload.message, 1200);

    if (!fullName || !workEmail || !companyName || !companySize || !country) {
      return NextResponse.json(
        { error: "Please complete the required fields." },
        { status: 400 },
      );
    }

    if (!emailPattern.test(workEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid work email." },
        { status: 400 },
      );
    }

    await db.collection("demoRequests").add({
      fullName,
      workEmail,
      companyName,
      role,
      companySize,
      country,
      interest,
      message,
      status: "new",
      source: "demo-page",
      createdAt: new Date(),
      userAgent: request.headers.get("user-agent") ?? null,
      referrer: request.headers.get("referer") ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DEMO_REQUEST_ERROR]", error);
    return NextResponse.json(
      { error: "We could not submit your request. Please try again." },
      { status: 500 },
    );
  }
}
