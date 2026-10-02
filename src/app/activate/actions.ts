"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { CARD_PURPOSES, resolveButton, type CardButton } from "@/lib/card";
import { formatSerial, isCardCode } from "@/lib/card-codes";
import { mailerConfigured, sendNotice } from "@/lib/email";
import { alertRecipient } from "@/lib/notify";

type Result<T = undefined> = { ok: boolean; error?: string; data?: T };

function fail(error: unknown): Result<never> {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : String(error);
  return { ok: false, error: message };
}

function service() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Server is missing SUPABASE_SERVICE_ROLE_KEY.");
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
}

async function origin() {
  const h = await headers();
  const host = h.get("host") ?? "tap.scorlyn.com";
  return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
}

/** The signed-in user and the id of a card they own, or an error. */
async function ownedCard(code: string) {
  if (!isCardCode(code)) throw new Error("That isn't a Scorlyn card.");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in first.");
  const { data } = await supabase.rpc("card_claim_status", { p_code: code });
  const status = data as { is_owner?: boolean; id?: string } | null;
  if (!status?.is_owner || !status.id) throw new Error("This card isn't yours yet.");
  return { supabase, user, cardId: status.id };
}

export async function requestActivation(code: string, activation: string): Promise<Result<{ state: "claimed" | "pending" }>> {
  try {
    if (!isCardCode(code)) throw new Error("That isn't a Scorlyn card.");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Sign in first.");

    const { data, error } = await supabase.rpc("request_card_claim", {
      p_code: code,
      p_activation: activation.slice(0, 20),
    });
    if (error) throw new Error(error.message);
    const state = data === "claimed" ? "claimed" : "pending";

    if (state === "pending") await alertAdmins(code, user.email ?? "a customer");
    revalidatePath(`/activate/${code}`);
    revalidatePath("/admin/requests");
    return { ok: true, data: { state } };
  } catch (e) {
    return fail(e);
  }
}

/** Swallowed on failure — the request is already recorded and shows in admin. */
async function alertAdmins(code: string, who: string) {
  try {
    const to = alertRecipient();
    if (!to || !mailerConfigured()) return;
    const { data: card } = await service().from("nfc_cards").select("serial").eq("card_url", code).maybeSingle();
    const serial = card ? formatSerial(card.serial) : code;
    await sendNotice(
      to,
      `Card request: ${serial} from ${who}`,
      `${who} has asked to activate card ${serial}.\n\nApprove or reject it in the admin panel under Card requests.`,
      `${await origin()}/admin/requests`
    );
  } catch {
    // Recorded either way.
  }
}

function newUsername(prefix: string) {
  const slug = prefix.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20) || "card";
  return `${slug}-${randomBytes(3).toString("hex")}`;
}

/**
 * Creates the page this physical card will open, already approved: the card
 * was bought, so the page that comes with it is included. Created with the
 * service role for that reason (a customer's own insert of a second page
 * waits for the extra-card fee), and owned by the signed-in customer.
 */
async function createIncludedPage(userId: string, row: Record<string, unknown>) {
  const admin = service();
  const { username_hint: hint, ...fields } = row;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await admin
      .from("card_profiles")
      .insert({ ...fields, user_id: userId, username: newUsername(String(hint ?? "card")) })
      .select("id, username")
      .single();
    if (!error && data) return data;
    if (error?.code !== "23505") throw new Error(error?.message ?? "Could not create the page.");
  }
  throw new Error("Could not create the page — try again.");
}

/** WhatsApp, Instagram, Maps … : the card opens one link directly. */
export async function setupSingleLink(
  code: string,
  purposeId: string,
  value: string,
  message?: string
): Promise<Result<{ href: string }>> {
  try {
    const { supabase, user, cardId } = await ownedCard(code);
    const purpose = CARD_PURPOSES.find((p) => p.id === purposeId);
    if (!purpose) throw new Error("Pick what the card should open.");

    const button: CardButton = {
      label: purpose.label,
      kind: purpose.kind,
      value: value.trim().slice(0, 500),
      ...(purpose.kind === "whatsapp" && message?.trim() ? { message: message.trim().slice(0, 300) } : {}),
    };
    const resolved = resolveButton(button);
    if (!resolved) throw new Error(`Enter your ${purpose.fieldLabel.toLowerCase()}.`);

    const { data: me } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const page = await createIncludedPage(user.id, {
      username_hint: `sp-${purpose.id}`,
      full_name: `${me?.full_name?.trim() || purpose.label} — ${purpose.label}`,
      template: "minimal",
      accent_color: "#111111",
      published: true,
      is_single_purpose: true,
      buttons: [button],
      email: user.email,
    });

    const { error } = await supabase.rpc("set_my_card_page", { p_card: cardId, p_profile: page.id });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/cards");
    return { ok: true, data: { href: resolved.href } };
  } catch (e) {
    return fail(e);
  }
}

/** A full digital profile or a Review Card: create it, link it, then finish it in the editor. */
export async function setupPage(code: string, kind: "profile" | "review"): Promise<Result<{ id: string }>> {
  try {
    const { supabase, user, cardId } = await ownedCard(code);
    const { data: me } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const name = me?.full_name?.trim() || user.email?.split("@")[0] || "My card";

    const page = await createIncludedPage(user.id, {
      username_hint: name,
      full_name: name,
      template: kind === "review" ? "review" : "minimal",
      accent_color: kind === "review" ? "#F59E0B" : "#111111",
      published: true,
      email: user.email,
      ...(kind === "review" ? { review_config: {} } : {}),
    });

    if (kind === "review") {
      await service().from("review_settings").insert({ card_profile_id: page.id, notify_email: user.email ?? null });
    }

    const { error } = await supabase.rpc("set_my_card_page", { p_card: cardId, p_profile: page.id });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/cards");
    return { ok: true, data: { id: page.id } };
  } catch (e) {
    return fail(e);
  }
}

/** Point the card at a page they already have. */
export async function linkExistingPage(code: string, profileId: string): Promise<Result> {
  try {
    const { supabase, cardId } = await ownedCard(code);
    const { error } = await supabase.rpc("set_my_card_page", { p_card: cardId, p_profile: profileId });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/cards");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
