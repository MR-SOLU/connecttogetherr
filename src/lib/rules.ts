export interface ProfileLike {
  display_name: string;
  bio: string;
  interests: string[];
  is_suspended?: boolean;
}

export const PROFILE_RULES = { minName: 2, minBio: 20, minInterests: 1 } as const;

/** Same rule the database enforces before someone can chat, join rooms or teams. */
export function isProfileComplete(p: ProfileLike | null | undefined): boolean {
  if (!p || p.is_suspended) return false;
  return (
    p.display_name.trim().length >= PROFILE_RULES.minName &&
    p.bio.trim().length >= PROFILE_RULES.minBio &&
    p.interests.length >= PROFILE_RULES.minInterests
  );
}

export function profileMissing(p: ProfileLike | null | undefined): string[] {
  const missing: string[] = [];
  if (!p) return ["profile"];
  if (p.display_name.trim().length < PROFILE_RULES.minName) missing.push("your name");
  if (p.bio.trim().length < PROFILE_RULES.minBio) missing.push(`a short bio (${PROFILE_RULES.minBio}+ characters)`);
  if (p.interests.length < PROFILE_RULES.minInterests) missing.push("at least one interest");
  return missing;
}

/** Duo rooms are always exactly two people; groups hold at least three. */
export function roomCapacity(kind: "duo" | "group", requested: number): number {
  if (kind === "duo") return 2;
  return Math.min(50, Math.max(3, Math.round(requested)));
}

export function spotsLeft(capacity: number, members: number): number {
  return Math.max(0, capacity - members);
}
