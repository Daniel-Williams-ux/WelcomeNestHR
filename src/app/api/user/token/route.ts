import { auth } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const sessionCookie = req.headers
      .get("cookie")
      ?.split("; ")
      .find((c) => c.startsWith("session="))
      ?.split("=")[1];

    if (!sessionCookie) {
      return NextResponse.json("Missing session cookie", { status: 401 });
    }

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const user = await getAuth().getUser(decodedClaims.uid);
    const idToken = user.customClaims?.stripeToken;

    if (!idToken) {
      return NextResponse.json("Missing ID token", { status: 401 });
    }

    return new NextResponse(idToken);
  } catch (err) {
    console.error("[USER_TOKEN_ERROR]", err);
    return NextResponse.json("Invalid session", { status: 401 });
  }
}