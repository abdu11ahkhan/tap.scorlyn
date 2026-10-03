import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera, ExternalLink, LayoutTemplate, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CARD_TEMPLATES } from "@/lib/card";
import { googleWalletEnabled } from "@/lib/google-wallet";
import CardList, { type CardSummary } from "@/components/dashboard/CardList";
import QrPanel from "../settings/QrPanel";

export const dynamic = "force-dynamic";

/**
 * Everything about the digital card in one place: edit it, see it, share
 * it (link, QR, Google Wallet). QR and Wallet used to sit inside Settings,
 * which is the last place anyone looks for "how do I share my card".
 */
export default async function MyCardHub({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/my-card");

  const { data: rows } = await supabase
    .from("card_profiles")
    .select("id, username, full_name, headline, template, accent_color, avatar_url, published, approval_status, approval_fee_pkr, is_single_purpose")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  const cards = rows ?? [];

  if (cards.length === 0) {
    return (
      <div className="max-w-2xl space-y-5 pb-10">
        <header>
          <h1 className="app-h1">My card</h1>
          <p className="app-sub mt-1">You haven&apos;t made a card yet. It takes about two minutes and it&apos;s free.</p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/templates" className="app-panel app-panel-pad flex min-h-28 flex-col gap-2 transition-colors hover:border-sc-gold">
            <LayoutTemplate className="h-6 w-6 text-sc-gold-text" />
            <span className="text-[15px] font-black">Choose a design</span>
            <span className="app-sub text-[13px]">Pick from 44 designs, then add your details.</span>
          </Link>
          <Link href="/templates/scan" className="app-panel app-panel-pad flex min-h-28 flex-col gap-2 transition-colors hover:border-sc-gold">
            <Camera className="h-6 w-6 text-sc-gold-text" />
            <span className="text-[15px] font-black">Use my business card</span>
            <span className="app-sub text-[13px]">Take a photo — we fill in your details for you.</span>
          </Link>
        </div>
      </div>
    );
  }

  const card = cards.find((c) => c.id === id) ?? cards[0];
  const design = card.is_single_purpose
    ? "One-link card"
    : CARD_TEMPLATES.find((t) => t.id === card.template)?.name ?? card.template;
  const live = card.published !== false;
  const placeholder = /^new-card-[a-z0-9]{1,8}$/.test(card.username);

  return (
    <div className="max-w-3xl space-y-5 pb-10">
      <header>
        <h1 className="app-h1">My card</h1>
        <p className="app-sub mt-1">Edit it, check how it looks, and share it.</p>
      </header>

      {/* The card itself, and the two things people come here to do. */}
      <section className="app-panel app-panel-pad space-y-5">
        <div className="flex items-center gap-4">
          {card.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.avatar_url} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
          ) : (
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white"
              style={{ background: card.accent_color || "#111111" }}
            >
              {(card.full_name || "?").slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[18px] font-semibold leading-tight text-sc-text">{card.full_name || "Untitled card"}</p>
            <p className="app-sub mt-0.5 truncate">
              {card.headline || "No job title yet"} · {design}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
              live && !placeholder ? "bg-sc-success/15 text-sc-success" : "bg-sc-surface-2 text-sc-text-dim"
            }`}
          >
            {live && !placeholder ? "● Live" : "Draft"}
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Link href={`/dashboard/card?id=${card.id}`} className="app-btn app-btn-primary min-h-12 justify-center">
            <Pencil className="h-4 w-4" />
            Edit card
          </Link>
          {live && !placeholder ? (
            <a href={`/u/${card.username}`} target="_blank" rel="noopener noreferrer" className="app-btn app-btn-ghost min-h-12 justify-center">
              <ExternalLink className="h-4 w-4" />
              Preview live card
            </a>
          ) : (
            <p className="flex min-h-12 items-center justify-center rounded-xl bg-sc-surface-2 px-4 text-center text-[13px] font-semibold text-sc-text-dim">
              Publish it from the editor to get your link.
            </p>
          )}
        </div>
      </section>

      {live && !placeholder && <QrPanel username={card.username} cardId={card.id} wallet={googleWalletEnabled()} />}

      {/* Which card the panels above are about — only when there's a choice. */}
      {cards.length > 1 && (
        <section className="space-y-2">
          <p className="px-1 text-[12.5px] font-semibold text-sc-text-dimmer">Showing sharing options for:</p>
          <div className="flex flex-wrap gap-2">
            {cards.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/my-card?id=${c.id}`}
                aria-current={c.id === card.id ? "true" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full border-2 px-4 text-[13px] font-bold ${
                  c.id === card.id ? "border-sc-gold bg-sc-gold/10 text-sc-text" : "border-sc-border-soft text-sc-text-dim hover:border-sc-gold"
                }`}
              >
                {c.full_name || c.username}
              </Link>
            ))}
          </div>
        </section>
      )}

      <CardList cards={cards as CardSummary[]} />
    </div>
  );
}
