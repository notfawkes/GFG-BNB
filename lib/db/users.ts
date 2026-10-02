import { sql } from "@/lib/db/neon";

export interface DbUser {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export async function ensureAuthSchema() {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS firebase_uid`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (lower(email))`;
  await sql`CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

export async function getUserByEmail(email: string) {
  const rows = await sql`SELECT id, email, display_name, created_at, updated_at, password_hash FROM users WHERE lower(email) = ${email} LIMIT 1`;
  return (rows[0] as (DbUser & { password_hash: string | null }) | undefined) ?? null;
}

export async function createPasswordUser(email: string, displayName: string | null, passwordHash: string) {
  const rows = await sql`INSERT INTO users (email, display_name, password_hash, updated_at) VALUES (${email}, ${displayName}, ${passwordHash}, NOW()) RETURNING id, email, display_name, created_at, updated_at`;
  return rows[0] as unknown as DbUser;
}

export async function createSession(userId: string, tokenHash: string, expiresAt: Date) {
  await sql`INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (${tokenHash}, ${userId}, ${expiresAt.toISOString()})`;
}

export async function getUserBySession(tokenHash: string) {
  const rows = await sql`SELECT u.id, u.email, u.display_name, u.created_at, u.updated_at FROM auth_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ${tokenHash} AND s.expires_at > NOW() LIMIT 1`;
  return (rows[0] as unknown as DbUser | undefined) ?? null;
}

export async function deleteSession(tokenHash: string) {
  await sql`DELETE FROM auth_sessions WHERE token_hash = ${tokenHash}`;
}
