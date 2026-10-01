import { sql } from "@/lib/db/neon";

export interface DbUser {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export async function upsertUser({
  firebaseUid,
  email,
  displayName,
}: {
  firebaseUid: string;
  email: string;
  displayName?: string | null;
}): Promise<DbUser> {
  const result = await sql`
    INSERT INTO users (firebase_uid, email, display_name, updated_at)
    VALUES (${firebaseUid}, ${email}, ${displayName ?? null}, NOW())
    ON CONFLICT (firebase_uid)
    DO UPDATE SET
      email = EXCLUDED.email,
      display_name = COALESCE(EXCLUDED.display_name, users.display_name),
      updated_at = NOW()
    RETURNING id, firebase_uid, email, display_name, created_at, updated_at;
  `;

  return result[0] as unknown as DbUser;
}

export async function getUserByFirebaseUid(
  firebaseUid: string
): Promise<DbUser | null> {
  const result = await sql`
    SELECT id, firebase_uid, email, display_name, created_at, updated_at
    FROM users
    WHERE firebase_uid = ${firebaseUid}
    LIMIT 1;
  `;

  if (!result || result.length === 0) {
    return null;
  }

  return result[0] as unknown as DbUser;
}
