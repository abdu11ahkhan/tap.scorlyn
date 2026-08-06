"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

type Result = { ok: boolean; error?: string };

/**
 * A destructive admin action you have to type a name to perform.
 *
 * window.confirm() is one careless tap away from granting somebody full admin,
 * and in a table of rows the muscle memory is to hit Enter. Typing the exact
 * name forces you to look at *which* row you're on, which is the mistake this
 * is guarding against — not "are you sure", but "are you sure about them".
 */
export default function ConfirmByName({
  action,
  expected,
  title,
  body,
  cta,
  children,
  variant = "acid",
}: {
  action: () => Promise<Result>;
  /** What has to be typed, exactly. Usually the person's name or email. */
  expected: string;
  title: string;
  body: string;
  cta: string;
  children: React.ReactNode;
  variant?: "acid" | "danger";
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
    else {
      setTyped("");
      setError(null);
    }
  }, [open]);

  // Case and surrounding space are noise; the point is that you read the name.
  const matches = typed.trim().toLowerCase() === expected.trim().toLowerCase();

  const styles =
    variant === "danger"
      ? "border-white/20 text-white/70 hover:border-hotpink hover:text-hotpink"
      : "border-ink bg-acid text-ink";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-xs font-black lowercase transition-colors ${styles}`}
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) setOpen(false);
          }}
        >
          <div className="app-panel w-full max-w-md p-5">
            <div className="flex items-start gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  variant === "danger" ? "bg-hotpink/15 text-hotpink" : "bg-acid/15 text-acid"
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-white">{title}</p>
                <p className="app-sub mt-1">{body}</p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                aria-label="Cancel"
                className="shrink-0 p-1 text-white/35 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-5 block">
              <span className="app-sub">
                Type <span className="font-mono font-bold text-white">{expected}</span> to
                confirm
              </span>
              <input
                ref={input}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && !pending) setOpen(false);
                }}
                autoComplete="off"
                spellCheck={false}
                className="app-input mt-2"
              />
            </label>

            {error && (
              <p className="mt-3 text-[13px] font-semibold text-hotpink">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="app-btn app-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!matches || pending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const result = await action();
                    if (!result.ok) setError(result.error ?? "Something went wrong.");
                    else setOpen(false);
                  });
                }}
                className="app-btn app-btn-primary disabled:opacity-40"
              >
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {cta}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
