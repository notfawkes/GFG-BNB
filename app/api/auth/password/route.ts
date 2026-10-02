import { NextResponse } from "next/server";
import { ensureAuthSchema, getUserByEmail, createPasswordUser, createSession } from "@/lib/db/users";
import { hashPassword, verifyPassword, newSessionToken, hashSessionToken, sessionExpiry, SESSION_COOKIE } from "@/lib/auth/password";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const mode = body.mode;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    }
    await ensureAuthSchema();

    let user;
    if (mode === "signup") {
      if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
      const existing = await getUserByEmail(email);
      if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      const name = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 120) : "";
      user = await createPasswordUser(email, name || null, await hashPassword(password));
    } else if (mode === "login") {
      const existing = await getUserByEmail(email);
      if (!existing?.password_hash || !(await verifyPassword(password, existing.password_hash))) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
      }
      user = {
        id: existing.id,
        email: existing.email,
        display_name: existing.display_name,
        created_at: existing.created_at,
        updated_at: existing.updated_at,
      };
    } else {
      return NextResponse.json({ error: "Invalid authentication mode." }, { status: 400 });
    }

    const token = newSessionToken();
    const expiresAt = sessionExpiry();
    await createSession(user.id, hashSessionToken(token), expiresAt);
    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    return response;
  } catch (error) {
    console.error("Password authentication failed", error);
    return NextResponse.json({ error: "Authentication is unavailable. Check your Neon database configuration." }, { status: 500 });
  }
}
