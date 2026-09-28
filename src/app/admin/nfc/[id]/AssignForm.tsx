"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { assignCard } from "../actions";

const FIELD =
  "h-12 w-full rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 px-4 font-semibold text-sc-text outline-none placeholder:text-sc-text-dimmer focus:border-acid";
const LABEL = "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer";

export type AssignOption = {
  username: string;
  fullName: string;
  /** Template name, or "Direct link" for a single-purpose card. */
  experience: string;
  owner: string | null;
  published: boolean;
};

/**
 * Point this physical card at one specific card a customer made. A customer
 * can have several (a profile, a review card…), so the choice is the card
 * profile itself — shown with its template and owner so it's unambiguous.
 * The profile carries the experience and destination; changing either later
 * happens there, and this card follows automatically.
 */
export default function AssignForm({
  cardId,
  current,
  options,
  preselect,
  disabled,
}: {
  cardId: string;
  current: { username: string | null; nickname: string | null; location: string | null };
  options: AssignOption[];
  /** From "Assign a card" on the Reviews page: the business already chosen. */
  preselect?: string | null;
  disabled?: boolean;
}) {
  const [username, setUsername] = useState(preselect ?? current.username ?? "");
  const [query, setQuery] = useState("");
  const [nickname, setNickname] = useState(current.nickname ?? "");
  const [location, setLocation] = useState(current.location ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selected = options.find((o) => o.username === username) ?? null;
  const changedOwner = (current.username ?? "") !== username;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q) return [];
    return options
      .filter(
        (o) =>
          o.username.includes(q) ||
          o.fullName.toLowerCase().includes(q) ||
          o.experience.toLowerCase().includes(q) ||
          (o.owner ?? "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [options, query]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (current.username && changedOwner) {
          const msg = username
            ? `Move this card from @${current.username} to @${username}? Taps open the new card immediately.`
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
        <span className={LABEL}>opens this card</span>
        {selected || username ? (
          <div className="flex items-center gap-3 rounded-xl border-2 border-acid/50 bg-acid/5 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{selected?.fullName ?? `@${username}`}</p>
              <p className="truncate text-xs font-semibold text-sc-text-dim">
                {selected ? (
                  <>
                    <span className="font-bold text-acid">{selected.experience}</span> · @{selected.username}
                    {selected.owner ? ` · ${selected.owner}` : ""}
                    {!selected.published && <span className="ml-1 font-bold text-hotpink">(unpublished)</span>}
                  </>
                ) : (
                  "Not in the list — will be checked on save"
                )}
              </p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => {
                  setUsername("");
                  setSaved(false);
                }}
                aria-label="Clear"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sc-text-dimmer hover:text-hotpink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sc-text-dimmer" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search business, @handle, template or owner email"
                autoComplete="off"
                disabled={disabled}
                className={`${FIELD} pl-10`}
                aria-label="Find the card to open"
              />
            </div>
            {matches.length > 0 && (
              <ul className="overflow-hidden rounded-xl border-2 border-sc-border-soft">
                {matches.map((o) => (
                  <li key={o.username} className="border-b border-sc-border-soft last:border-0">
                    <button
                      type="button"
                      onClick={() => {
                        setUsername(o.username);
                        setQuery("");
                        setSaved(false);
                      }}
                      className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-sc-surface-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">{o.fullName}</span>
                        <span className="block truncate text-xs font-semibold text-sc-text-dimmer">
                          @{o.username}
                          {o.owner ? ` · ${o.owner}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full border-2 border-sc-border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-sc-text-dim">
                        {o.experience}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {query.trim() && matches.length === 0 && (
              <p className="text-xs font-semibold text-sc-text-dimmer">
                No card matches. Create the customer&apos;s card first (Customers → set someone up, or Review cards → New review card).
              </p>
            )}
            {!query.trim() && (
              <p className="text-xs font-semibold text-sc-text-dimmer">
                Leave empty to keep this card in stock.
              </p>
            )}
          </div>
        )}
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
            placeholder="Table 4"
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
          {!changedOwner ? "save details" : username ? "assign & activate" : "unassign"}
        </button>
        {saved && <span className="text-xs font-bold text-acid">Saved — live on the next tap.</span>}
        {error && <span className="text-xs font-bold text-hotpink">{error}</span>}
      </div>
    </form>
  );
}
