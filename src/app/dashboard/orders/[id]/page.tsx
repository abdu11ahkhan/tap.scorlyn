import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, FileText, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_STEPS, statusTone } from "../status";
import ProofUpload from "./ProofUpload";
import ReorderButton from "./ReorderButton";

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
  if (!user) return <p className="font-bold text-white/50">Please log in.</p>;

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

  const cancelled = order.status === "cancelled";
  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-3xl space-y-8 pb-16">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-4 py-2 text-xs font-black lowercase text-white/60 transition-colors hover:border-acid hover:text-acid"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        orders
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-3xl font-black tracking-tight text-white">
            {order.reference}
          </h1>
          <p className="mt-1 font-medium text-white/50">
            {order.quantity} × {order.plan_id} ·{" "}
            {order.amount_pkr === 0 ? "Free" : `Rs.${order.amount_pkr.toLocaleString()}`}
          </p>
        </div>
        <span
          className={`rounded-full border-2 border-ink px-4 py-1.5 text-xs font-black uppercase tracking-widest ${statusTone(order.status)}`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {/* Progress */}
      {!cancelled && (
        <section className="rounded-2xl border-2 border-white/12 bg-white/[0.03] p-6">
          <div className="flex items-start">
            {STATUS_STEPS.map((step, i) => {
              const reached = i <= currentStep;
              return (
                <div key={step} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    {/* Connector left */}
                    <span
                      className={`h-1 flex-1 rounded ${
                        i === 0 ? "opacity-0" : reached ? "bg-acid" : "bg-white/12"
                      }`}
                    />
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink text-[11px] font-black ${
                        reached ? "bg-acid text-ink" : "bg-white/10 text-white/40"
                      }`}
                    >
                      {reached ? <Check className="h-3.5 w-3.5" strokeWidth={3.5} /> : i + 1}
                    </span>
                    <span
                      className={`h-1 flex-1 rounded ${
                        i === STATUS_STEPS.length - 1
                          ? "opacity-0"
                          : i < currentStep
                            ? "bg-acid"
                            : "bg-white/12"
                      }`}
                    />
                  </div>
                  <p
                    className={`mt-2 text-[10px] font-black uppercase tracking-wider ${
                      reached ? "text-white" : "text-white/30"
                    }`}
                  >
                    {step}
                  </p>
                </div>
              );
            })}
          </div>

          {order.estimated_delivery && currentStep < 4 && (
            <p className="mt-5 text-center text-sm font-bold text-white/45">
              Estimated delivery{" "}
              <span className="text-acid">
                {new Date(order.estimated_delivery).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </p>
          )}
        </section>
      )}

      {/* Payment */}
      {order.status === "pending" && order.amount_pkr > 0 && (
        <section className="sticker-lg rounded-2xl border-2 border-ink bg-acid p-6 text-ink">
          <p className="text-xl font-black tracking-tight">Send Rs.{order.amount_pkr.toLocaleString()}</p>
          <p className="mt-1 text-sm font-semibold opacity-70">
            Transfer the amount, then upload a screenshot. We confirm manually —
            usually within a few hours.
          </p>
          <div className="mt-4 rounded-xl border-2 border-ink bg-white p-4 text-sm font-semibold">
            <p className="text-[11px] font-black uppercase tracking-widest opacity-45">
              pay to
            </p>
            <p className="mt-1">Bank details will be shown here once configured in admin.</p>
          </div>
          <div className="mt-4">
            <div className="rounded-xl bg-ink p-4">
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
      <section className="rounded-2xl border-2 border-white/12 bg-white/[0.03] p-6">
        <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          <MapPin className="h-3.5 w-3.5" />
          delivering to
        </p>
        <p className="mt-3 font-black text-white">{order.full_name}</p>
        <p className="text-sm font-semibold text-white/55">{order.phone}</p>
        <p className="mt-1 text-sm font-semibold text-white/55">
          {order.address}, {order.city}
        </p>
        {order.customer_note && (
          <p className="mt-3 text-sm font-medium text-white/40">“{order.customer_note}”</p>
        )}
      </section>

      {/* Timeline */}
      {events && events.length > 0 && (
        <section className="rounded-2xl border-2 border-white/12 bg-white/[0.03] p-6">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
            history
          </p>
          <ol className="space-y-3">
            {events.map((e, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-acid" />
                <div>
                  <p className="text-sm font-black text-white">
                    {STATUS_LABELS[e.status] ?? e.status}
                  </p>
                  <p className="text-xs font-semibold text-white/35">
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
          className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-6 py-3 text-sm font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
        >
          <FileText className="h-4 w-4" />
          invoice
        </Link>
        <ReorderButton orderId={order.id} />
      </div>
    </div>
  );
}
