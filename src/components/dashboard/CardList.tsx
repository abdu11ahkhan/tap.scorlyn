"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Clock, Loader2, Lock, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type CardSummary = {
  id: string;
  username: string;
  full_name: string;
  headline: string | null;
  template: string;
  accent_color: string | null;
  published: boolean;
  approval_status: string;
  approval_fee_pkr: number | null;
};

/**
 * Every card the person owns, collapsed to a row each.
 *
 * The dashboard used to assume one card and render it full width, so a second
 * one had nowhere to appear. Collapsed rows keep drafts and live cards in the
 * same list — a draft that is hidden somewhere else is a draft nobody
 * finishes.
 */
export default function CardList({ cards }: { cards: CardSummary[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCard = async () => {
    setCreating(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCreating(false);
      setError("Your session expired — sign in again.");
      return;
    }

    // The handle has to be unique and the customer has not chosen one yet, so
    // it gets a placeholder they rename in the editor before it goes live.
    const suffix = Math.random().toString(36).slice(2, 8);
    const { data, error: createError } = await supabase
      .from("card_profiles")
      .insert({
        user_id: user.id,
        username: `new-card-${suffix}`,
        full_name: "",
        template: "minimal",
        accent_color: "#111111",
        published: false,
      })
      .select("id")
      .single();

    setCreating(false);
    if (createError) {
      setError(createError.message);
      return;
    }
    router.push(`/dashboard/card?id=${data.id}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-sc-text-dimmer">
          your cards
        </h2>
        <div className="flex flex-wrap gap-2">
          {/* Reads a physical card straight into a new one — faster than
              retyping it, and lands in the same editor either way. */}
          <Link
            href="/templates/scan"
            className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-sc-border px-4 text-xs font-black uppercase tracking-tight text-sc-text transition-colors hover:border-sc-gold hover:text-sc-gold-text"
          >
            <Camera className="h-4 w-4" />
            scan a card
          </Link>
          <button
            type="button"
            onClick={createCard}
            disabled={creating}
            className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-sc-border px-4 text-xs font-black uppercase tracking-tight text-sc-text transition-colors hover:border-sc-gold hover:text-sc-gold-text disabled:opacity-60"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            new card
            <span className="font-bold text-sc-text-dimmer">Rs.500</span>
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border-2 border-sc-error/40 bg-sc-error/10 px-4 py-3 text-sm font-bold text-sc-error">
          {error}
        </p>
      )}

      {cards.map((card) => {
        const live = card.published && card.approval_status === "approved";
        const waiting = card.approval_status !== "approved";
        return (
          <Link
            key={card.id}
            href={`/dashboard/card?id=${card.id}`}
            className="app-panel flex items-center gap-4 p-4 transition-colors hover:border-sc-gold/50"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-black text-sc-text"
              style={{ background: card.accent_color || "#111111" }}
            >
              {(card.full_name || card.username).slice(0, 2).toUpperCase()}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-sc-text">
                {card.full_name || "Untitled card"}
              </p>
              <p className="truncate text-xs font-semibold text-sc-text-dimmer">
                /u/{card.username} · {card.template}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-tight ${
                live
                  ? "bg-sc-gold/15 text-sc-gold-text"
                  : waiting
                    ? "bg-sc-warning/15 text-sc-warning"
                    : "bg-sc-surface-2 text-sc-text-dim"
              }`}
            >
              {live ? (
                "live"
              ) : card.approval_status === "awaiting_payment" ? (
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Rs.{card.approval_fee_pkr ?? 500} to publish
                </span>
              ) : card.approval_status === "awaiting_review" ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  checking payment
                </span>
              ) : card.approval_status === "rejected" ? (
                "not approved"
              ) : (
                "draft"
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
