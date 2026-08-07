"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import BrandLockup from "@/components/layout/BrandLockup";

/** Why /auth/confirm sent someone here instead of into the dashboard. */
const LINK_ERRORS: Record<string, string> = {
  "link-expired": "That link has expired or was already used. Request a new one.",
  "link-invalid": "That link wasn't valid. Request a new one.",
};

/** Only same-origin relative paths, so ?next= can't bounce to another host. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Same credentials either way — this only decides where you land, and the
  // admin area still gates on is_admin server-side. It exists because an admin
  // is also a customer, and typing /admin every time is friction.
  const [mode, setMode] = useState<"customer" | "admin">("customer");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // An expired reset link drops you back here; without a reason the page just
  // looks like it forgot you were signing in.
  const linkError = LINK_ERRORS[searchParams.get("error") ?? ""] ?? null;

  const requestedNext = safeNext(searchParams.get("next"));
  // An explicit ?next= wins — it's how Publish carries unsaved work through.
  const hasExplicitNext = Boolean(searchParams.get("next"));
  const next = hasExplicitNext
    ? requestedNext
    : mode === "admin"
      ? "/admin"
      : "/dashboard";
  // Arriving here from Publish means there's unsaved work waiting.
  const fromDraft = next.includes("from=draft");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(next);
      router.refresh();
    }
  };

  return (
    <div className="grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink p-4">
      <div className="float-orb pointer-events-none absolute -left-32 top-0 h-[460px] w-[460px] rounded-full bg-acid/20 blur-[130px]" />
      <div
        className="float-orb pointer-events-none absolute -right-32 bottom-0 h-[460px] w-[460px] rounded-full bg-hotpink/20 blur-[130px]"
        style={{ ["--d" as string]: "3s" }}
      />

      <Link href="/" className="absolute left-6 top-6 flex items-center">
        <BrandLockup width={170} />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticker-lg relative z-10 w-full max-w-md rounded-[2rem] border-2 border-ink bg-white p-8"
        style={{ ["--sticker-color" as string]: "#CCFF00" }}
      >
        <h1 className="text-4xl font-black leading-none tracking-tighter text-ink">
          welcome back.
        </h1>
        <p className="mt-3 text-[15px] font-semibold text-ink/50">
          {fromDraft
            ? "Log in and we'll bring your card straight over."
            : mode === "admin"
              ? "Log in to the ScorlynTap console."
              : "Log in to manage your card."}
        </p>

        {!hasExplicitNext && (
          <div className="mt-5 flex gap-1 rounded-full border-2 border-ink bg-ink/[0.06] p-1">
            {([
              { id: "customer" as const, label: "my card" },
              { id: "admin" as const, label: "admin" },
            ]).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                aria-pressed={mode === tab.id}
                className={`min-h-11 flex-1 rounded-full text-sm font-black lowercase transition-colors ${
                  mode === tab.id
                    ? "bg-ink text-acid"
                    : "text-ink/45 hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {(error || linkError) && (
          <div className="mt-6 rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">
            {error ?? linkError}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-7 space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-black uppercase tracking-wide text-ink">
              email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-13 w-full rounded-xl border-2 border-ink bg-white px-4 py-3 font-semibold text-ink outline-none placeholder:text-ink/30 focus:bg-acid/20"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-black uppercase tracking-wide text-ink"
            >
              password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-13 w-full rounded-xl border-2 border-ink bg-white px-4 py-3 font-semibold text-ink outline-none placeholder:text-ink/30 focus:bg-acid/20"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="sticker sticker-press flex h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-acid text-base font-black uppercase tracking-tight text-ink disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "log in"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm font-semibold text-ink/50">
          No account yet?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="font-black text-ink underline decoration-acid decoration-4 underline-offset-2"
          >
            sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

// useSearchParams() suspends, so the form needs a boundary above it.
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ink">
          <Loader2 className="h-6 w-6 animate-spin text-acid" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
