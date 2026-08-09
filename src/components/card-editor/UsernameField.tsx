"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Lock, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { USERNAME_PATTERN } from "@/lib/card-draft";

/** Only the answer we have to go and fetch is state. */
type Availability = "unknown" | "checking" | "free" | "taken";

/**
 * The handle, with availability checked as it is typed.
 *
 * The unique index catches a clash on save, but only after the whole card has
 * been filled in — and the message arrives attached to a failed save rather
 * than to the field that caused it.
 *
 * The lookup goes through a SECURITY DEFINER function rather than a select:
 * RLS hides unpublished cards, so querying the table directly would report a
 * taken handle as free and put us right back where we started.
 */
export default function UsernameField({
  value,
  onChange,
  className,
  locked = false,
  ownHandle,
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  /**
   * Set once the handle has been saved. It is the card's public address —
   * printed on NFC cards, saved into contacts, shared as a link — so changing
   * it breaks every card already handed out and frees the old handle for
   * someone else to claim. Enforced by a trigger too; this is the explanation.
   */
  locked?: boolean;
  /**
   * The handle this card already holds. The availability lookup hides your own
   * cards from you, but only yours — an admin editing someone else's card was
   * told that customer's own handle was taken, because to the database the
   * admin is a different user.
   */
  ownHandle?: string;
}) {
  const [availability, setAvailability] = useState<Availability>("unknown");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handle = value.trim().toLowerCase();
  const malformed = handle.length > 0 && !USERNAME_PATTERN.test(handle);

  // Derived, not stored: a value that can be computed from props during render
  // has no business being set from an effect.
  const state: { kind: string; message?: string } = malformed
    ? { kind: "invalid", message: "3–30 characters: lowercase letters, numbers, - and _." }
    : !handle
      ? { kind: "idle" }
      : { kind: availability === "unknown" ? "idle" : availability };

  const isOwnHandle =
    !!ownHandle && handle === ownHandle.trim().toLowerCase();

  useEffect(() => {
    // Keeping the handle you already have is not a clash.
    if (isOwnHandle) {
      setAvailability("free");
      setSuggestions([]);
      return;
    }
    if (locked || !handle || malformed) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    // Marked as checking from inside the timer rather than synchronously, so
    // the effect does not set state during the render it was scheduled by.
    const mark = window.setTimeout(() => setAvailability("checking"), 0);

    // Debounced: this fires on every keystroke otherwise, and the answer for a
    // half-typed handle is never the one being asked for.
    const timer = window.setTimeout(async () => {
      const { data, error } = await createClient().rpc("username_available", {
        candidate: handle,
      });
      if (cancelled) return;
      // A failed check must not claim the name is taken — saving will still
      // catch a genuine clash, and a false "taken" blocks a valid handle.
      if (error) {
        setAvailability("unknown");
        return;
      }
      setAvailability(data ? "free" : "taken");

      // "Taken — try another" leaves the work to the person who is already
      // stuck. Offer names that are actually free instead: candidates are
      // checked before being shown, so tapping one always succeeds.
      if (data) {
        setSuggestions([]);
        return;
      }
      const checked = await Promise.all(
        candidatesFor(handle).map(async (candidate) => {
          const { data: free } = await createClient().rpc("username_available", {
            candidate,
          });
          return free ? candidate : null;
        })
      );
      if (!cancelled) {
        setSuggestions(checked.filter((c): c is string => c !== null).slice(0, 3));
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(mark);
      window.clearTimeout(timer);
    };
  }, [handle, malformed, locked, isOwnHandle]);

  const border =
    state.kind === "taken" || state.kind === "invalid"
      ? "border-rose-400 focus:border-rose-500"
      : state.kind === "free"
        ? "border-emerald-400 focus:border-emerald-500"
        : "";

  if (locked) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-xl border-2 border-white/15 bg-white/[0.04] px-3.5 py-2.5">
          <Lock className="h-4 w-4 shrink-0 text-white/40" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
            /u/{handle}
          </span>
        </div>
        <p className="text-xs text-white/45">
          Your card address is permanent — it is printed on your NFC card and
          saved in the contacts of everyone you have tapped.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id="username"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="yourname"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={state.kind === "taken" || state.kind === "invalid"}
          aria-describedby="username-status"
          className={`${className ?? ""} ${border} pr-10`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {state.kind === "checking" && (
            <Loader2 className="h-4 w-4 animate-spin text-white/40" />
          )}
          {state.kind === "free" && <Check className="h-4 w-4 text-emerald-400" />}
          {(state.kind === "taken" || state.kind === "invalid") && (
            <X className="h-4 w-4 text-rose-300" />
          )}
        </span>
      </div>

      <p id="username-status" className="text-xs">
        {state.kind === "taken" ? (
          <span className="font-semibold text-rose-300">
            “{handle}” is already taken.
          </span>
        ) : state.kind === "invalid" ? (
          <span className="font-semibold text-rose-300">{state.message}</span>
        ) : state.kind === "free" ? (
          <span className="font-semibold text-emerald-300">
            {isOwnHandle
              ? `This card already lives at /u/${handle}`
              : `Available. Your card will live at /u/${handle}`}
          </span>
        ) : (
          <span className="text-white/45">
            Your card will live at /u/{handle || "username"}
          </span>
        )}
      </p>

      {state.kind === "taken" && suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-white/45">Available:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onChange(suggestion)}
              className="rounded-full border border-emerald-400/50 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/20"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Alternatives to offer when a handle is gone. Kept close to what was typed —
 * someone who wanted "ghulam" will take "ghulammustafa" or "ghulam1", but a
 * randomly generated string is just a different problem.
 */
function candidatesFor(handle: string): string[] {
  const base = handle.slice(0, 26);
  const year = new Date().getFullYear();
  return [
    `${base}1`,
    `the${base}`,
    `${base}_official`,
    `${base}${year % 100}`,
    `${base}pk`,
  ].filter((c) => USERNAME_PATTERN.test(c));
}
