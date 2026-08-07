"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
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
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}) {
  const [availability, setAvailability] = useState<Availability>("unknown");

  const handle = value.trim().toLowerCase();
  const malformed = handle.length > 0 && !USERNAME_PATTERN.test(handle);

  // Derived, not stored: a value that can be computed from props during render
  // has no business being set from an effect.
  const state: { kind: string; message?: string } = malformed
    ? { kind: "invalid", message: "3–30 characters: lowercase letters, numbers, - and _." }
    : !handle
      ? { kind: "idle" }
      : { kind: availability === "unknown" ? "idle" : availability };

  useEffect(() => {
    if (!handle || malformed) return;

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
      if (error) setAvailability("unknown");
      else setAvailability(data ? "free" : "taken");
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(mark);
      window.clearTimeout(timer);
    };
  }, [handle, malformed]);

  const border =
    state.kind === "taken" || state.kind === "invalid"
      ? "border-rose-400 focus:border-rose-500"
      : state.kind === "free"
        ? "border-emerald-400 focus:border-emerald-500"
        : "";

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
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          )}
          {state.kind === "free" && <Check className="h-4 w-4 text-emerald-500" />}
          {(state.kind === "taken" || state.kind === "invalid") && (
            <X className="h-4 w-4 text-rose-500" />
          )}
        </span>
      </div>

      <p id="username-status" className="text-xs">
        {state.kind === "taken" ? (
          <span className="font-semibold text-rose-500">
            “{handle}” is already taken — try another.
          </span>
        ) : state.kind === "invalid" ? (
          <span className="font-semibold text-rose-500">{state.message}</span>
        ) : state.kind === "free" ? (
          <span className="font-semibold text-emerald-600">
            Available. Your card will live at /u/{handle}
          </span>
        ) : (
          <span className="text-slate-500">
            Your card will live at /u/{handle || "username"}
          </span>
        )}
      </p>
    </div>
  );
}
