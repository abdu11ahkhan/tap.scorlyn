"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/components/auth/AuthShell";

const LINK_ERRORS: Record<string, string> = {
  "link-expired": "That reset link has expired or was already used. Request a new one below.",
};

function ForgotForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(LINK_ERRORS[searchParams.get("error") ?? ""] ?? null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Same /auth/callback?next= shape GoogleButton uses, so it matches the
    // redirect URLs already allowed in Supabase.
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", "/reset-password");
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: callback.toString(),
    });
    setLoading(false);
    // Rate limits are worth showing; anything else gets the same answer as
    // success, so this page never reveals which emails have an account.
    if (error && /rate|too many|seconds/i.test(error.message)) {
      setError("Too many requests. Wait a minute and try again.");
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell>
      {sent ? (
        <>
          <MailCheck className="h-10 w-10 text-ink" />
          <h1 className="mt-4 text-4xl font-black leading-none tracking-tighter text-ink">check your email.</h1>
          <p className="mt-3 text-[15px] font-semibold text-ink/60">
            If an account exists for <span className="text-ink">{email.trim()}</span>, we&apos;ve sent a link to
            reset your password. It can take a minute; check your spam folder too.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-6 inline-flex min-h-11 items-center text-sm font-black text-ink underline decoration-acid decoration-4 underline-offset-2"
          >
            use a different email
          </button>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-black leading-none tracking-tighter text-ink">forgot your password?</h1>
          <p className="mt-3 text-[15px] font-semibold text-ink/50">
            Enter the email you signed up with and we&apos;ll send you a link to set a new one.
          </p>

          {error && (
            <div className="mt-6 rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">{error}</div>
          )}

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-black uppercase tracking-wide text-ink">
                email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-13 w-full rounded-xl border-2 border-ink bg-white px-4 py-3 font-semibold text-ink outline-none placeholder:text-ink/30 focus:border-acid focus:bg-acid/20"
              />
            </div>
            <button
              disabled={loading}
              type="submit"
              className="sticker sticker-press flex h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-acid text-base font-black uppercase tracking-tight text-ink disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "send reset link"}
            </button>
          </form>
        </>
      )}

      <p className="mt-7 text-center text-sm font-semibold text-ink/50">
        Remembered it?{" "}
        <Link
          href="/login"
          className="inline-flex min-h-[44px] items-center font-black text-ink underline decoration-acid decoration-4 underline-offset-2"
        >
          log in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ink">
          <Loader2 className="h-6 w-6 animate-spin text-acid" />
        </div>
      }
    >
      <ForgotForm />
    </Suspense>
  );
}
