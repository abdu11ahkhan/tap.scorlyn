"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { saveMyCard } from "./actions";

export type MyCard = {
  id: string;
  serial: string;
  code: string;
  nickname: string;
  status: string;
  paused: boolean;
  profileId: string | null;
  opens: string | null;
};

export type MyPageOption = { id: string; label: string };

export default function MyCardRow({ card, pages }: { card: MyCard; pages: MyPageOption[] }) {
  const [profileId, setProfileId] = useState(card.profileId ?? "");
  const [nickname, setNickname] = useState(card.nickname);
  const [paused, setPaused] = useState(card.paused);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lockedByUs = card.status === "suspended" || card.status === "retired";

  if (card.status === "claimed" && !card.profileId) {
    return (
      <article className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-black">{card.serial}</p>
          <p className="text-sm font-semibold text-sc-text-dim">Activated — choose what it opens.</p>
        </div>
        <Link href={`/activate/${card.code}`} className="app-btn app-btn-primary min-h-11">
          Set it up
        </Link>
      </article>
    );
  }

  return (
    <article className="app-panel app-panel-pad space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-lg font-black">{card.serial}</p>
          <p className="text-sm font-semibold text-sc-text-dim">
            {lockedByUs
              ? "Switched off by ScorlynTap — contact us."
              : paused
                ? "Paused — taps show “not active”."
                : card.opens
                  ? `Opens ${card.opens}`
                  : "Not set up"}
          </p>
        </div>
        <Link href={`/activate/${card.code}`} className="text-xs font-bold text-sc-text-dim hover:text-sc-text">
          more options →
        </Link>
      </div>

      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setSaved(false);
          start(async () => {
            const r = await saveMyCard(card.id, {
              profileId: profileId || null,
              nickname,
              paused,
              pageChanged: (card.profileId ?? "") !== profileId,
            });
            if (!r.ok) setError(r.error ?? "Could not save.");
            else setSaved(true);
          });
        }}
      >
        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">opens</span>
          <select
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            disabled={lockedByUs}
            className="h-11 w-full rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 px-3 text-sm font-bold text-sc-text"
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">nickname</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={80}
            placeholder="Front desk"
            disabled={lockedByUs}
            className="h-11 w-full rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 px-3 text-sm font-semibold text-sc-text"
          />
        </label>
        <div className="flex items-center gap-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} disabled={lockedByUs} className="h-4 w-4" />
            Pause
          </label>
          <button type="submit" disabled={pending || lockedByUs} className="app-btn app-btn-primary min-h-11">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null} Save
          </button>
        </div>
      </form>
      {error && <p className="text-sm font-semibold text-sc-error">{error}</p>}
    </article>
  );
}
