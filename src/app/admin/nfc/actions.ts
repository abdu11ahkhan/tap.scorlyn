"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/admin-auth";
import { isCardCode, makeCardCode } from "@/lib/card-codes";

type Result<T = undefined> = { ok: boolean; error?: string; data?: T };

function fail(error: unknown): Result<never> {
  return { ok: false, error: error instanceof Error ? error.message : String(error) };
}

type Supabase = Awaited<ReturnType<typeof assertAdmin>>["supabase"];

type NewCard = {
  batch_id?: string | null;
  batch?: string | null;
  card_profile_id?: string | null;
  nickname?: string | null;
  location?: string | null;
};

const MAX_BATCH = 1000;
const INSERT_CHUNK = 500;

/**
 * Inserts cards with fresh codes. The database's unique index on card_url is
 * the real guarantee; a collision (vanishingly unlikely at 40 bits) fails the
 * whole insert atomically, so the chunk is simply retried with new codes.
 */
async function insertCards(supabase: Supabase, cards: NewCard[]) {
  const inserted: { id: string; serial: number; card_url: string }[] = [];

  for (let start = 0; start < cards.length; start += INSERT_CHUNK) {
    const chunk = cards.slice(start, start + INSERT_CHUNK);

    for (let attempt = 1; ; attempt++) {
      const codes = new Set<string>();
      while (codes.size < chunk.length) codes.add(makeCardCode());
      const list = [...codes];

      const { data, error } = await supabase
        .from("nfc_cards")
        .insert(chunk.map((c, i) => ({ ...c, card_url: list[i] })))
        .select("id, serial, card_url");

      if (!error) {
        inserted.push(...(data ?? []));
        break;
      }
      if (error.code !== "23505" || attempt >= 3) throw new Error(error.message);
    }
  }

  return inserted;
}

function clean(value: string | null | undefined, max: number): string | null {
  const v = (value ?? "").trim().slice(0, max);
  return v || null;
}

function refresh(cardId?: string) {
  revalidatePath("/admin/nfc");
  if (cardId) revalidatePath(`/admin/nfc/${cardId}`);
}

export async function createCard(): Promise<Result<{ id: string }>> {
  try {
    const { supabase } = await assertAdmin();
    const [card] = await insertCards(supabase, [{}]);
    refresh();
    return { ok: true, data: { id: card.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function createBatch(input: {
  quantity: number;
  name: string;
  productType?: string;
}): Promise<Result<{ batchId: string; count: number }>> {
  try {
    const { supabase, user } = await assertAdmin();

    const quantity = Math.floor(Number(input.quantity));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_BATCH) {
      throw new Error(`Quantity must be between 1 and ${MAX_BATCH}.`);
    }
    const name = clean(input.name, 120);
    if (!name) throw new Error("Give the batch a name.");

    const { data: batch, error } = await supabase
      .from("nfc_card_batches")
      .insert({ name, product_type: clean(input.productType, 120), quantity, created_by: user.id })
      .select("id")
      .single();
    if (error || !batch) throw new Error(error?.message ?? "Could not create the batch.");

    const cards = await insertCards(
      supabase,
      Array.from({ length: quantity }, () => ({ batch_id: batch.id, batch: name }))
    );

    refresh();
    return { ok: true, data: { batchId: batch.id, count: cards.length } };
  } catch (e) {
    return fail(e);
  }
}

export async function assignCard(
  cardId: string,
  input: { username: string; nickname?: string; location?: string }
): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    const { data: card } = await supabase
      .from("nfc_cards")
      .select("id, status")
      .eq("id", cardId)
      .maybeSingle();
    if (!card) throw new Error("Card not found.");
    if (card.status === "retired") throw new Error("This card is retired. Reactivate it first.");

    const handle = input.username.trim().toLowerCase().replace(/^@/, "");
    let profileId: string | null = null;

    if (handle) {
      const { data: profile } = await supabase
        .from("card_profiles")
        .select("id")
        .eq("username", handle)
        .maybeSingle();
      if (!profile) throw new Error(`No card profile with the handle "${handle}".`);
      profileId = profile.id;
    }

    // Status and user_id follow from card_profile_id in the database trigger.
    const { error } = await supabase
      .from("nfc_cards")
      .update({
        card_profile_id: profileId,
        nickname: clean(input.nickname, 80),
        location: clean(input.location, 120),
      })
      .eq("id", cardId);
    if (error) throw new Error(error.message);

    refresh(cardId);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setCardStatus(
  cardId: string,
  action: "suspend" | "reactivate" | "retire"
): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();

    const { data: card } = await supabase
      .from("nfc_cards")
      .select("id, card_profile_id")
      .eq("id", cardId)
      .maybeSingle();
    if (!card) throw new Error("Card not found.");

    const patch =
      action === "suspend"
        ? { status: "suspended" }
        : action === "retire"
          ? // Retiring releases the owner too; the assignment stays in history.
            { status: "retired", card_profile_id: null }
          : { status: card.card_profile_id ? "active" : "in_stock" };

    const { error } = await supabase.from("nfc_cards").update(patch).eq("id", cardId);
    if (error) throw new Error(error.message);

    refresh(cardId);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** A new physical card with the same owner, nickname and location — never the same code. */
export async function cloneCard(cardId: string): Promise<Result<{ id: string }>> {
  try {
    const { supabase } = await assertAdmin();

    const { data: source } = await supabase
      .from("nfc_cards")
      .select("card_profile_id, nickname, location, batch_id, batch")
      .eq("id", cardId)
      .maybeSingle();
    if (!source) throw new Error("Card not found.");

    const [card] = await insertCards(supabase, [source]);
    refresh();
    return { ok: true, data: { id: card.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCard(cardId: string): Promise<Result> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase.from("nfc_cards").delete().eq("id", cardId);
    if (error) throw new Error(error.message);
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function findCardByCode(code: string): Promise<Result<{ id: string }>> {
  try {
    const { supabase } = await assertAdmin();
    const normalized = code.trim().toLowerCase();
    if (!isCardCode(normalized)) throw new Error("That isn't a Scorlyn card code.");

    const { data } = await supabase
      .from("nfc_cards")
      .select("id")
      .eq("card_url", normalized)
      .maybeSingle();
    if (!data) throw new Error("No card with that code in inventory.");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    return fail(e);
  }
}

/**
 * "Ready to sell": only released stock can be activated by a customer who
 * scans it. Applies to cards still in stock; anything already owned is
 * left alone.
 */
export async function setCardsClaimable(cardIds: string[], claimable: boolean): Promise<Result<{ count: number }>> {
  try {
    const { supabase } = await assertAdmin();
    const ids = cardIds.filter((id) => /^[0-9a-f-]{36}$/.test(id)).slice(0, 5000);
    if (!ids.length) throw new Error("No cards selected.");
    let count = 0;
    for (let i = 0; i < ids.length; i += 500) {
      const { data, error } = await supabase
        .from("nfc_cards")
        .update({ claimable })
        .in("id", ids.slice(i, i + 500))
        .eq("status", "in_stock")
        .select("id");
      if (error) throw new Error(error.message);
      count += data?.length ?? 0;
    }
    refresh();
    for (const id of ids.slice(0, 1)) revalidatePath(`/admin/nfc/${id}`);
    return { ok: true, data: { count } };
  } catch (e) {
    return fail(e);
  }
}
