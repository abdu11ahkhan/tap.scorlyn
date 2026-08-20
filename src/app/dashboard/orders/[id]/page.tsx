import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, FileText, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_STEPS, statusTone } from "../status";
import ProofUpload from "./ProofUpload";
import ReorderButton from "./ReorderButton";
import CopyRow from "@/components/nfc/CopyRow";
import PhysicalCardStatus from "@/components/dashboard/PhysicalCardStatus";
import { buildPhysicalCardStatus, type NfcAssignment } from "@/lib/nfc-lifecycle";

export const dynamic = "force-dynamic";

export default async function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <p className="app-sub font-bold">Please log in.</p>;

  // RLS already limits this to the caller's own orders.
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!order) return notFound();

  const { data: events } = await supabase
    .from("order_events")
    .select("status, note, created_at")
    .eq("order_id", id)
    .order("created_at");

  // The shop's own accounts. Only fetched for an unpaid order — there's no
  // reason to put bank details on screen once the money has arrived.
  const { data: paymentRows } =
    order.status === "pending"
      ? await supabase
          .from("shop_payment_methods")
          .select("id, label, account_name, account_number, iban, note")
          .eq("enabled", true)
          .order("sort_order")
      : { data: [] };

  const payMethods = paymentRows ?? [];

  const cancelled = order.status === "cancelled";
  const currentStep = STATUS_STEPS.indexOf(order.status);

  // The physical card's NFC assignment lives on nfc_cards, correlated to this
  // order only through the card_profile_id both tables happen to share —
  // there is no direct foreign key between orders and nfc_cards.
  let assignments: NfcAssignment[] = [];
  const isPhysical = order.amount_pkr > 0 && !!order.card_profile_id;
  if (isPhysical) {
    const { data: nfcRows } = await supabase
      .from("nfc_cards")
      .select("id")
      .eq("card_profile_id", order.card_profile_id);

    if (nfcRows && nfcRows.length > 0) {
      const ids = nfcRows.map((r) => r.id);
      const { data: tapRows } = await supabase
        .from("card_taps")
        .select("nfc_card_id, created_at")
        .in("nfc_card_id", ids)
        .order("created_at", { ascending: true });

      const firstTap = new Map<string, string>();
      for (const t of tapRows ?? []) {
        if (t.nfc_card_id && !firstTap.has(t.nfc_card_id)) {
          firstTap.set(t.nfc_card_id, t.created_at);
        }
      }
      assignments = nfcRows.map((r) => ({
        nfcCardId: r.id,
        firstTapAt: firstTap.get(r.id) ?? null,
      }));
    }
  }

  const physicalStatus = isPhysical
    ? buildPhysicalCardStatus({
        order: { id: order.id, reference: order.reference, status: order.status },
        assignments,
      })
    : null;

  return (
    <div className="max-w-3xl space-y-8 pb-16">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 rounded-full border-2 border-sc-border px-4 py-2 text-xs font-black lowercase text-sc-text-dim transition-colors hover:border-sc-gold hover:text-sc-gold"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        orders
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-3xl font-black tracking-tight text-sc-text">
            {order.reference}
          </h1>
          <p className="mt-1 font-medium text-sc-text-dim">
            {order.quantity} × {order.plan_id} ·{" "}
            {order.amount_pkr === 0 ? "Free" : `Rs.${order.amount_pkr.toLocaleString()}`}
          </p>
        </div>
        <span
          className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest ${statusTone(order.status)}`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {/* Progress — the unified order + NFC timeline for a physical order,
          the plain order-only bar for anything without a physical card
          (a free-plan order has nothing to assign). */}
      {physicalStatus ? (
        <PhysicalCardStatus status={physicalStatus} />
      ) : !cancelled ? (
        <section className="app-panel p-6">
          <div className="flex items-start">
            {STATUS_STEPS.map((step, i) => {
              const reached = i <= currentStep;
              return (
                <div key={step} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    {/* Connector left */}
                    <span
                      className={`h-1 flex-1 rounded ${
                        i === 0 ? "opacity-0" : reached ? "bg-sc-gold" : "bg-sc-border"
                      }`}
                    />
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                        reached ? "bg-sc-gold text-sc-gold-ink" : "bg-sc-surface-2 text-sc-text-dimmer"
                      }`}
                    >
                      {reached ? <Check className="h-3.5 w-3.5" strokeWidth={3.5} /> : i + 1}
                    </span>
                    <span
                      className={`h-1 flex-1 rounded ${
                        i === STATUS_STEPS.length - 1
                          ? "opacity-0"
                          : i < currentStep
                            ? "bg-sc-gold"
                            : "bg-sc-border"
                      }`}
                    />
                  </div>
                  <p
                    className={`mt-2 text-[10px] font-black uppercase tracking-wider ${
                      reached ? "text-sc-text" : "text-sc-text-dimmer"
                    }`}
                  >
                    {step}
                  </p>
                </div>
              );
            })}
          </div>

          {order.estimated_delivery && currentStep < 4 && (
            <p className="mt-5 text-center text-sm font-bold text-sc-text-dim">
              Estimated delivery{" "}
              <span className="text-sc-gold">
                {new Date(order.estimated_delivery).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </p>
          )}
        </section>
      ) : null}

      {/* Payment */}
      {order.status === "pending" && order.amount_pkr > 0 && (
        <section className="rounded-2xl border-2 border-sc-gold/40 bg-sc-gold/5 p-6">
          <p className="text-xl font-black tracking-tight text-sc-text">
            Send Rs.{order.amount_pkr.toLocaleString()}
          </p>
          <p className="mt-1 text-sm font-semibold text-sc-text-dim">
            Transfer the amount, then upload a screenshot. We confirm manually —
            usually within a few hours.
          </p>
          <div className="mt-4 space-y-3">
            {payMethods.length === 0 ? (
              <div className="app-panel app-panel-pad text-sm font-semibold text-sc-text">
                <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">
                  pay to
                </p>
                <p className="mt-1">
                  No payment account is set up yet — message us and we&apos;ll send
                  the details.
                </p>
              </div>
            ) : (
              payMethods.map((m) => (
                <div key={m.id} className="rounded-xl border-2 border-sc-gold/30 bg-white p-4">
                  <p className="text-sm font-black text-black">{m.label}</p>
                  <div className="mt-2 space-y-0.5">
                    {m.account_name && (
                      <CopyRow label="Name" value={m.account_name} accent="#d4af37" />
                    )}
                    {m.account_number && (
                      <CopyRow label="Account" value={m.account_number} accent="#d4af37" />
                    )}
                    {m.iban && <CopyRow label="IBAN" value={m.iban} accent="#d4af37" />}
                  </div>
                  {m.note && (
                    <p className="mt-2 text-[11px] font-semibold text-black/50">{m.note}</p>
                  )}
                  <p className="mt-1.5 px-0.5 text-[10px] font-semibold text-black/35">
                    Tap any line to copy it.
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="mt-4">
            <div className="rounded-xl bg-sc-surface-2 p-4">
              <ProofUpload
                orderId={order.id}
                userId={user.id}
                reference={order.reference}
                existing={order.payment_proof_url}
              />
            </div>
          </div>
        </section>
      )}

      {/* Delivery details */}
      <section className="app-panel p-6">
        <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-sc-text-dimmer">
          <MapPin className="h-3.5 w-3.5" />
          delivering to
        </p>
        <p className="mt-3 font-black text-sc-text">{order.full_name}</p>
        <p className="text-sm font-semibold text-sc-text-dim">{order.phone}</p>
        <p className="mt-1 text-sm font-semibold text-sc-text-dim">
          {order.address}, {order.city}
        </p>
        {order.customer_note && (
          <p className="mt-3 text-sm font-medium text-sc-text-dimmer">“{order.customer_note}”</p>
        )}
      </section>

      {/* Timeline */}
      {events && events.length > 0 && (
        <section className="app-panel p-6">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-sc-text-dimmer">
            history
          </p>
          <ol className="space-y-3">
            {events.map((e, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sc-gold" />
                <div>
                  <p className="text-sm font-black text-sc-text">
                    {STATUS_LABELS[e.status] ?? e.status}
                  </p>
                  <p className="text-xs font-semibold text-sc-text-dimmer">
                    {new Date(e.created_at).toLocaleString("en-GB")}
                    {e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/orders/${order.id}/invoice`}
          className="inline-flex items-center gap-2 rounded-full border-2 border-sc-border px-6 py-3 text-sm font-black lowercase text-sc-text-dim transition-colors hover:border-sc-gold hover:text-sc-gold"
        >
          <FileText className="h-4 w-4" />
          invoice
        </Link>
        <ReorderButton orderId={order.id} />
      </div>
    </div>
  );
}
