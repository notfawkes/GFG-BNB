import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { upsertUser } from "@/lib/db/users";

export async function POST(request: Request) {
  try {
    let idToken = "";
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      idToken = authHeader.split("Bearer ")[1].trim();
    }

    let body: { idToken?: string; displayName?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body can be empty if token is in header
    }

    if (!idToken && body.idToken) {
      idToken = body.idToken;
    }

    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication token" },
        { status: 401 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        { error: "Bad Request: Authenticated user does not have an email" },
        { status: 400 }
      );
    }

    const displayName =
      body.displayName ??
      (decodedToken.name as string | undefined) ??
      null;

    const dbUser = await upsertUser({
      firebaseUid: decodedToken.uid,
      email,
      displayName,
    });

    return NextResponse.json({
      success: true,
      user: dbUser,
    });
  } catch (error: unknown) {
    console.error("Error syncing user with Neon:", error);
    const message =
      error instanceof Error ? error.message : "Failed to sync user with database";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
