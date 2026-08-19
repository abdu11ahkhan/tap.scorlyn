"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { COMPANY_SLUG_MAX, COMPANY_SLUG_PATTERN, slugify } from "@/lib/org";

export type AccountType = "individual" | "corporate";
type SlugStatus = "idle" | "checking" | "free" | "taken" | "invalid";

export type AccountTypeValue = {
  accountType: AccountType;
  companyName: string;
  companySlug: string;
  /** True once this is safe to submit: individual always, corporate only
   *  once the slug has cleared the availability check. */
  valid: boolean;
};

/**
 * Individual vs. corporate, plus the business name when corporate — shared
 * between /signup (asked inline, before the account exists) and
 * /onboarding/account-type (asked just after, for anyone who arrived via
 * Google and was never asked at all). One component so the two can't drift
 * into asking the question differently.
 */
export default function AccountTypePicker({
  onChange,
  fieldClassName,
  labelClassName,
}: {
  onChange: (value: AccountTypeValue) => void;
  fieldClassName: string;
  labelClassName: string;
}) {
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [companyName, setCompanyName] = useState("");
  const [checkedStatus, setCheckedStatus] = useState<SlugStatus>("idle");
  const companySlug = slugify(companyName, COMPANY_SLUG_MAX);
  const supabase = createClient();

  const staticSlugStatus: SlugStatus | null =
    accountType !== "corporate" || !companyName.trim()
      ? "idle"
      : !COMPANY_SLUG_PATTERN.test(companySlug)
        ? "invalid"
        : null; // null = needs the async availability check below

  const slugStatus = staticSlugStatus ?? checkedStatus;

  // Debounced the same way the handle field checks availability while typing.
  useEffect(() => {
    if (staticSlugStatus !== null) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCheckedStatus("checking");
      const { data, error } = await supabase.rpc("company_slug_available", {
        candidate: companySlug,
      });
      if (cancelled) return;
      // A failed lookup must not claim the name is taken — the caller's own
      // submit will still catch a genuine clash.
      setCheckedStatus(error ? "idle" : data ? "free" : "taken");
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticSlugStatus, companySlug]);

  useEffect(() => {
    onChange({
      accountType,
      companyName,
      companySlug,
      valid: accountType === "individual" || slugStatus === "free",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountType, companyName, companySlug, slugStatus]);

  return (
    <div>
      <div className="inline-flex w-full rounded-full border-2 border-ink bg-white p-1">
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
          <label htmlFor="company" className={labelClassName}>
            business name
          </label>
          <div className="relative">
            <input
              id="company"
              placeholder="Acme Studio"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className={`${fieldClassName} pr-11`}
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
              {slugStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-ink/30" />}
              {slugStatus === "free" && <Check className="h-4 w-4 text-emerald-600" />}
              {slugStatus === "taken" && <X className="h-4 w-4 text-rose-600" />}
            </span>
          </div>
          {companySlug && (
            <p className="px-1 text-[12px] font-semibold text-ink/40">
              Employees will get cards like{" "}
              <span className="font-mono text-ink/70">/u/{companySlug}-jane</span>
              {slugStatus === "taken" && <span className="text-rose-600"> — that name is taken</span>}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
