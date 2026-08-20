"use client";

/**
 * The one thing Google sign-in never asks: individual or corporate.
 *
 * /signup asks this inline, before the account exists, and always sends
 * account_type in the auth metadata — even for "individual" — so the
 * handle_new_user() trigger (043_account_type_confirmed.sql) can tell a real
 * choice from Google's silent default apart. Anyone whose account isn't
 * confirmed yet lands here from /auth/callback before ever reaching the
 * dashboard; anyone who already chose skips straight past.
 */
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { needsCompanySetup } from "@/lib/org";
import BrandLockup from "@/components/layout/BrandLockup";
import AccountTypePicker, { type AccountTypeValue } from "@/components/auth/AccountTypePicker";

function AccountTypeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard/card";

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountTypeValue>({
    accountType: "individual",
    companyName: "",
    companySlug: "",
    valid: true,
  });

  // Not a page anyone should land on twice — a returning, already-confirmed
  // user (or someone who typed the URL directly) is sent straight past.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type, account_type_confirmed, house_template")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profile?.account_type_confirmed) {
        router.replace(profile && needsCompanySetup(profile) ? `/onboarding/company-setup?next=${encodeURIComponent(next)}` : next);
        return;
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (account.accountType === "corporate" && !account.valid) {
      setError("Give the business a valid, available name first — see above.");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        account_type: account.accountType,
        company_name: account.accountType === "corporate" ? account.companyName.trim() : null,
        company_slug: account.accountType === "corporate" ? account.companySlug : null,
        account_type_confirmed: true,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    if (account.accountType === "corporate") {
      router.push(`/onboarding/company-setup?next=${encodeURIComponent(next)}`);
    } else {
      router.push(next);
    }
    router.refresh();
  };

  const field =
    "h-13 w-full rounded-xl border-2 border-ink bg-white px-4 py-3 font-semibold text-ink outline-none placeholder:text-ink/30 focus:border-acid focus:bg-acid/20";
  const label = "text-sm font-black uppercase tracking-wide text-ink";

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="h-6 w-6 animate-spin text-acid" />
      </div>
    );
  }

  return (
    <div className="grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink p-4">
      <div className="float-orb pointer-events-none absolute -left-32 bottom-0 h-[460px] w-[460px] rounded-full bg-violet-pop/20 blur-[130px]" />
      <div
        className="float-orb pointer-events-none absolute -right-32 top-0 h-[460px] w-[460px] rounded-full bg-acid/20 blur-[130px]"
        style={{ ["--d" as string]: "3s" }}
      />

      <div className="absolute left-6 top-6 flex items-center">
        <BrandLockup width={170} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticker-lg relative z-10 w-full max-w-md rounded-[2rem] border-2 border-ink bg-white p-8"
        style={{ ["--sticker-color" as string]: "#F58800" }}
      >
        <h1 className="text-4xl font-black leading-none tracking-tighter text-ink">
          one more thing.
        </h1>
        <p className="mt-3 text-[15px] font-semibold text-ink/50">
          Just this — is this your own card, or your company&apos;s?
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <AccountTypePicker onChange={setAccount} fieldClassName={field} labelClassName={label} />

          {error && (
            <div className="rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">
              {error}
            </div>
          )}

          <button
            disabled={saving || (account.accountType === "corporate" && !account.valid)}
            type="submit"
            className="sticker sticker-press flex h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-acid text-base font-black uppercase tracking-tight text-ink disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "continue"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function AccountTypeOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ink">
          <Loader2 className="h-6 w-6 animate-spin text-acid" />
        </div>
      }
    >
      <AccountTypeForm />
    </Suspense>
  );
}
