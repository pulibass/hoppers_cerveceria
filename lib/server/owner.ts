// Pure decision logic for the owner bootstrap, kept separate so it can be unit tested.

export type AdminRole = "owner" | "editor";

export type OwnerDecision = "keep" | "create-owner" | "promote-to-owner" | "deny";

export function isOwnerEmail(email: string, ownerEmail: string | undefined): boolean {
  const expected = ownerEmail?.trim().toLowerCase() ?? "";
  return expected !== "" && email.trim().toLowerCase() === expected;
}

/**
 * - An existing owner stays owner.
 * - An editor whose email is OWNER_EMAIL is promoted while no owner exists yet.
 * - A non-admin becomes owner only if their email is OWNER_EMAIL and there is no owner.
 * - Everyone else keeps their access (editors) or is denied (non-admins).
 */
export function decideOwnerBootstrap(input: {
  email: string;
  ownerEmail: string | undefined;
  currentRole: AdminRole | null;
  ownerExists: boolean;
}): OwnerDecision {
  const matches = isOwnerEmail(input.email, input.ownerEmail);
  if (input.currentRole === "owner") return "keep";
  if (input.currentRole === "editor") return matches && !input.ownerExists ? "promote-to-owner" : "keep";
  return matches && !input.ownerExists ? "create-owner" : "deny";
}
