"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Every mutation below funnels through this.
 *
 * Server Actions are reachable by direct POST, not just through the UI, so a
 * page-level check is not a security boundary. RLS is the real backstop — the
 * admin policies all require is_admin() — but failing loudly here gives a
 * clear error instead of a silent no-op when a policy blocks the write.
 */
async function assertAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) throw new Error("Admins only.");

  return { supabase, user };
}

type Result<T = undefined> = { ok: boolean; error?: string; data?: T };

function fail(error: unknown): Result<never> {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

// ---------------------------------------------------------------- people

export async function setAdmin(userId: string, isAdmin: boolean): Promise<Result> {
  try {
    const { supabase, user } = await assertAdmin();

    // Removing your own admin rights locks you out of this console with no way
    // back except SQL, so it's blocked.
    if (userId === user.id && !isAdmin) {
      throw new Error("You can't remove your own admin access.");
    }

    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: isAdmin })
      .eq("id", userId);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setSuspended(userId: string, suspended: boolean): Promise<Result> {
  try {
    const { supabase, user } = await assertAdmin();

    if (userId === user.id) throw new Error("You can't suspend yourself.");

    const { error } = await supabase
      .from("profiles")
      .update({ suspended })
      .eq("id", userId);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- cards

export async function setCardPublished(cardId: string, published: boolean): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase
      .from("card_profiles")
      .update({ published })
      .eq("id", cardId);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/cards");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------------- nfc stock

/** Short, unambiguous code written to the tag. No l/o/0/1. */
function makeCardCode(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function issueNfcCards(count: number, batch: string): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    const howMany = Math.min(Math.max(1, Math.floor(count) || 1), 100);

    // Unassigned on purpose: stock gets printed before it's sold, and the
    // owner is attached later.
    const rows = Array.from({ length: howMany }, () => ({
      card_url: makeCardCode(),
      batch: batch?.trim() || null,
      user_id: null,
      card_profile_id: null,
    }));

    const { error } = await supabase.from("nfc_cards").insert(rows);
    if (error) throw new Error(error.message);

    revalidatePath("/admin/nfc");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function assignNfcCard(cardId: string, username: string): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    const handle = username.trim().toLowerCase();

    if (!handle) {
      // Empty username means "unassign" — put the card back into stock.
      const { error } = await supabase
        .from("nfc_cards")
        .update({ card_profile_id: null, user_id: null })
        .eq("id", cardId);
      if (error) throw new Error(error.message);
      revalidatePath("/admin/nfc");
      return { ok: true };
    }

    const { data: profile } = await supabase
      .from("card_profiles")
      .select("id, user_id")
      .eq("username", handle)
      .maybeSingle();

    if (!profile) throw new Error(`No card profile with the handle "${handle}".`);

    const { error } = await supabase
      .from("nfc_cards")
      .update({ card_profile_id: profile.id, user_id: profile.user_id })
      .eq("id", cardId);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/nfc");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteNfcCard(cardId: string): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase.from("nfc_cards").delete().eq("id", cardId);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/nfc");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------------- templates

export async function saveTemplateSettings(input: {
  templateId: string;
  enabled: boolean;
  name?: string;
  blurb?: string;
  category?: string;
  sortOrder?: number;
  isNew?: boolean;
}): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    const { error } = await supabase.from("template_settings").upsert(
      {
        template_id: input.templateId,
        enabled: input.enabled,
        name: input.name?.trim() || null,
        blurb: input.blurb?.trim() || null,
        category: input.category?.trim() || null,
        sort_order: input.sortOrder ?? 0,
        is_new: input.isNew ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "template_id" }
    );

    if (error) throw new Error(error.message);

    revalidatePath("/admin/templates");
    revalidatePath("/templates");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// -------------------------------------------------------------- settings

export async function saveAppSettings(input: {
  signupsOpen: boolean;
  publishingOpen: boolean;
  announcement?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    const { error } = await supabase
      .from("app_settings")
      .update({
        signups_open: input.signupsOpen,
        publishing_open: input.publishingOpen,
        announcement: input.announcement?.trim() || null,
        maintenance_mode: input.maintenanceMode ?? false,
        maintenance_message: input.maintenanceMessage?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true);

    if (error) throw new Error(error.message);

    revalidatePath("/admin/settings");
    revalidatePath("/dashboard/orders");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- orders

export async function setOrderStatus(
  orderIds: string[],
  status: string
): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    const allowed = ["pending", "paid", "printing", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) throw new Error("Unknown status.");
    if (orderIds.length === 0) throw new Error("Nothing selected.");

    const patch: Record<string, unknown> = { status };
    // Marking an order paid is the moment money is confirmed, so stamp it.
    if (status === "paid") patch.payment_verified_at = new Date().toISOString();

    const { error } = await supabase.from("orders").update(patch).in("id", orderIds);
    if (error) throw new Error(error.message);

    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setOrderFlag(orderId: string, flagged: boolean): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase.from("orders").update({ flagged }).eq("id", orderId);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setOrderNote(orderId: string, note: string): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase
      .from("orders")
      .update({ internal_note: note.trim() || null })
      .eq("id", orderId);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Signed URL for a payment proof.
 *
 * The bucket is private, so there is no public link to hand out. This mints a
 * short-lived one on demand rather than making the bucket readable.
 */
export async function getProofUrl(path: string): Promise<Result<{ url: string }>> {
  try {
    const { supabase } = await assertAdmin();
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 300);

    if (error) throw new Error(error.message);
    return { ok: true, data: { url: data.signedUrl } };
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------------------ faqs

export async function saveFaq(input: {
  id?: string;
  question: string;
  answer: string;
  sortOrder: number;
  published: boolean;
}): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    if (!input.question.trim() || !input.answer.trim()) {
      throw new Error("Question and answer are both required.");
    }

    const row = {
      question: input.question.trim(),
      answer: input.answer.trim(),
      sort_order: input.sortOrder,
      published: input.published,
    };

    const { error } = input.id
      ? await supabase.from("faqs").update(row).eq("id", input.id)
      : await supabase.from("faqs").insert(row);

    if (error) throw new Error(error.message);

    revalidatePath("/admin/faq");
    revalidatePath("/faq");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteFaq(id: string): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/faq");
    revalidatePath("/faq");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Clear the new-order badge.
 *
 * Called once when an admin opens the orders list — the list is where the
 * orders get seen, so that's what "seen" means. Deliberately not done during
 * render: a Server Component may render more than once, and a write belongs
 * in an action.
 */
export async function markOrdersSeen(): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    const { error } = await supabase
      .from("orders")
      .update({ admin_seen_at: new Date().toISOString() })
      .is("admin_seen_at", null);

    if (error) throw new Error(error.message);

    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------- shop payments

export type ShopPaymentInput = {
  id?: string;
  label: string;
  kind: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  note?: string;
  enabled: boolean;
  sortOrder: number;
};

/** Add or update one of the shop's own accounts. */
export async function saveShopPayment(input: ShopPaymentInput): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    if (!input.label.trim()) throw new Error("Give it a name, e.g. Meezan Bank.");
    if (!input.accountNumber?.trim() && !input.iban?.trim()) {
      throw new Error("An account number or IBAN is needed — otherwise nobody can pay it.");
    }

    const row = {
      label: input.label.trim(),
      kind: input.kind,
      account_name: input.accountName?.trim() || null,
      account_number: input.accountNumber?.trim() || null,
      iban: input.iban?.trim() || null,
      note: input.note?.trim() || null,
      enabled: input.enabled,
      sort_order: input.sortOrder,
    };

    const { error } = input.id
      ? await supabase.from("shop_payment_methods").update(row).eq("id", input.id)
      : await supabase.from("shop_payment_methods").insert(row);

    if (error) throw new Error(error.message);

    revalidatePath("/admin/billing");
    revalidatePath("/dashboard/orders", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteShopPayment(id: string): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase.from("shop_payment_methods").delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/admin/billing");
    revalidatePath("/dashboard/orders", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------------- content

/**
 * Landing copy.
 *
 * Empty strings are stored as NULL so a blanked field falls back to the
 * compiled-in text rather than shipping an empty headline.
 */
export async function saveSiteContent(input: {
  heroTitle?: string;
  heroSubtitle?: string;
  pricingNote?: string;
  supportWhatsapp?: string;
  supportEmail?: string;
}): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    const { error } = await supabase
      .from("app_settings")
      .update({
        hero_title: input.heroTitle?.trim() || null,
        hero_subtitle: input.heroSubtitle?.trim() || null,
        pricing_note: input.pricingNote?.trim() || null,
        support_whatsapp: input.supportWhatsapp?.trim() || null,
        support_email: input.supportEmail?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true);

    if (error) throw new Error(error.message);

    revalidatePath("/admin/content");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Removes a customer account and everything personal attached to it.
 *
 * The profile row cascades to their card, NFC assignments and referral events.
 * Orders are not among them by design — orders.user_id is ON DELETE SET NULL,
 * so the record of a sale outlives the person asking to be forgotten, which is
 * what an accounting trail has to do.
 *
 * The auth user is removed too, or the address would stay registered and they
 * could sign in to an account with nothing behind it. That needs the service
 * role, since a cookie-bound client cannot delete users.
 */
export async function deleteAccount(userId: string, reason?: string): Promise<Result> {
  try {
    const { supabase, user } = await assertAdmin();

    if (userId === user.id) throw new Error("You can't delete your own account.");

    const { data: target } = await supabase
      .from("profiles")
      .select("id, full_name, email, is_admin")
      .eq("id", userId)
      .maybeSingle();

    if (!target) throw new Error("That account no longer exists.");
    // Removing the last admin would lock everyone out of the console.
    if (target.is_admin) {
      throw new Error("Remove admin access first, then delete the account.");
    }

    const [{ data: card }, { count: orderCount }] = await Promise.all([
      supabase.from("card_profiles").select("username").eq("user_id", userId).maybeSingle(),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

    // Written before anything is destroyed, so a failure halfway through still
    // leaves a record that the attempt happened.
    const { error: auditError } = await supabase.from("deleted_accounts").insert({
      former_user_id: userId,
      email: target.email,
      full_name: target.full_name,
      username: card?.username ?? null,
      orders_kept: orderCount ?? 0,
      reason: reason?.trim() || null,
      deleted_by: user.id,
    });
    if (auditError) throw new Error(auditError.message);

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      throw new Error(
        "Account deletion needs SUPABASE_SERVICE_ROLE_KEY on the server."
      );
    }

    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false },
    });

    // Deleting the auth user cascades to profiles, and profiles cascades on to
    // the card and the rest. One call, in the right order.
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) throw new Error(authError.message);

    // If the profile survived (no cascade from auth in this schema), clear it
    // explicitly rather than leaving a row pointing at a user that is gone.
    await admin.from("profiles").delete().eq("id", userId);

    revalidatePath("/admin/users");
    revalidatePath("/admin/accounts");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
