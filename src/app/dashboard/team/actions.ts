"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { employeeUsername } from "@/lib/org";

/**
 * Every mutation below funnels through this, the same shape as assertAdmin()
 * in src/app/admin/actions.ts and for the same reason: Server Actions are
 * reachable by direct POST, not just through the UI, so a page-level check is
 * not a security boundary — RLS (and, for account creation, the service-role
 * key never reaching the client) is the real backstop. This just turns a
 * blocked write into a clear error instead of a silent no-op.
 */
async function assertCorporateOwner() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "account_type, company_slug, company_name, house_template, house_accent_color, house_surface_color"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.account_type !== "corporate" || !profile.company_slug) {
    throw new Error("Corporate accounts only.");
  }

  return {
    supabase,
    user,
    companySlug: profile.company_slug,
    companyName: profile.company_name ?? "",
    houseTemplate: profile.house_template,
    houseAccentColor: profile.house_accent_color,
    houseSurfaceColor: profile.house_surface_color,
  };
}

type Result<T = undefined> = { ok: boolean; error?: string; data?: T };

function fail(error: unknown): Result<never> {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

/** Readable, not random characters — handed to someone who has to type it
 *  once. Same shape as admin's own generator (src/app/admin/actions.ts). */
function generatePassword(): string {
  const words = ["tap", "card", "link", "sharp", "quick", "bright", "solid", "clear"];
  const pick = () => words[Math.floor(Math.random() * words.length)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return pick() + "-" + pick() + "-" + digits;
}

function serviceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Creating accounts needs SUPABASE_SERVICE_ROLE_KEY on the server.");
  }
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * Creates a login and a card for one employee, on the company's behalf.
 *
 * Mirrors createCustomer in src/app/admin/actions.ts almost exactly — same
 * reason: the only INSERT policy on card_profiles is "your own row", and this
 * row belongs to somebody who does not have an account yet. The one
 * difference is the handle: it is not chosen, it is derived as
 * "company_slug-name" so every card this company hands out carries the
 * business name, retried with a numeric suffix if that exact combination is
 * already someone else's.
 */
export async function createEmployee(input: {
  fullName: string;
  email: string;
  headline?: string;
  phone?: string;
}): Promise<Result<{ email: string; password: string; username: string }>> {
  try {
    const { user, companySlug, companyName, houseTemplate, houseAccentColor, houseSurfaceColor } =
      await assertCorporateOwner();

    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();

    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
      throw new Error("That email address doesn't look right.");
    }
    if (!fullName) throw new Error("Give them a name.");

    const admin = serviceClient();

    // Try the plain handle first, then "-2", "-3", ... — collisions are rare
    // (one company, one roster) but a human name genuinely can repeat.
    let username = "";
    for (let suffix = 0; suffix <= 25; suffix++) {
      const candidate = employeeUsername(companySlug, fullName, suffix || undefined);
      const { data: clash } = await admin
        .from("card_profiles")
        .select("id")
        .ilike("username", candidate)
        .maybeSingle();
      if (!clash) {
        username = candidate;
        break;
      }
    }
    if (!username) {
      throw new Error("Could not find a free handle for that name — try a variation.");
    }

    const password = generatePassword();

    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      // Confirmed on the spot: the owner is handing these credentials
      // straight to the employee, the same as createCustomer does in person.
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
      org_owner_id: user.id,
      username,
      full_name: fullName,
      headline: input.headline?.trim() || null,
      company: companyName || null,
      // The company's own scanned-card look (src/app/dashboard/team/TeamManager.tsx
      // "company card" section), falling back to the old fixed default for a
      // company that hasn't set one.
      accent_color: houseAccentColor || "#111111",
      surface_color: houseSurfaceColor || null,
      template: houseTemplate || "minimal",
      font: "sans",
      // Off by default: the company reviews the card before it goes live,
      // same reasoning as createCustomer's own default.
      published: false,
      buttons: input.phone?.trim()
        ? [{ kind: "phone", label: "Call", value: input.phone.trim(), enabled: true }]
        : [],
      phone: input.phone?.trim() || null,
      email,
    });

    if (cardError) {
      // Roll the account back rather than leaving a login that opens onto
      // nothing and holds an address nobody can re-register.
      await admin.auth.admin.deleteUser(userId);
      throw new Error(cardError.message);
    }

    revalidatePath("/dashboard/team");
    return { ok: true, data: { email, password, username } };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Sets the look every employee card starts from — derived client-side (see
 * extractPalette/suggestTemplate in src/lib/card-scan-color.ts) from a photo
 * of the company's own card, not typed in here.
 *
 * Own row, own session: unlike createEmployee this needs no service role —
 * it's simply the owner updating their own profiles row, the same as any
 * other account-settings write.
 */
