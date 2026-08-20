"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { USERNAME_PATTERN } from "@/lib/card-draft";
import { COMPANY_SLUG_MAX, COMPANY_SLUG_PATTERN, slugify } from "@/lib/org";

type Result = { ok: boolean; error?: string };

function fail(error: unknown): Result {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please log in first.");
  return { supabase, user };
}

/**
 * Change the public handle.
 *
 * Allowed once, ever. Every printed card points at /u/<old-handle> through
 * the NFC redirect, and those chips can't be rewritten remotely — so a second
 * change would strand a second batch of cards. One is a mistake people can
 * recover from; unlimited is a support problem forever.
 */
export async function changeUsername(next: string): Promise<Result> {
  try {
    const { supabase, user } = await requireUser();

    const handle = next.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(handle)) {
      throw new Error("3–30 characters: lowercase letters, numbers, - and _ only.");
    }

    const { data: card } = await supabase
      .from("card_profiles")
      .select("id, username, username_changed_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!card) throw new Error("You don't have a card yet.");
    if (card.username === handle) throw new Error("That's already your handle.");
    if (card.username_changed_at) {
      throw new Error("You've already changed your handle once. Contact support if you need it changed again.");
    }

    const { error } = await supabase
      .from("card_profiles")
      .update({ username: handle, username_changed_at: new Date().toISOString() })
      .eq("id", card.id);

    if (error) {
      if (error.code === "23505") throw new Error("That handle is taken.");
      console.error("changeUsername update failed:", error);
      throw new Error("Couldn't change the handle — please try again.");
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/card");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function changeEmail(email: string): Promise<Result> {
  try {
    const { supabase } = await requireUser();
    const next = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) throw new Error("That doesn't look like an email.");

    // Supabase sends a confirmation to the new address; it isn't live until
    // that link is clicked.
    const { error } = await supabase.auth.updateUser({ email: next });
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function changePassword(password: string): Promise<Result> {
  try {
    const { supabase } = await requireUser();
    if (password.length < 8) throw new Error("Use at least 8 characters.");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveNotifications(input: {
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
  whatsapp: string;
}): Promise<Result> {
  try {
    const { supabase, user } = await requireUser();

    if (input.notifyWhatsapp && !input.whatsapp.trim()) {
      throw new Error("Add a WhatsApp number, or turn WhatsApp updates off.");
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        notify_email: input.notifyEmail,
        notify_whatsapp: input.notifyWhatsapp,
        whatsapp: input.whatsapp.trim() || null,
      })
      .eq("id", user.id);

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/settings");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Irreversible. The RPC only ever deletes the caller's own row. */
export async function deleteAccount(): Promise<Result> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("delete_own_account");
    if (error) throw new Error(error.message);
    await supabase.auth.signOut();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Individual → corporate.
 *
 * /onboarding/company-setup (reached from signup) turns out NOT to be
 * reusable here: it only collects house_template/first-employee, on the
 * assumption company_name/company_slug were already set during signup by
 * AccountTypePicker. A settings-triggered conversion never goes through
 * that picker, so this collects the same company name → slug pair itself
 * — company_slug is required by every corporate feature (assertCorporateOwner
 * in src/app/dashboard/team/actions.ts refuses to proceed without it), so
 * flipping account_type without it would leave the account stuck corporate
 * but unable to actually do anything corporate.
 */
export async function switchToCorporate(companyName: string): Promise<Result> {
  try {
    const { supabase, user } = await requireUser();

    const name = companyName.trim();
    if (!name) throw new Error("Enter your company name.");

    const slug = slugify(name, COMPANY_SLUG_MAX);
    if (!COMPANY_SLUG_PATTERN.test(slug)) {
      throw new Error("That name doesn't produce a usable address — try adding a word or two.");
    }

    const { data: available, error: slugCheckError } = await supabase.rpc(
      "company_slug_available",
      { candidate: slug }
    );
    if (slugCheckError) throw new Error(slugCheckError.message);
    if (!available) throw new Error(`"${slug}" is already taken by another company.`);

    const { error } = await supabase
      .from("profiles")
      .update({ account_type: "corporate", company_name: name, company_slug: slug })
      .eq("id", user.id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Corporate → individual. Blocked while any employee cards still exist —
 * every corporate-only action (team management, employee NFC ordering) is
 * gated on account_type === "corporate" (assertCorporateOwner in
 * src/app/dashboard/team/actions.ts), so downgrading with a live roster
 * would leave employees whose cards nobody could manage or remove anymore,
 * the same "remove admin access first" shape as deleteAccount in
 * src/app/admin/actions.ts refusing to delete the last admin.
 *
 * company_name/company_slug/house_* are deliberately left in place rather
 * than cleared — harmless once account_type flips (nothing reads them for
 * an individual account), and switching back later restores the same
 * company identity instead of starting over.
 */
export async function switchToIndividual(): Promise<Result> {
  try {
    const { supabase, user } = await requireUser();

    const { count } = await supabase
      .from("card_profiles")
      .select("id", { count: "exact", head: true })
      .eq("org_owner_id", user.id);

    if (count && count > 0) {
      throw new Error(
        `You still have ${count} employee card${count === 1 ? "" : "s"}. Remove them from your team before switching to an individual account.`
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({ account_type: "individual" })
      .eq("id", user.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
