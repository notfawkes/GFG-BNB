import { User } from "firebase/auth";
import { DbUser } from "@/lib/db/users";

export async function syncUserWithNeon(
  user: User,
  displayName?: string
): Promise<DbUser> {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      displayName: displayName ?? user.displayName ?? null,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error || "Failed to sync user with Neon database"
    );
  }

  const data = await res.json();
  return data.user as DbUser;
}

export async function fetchNeonUser(user: User): Promise<DbUser | null> {
  const idToken = await user.getIdToken();
  const res = await fetch("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return (data.user as DbUser) || null;
}
