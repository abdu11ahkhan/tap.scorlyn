/**
 * The naming convention corporate accounts hang employee handles off.
 *
 * There is no second URL scheme here — an employee's card is an ordinary
 * card_profiles row at /u/[username], see src/app/u/[username]/page.tsx.
 * This just derives a username of the shape "{company_slug}-{employee}" so
 * the existing single route carries both names.
 */

/**
 * Deliberately short: card_profiles.username tops out at 30 characters
 * (USERNAME_PATTERN in src/lib/card-draft.ts), and every employee handle is
 * "{company_slug}-{something}". A slug anywhere near that cap on its own
 * would leave no room for the employee's name — 21 leaves at least 8 for it,
 * comfortably enough for a real name, with room to spare for a numeric
 * suffix if two employees collide. Matched by the CHECK on
 * profiles.company_slug in supabase/migrations/040_corporate_accounts.sql.
 */
export const COMPANY_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,20}$/;

/**
 * A best-effort slug from freeform text — a business name, a person's name.
 * Not guaranteed unique; callers check that separately (company_slug_available
 * or username_available) and add a numeric suffix on collision.
 */
export function slugify(input: string, maxLength = 39): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    // Trim edges *after* the length cut, not before: cutting a hyphenated
    // slug at an arbitrary length routinely lands right after a "-", and
    // trimming only the original string's edges left that dangling —
    // employeeUsername() with a tight budget produced things like
    // "acme-jane-qa-" instead of "acme-jane-qa" (found by testing the
    // actual feature end-to-end, not by inspection).
    .slice(0, maxLength)
    .replace(/^-+|-+$/g, "");
}

/** profiles.company_slug's own cap — see COMPANY_SLUG_PATTERN. */
export const COMPANY_SLUG_MAX = 21;

/** card_profiles.username's cap, everywhere else called USERNAME_PATTERN. */
const USERNAME_MAX = 30;

/**
 * An employee's composed handle: "{company_slug}-{employee slug}", fit to
 * card_profiles.username's 30-character ceiling.
 *
 * `suffix` is the collision-retry number the caller is currently trying (see
 * createEmployee in src/app/dashboard/team/actions.ts) — room is recomputed
 * per attempt so a growing "-2", "-3", ... suffix never pushes the whole
 * thing back over the limit.
 */
export function employeeUsername(
  companySlug: string,
  employeeName: string,
  suffix?: number
): string {
  const suffixText = suffix ? `-${suffix}` : "";
  const room = Math.max(1, USERNAME_MAX - companySlug.length - 1 - suffixText.length);
  const employeeSlug = slugify(employeeName, room) || "member";
  return `${companySlug}-${employeeSlug}${suffixText}`;
}
