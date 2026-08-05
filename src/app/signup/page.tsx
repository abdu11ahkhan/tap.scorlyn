"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Loader2, Mail, Zap } from "lucide-react";
import { REF_COOKIE, REF_COOKIE_MAX_AGE, REF_PARAM } from "@/lib/referral";

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // A visitor who tapped someone's card arrives as /signup?ref=<code>. Park the
  // code in a cookie so attribution survives an email-confirmation round trip.
  useEffect(() => {
    const ref = searchParams.get(REF_PARAM);
    if (ref) {
      document.cookie = `${REF_COOKIE}=${encodeURIComponent(ref)}; path=/; max-age=${REF_COOKIE_MAX_AGE}; SameSite=Lax`;
    }
  }, [searchParams]);

  // Set when arriving from "Use this template" — resume that after signup.
  const nextParam = searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  const readRefCode = (): string | null => {
    const fromUrl = searchParams.get(REF_PARAM);
    if (fromUrl) return fromUrl;
    const match = document.cookie.match(new RegExp(`(?:^|; )${REF_COOKIE}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  };

  const attributeSignup = async (userId: string) => {
    const refCode = readRefCode();
    if (!refCode) return;

    await fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refCode, eventType: "signup", referredUserId: userId }),
    }).catch(() => {
      // Attribution is best-effort — never block the signup on it.
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.session) {
      // Instantly logged in (Confirm Email is OFF in Supabase)
      await attributeSignup(authData.session.user.id);
      router.push(next);
      router.refresh();
    } else if (authData.user) {
      // Supabase returns a user with empty identities if the email already
      // exists, to prevent enumeration. We must catch this.
      if (authData.user.identities && authData.user.identities.length === 0) {
        setError("An account with this email already exists. Try logging in.");
        setLoading(false);
        return;
      }

      await attributeSignup(authData.user.id);
      setIsSuccess(true);
      setLoading(false);
    } else {
      setError("Failed to create account.");
      setLoading(false);
    }
  };

  const field =
    "h-13 w-full rounded-xl border-2 border-ink bg-white px-4 py-3 font-semibold text-ink outline-none placeholder:text-ink/30 focus:bg-acid/20";
  const label = "text-sm font-black uppercase tracking-wide text-ink";

  return (
    <div className="grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink p-4">
      <div className="float-orb pointer-events-none absolute -left-32 bottom-0 h-[460px] w-[460px] rounded-full bg-violet-pop/20 blur-[130px]" />
      <div
        className="float-orb pointer-events-none absolute -right-32 top-0 h-[460px] w-[460px] rounded-full bg-acid/20 blur-[130px]"
        style={{ ["--d" as string]: "3s" }}
      />

      <Link href="/" className="absolute left-6 top-6 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-acid">
          <Zap className="h-4 w-4 fill-ink text-ink" />
        </span>
        <span className="text-xl font-black tracking-tighter text-white">klyro</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticker-lg relative z-10 w-full max-w-md rounded-[2rem] border-2 border-ink bg-white p-8"
        style={{ ["--sticker-color" as string]: "#FF3D9A" }}
      >
        {isSuccess ? (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-acid">
              <Mail className="h-6 w-6 text-ink" />
            </span>
            <h1 className="mt-5 text-3xl font-black leading-none tracking-tighter text-ink">
              check your email.
            </h1>
            <p className="mt-4 text-[15px] font-semibold text-ink/60">
              We sent a verification link to <strong className="text-ink">{email}</strong>.
              Click it, then log in.
            </p>
            <button
              onClick={() => router.push(`/login?next=${encodeURIComponent(next)}`)}
              className="sticker sticker-press mt-7 flex h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-acid text-base font-black uppercase tracking-tight text-ink"
            >
              go to login
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-black leading-none tracking-tighter text-ink">
              make your card.
            </h1>
            <p className="mt-3 text-[15px] font-semibold text-ink/50">
              Free forever. No card details needed.
            </p>

            {error && (
              <div className="mt-6 rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="mt-7 space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className={label}>
                  full name
                </label>
                <input
                  id="name"
                  placeholder="Abdullah Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={field}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className={label}>
                  email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={field}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className={label}>
                  password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Make it a good one"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={field}
                />
              </div>

              <button
                disabled={loading}
                type="submit"
                className="sticker sticker-press flex h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-acid text-base font-black uppercase tracking-tight text-ink disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "sign up"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm font-semibold text-ink/50">
              Already have an account?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                className="font-black text-ink underline decoration-acid decoration-4 underline-offset-2"
              >
                log in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

// useSearchParams() suspends, so the form needs a boundary above it.
export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ink">
          <Loader2 className="h-6 w-6 animate-spin text-acid" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
