import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, Phone, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cardLinkUrl } from "@/lib/card";
import { STATUS_LABELS, statusTone } from "@/app/dashboard/orders/status";
import ProofLink from "./ProofLink";
import OrderCardArt from "./OrderCardArt";
import type { CardProfile as CardProfileType } from "@/lib/card";
import type { CardFields as CardFieldsType } from "@/components/card-design/NfcCardArt";

export const dynamic = "force-dynamic";

/**
 * Everything about one order, on one screen.
 *
 * A delivery address cannot go in the table without making it unreadable, so
 * it was nowhere — awkward, given the address is the thing you need in order
 * to post the card. This is where an order row leads now.
 */
export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!order) return notFound();

  const [{ data: events }, { data: profile }, { data: card }] = await Promise.all([
    supabase
      .from("order_events")
      .select("status, note, created_at")
      .eq("order_id", id)
      .order("created_at"),
    order.user_id
      ? supabase
          .from("profiles")
          .select("id, full_name, email, suspended")
          .eq("id", order.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // By card_profile_id, not user_id — an account can own several cards
    // now (a profile card plus one or more single-purpose/quick-order
    // cards), so "their card" is no longer unambiguous.
    order.card_profile_id
      ? supabase
          .from("card_profiles")
          .select("*")
          .eq("id", order.card_profile_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const money = (n: number) => `Rs.${n.toLocaleString()}`;

  const delivery = [
    { label: "Name", value: order.full_name, icon: User },
    { label: "Phone", value: order.phone, icon: Phone },
    { label: "Address", value: order.address, icon: MapPin },
    { label: "City", value: order.city, icon: MapPin },
  ];

  const summary: [string, string][] = [
    ["Plan", `${order.quantity} x ${order.plan_id ?? "—"}`],
    ["Branding", order.branding ?? "—"],
    ["Amount", money(order.amount_pkr)],
    [
      "Estimated delivery",
      order.estimated_delivery
        ? new Date(order.estimated_delivery).toLocaleDateString("en-GB")
        : "—",
    ],
  ];

  return (
    <div className="space-y-5">
      <Link href="/admin/orders" className="app-btn app-btn-ghost">
        <ArrowLeft className="h-3.5 w-3.5" />
        All orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="app-h1 font-mono">{order.reference}</h1>
          <p className="app-sub mt-1">
            {new Date(order.created_at).toLocaleString("en-GB")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {order.is_quick_order && (
            <span className="rounded-full border-2 border-sc-gold/50 bg-sc-gold/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-sc-gold-text">
              quick order
            </span>
          )}
          {/* Only paid orders carry artwork; the free plan prints nothing. */}
          {order.card_profile_id && (
            <Link
              href={`/admin/orders/${order.id}/artwork`}
              className="app-btn app-btn-ghost"
            >
              Artwork
            </Link>
          )}
          <span
            className={`rounded-full px-3 py-1 text-[12px] font-black ${statusTone(order.status)}`}
          >
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Where it's going — the reason this page exists. */}
        <section className="app-panel app-panel-pad">
          <h2 className="font-black lowercase">deliver to</h2>
          <dl className="mt-4 space-y-3">
            {delivery.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sc-text-dimmer" />
                <div className="min-w-0">
                  <dt className="text-[11px] font-bold uppercase tracking-widest text-sc-text-dimmer">
                    {label}
                  </dt>
                  <dd className="mt-0.5 break-words text-[15px] font-semibold text-sc-text">
                    {value || "—"}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          {order.customer_note && (
            <div className="mt-4 rounded-lg border border-sc-border-soft bg-sc-surface-2 p-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-sc-text-dimmer">
                Their note
              </p>
              <p className="mt-1 text-[14px] text-sc-text">{order.customer_note}</p>
            </div>
          )}
        </section>

        <section className="app-panel app-panel-pad">
          <h2 className="font-black lowercase">order</h2>
          <dl className="mt-4 space-y-3 text-[15px]">
            {summary.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-sc-text-dim">{k}</dt>
                <dd className="text-right font-semibold text-sc-text">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 border-t border-sc-border-soft pt-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-sc-text-dimmer">
              Payment proof
            </p>
            <ProofLink path={order.payment_proof_url} />
          </div>
        </section>

        {/* Everything needed to fulfil this order in one place: where the
            chip points, what gets printed, and the file to send a printer. */}
        {card?.username && (
          <section className="app-panel app-panel-pad lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-black lowercase">printed card</h2>
                <p className="mt-1 text-[13px] text-sc-text-dim">
                  Finish: {(order.card_design as { finish?: string } | null)?.finish ?? "minimal"}
                  {" · "}
                  {order.branding === "unbranded"
                    ? "customer artwork only"
                    : "ScorlynTap mark"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={cardLinkUrl(card as CardProfileType, "https://tap.scorlyn.com")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="app-btn app-btn-ghost"
                >
                  {card.is_single_purpose ? "Open the destination" : "Open their page"}
                </a>
                <Link
                  href={`/admin/orders/${order.id}/artwork`}
                  className="app-btn app-btn-primary"
                >
                  Print / PDF
                </Link>
              </div>
            </div>

            {/* Single-purpose/quick-order cards have no profile page worth
                reading — what matters is exactly where the tap goes. */}
            {card.is_single_purpose && card.buttons?.[0] && (
              <p className="mt-3 break-all rounded-lg border border-sc-border-soft bg-sc-surface-2 px-3 py-2 text-[13px] font-semibold text-sc-text">
                opens: {card.buttons[0].kind} — {card.buttons[0].value}
                {card.buttons[0].message ? ` ("${card.buttons[0].message}")` : ""}
              </p>
            )}

            <p className="mt-3 break-all font-mono text-[12px] text-sc-text-dimmer">
              chip URL — {cardLinkUrl(card as CardProfileType, "https://tap.scorlyn.com")}
            </p>

            <div className="mt-4">
              <OrderCardArt
                card={card as unknown as CardProfileType}
                finish={(order.card_design as { finish?: string } | null)?.finish ?? "minimal"}
                fields={(order.card_design as { fields?: CardFieldsType } | null)?.fields ?? null}
              />
            </div>
          </section>
        )}

        <section className="app-panel app-panel-pad">
          <h2 className="font-black lowercase">customer</h2>
          {profile ? (
            <div className="mt-4 space-y-2 text-[15px]">
              <p className="font-semibold text-sc-text">{profile.full_name || "—"}</p>
              <p className="text-sc-text-dim">{profile.email}</p>
              {profile.suspended && (
                <p className="text-[13px] font-semibold text-hotpink">
                  This account is suspended — their card is offline.
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Link href={`/admin/users/${profile.id}`} className="app-btn app-btn-ghost">
                  Open customer
                </Link>
                {card?.username && !card.is_single_purpose && (
                  <a
                    href={`/u/${card.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="app-btn app-btn-ghost"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    /u/{card.username}
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="app-sub mt-4">
              No account attached — the customer was deleted, or this was placed
              before accounts were linked.
            </p>
          )}
        </section>

        <section className="app-panel app-panel-pad">
          <h2 className="font-black lowercase">history</h2>
          {(events ?? []).length === 0 ? (
            <p className="app-sub mt-4">Nothing recorded yet.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {(events ?? []).map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sc-surface-2" />
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-sc-text">
                      {STATUS_LABELS[e.status] ?? e.status}
                    </p>
                    <p className="text-[12px] text-sc-text-dimmer">
                      {new Date(e.created_at).toLocaleString("en-GB")}
                    </p>
                    {e.note && <p className="mt-0.5 text-[13px] text-sc-text-dim">{e.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {order.internal_note && (
        <section className="app-panel app-panel-pad">
          <h2 className="font-black lowercase">internal note</h2>
          <p className="mt-2 text-[14px] text-sc-text">{order.internal_note}</p>
          <p className="app-sub mt-2">Only staff see this.</p>
        </section>
      )}
    </div>
  );
}
