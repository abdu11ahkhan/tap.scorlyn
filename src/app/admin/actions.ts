"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { mailerConfigured, sendReceipt } from "@/lib/email";
import { USERNAME_PATTERN } from "@/lib/card-draft";

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

    // Only the rows that actually moved to paid, so re-confirming an order
    // that was already paid does not send a second receipt.
    const { data: moved, error } = await supabase
      .from("orders")
      .update(patch)
      .in("id", orderIds)
      .neq("status", status)
      .select("id");
    if (error) throw new Error(error.message);

    if (status === "paid" && moved?.length) {
      await Promise.all(moved.map((o) => sendOrderReceipt(supabase, o.id)));
    }

    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Emails the customer their receipt once a transfer is confirmed.
 *
 * Payment is verified by hand here, so this is the only moment we know the
 * money arrived — there is no gateway to tell us. A failure to send must not
 * fail the status change: the order really is paid either way, and an admin
 * retrying would be re-marking something already correct.
 */
async function sendOrderReceipt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string
) {
  try {
    if (!mailerConfigured()) return;

    const { data: order } = await supabase
      .from("orders")
      .select("id, reference, amount_pkr, quantity, full_name, user_id")
      .eq("id", orderId)
      .maybeSingle();
    if (!order?.user_id) return;

    // The account address, not one typed on the order form — the receipt
    // should reach whoever can sign in and see the order.
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", order.user_id)
      .maybeSingle();

    if (!profile?.email) return;

    await sendReceipt({
      to: profile.email,
      name: order.full_name || profile.full_name,
      reference: order.reference,
      amountPkr: order.amount_pkr,
      quantity: order.quantity,
      orderId: order.id,
    });
  } catch {
    // Deliberately swallowed — see above.
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

/**
 * Deletes one customer's card, leaving the account intact.
 *
 * Separate from deleting the account: a card that breaks a rule has to come
 * down without closing the person's account, and unpublishing only hides it
 * while holding the handle. This frees the handle too.
 */
// ---------------------------------------------------------------- invoices

export type InvoiceFields = {
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  issued_on: string;
  due_on: string | null;
  items: { description: string; quantity: number; unit_price_pkr: number }[];
  discount_pkr: number;
  shipping_pkr: number;
  tax_percent: number;
  notes: string | null;
  status: "unpaid" | "paid" | "void";
};

/** Rejects what the table would reject anyway, but with a readable message. */
function cleanInvoice(fields: InvoiceFields) {
  const name = fields.customer_name?.trim();
  if (!name) throw new Error("An invoice needs a customer name.");

  const items = (fields.items ?? [])
    .map((item) => ({
      description: (item.description ?? "").trim(),
      quantity: Math.max(0, Math.round(Number(item.quantity) || 0)),
      unit_price_pkr: Math.max(0, Math.round(Number(item.unit_price_pkr) || 0)),
    }))
    .filter((item) => item.description || item.unit_price_pkr > 0);

  if (items.length === 0) throw new Error("Add at least one line to the invoice.");

  return {
    customer_name: name,
    customer_phone: fields.customer_phone?.trim() || null,
    customer_email: fields.customer_email?.trim() || null,
    customer_address: fields.customer_address?.trim() || null,
    issued_on: fields.issued_on,
    due_on: fields.due_on || null,
    items,
    discount_pkr: Math.max(0, Math.round(Number(fields.discount_pkr) || 0)),
    shipping_pkr: Math.max(0, Math.round(Number(fields.shipping_pkr) || 0)),
    tax_percent: Math.max(0, Number(fields.tax_percent) || 0),
    notes: fields.notes?.trim() || null,
    status: fields.status,
  };
}

export async function createInvoice(
  fields: InvoiceFields
): Promise<Result<{ id: string }>> {
  try {
    const { supabase, user } = await assertAdmin();
    const row = cleanInvoice(fields);

    // The number comes from a sequence, so two invoices started at the same
    // moment cannot collide on it.
    const { data: number, error: numberError } = await supabase.rpc(
      "next_invoice_number"
    );
    if (numberError) throw new Error(numberError.message);

    const { data, error } = await supabase
      .from("invoices")
      .insert({ ...row, number, created_by: user.id })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    revalidatePath("/admin/invoices");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function saveInvoice(
  id: string,
  fields: InvoiceFields
): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    const { data, error } = await supabase
      .from("invoices")
      .update(cleanInvoice(fields))
      .eq("id", id)
      // RLS refuses by matching nothing rather than erroring, so a blocked
      // save would otherwise report success and lose the edit.
      .select("id");
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error("That invoice could not be saved.");

    revalidatePath("/admin/invoices");
    revalidatePath(`/admin/invoices/${id}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteInvoice(id: string): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();
    const { data, error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!data?.length) throw new Error("That invoice could not be deleted.");

    revalidatePath("/admin/invoices");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Releases a paid second card, or refuses it.
 *
 * The customer builds the card and pays; nothing they can do puts it live.
 * The trigger enforces that, so this is the only route from built to live.
 */
export async function setCardApproval(
  cardId: string,
  status: "approved" | "awaiting_payment" | "awaiting_review" | "rejected",
  note?: string
): Promise<Result> {
  try {
    const { supabase, user } = await assertAdmin();

    const { data: updated, error } = await supabase
      .from("card_profiles")
      .update({
        approval_status: status,
        approval_note: note?.trim() || null,
        approved_at: status === "approved" ? new Date().toISOString() : null,
        approved_by: status === "approved" ? user.id : null,
      })
      .eq("id", cardId)
      // RLS refuses by matching nothing rather than erroring, so a blocked
      // approval would otherwise report success and stay unpublishable.
      .select("id");
    if (error) throw new Error(error.message);
    if (!updated?.length) throw new Error("That card could not be updated.");

    revalidatePath("/admin/cards");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** The finishes NfcCardArt can render. Mirrors the CHECK on the column. */
const NFC_FINISHES = [
  "minimal", "bold", "gradient", "midnight", "sticker", "split", "frame",
  "mono", "luxe", "executive", "ivory", "steel", "holo", "tag", "pixel",
] as const;

/**
 * Picks the printed card on a customer's behalf.
 *
 * Most people here order over WhatsApp and never touch the picker, so support
 * needs to be able to set it for them — otherwise there is nothing to print
 * and the order stalls on a question nobody asked.
 */
export async function setCardFinish(
  cardId: string,
  finish: string,
  /** Which details to print. Omitted leaves whatever is already stored. */
  fields?: Record<string, boolean>
): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    // Checked before it reaches the database: the column's CHECK would reject
    // it anyway, but as a raw constraint error rather than something readable.
    if (!NFC_FINISHES.includes(finish as (typeof NFC_FINISHES)[number])) {
      throw new Error(`"${finish}" is not a card design we can print.`);
    }

    // Confirm a row actually changed. RLS refuses by matching nothing rather
    // than erroring, so without this a blocked update reports success and the
    // console would show the new finish until the page was reloaded.
    const { data: updated, error } = await supabase
      .from("card_profiles")
      .update({
        nfc_finish: finish,
        nfc_chosen_at: new Date().toISOString(),
        ...(fields ? { nfc_fields: fields } : {}),
      })
      .eq("id", cardId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!updated?.length) throw new Error("That card could not be updated.");

    revalidatePath("/admin/cards");
    revalidatePath(`/admin/cards/${cardId}/artwork`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCard(cardId: string): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    const { data: card } = await supabase
      .from("card_profiles")
      .select("id, username")
      .eq("id", cardId)
      .maybeSingle();

    if (!card) throw new Error("That card no longer exists.");

    // Confirm a row actually went. RLS refuses by matching nothing rather than
    // erroring, so without this a blocked delete would report success.
    const { data: removed, error } = await supabase
      .from("card_profiles")
      .delete()
      .eq("id", cardId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!removed?.length) throw new Error("That card could not be deleted.");

    revalidatePath("/admin/cards");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Creates an account and its card in one go, on someone's behalf.
 *
 * Selling a card in person means the customer has to sign up, confirm an
 * email, pick a handle and fill a form before anything can be printed — and
 * the person selling is standing there waiting. This does the whole of it from
 * the console and hands back credentials to pass on.
 *
 * Everything runs through the service role rather than the admin's session:
 * creating an auth user needs it, and the card insert does too, because the
 * only INSERT policy on card_profiles is "your own row" and this row belongs
 * to somebody else.
 */
export async function createCustomer(input: {
  email: string;
  password?: string;
  fullName: string;
  username: string;
  headline?: string;
  company?: string;
  phone?: string;
  location?: string;
  template?: string;
  accentColor?: string;
  /** Off by default: a card built for someone should be theirs to release. */
  publish?: boolean;
}): Promise<Result<{ email: string; password: string; username: string }>> {
  try {
    await assertAdmin();

    const email = input.email.trim().toLowerCase();
    const username = input.username.trim().toLowerCase();
    const fullName = input.fullName.trim();

    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
      throw new Error("That email address doesn't look right.");
    }
    if (!fullName) throw new Error("Give them a name.");
    if (!USERNAME_PATTERN.test(username)) {
      throw new Error("Handle must be 3–30 characters: lowercase letters, numbers, - and _.");
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      throw new Error("Creating accounts needs SUPABASE_SERVICE_ROLE_KEY on the server.");
    }

    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false },
    });

    // Checked before creating the user, so a clash does not leave an account
    // behind with no card attached to it.
    const { data: clash } = await admin
      .from("card_profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle();
    if (clash) throw new Error(`The handle “${username}” is already taken.`);

    const password = input.password?.trim() || generatePassword();
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");

    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      // Confirmed on the spot: the customer is standing in front of you, and
      // an unconfirmed account cannot sign in.
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      throw new Error(
        authError.message.toLowerCase().includes("already")
          ? "An account with that email already exists."
          : authError.message
      );
    }

    const userId = created.user?.id;
    if (!userId) throw new Error("The account was not created.");

    const { error: cardError } = await admin.from("card_profiles").insert({
      user_id: userId,
      username,
      full_name: fullName,
      headline: input.headline?.trim() || null,
      company: input.company?.trim() || null,
      location: input.location?.trim() || null,
      accent_color: input.accentColor || "#111111",
      template: input.template || "minimal",
      font: "sans",
      published: input.publish === true,
      buttons: input.phone?.trim()
        ? [{ kind: "phone", label: "Call", value: input.phone.trim(), enabled: true }]
        : [],
      phone: input.phone?.trim() || null,
      email,
    });

    if (cardError) {
      // Roll the account back rather than leaving one that can sign in to
      // nothing and holds an address nobody can re-register.
      await admin.auth.admin.deleteUser(userId);
      throw new Error(cardError.message);
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin/cards");
    return { ok: true, data: { email, password, username } };
  } catch (e) {
    return fail(e);
  }
}

/** Readable rather than maximally random — this gets read out loud. */
function generatePassword(): string {
  const words = ["tap", "card", "link", "sharp", "quick", "bright", "solid", "clear"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${pick()}-${pick()}-${digits}`;
}

/**
 * Signs the admin in as a customer, to set their card up for them.
 *
 * Selling in person means building the card there and then — buttons, links,
 * photos — and the dashboard already does all of that. Rebuilding an
 * admin-flavoured copy of the editor would be a second thing to keep in step
 * with the first, and it would drift.
 *
 * A magic link is generated for the customer and its token handed back, which
 * /auth/confirm exchanges exactly as it does for a real sign-in. Nothing about
 * the customer's account changes: no password reset, nothing emailed to them.
 *
 * This grants no power an admin lacked — the console already reads and writes
 * every customer's data — but it does put an admin inside someone's session,
 * so every use is logged.
 */
export async function impersonateCustomer(
  userId: string,
  reason?: string
): Promise<Result<{ url: string; email: string }>> {
  try {
    const { supabase, user } = await assertAdmin();

    if (userId === user.id) throw new Error("You're already signed in as yourself.");

    const { data: target } = await supabase
      .from("profiles")
      .select("id, email, full_name, is_admin, suspended")
      .eq("id", userId)
      .maybeSingle();

    if (!target?.email) throw new Error("That account has no email address.");
    // Another admin's session would carry their console access, so a lesser
    // admin could borrow a greater one. Refused outright.
    if (target.is_admin) throw new Error("You can't sign in as another admin.");

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      throw new Error("Signing in as a customer needs SUPABASE_SERVICE_ROLE_KEY.");
    }

    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: link, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: target.email,
    });

    if (linkError || !link?.properties?.hashed_token) {
      throw new Error(linkError?.message || "Could not create a sign-in link.");
    }

    // Logged before the link is handed over, so a session that is opened is
    // always one that was recorded.
    await supabase.from("admin_impersonations").insert({
      admin_id: user.id,
      admin_email: user.email,
      target_id: target.id,
      target_email: target.email,
      reason: reason?.trim() || null,
    });

    // Exchanged by our own route rather than Supabase's, so the sign-in stays
    // on this domain and lands straight in the card editor.
    const url =
      `/auth/confirm?token_hash=${encodeURIComponent(link.properties.hashed_token)}` +
      `&type=magiclink&next=${encodeURIComponent("/dashboard/card")}`;

    return { ok: true, data: { url, email: target.email } };
  } catch (e) {
    return fail(e);
  }
}
