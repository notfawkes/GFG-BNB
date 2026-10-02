import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSession, ensureAuthSchema } from "@/lib/db/users";
import { hashSessionToken, SESSION_COOKIE } from "@/lib/auth/password";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await ensureAuthSchema();
      await deleteSession(hashSessionToken(token));
    } catch (error) {
      console.error("Could not end session", error);
    }
  }
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
