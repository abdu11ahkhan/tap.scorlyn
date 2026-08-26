"use client";

import { useState, useTransition } from "react";
import { LogIn, Loader2, AlertTriangle } from "lucide-react";
import { impersonateCustomer } from "../../actions";

/**
 * Opens a customer's account so an admin can build their card for them.
 *
 * Behind a confirmation because of the side effect rather than the risk: a
 * browser holds one session, so signing in as someone else signs the admin out
 * of their own. That is surprising if it happens on a single click, and the
 * way back is simply to log in again.
 */
export default function SignInAsButton({
  userId,
  email,
  name,
}: {
  userId: string;
  email: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="app-btn app-btn-ghost">
        <LogIn className="h-3.5 w-3.5" />
        sign in as them
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-amber-200">
        <AlertTriangle className="h-4 w-4" />
        Sign in as {name || email}?
      </p>
      <p className="mt-1.5 text-[13px] text-sc-text-dim">
        You&apos;ll land in their dashboard and can set up their card, buttons
        and links exactly as they would. This signs you out of the admin
        console in this browser — log back in when you&apos;re done. Nothing is
        emailed to them and their password is unchanged.
      </p>

      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why? (optional — kept in the log)"
        className="mt-3 h-10 w-full rounded-lg border border-sc-border-soft bg-sc-surface-2 px-3 text-sm text-sc-text outline-none placeholder:text-sc-text-dimmer focus:border-sc-border"
      />

      {error && <p className="mt-2 text-[13px] font-semibold text-rose-300">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const r = await impersonateCustomer(userId, reason);
              if (!r.ok || !r.data) {
                setError(r.error ?? "Could not open that account.");
                return;
              }
              // A full navigation, not a router push: the session cookie is
              // set by the route being visited, and a client transition would
              // keep the old one in memory.
              window.location.href = r.data.url;
            })
          }
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-black disabled:opacity-50"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Open their account
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="app-btn app-btn-ghost"
        >
          cancel
        </button>
      </div>
    </div>
  );
}
