"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AlertTriangle, Check, ChevronDown, Loader2, Power, RefreshCw } from "lucide-react";
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

/**
 * One physical card, in customer words. The database lifecycle
 * (in_stock → claimed → active → suspended / retired, plus the owner's own
 * pause switch) shows up here as: Ready to set up, Active, Turned off,
 * Switched off by ScorlynTap, Retired.
 *
 * "Report lost card" is the same owner pause the card always had
 * (update_my_card) — it just leads with what it's for and what to do next.
 */
export default function MyCardRow({ card, pages }: { card: MyCard; pages: MyPageOption[] }) {
  const [profileId, setProfileId] = useState(card.profileId ?? "");
  const [nickname, setNickname] = useState(card.nickname);
  const [paused, setPaused] = useState(card.paused);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmLost, setConfirmLost] = useState(false);
  const [reportedLost, setReportedLost] = useState(false);
  const lockedByUs = card.status === "suspended" || card.status === "retired";

  const save = (next: { paused?: boolean } = {}, after?: () => void) => {
    setError(null);
    setSaved(false);
    start(async () => {
      const r = await saveMyCard(card.id, {
        profileId: profileId || null,
        nickname,
        paused: next.paused ?? paused,
        pageChanged: (card.profileId ?? "") !== profileId,
      });
      if (!r.ok) setError(r.error ?? "Could not save.");
      else {
        if (next.paused !== undefined) setPaused(next.paused);
        setSaved(true);
        after?.();
      }
    });
  };

  const title = card.nickname ? card.nickname : "Scorlyn card";

  if (card.status === "claimed" && !card.profileId) {
    return (
      <article className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <StatusChip tone="warn" label="Ready to set up" />
          <p className="mt-2 text-[16px] font-semibold">{title}</p>
          <p className="text-sm text-sc-text-dim">Activated — choose what it opens.</p>
        </div>
        <Link href={`/activate/${card.code}`} className="app-btn app-btn-primary min-h-12">
          Set it up
        </Link>
      </article>
    );
  }

  const state = lockedByUs
    ? card.status === "retired"
      ? { tone: "off" as const, label: "Retired", line: "This card is no longer in use." }
      : { tone: "off" as const, label: "Switched off by ScorlynTap", line: "Message us if you think this is a mistake." }
    : paused
      ? { tone: "warn" as const, label: "Turned off", line: "Taps and scans show “this card isn’t active right now”." }
      : card.opens
        ? { tone: "ok" as const, label: "Active", line: `Opens: ${card.opens}` }
        : { tone: "warn" as const, label: "Not set up", line: "Choose what this card opens." };

  return (
    <article className="app-panel app-panel-pad space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusChip tone={state.tone} label={state.label} />
          <p className="mt-2 text-[16px] font-semibold text-sc-text">{title}</p>
          <p className="text-sm text-sc-text-dim">{state.line}</p>
          <p className="mt-1 font-mono text-[11px] text-sc-text-dimmer">{card.serial}</p>
        </div>
      </div>

      {/* Lost card — the routine case, handled here without contacting us. */}
      {!lockedByUs && reportedLost && (
        <div className="space-y-3 rounded-xl border-2 border-sc-success/40 bg-sc-success/5 p-4">
          <p className="flex items-center gap-2 text-sm font-black text-sc-text">
            <Check className="h-4 w-4 text-sc-success" strokeWidth={3} /> Card turned off
          </p>
          <p className="text-sm text-sc-text-dim">
            Anyone who finds it now sees “this card isn’t active”, not your details. Your digital card and link still work.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/nfc" className="app-btn app-btn-primary min-h-11">
              <RefreshCw className="h-4 w-4" /> Order a replacement
            </Link>
            <button type="button" onClick={() => setReportedLost(false)} className="app-btn app-btn-ghost min-h-11">
              Done
            </button>
          </div>
        </div>
      )}

      {!lockedByUs && confirmLost && !reportedLost && (
        <div className="space-y-3 rounded-xl border-2 border-sc-warning/50 bg-sc-warning/5 p-4">
          <p className="flex items-center gap-2 text-sm font-black text-sc-text">
            <AlertTriangle className="h-4 w-4 text-sc-warning" /> Report this card lost?
          </p>
          <p className="text-sm text-sc-text-dim">
            It will stop opening your profile immediately. If you find it, you can turn it back on here.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                save({ paused: true }, () => {
                  setConfirmLost(false);
                  setReportedLost(true);
                })
              }
              className="app-btn min-h-11 bg-sc-error text-white hover:opacity-90"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              Turn it off now
            </button>
            <button type="button" onClick={() => setConfirmLost(false)} className="app-btn app-btn-ghost min-h-11">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!lockedByUs && !confirmLost && !reportedLost && (
        <div className="flex flex-wrap gap-2">
          {paused ? (
            <button type="button" disabled={pending} onClick={() => save({ paused: false })} className="app-btn app-btn-primary min-h-11">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              Turn back on
            </button>
          ) : (
            <Link href={`/activate/${card.code}`} className="app-btn app-btn-ghost min-h-11">
              Change what it opens
            </Link>
          )}
          {!paused && (
            <button type="button" onClick={() => setConfirmLost(true)} className="app-btn app-btn-ghost min-h-11 text-sc-error">
              <AlertTriangle className="h-4 w-4" />
              Report lost card
            </button>
          )}
        </div>
      )}

      {/* The full controls, folded away: most visits only need the above. */}
      {!lockedByUs && (
        <details className="group rounded-xl border-2 border-sc-border-soft">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-bold text-sc-text-dim [&::-webkit-details-marker]:hidden">
            Manage card
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <form
            className="grid gap-3 border-t-2 border-sc-border-soft p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label className="block">
              <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">opens</span>
              <select
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                className="h-12 w-full rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 px-3 text-sm font-bold text-sc-text"
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
                placeholder="e.g. Front desk"
                className="h-12 w-full rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 px-3 text-sm font-semibold text-sc-text"
              />
            </label>
            <button type="submit" disabled={pending} className="app-btn app-btn-primary min-h-12">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null} Save
            </button>
          </form>
        </details>
      )}

      {error && <p className="text-sm font-semibold text-sc-error">{error}</p>}
    </article>
  );
}

function StatusChip({ tone, label }: { tone: "ok" | "warn" | "off"; label: string }) {
  const cls =
    tone === "ok"
      ? "bg-sc-success/15 text-sc-success"
      : tone === "warn"
        ? "bg-sc-warning/15 text-sc-warning"
        : "bg-sc-surface-2 text-sc-text-dim";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
