import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { sql } from "@/lib/db/neon";

async function handleSessionVerification(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing Bearer token in Authorization header." },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1]?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Token not provided." },
        { status: 401 }
      );
    }

    // Verify the Firebase ID token using Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken.uid) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token payload." },
        { status: 401 }
      );
    }

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email || "";

    // Synchronize user with Neon PostgreSQL
    // 1. Check if user already exists by firebase_uid
    const existingUsers = await sql`
      SELECT id, firebase_uid, email, display_name, created_at, updated_at
      FROM users
      WHERE firebase_uid = ${firebaseUid}
      LIMIT 1;
    `;

    // 2. If user does not exist, insert new record
    if (existingUsers.length === 0) {
      await sql`
        INSERT INTO users (firebase_uid, email)
        VALUES (${firebaseUid}, ${email});
      `;
    }

    // Return safe user information without ID token
    return NextResponse.json({
      authenticated: true,
      user: {
        uid: firebaseUid,
        email: decodedToken.email ?? null,
      },
    });
  } catch (error: unknown) {
    console.error(
      "Session verification error:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Unauthorized: Invalid or expired token." },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  return handleSessionVerification(request);
}

export async function GET(request: Request) {
  return handleSessionVerification(request);
}
