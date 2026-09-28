"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { assignCard } from "../actions";

const FIELD =
  "h-12 w-full rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 px-4 font-semibold text-sc-text outline-none placeholder:text-sc-text-dimmer focus:border-acid";
const LABEL = "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer";

/**
 * Point this card at a business's card profile. The profile carries the
 * experience (its template, or a direct link) and the destination, so
 * changing either later happens on the profile — the card never needs
 * touching again.
 */
export default function AssignForm({
  cardId,
  current,
  profiles,
  disabled,
}: {
  cardId: string;
  current: { username: string | null; nickname: string | null; location: string | null };
  profiles: { username: string; full_name: string }[];
  disabled?: boolean;
}) {
  const [username, setUsername] = useState(current.username ?? "");
  const [nickname, setNickname] = useState(current.nickname ?? "");
  const [location, setLocation] = useState(current.location ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const assigning = Boolean(username.trim());
  const changedOwner = (current.username ?? "") !== username.trim().replace(/^@/, "").toLowerCase();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (current.username && changedOwner) {
          const msg = assigning
            ? `Move this card from @${current.username} to @${username.trim().replace(/^@/, "")}? Taps will open the new business immediately.`
            : `Unassign this card from @${current.username}? It goes back into stock.`;
          if (!window.confirm(msg)) return;
        }
        setError(null);
        setSaved(false);
        startTransition(async () => {
          const r = await assignCard(cardId, { username, nickname, location });
          if (!r.ok) setError(r.error ?? "Could not save.");
          else setSaved(true);
        });
      }}
      className="space-y-3"
    >
      <div>
        <label className={LABEL} htmlFor="assign-business">business (card handle)</label>
        <input
          id="assign-business"
          list="assign-profiles"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setSaved(false);
          }}
          placeholder="Leave empty to keep in stock"
          autoComplete="off"
          disabled={disabled}
          className={FIELD}
        />
        <datalist id="assign-profiles">
          {profiles.map((p) => (
            <option key={p.username} value={p.username}>
              {p.full_name}
            </option>
          ))}
        </datalist>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="assign-nickname">nickname</label>
          <input
            id="assign-nickname"
            value={nickname}
            maxLength={80}
            onChange={(e) => {
              setNickname(e.target.value);
              setSaved(false);
            }}
            placeholder="Reception desk"
            disabled={disabled}
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="assign-location">location</label>
          <input
            id="assign-location"
            value={location}
            maxLength={120}
            onChange={(e) => {
              setLocation(e.target.value);
              setSaved(false);
            }}
            placeholder="Main branch"
            disabled={disabled}
            className={FIELD}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || disabled}
          className="sticker sticker-press inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-acid px-6 text-sm font-black uppercase tracking-tight text-ink disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" strokeWidth={3} />
          ) : null}
          {!changedOwner ? "save details" : assigning ? "assign & activate" : "unassign"}
        </button>
        {saved && <span className="text-xs font-bold text-acid">Saved — live on the next tap.</span>}
        {error && <span className="text-xs font-bold text-hotpink">{error}</span>}
      </div>
    </form>
  );
}
