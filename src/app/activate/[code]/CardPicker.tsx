"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Check, ChevronDown, IdCard, Loader2, Star } from "lucide-react";
import { CARD_PURPOSES, type CardPurpose } from "@/lib/card";
import { iconFor } from "@/components/card-templates/button-icons";
import { setupPage, setupSingleLink, linkExistingPage } from "../actions";

export type MyPage = { id: string; name: string; username: string; kind: string };

const FEATURED = ["whatsapp", "instagram"];
const BOX =
  "flex min-h-28 w-full flex-col items-start gap-2 rounded-2xl border-2 border-sc-border-soft bg-sc-surface p-4 text-left transition-colors hover:border-sc-gold disabled:opacity-60";
const FIELD =
  "h-12 w-full rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 px-4 font-semibold text-sc-text outline-none placeholder:text-sc-text-dimmer focus:border-sc-gold";

/**
 * "What should this card open?" — big boxes, one choice each. A full page
 * (profile or review card) is created and opened in the editor; a single
 * link (WhatsApp, Instagram, Maps…) is set up right here in one field.
 */
export default function CardPicker({ code, pages, active }: { code: string; pages: MyPage[]; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<CardPurpose | null>(null);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [done, setDone] = useState<{ title: string; href?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (key: string, fn: () => Promise<void>) => {
    setError(null);
    setBusy(key);
    start(async () => {
      await fn();
      setBusy(null);
    });
  };

  const page = (kind: "profile" | "review") =>
    run(kind, async () => {
      const r = await setupPage(code, kind);
      if (!r.ok || !r.data) setError(r.error ?? "Could not set it up.");
      else router.push(`/dashboard/card?id=${r.data.id}&from=activate`);
    });

  if (done) {
    return (
      <div className="app-panel app-panel-pad space-y-4 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sc-gold/20 text-sc-gold-text">
          <Check className="h-7 w-7" strokeWidth={3} />
        </span>
        <h1 className="text-2xl font-black">{done.title}</h1>
        <p className="text-sm font-medium text-sc-text-dim">Your card is live — tap or scan it to try. You can change this any time.</p>
        <div className="flex flex-wrap justify-center gap-2">
          {done.href && (
            <a href={done.href} target="_blank" rel="noopener noreferrer" className="app-btn app-btn-primary min-h-12">
              Test it <ArrowRight className="h-4 w-4" />
            </a>
          )}
          <Link href="/dashboard/cards" className="app-btn app-btn-ghost min-h-12">
            Physical cards
          </Link>
        </div>
      </div>
    );
  }

  if (purpose) {
    return (
      <form
        className="app-panel app-panel-pad space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          run("single", async () => {
            const r = await setupSingleLink(code, purpose.id, value, message);
            if (!r.ok) setError(r.error ?? "Could not set it up.");
            else setDone({ title: `Your card now opens ${purpose.label}`, href: r.data?.href });
          });
        }}
      >
        <button type="button" onClick={() => setPurpose(null)} className="min-h-11 text-sm font-bold text-sc-text-dim hover:text-sc-text">
          ← back
        </button>
        <div>
          <h1 className="text-2xl font-black">{purpose.label} card</h1>
          <p className="mt-1 text-sm font-medium text-sc-text-dim">{purpose.blurb}</p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">{purpose.fieldLabel}</span>
          <input
            autoFocus
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={purpose.placeholder}
            inputMode={purpose.kind === "whatsapp" || purpose.kind === "phone" ? "tel" : purpose.kind === "email" ? "email" : "url"}
            className={FIELD}
          />
        </label>
        {purpose.kind === "whatsapp" && (
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">
              ready-typed message (optional)
            </span>
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi! I got your card…" className={FIELD} />
          </label>
        )}
        {error && <p className="rounded-xl bg-sc-error/10 px-4 py-3 text-sm font-semibold text-sc-error">{error}</p>}
        <button type="submit" disabled={pending} className="app-btn app-btn-primary min-h-12 w-full justify-center">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save &amp; activate
        </button>
      </form>
    );
  }

  const featured = CARD_PURPOSES.filter((p) => FEATURED.includes(p.id));
  const more = CARD_PURPOSES.filter((p) => !FEATURED.includes(p.id));
  const heading = (t: string) => (
    <p className="px-1 text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">{t}</p>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">
          {active ? "your card" : "✓ card activated · step 3 of 3"}
        </p>
        <h1 className="mt-1 text-3xl font-black leading-tight">What should this card open?</h1>
        <p className="mt-2 text-sm font-medium text-sc-text-dim">
          {active ? "It's live already — pick something else to change what a tap opens." : "Pick one. You can change it any time from Physical cards."}
        </p>
      </div>

      {error && <p className="rounded-xl bg-sc-error/10 px-4 py-3 text-sm font-semibold text-sc-error">{error}</p>}

      {/* 1 — a card they already made: the quickest finish, so it comes first. */}
      {pages.length > 0 && (
        <section className="space-y-2">
          {heading("My existing card")}
          <div className="app-panel app-panel-pad space-y-2">
            {pages.map((pg) => (
              <button
                key={pg.id}
                type="button"
                disabled={pending}
                onClick={() =>
                  run(pg.id, async () => {
                    const r = await linkExistingPage(code, pg.id);
                    if (!r.ok) setError(r.error ?? "Could not link it.");
                    else setDone({ title: `Your card now opens ${pg.name}`, href: `/u/${pg.username}` });
                  })
                }
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border-2 border-sc-border-soft px-4 text-left hover:border-sc-gold"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black">{pg.name}</span>
                  <span className="block truncate text-xs font-semibold text-sc-text-dimmer">@{pg.username}</span>
                </span>
                {busy === pg.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="shrink-0 rounded-full border-2 border-sc-border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-sc-text-dim">
                    {pg.kind}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 2 — a new full page. */}
      <section className="space-y-2">
        {heading(pages.length > 0 ? "Or create a new card" : "Create a new card")}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className={BOX} disabled={pending} onClick={() => page("profile")}>
            {busy === "profile" ? <Loader2 className="h-6 w-6 animate-spin" /> : <IdCard className="h-6 w-6 text-sc-gold-text" />}
            <span className="text-base font-black">Digital profile</span>
            <span className="text-xs font-medium text-sc-text-dim">Your full page — photo, links, contact</span>
          </button>
          <button type="button" className={BOX} disabled={pending} onClick={() => page("review")}>
            {busy === "review" ? <Loader2 className="h-6 w-6 animate-spin" /> : <Star className="h-6 w-6 text-sc-gold-text" />}
            <span className="text-base font-black">Review card</span>
            <span className="text-xs font-medium text-sc-text-dim">Customers rate you, then go to Google</span>
          </button>
        </div>
      </section>

      {/* 3 — a single link, no page at all. */}
      <section className="space-y-2">
        {heading("Or just one link")}
        <div className="grid grid-cols-2 gap-3">
          {featured.map((p) => {
            const Icon = iconFor(p.kind);
            return (
              <button key={p.id} type="button" className={BOX} disabled={pending} onClick={() => setPurpose(p)}>
                <Icon className="h-6 w-6 text-sc-gold-text" />
                <span className="text-base font-black">{p.label}</span>
                <span className="text-xs font-medium text-sc-text-dim">{p.blurb}</span>
              </button>
            );
          })}
        </div>
        <div className="app-panel overflow-hidden">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className="flex min-h-14 w-full items-center justify-between px-5 text-left text-sm font-black"
          >
            Other links (Maps, email, website…)
            <ChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
          </button>
          {moreOpen && (
            <div className="grid grid-cols-2 gap-2 border-t border-sc-border-soft p-3 sm:grid-cols-3">
              {more.map((p) => {
                const Icon = iconFor(p.kind);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={pending}
                    onClick={() => setPurpose(p)}
                    className="flex min-h-12 items-center gap-2 rounded-xl border-2 border-sc-border-soft px-3 text-left text-sm font-bold hover:border-sc-gold"
                  >
                    <Icon className="h-4 w-4 shrink-0" /> {p.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
