import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, MessageCircle, ShieldCheck, Ban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { statusTone } from "@/app/dashboard/orders/status";
import ActionButton from "../../ActionButton";
import { setAdmin, setSuspended } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminUserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: me },
  } = await supabase.auth.getUser();

  const { data: person } = await supabase
    .from("profiles")
    .select("id, email, full_name, whatsapp, is_admin, suspended, referral_code, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!person) return notFound();

  const [{ data: card }, { data: orders }] = await Promise.all([
    supabase
      .from("card_profiles")
      .select("username, full_name, template, published, view_count, accent_color")
      .eq("user_id", id)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("id, reference, status, amount_pkr, quantity, plan_id, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const orderRows = orders ?? [];
  const spent = orderRows
    .filter((o) => ["paid", "printing", "shipped", "delivered"].includes(o.status))
    .reduce((s, o) => s + o.amount_pkr, 0);

  const isMe = person.id === me?.id;

  // Pre-filled outreach. mailto/wa.me rather than an in-app inbox — there is
  // no messaging system, and pretending otherwise would just lose messages.
  const waNumber = (person.whatsapp ?? "").replace(/\D/g, "");
  const greeting = `Hi ${person.full_name?.split(" ")[0] ?? "there"}, this is ScorlynTap support.`;

  return (
    <div className="max-w-5xl space-y-5">
      <Link href="/admin/users" className="app-btn app-btn-ghost w-fit">
        <ArrowLeft className="h-3.5 w-3.5" />
        People
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Identity */}
          <section className="app-panel app-panel-pad">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="app-h1">{person.full_name || "—"}</h1>
                <p className="app-sub mt-1">{person.email}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {person.is_admin && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-acid px-2 py-0.5 text-[11px] font-semibold text-ink">
                      <ShieldCheck className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                  {person.suspended && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-hotpink px-2 py-0.5 text-[11px] font-semibold text-white">
                      <Ban className="h-3 w-3" />
                      Suspended
                    </span>
                  )}
                  <span className="rounded-md border border-white/12 px-2 py-0.5 text-[11px] font-medium text-white/45">
                    Joined {new Date(person.created_at).toLocaleDateString("en-GB")}
                  </span>
                  {person.referral_code && (
                    <span className="rounded-md border border-white/12 px-2 py-0.5 font-mono text-[11px] text-white/45">
                      {person.referral_code}
                    </span>
                  )}
                </div>
              </div>

              {!isMe && (
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    action={async () => {
                      "use server";
                      return setAdmin(person.id, !person.is_admin);
                    }}
                    variant={person.is_admin ? "ghost" : "acid"}
                    confirm={
                      person.is_admin
                        ? `Remove admin access from ${person.email}?`
                        : `Give ${person.email} full admin access?`
                    }
                  >
                    {person.is_admin ? "revoke admin" : "make admin"}
                  </ActionButton>
                  <ActionButton
                    action={async () => {
                      "use server";
                      return setSuspended(person.id, !person.suspended);
                    }}
                    variant="danger"
                    confirm={
                      person.suspended
                        ? `Restore ${person.email}?`
                        : `Suspend ${person.email}? Their card stops being public immediately.`
                    }
                  >
                    {person.suspended ? "restore" : "suspend"}
                  </ActionButton>
                </div>
              )}
            </div>

            {/* Contact */}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-white/8 pt-4">
              <a
                href={`mailto:${person.email}?subject=${encodeURIComponent("ScorlynTap")}&body=${encodeURIComponent(greeting)}`}
                className="app-btn app-btn-ghost"
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </a>
              {waNumber ? (
                <a
                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(greeting)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="app-btn app-btn-ghost"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              ) : (
                <span className="app-btn app-btn-ghost opacity-40">
                  <MessageCircle className="h-3.5 w-3.5" />
                  No WhatsApp number
                </span>
              )}
            </div>
          </section>

          {/* Orders */}
          <section className="app-panel">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <h2 className="app-h2">Order history</h2>
              <span className="text-[13px] text-white/45">
                {orderRows.length} orders · Rs.{spent.toLocaleString()} paid
              </span>
            </div>

            {orderRows.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-white/35">No orders yet.</p>
            ) : (
              <table className="app-table w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    <th>Reference</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {orderRows.map((o) => (
                    <tr key={o.id}>
                      <td className="font-mono text-[13px]">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="text-white hover:text-acid hover:underline"
                        >
                          {o.reference}
                        </Link>
                      </td>
                      <td className="text-white/60">
                        {o.quantity} × {o.plan_id}
                      </td>
                      <td className="tabular-nums text-white/80">
                        Rs.{o.amount_pkr.toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${statusTone(o.status)}`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        {/* Live preview */}
        <aside className="space-y-4">
          <section className="app-panel app-panel-pad">
            <h2 className="app-h2">Their card</h2>
            {card ? (
              <>
                <div className="mt-3 flex items-center gap-2 text-[13px]">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: card.accent_color || "#111" }}
                  />
                  <span className="font-medium text-white">@{card.username}</span>
                  <span className="text-white/35">· {card.template}</span>
                </div>
                <p className="app-sub mt-1">{card.view_count} views</p>

                {/* Real render, not a screenshot — an iframe is a real viewport
                    so the card lays out exactly as a visitor sees it. */}
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black">
                  <iframe
                    src={`/u/${card.username}`}
                    title={`${card.username} preview`}
                    loading="lazy"
                    className="h-[420px] w-full border-0"
                  />
                </div>

                <Link
                  href={`/u/${card.username}`}
                  target="_blank"
                  className="app-btn app-btn-ghost mt-3 w-full"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open full page
                </Link>
              </>
            ) : (
              <p className="mt-3 text-[13px] text-white/35">No card created yet.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
