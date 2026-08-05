"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result<T = undefined> = { ok: boolean; error?: string; data?: T };

function fail(error: unknown): Result<never> {
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

/** Working days only — nobody prints or ships on a Sunday. */
function estimateDelivery(workingDays: number): string {
  const d = new Date();
  let added = 0;
  while (added < workingDays) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++;
  }
  return d.toISOString().slice(0, 10);
}

export async function placeOrder(input: {
  planId: string;
  quantity: number;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  note?: string;
}): Promise<Result<{ id: string; reference: string }>> {
  try {
    const { supabase, user } = await requireUser();

    const quantity = Math.min(Math.max(1, Math.floor(input.quantity) || 1), 50);

    for (const [label, v] of [
      ["name", input.fullName],
      ["phone", input.phone],
      ["address", input.address],
      ["city", input.city],
    ] as const) {
      if (!v?.trim()) throw new Error(`Please fill in your ${label}.`);
    }

    // Price comes from the database, never the form — otherwise the amount is
    // whatever the browser says it is.
    const { data: plan } = await supabase
      .from("plans")
      .select("id, price_pkr, enabled")
      .eq("id", input.planId)
      .maybeSingle();

    if (!plan?.enabled) throw new Error("That plan isn't available.");

    const { data: card } = await supabase
      .from("card_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        card_profile_id: card?.id ?? null,
        plan_id: plan.id,
        quantity,
        amount_pkr: plan.price_pkr * quantity,
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
        address: input.address.trim(),
        city: input.city.trim(),
        customer_note: input.note?.trim() || null,
        estimated_delivery: estimateDelivery(plan.price_pkr === 0 ? 1 : 5),
      })
      .select("id, reference")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/orders");
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}

/** Repeat an existing order — same plan, same address. */
export async function reorder(orderId: string): Promise<Result<{ reference: string }>> {
  try {
    const { supabase } = await requireUser();

    const { data: old } = await supabase
      .from("orders")
      .select("plan_id, quantity, full_name, phone, address, city")
      .eq("id", orderId)
      .maybeSingle();

    if (!old) throw new Error("Order not found.");

    const result = await placeOrder({
      planId: old.plan_id as string,
      quantity: old.quantity,
      fullName: old.full_name,
      phone: old.phone,
      address: old.address,
      city: old.city,
      note: "Repeat order",
    });

    return result.ok && result.data
      ? { ok: true, data: { reference: result.data.reference } }
      : { ok: false, error: result.error };
  } catch (e) {
    return fail(e);
  }
}

export async function attachPaymentProof(orderId: string, path: string): Promise<Result> {
  try {
    const { supabase } = await requireUser();

    // RLS restricts this to the owner's own *pending* orders, so a customer
    // can't quietly swap the proof after it's been verified.
    const { error } = await supabase
      .from("orders")
      .update({ payment_proof_url: path })
      .eq("id", orderId);

    if (error) throw new Error(error.message);

    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/orders");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
