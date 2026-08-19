"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Check, Loader2, Mail, X } from "lucide-react";
import {
  LEGACY_REF_COOKIE,
  REF_COOKIE,
  REF_COOKIE_MAX_AGE,
  REF_PARAM,
} from "@/lib/referral";
import { COMPANY_SLUG_MAX, COMPANY_SLUG_PATTERN, slugify } from "@/lib/org";
import BrandLockup from "@/components/layout/BrandLockup";
import GoogleButton from "@/components/auth/GoogleButton";

type AccountType = "individual" | "corporate";
type SlugStatus = "idle" | "checking" | "free" | "taken" | "invalid";

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [companyName, setCompanyName] = useState("");
  // Only the async result is state — "idle"/"invalid" are fully determined by
  // accountType/companyName already, and setting them from the effect below
  // was a synchronous setState in an effect body for no reason: derived below
  // instead, the same fix used elsewhere in this codebase for the same rule.
  const [checkedStatus, setCheckedStatus] = useState<SlugStatus>("idle");
  const companySlug = slugify(companyName, COMPANY_SLUG_MAX);

  const staticSlugStatus: SlugStatus | null =
    accountType !== "corporate" || !companyName.trim()
      ? "idle"
      : !COMPANY_SLUG_PATTERN.test(companySlug)
        ? "invalid"
        : null; // null = needs the async availability check below

  const slugStatus = staticSlugStatus ?? checkedStatus;

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Debounced the same way the handle field checks availability while typing
  // (src/components/card-editor/UsernameField.tsx) — checking on every
  // keystroke would fire a query for every half-typed business name.
  useEffect(() => {
    if (staticSlugStatus !== null) return;

    let cancelled = false;
    // Marked as checking from inside the timer rather than synchronously, so
    // the effect does not set state during the render it was scheduled by —
    // same trick UsernameField.tsx uses for its own availability check.
    const timer = setTimeout(async () => {
      setCheckedStatus("checking");
      const { data, error: rpcError } = await supabase.rpc("company_slug_available", {
        candidate: companySlug,
      });
      if (cancelled) return;
      // Same failure mode as the username check: a failed lookup must not
      // claim the name is taken, since signup itself will still catch a
      // genuine clash.
      setCheckedStatus(rpcError ? "idle" : data ? "free" : "taken");
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [staticSlugStatus, companySlug, supabase]);

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
    // Falls back to the pre-rename cookie so referrals already in flight when
    // the name changed still attribute.
    for (const name of [REF_COOKIE, LEGACY_REF_COOKIE]) {
      const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
      if (match) return decodeURIComponent(match[1]);
    }
    return null;
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

  /**
   * The same email carries both a link and a code — Supabase issues them
   * together for the same event, see the confirmation template. The link
   * still works on its own (handled by /auth/confirm); this is for when the
   * email was opened on a different device than the one mid-signup, where a
   * link that finishes sign-in over there is useless and typing the code
   * back here is the only way through.
   */
  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setCodeError(null);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "signup",
    });

    if (verifyError) {
      setVerifying(false);
      setCodeError(
        /expired/i.test(verifyError.message)
          ? "That code has expired — send a new one below."
          : "That code didn't match. Check the email and try again."
      );
      return;
    }

    if (data.session) await attributeSignup(data.session.user.id);
    router.push(next);
    router.refresh();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (accountType === "corporate" && slugStatus !== "free") {
      setError(
        slugStatus === "taken"
          ? "That business name is already in use — try a variation."
          : "Give the business a name first."
      );
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data:
          accountType === "corporate"
            ? {
                full_name: name,
                account_type: accountType,
                company_name: companyName.trim(),
                company_slug: companySlug,
              }
            : { full_name: name, account_type: accountType },
      },
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

      <Link href="/" className="absolute left-6 top-6 flex items-center">
        <BrandLockup width={170} />
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
              We sent a link and a code to <strong className="text-ink">{email}</strong>.
              Open the link on this device and you&apos;ll be signed straight
              in — or if the email landed somewhere else, type the code
              below.
            </p>
            <p className="mt-3 text-[13px] font-semibold text-ink/40">
              It can take a minute. Check spam if it hasn&apos;t arrived.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-left text-sm font-bold text-white">
                {error}
              </div>
            )}

            <form onSubmit={verifyCode} className="mt-6 space-y-2 text-left">
              <label htmlFor="otp" className={label}>
                verification code
              </label>
              <input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\s+/g, ""));
                  setCodeError(null);
                }}
                required
                className={`${field} text-center font-mono text-lg tracking-[0.3em]`}
              />
              {codeError && (
                <p className="text-[13px] font-bold text-hotpink">{codeError}</p>
              )}
              <button
                type="submit"
                disabled={verifying || !code.trim()}
                className="sticker sticker-press flex h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-ink text-base font-black uppercase tracking-tight text-acid disabled:opacity-60"
              >
                {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "verify code"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-0.5 flex-1 bg-ink/10" />
              <span className="text-[11px] font-black uppercase tracking-widest text-ink/35">or</span>
              <span className="h-0.5 flex-1 bg-ink/10" />
            </div>

            {/* A link that never arrives is where signups die, and there was
                no way to ask for another without starting over. Resending
                also issues a fresh code, since they're the same email. */}
            <button
              type="button"
              disabled={resending || resent}
              onClick={async () => {
                setResending(true);
                const { error: resendError } = await supabase.auth.resend({
                  type: "signup",
                  email,
                });
                setResending(false);
                if (resendError) setError(resendError.message);
                else setResent(true);
              }}
              className="sticker sticker-press mt-7 flex h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-acid text-base font-black uppercase tracking-tight text-ink disabled:opacity-60"
            >
              {resending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : resent ? (
                "sent again"
              ) : (
                "resend the email"
              )}
            </button>

            <button
              onClick={() => router.push(`/login?next=${encodeURIComponent(next)}`)}
              className="mt-3 text-[13px] font-black uppercase tracking-widest text-ink/45"
            >
              back to login
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

            {/* Decided before anything else: a corporate account needs a
                business name up front, and Google sign-in doesn't carry this
                choice through, so it has to be settled before either path. */}
            <div className="mt-6 inline-flex w-full rounded-full border-2 border-ink bg-white p-1">
              {(["individual", "corporate"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAccountType(type)}
                  className={`flex-1 rounded-full py-2.5 text-sm font-black uppercase tracking-tight transition-colors ${
                    accountType === type ? "bg-ink text-acid" : "text-ink/45"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {accountType === "corporate" && (
              <div className="mt-4 space-y-2">
                <label htmlFor="company" className={label}>
                  business name
                </label>
                <div className="relative">
                  <input
                    id="company"
                    placeholder="Acme Studio"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required={accountType === "corporate"}
                    className={`${field} pr-11`}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
                    {slugStatus === "checking" && (
                      <Loader2 className="h-4 w-4 animate-spin text-ink/30" />
                    )}
                    {slugStatus === "free" && <Check className="h-4 w-4 text-emerald-600" />}
                    {slugStatus === "taken" && <X className="h-4 w-4 text-rose-600" />}
                  </span>
                </div>
                {/* Company name alone doesn't say what employees' cards will
                    look like — showing the prefix now is cheaper than a
                    surprise the first time someone adds staff. */}
                {companySlug && (
                  <p className="px-1 text-[12px] font-semibold text-ink/40">
                    Employees will get cards like{" "}
                    <span className="font-mono text-ink/70">/u/{companySlug}-jane</span>
                    {slugStatus === "taken" && (
                      <span className="text-rose-600"> — that name is taken</span>
                    )}
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">
                {error}
              </div>
            )}

            <div className="mt-7">
              <GoogleButton next={next} label="Sign up with Google" />
            </div>

            <div className="my-6 flex items-center gap-3">
              <span className="h-0.5 flex-1 bg-ink/10" />
              <span className="text-[11px] font-black uppercase tracking-widest text-ink/35">or</span>
              <span className="h-0.5 flex-1 bg-ink/10" />
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className={label}>
                  full name
                </label>
                <input
                  id="name"
                  placeholder="Your full name"
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
                disabled={
                  loading || (accountType === "corporate" && slugStatus !== "free")
                }
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
                className="inline-flex min-h-[44px] items-center font-black text-ink underline decoration-acid decoration-4 underline-offset-2"
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