export async function setHouseStyle(input: {
  template: string;
  accentColor: string;
  surfaceColor?: string;
}): Promise<Result> {
  try {
    const { supabase, user } = await assertCorporateOwner();

    const { error } = await supabase
      .from("profiles")
      .update({
        house_template: input.template,
        house_accent_color: input.accentColor,
        house_surface_color: input.surfaceColor || null,
      })
      .eq("id", user.id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/team");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Confirms the card belongs to the caller's own roster before any write
 *  that isn't already scoped by an RLS policy (suspend/reactivate go through
 *  profiles, which has no org_owner_id column to filter by). */
async function ownedEmployeeCard(
  admin: ReturnType<typeof serviceClient>,
  cardId: string,
  ownerId: string
) {
  const { data: card } = await admin
    .from("card_profiles")
    .select("id, user_id, org_owner_id")
    .eq("id", cardId)
    .maybeSingle();

  if (!card || card.org_owner_id !== ownerId) {
    throw new Error("That card isn't part of your team.");
  }
  return card;
}

export async function suspendEmployee(cardId: string, suspended: boolean): Promise<Result> {
  try {
    const { user } = await assertCorporateOwner();
    const admin = serviceClient();
    const card = await ownedEmployeeCard(admin, cardId, user.id);

    // profiles.suspended, not a column on card_profiles directly — the
    // existing sync_card_suspension() trigger (012_fix_suspension.sql)
    // mirrors it onto every card that user owns, including this one.
    const { error } = await admin.from("profiles").update({ suspended }).eq("id", card.user_id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/team");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Same "Working days only" logic as src/app/orders/actions.ts — duplicated
 *  rather than imported, since that module's placeOrder always orders for
 *  the *caller's own* card_profiles row and can't be reused for an
 *  owner ordering against an employee's card without changing what every
 *  other caller of it means. */
function estimateDelivery(workingDays: number): string {
  const d = new Date();
  let added = 0;
  while (added < workingDays) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++;
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Places a physical-card order on behalf of one employee.
 *
 * The gap this closes: every existing "get an NFC card" path (individual
 * dashboard, corporate dashboard, the team roster's own "No NFC order" link)
 * pointed at the same /dashboard/nfc → /dashboard/orders flow, which always
 * orders for the *signed-in account's own* card_profiles row — a corporate
 * owner had no way to place an order tied to an employee's card at all.
 *
 * The order belongs to the employee (orders.user_id = the employee's own
 * user id, matching how assignNfcCard already sets nfc_cards.user_id to the
 * card's owner, not the assigner) — so the employee's own dashboard and
 * order-detail page show it immediately through the existing "Customers see
 * their own orders" policy, no new RLS needed there. The owner sees it
 * through the corporate-owner orders policy already added in
 * supabase/migrations/051_corporate_orders_nfc_visibility.sql. Writing it
 * needs the service role because RLS's INSERT policy on orders requires
 * auth.uid() = user_id, and the owner's session is not the employee's.
 */
export async function placeEmployeeOrder(input: {
  cardId: string;
  planId: string;
  quantity: number;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  note?: string;
  finish?: string;
}): Promise<Result<{ id: string; reference: string }>> {
  try {
    const { user } = await assertCorporateOwner();
    const admin = serviceClient();
    const card = await ownedEmployeeCard(admin, input.cardId, user.id);

    const quantity = Math.min(Math.max(1, Math.floor(input.quantity) || 1), 50);

    let phone = input.phone.replace(/\D/g, "");
    if (phone.startsWith("0092")) phone = phone.slice(4);
    if (phone.startsWith("92")) phone = "0" + phone.slice(2);
    if (!/^03\d{9}$/.test(phone)) {
      throw new Error("That mobile number doesn't look right — 11 digits starting 03.");
    }

    for (const [label, v] of [
      ["name", input.fullName],
      ["address", input.address],
      ["city", input.city],
    ] as const) {
      if (!v?.trim()) throw new Error(`Please fill in the ${label}.`);
    }

    const { data: plan } = await admin
      .from("plans")
      .select("id, price_pkr, enabled")
      .eq("id", input.planId)
      .maybeSingle();
    if (!plan?.enabled) throw new Error("That plan isn't available.");

    const { data, error } = await admin
      .from("orders")
      .insert({
        user_id: card.user_id,
        card_profile_id: card.id,
        plan_id: plan.id,
        quantity,
        amount_pkr: plan.price_pkr * quantity,
        full_name: input.fullName.trim(),
        phone,
        address: input.address.trim(),
        city: input.city.trim(),
        customer_note: input.note?.trim() || null,
        card_design:
          plan.price_pkr > 0
            ? {
                finish: input.finish ?? "minimal",
                fields: null,
                accent: null,
                captured_at: new Date().toISOString(),
              }
            : null,
        estimated_delivery: estimateDelivery(plan.price_pkr === 0 ? 1 : 5),
      })
      .select("id, reference")
      .single();

    if (error) {
      console.error("placeEmployeeOrder insert failed:", error);
      throw new Error("Couldn't place the order — please try again.");
    }

    revalidatePath("/dashboard/team");
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteEmployeeCard(cardId: string): Promise<Result> {
  try {
    const { user, supabase } = await assertCorporateOwner();
    const admin = serviceClient();
    const card = await ownedEmployeeCard(admin, cardId, user.id);

    // The caller's own session, not service role: the RLS delete policy
    // ("Corporate owners can delete their employees' cards.") already covers
    // exactly this row, and going through it means a blocked delete reports
    // a real error instead of silently matching nothing.
    const { data: removed, error } = await supabase
      .from("card_profiles")
      .delete()
      .eq("id", cardId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!removed?.length) throw new Error("That card could not be deleted.");

    // The login itself, not just the card — found by testing this end to
    // end: without this, "remove" only unlisted the card, and the account
    // it belonged to (created by createEmployee, credentials handed out by
    // the company) kept working. Someone removed from the team could still
    // sign in and build themselves a brand-new free card, disconnected from
    // any company oversight. deleteUser cascades to their profiles row
    // (ON DELETE CASCADE from auth.users), so nothing is left behind.
    // Best-effort: the card is already gone either way, and a dangling
    // login is a smaller problem than reporting the whole removal failed
    // after the part the owner actually asked for already succeeded.
    await admin.auth.admin.deleteUser(card.user_id).catch(() => {});

    revalidatePath("/dashboard/team");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
