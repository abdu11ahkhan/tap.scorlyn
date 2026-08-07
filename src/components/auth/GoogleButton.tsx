"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Google's mark. Inlined because the brand guidelines require these exact
 *  four colours, and an external image would be blocked on first paint. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * "Continue with Google" — the same button for signing in and signing up.
 *
 * OAuth makes no distinction between the two: Google returns an identity, and
 * Supabase creates the account if it hasn't seen that address before. Offering
 * separate buttons would imply a choice that doesn't exist, and one of them
 * would always be the wrong one to press.
 */
export default function GoogleButton({
  next,
  label = "Continue with Google",
}: {
  /** Where to land afterwards. Carried through Google and validated on return. */
  next?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    if (next) callback.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
        // Without this a returning visitor is bounced straight through by
        // Google with no way to pick a different account.
        queryParams: { prompt: "select_account" },
      },
    });

    // On success the browser is already navigating away, so this only runs if
    // the provider is switched off or misconfigured.
    if (error) {
      setError(
        error.message.toLowerCase().includes("provider")
          ? "Google sign-in isn't switched on yet."
          : error.message
      );
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="flex h-13 w-full items-center justify-center gap-3 rounded-xl border-2 border-ink bg-white py-3 text-[15px] font-black text-ink transition-transform active:scale-[0.99] disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleMark />}
        {label}
      </button>
      {error && <p className="text-xs font-bold text-hotpink">{error}</p>}
    </div>
  );
}
