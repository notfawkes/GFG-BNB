import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getUserByFirebaseUid, upsertUser } from "@/lib/db/users";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing authentication token" },
        { status: 401 }
      );
    }

    const idToken = authHeader.split("Bearer ")[1].trim();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    let dbUser = await getUserByFirebaseUid(decodedToken.uid);

    // If user is not yet in Neon DB, auto-upsert
    if (!dbUser && decodedToken.email) {
      dbUser = await upsertUser({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        displayName: (decodedToken.name as string | undefined) ?? null,
      });
    }

    return NextResponse.json({
      user: dbUser,
    });
  } catch (error: unknown) {
    console.error("Error fetching user profile:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
