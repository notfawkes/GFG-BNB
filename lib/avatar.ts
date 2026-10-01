/**
 * Generates an email-based avatar URL using Dicebear with black & orange theme
 */
export function getEmailAvatarUrl(
  email?: string | null,
  displayName?: string | null
): string {
  const seed = (displayName || email?.split("@")[0] || "Bala").trim();
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=fc7819,ea580c,18181b&textColor=ffffff`;
}

export function getEmailInitial(
  email?: string | null,
  displayName?: string | null
): string {
  if (displayName && displayName.trim().length > 0) {
    return displayName.trim().slice(0, 2).toUpperCase();
  }
  if (email && email.trim().length > 0) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return "B";
}
