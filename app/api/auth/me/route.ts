import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureAuthSchema, getUserBySession } from "@/lib/db/users";
import { hashSessionToken, SESSION_COOKIE } from "@/lib/auth/password";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null });
  try {
    await ensureAuthSchema();
    return NextResponse.json({ user: await getUserBySession(hashSessionToken(token)) });
  } catch (error) {
    console.error("Could not load session", error);
    return NextResponse.json({ error: "Could not load session" }, { status: 500 });
  }
}
