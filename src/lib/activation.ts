/**
 * Activation-page logic with no database or React, so each state is
 * unit-tested (tests/unit/activation.test.ts). The page fetches
 * card_claim_status() and renders whatever activationStep() returns.
 */

/** What card_claim_status(p_code) reports (migration 063). */
export type ClaimStatus = {
  exists: boolean;
  serial?: number;
  status?: string;
  claimable?: boolean;
  pending_other?: boolean;
  my_claim?: string | null;
  is_owner?: boolean;
};

export type ActivationStep =
  /** Unknown code: 404. */
  | "not-found"
  /** The signed-in user owns it: choose what it opens. */
  | "owner"
  /** Owned by someone else. */
  | "in-use"
  /** In stock but held back by an admin. */
  | "not-ready"
  /** Claimable, nobody signed in. */
  | "sign-in"
  /** This user's request is waiting for approval. */
  | "pending"
  /** Someone else's request is waiting. */
  | "pending-other"
  /** Claimable and signed in: enter the code or request activation. */
  | "claim";

export function activationStep(s: ClaimStatus, signedIn: boolean): ActivationStep {
  if (!s.exists) return "not-found";
  if (s.is_owner) return "owner";
  if (s.status !== "in_stock") return "in-use";
  if (!s.claimable) return "not-ready";
  if (!signedIn) return "sign-in";
  if (s.my_claim === "pending") return "pending";
  if (s.pending_other) return "pending-other";
  return "claim";
}

/** Same alphabet new_activation_code() draws from: no I, O, 0 or 1. */
const CODE_ALPHABET = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
export const ACTIVATION_CODE_LENGTH = 8;

/** What the database compares: dashes, spaces and case don't matter. */
export function normalizeActivationCode(input: string): string {
  return input.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export type CodeCheck =
  | { ok: true; code: string }
  | { ok: false; reason: "empty" | "incomplete" | "invalid" };

/**
 * Format check before anything is sent. It cannot say whether a code is the
 * right one for this card — only the database can — but it catches the
 * typing mistakes that would otherwise cost a round trip: too short, too
 * long, or letters that never appear in a code (O, I, 0, 1).
 */
export function checkActivationCode(input: string): CodeCheck {
  const code = normalizeActivationCode(input);
  if (!code) return { ok: false, reason: "empty" };
  if (code.length < ACTIVATION_CODE_LENGTH) return { ok: false, reason: "incomplete" };
  if (code.length > ACTIVATION_CODE_LENGTH || !CODE_ALPHABET.test(code)) return { ok: false, reason: "invalid" };
  return { ok: true, code };
}

export const CODE_PROBLEM: Record<"empty" | "incomplete" | "invalid", string> = {
  empty: "Enter the code printed on the packaging.",
  incomplete: "That code is too short — it has 8 letters and numbers.",
  invalid: "That doesn't look like an activation code. Check it for O/0 and I/1 — codes never use those.",
};
