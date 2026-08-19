"use client";

/**
 * The corporate half of onboarding — house style, then an optional first
 * employee. Individual accounts never see this: /signup and
 * /onboarding/account-type both already ask individual-vs-corporate and,
 * for corporate, the business name/slug (see AccountTypePicker.tsx) — this
 * only picks up from there, once the account itself exists.
 *
 * Gated on needsCompanySetup() (src/lib/org.ts) — house_template being unset
 * IS the "hasn't done this yet" signal, not a separate flag, so re-running
 * the company-card scan later (from /dashboard/team) never re-triggers this.
 */
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Keyboard, Loader2, SkipForward } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { needsCompanySetup } from "@/lib/org";
import { createEmployee } from "@/app/dashboard/team/actions";
import HouseStyleSection from "@/components/dashboard/HouseStyleSection";
import BrandLockup from "@/components/layout/BrandLockup";
import { downscale, toDataUrl } from "@/components/card-editor/ImagePicker";
import { scanCardWithClaude } from "@/lib/card-scan-ai";
import { scanCardText } from "@/lib/card-ocr";

type Step = "loading" | "house-style" | "first-employee" | "done";

function CompanySetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  const [step, setStep] = useState<Step>("loading");
  const [companyName, setCompanyName] = useState("");
  const [houseTemplate, setHouseTemplate] = useState<string | null>(null);
  const [houseAccentColor, setHouseAccentColor] = useState<string | null>(null);
  const [styleError, setStyleError] = useState<string | null>(null);

  const [mode, setMode] = useState<"type" | "scan">("type");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [headline, setHeadline] = useState("");
  const [phone, setPhone] = useState("");
  const [scanning, setScanning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [employeeError, setEmployeeError] = useState<string | null>(null);

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
        .select("account_type, company_name, house_template, house_accent_color")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!profile || !needsCompanySetup(profile)) {
        router.replace(next);
        return;
      }
      setCompanyName(profile.company_name ?? "");
      setHouseTemplate(profile.house_template);
      setHouseAccentColor(profile.house_accent_color);
      setStep("house-style");
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scanEmployeeCard = async (file: File) => {
    setScanning(true);
    setEmployeeError(null);
    try {
      const blob = await downscale(file, "scan");
      const claudeFields = await scanCardWithClaude([await toDataUrl(blob)]);
      if (claudeFields) {
        if (claudeFields.full_name) setFullName(claudeFields.full_name);
        if (claudeFields.headline) setHeadline(claudeFields.headline);
        if (claudeFields.phones[0]) setPhone(claudeFields.phones[0].value);
        if (claudeFields.emails[0]) setEmail(claudeFields.emails[0].value);
        return;
      }
      const result = await scanCardText([blob]);
      if (result.full_name) setFullName(result.full_name.text);
      if (result.headline) setHeadline(result.headline.text);
      if (result.phone) setPhone(result.phone.text);
      if (result.email) setEmail(result.email.text);
      if (!result.ok) {
        setEmployeeError("Couldn't read that photo automatically — check the fields below.");
      }
    } catch {
      setEmployeeError("Something went wrong reading that photo — fill the fields in manually.");
    } finally {
      setScanning(false);
    }
  };

  const addFirstEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setEmployeeError(null);
    const r = await createEmployee({
      fullName,
      email,
      headline: headline.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    setCreating(false);
    if (!r.ok) {
      setEmployeeError(r.error ?? "Could not create that account.");
      return;
    }
    router.push(next);
    router.refresh();
  };

  const field =
    "h-13 w-full rounded-xl border-2 border-ink bg-white px-4 py-3 font-semibold text-ink outline-none placeholder:text-ink/30 focus:bg-acid/20";

  if (step === "loading") {
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

      <div className="absolute left-6 top-[max(1.5rem,env(safe-area-inset-top))] flex items-center">
        <BrandLockup width={170} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticker-lg relative z-10 w-full max-w-md rounded-[2rem] border-2 border-ink bg-white p-8"
        style={{ ["--sticker-color" as string]: "#8B5CF6" }}
      >
        <p className="text-xs font-black uppercase tracking-widest text-ink/35">
          {step === "house-style" ? "step 1 of 2" : "step 2 of 2"}
        </p>

        {step === "house-style" && (
          <>
            <h1 className="mt-2 text-4xl font-black leading-none tracking-tighter text-ink">
              set your card style.
            </h1>
            <p className="mt-3 text-[15px] font-semibold text-ink/50">
              Every employee at {companyName || "your company"} can start with your
              branding — photograph your card once, everyone else builds from it.
            </p>

            <div className="mt-6">
              <HouseStyleSection
                houseTemplate={houseTemplate}
                houseAccentColor={houseAccentColor}
                onError={setStyleError}
                onSaved={() => setStep("first-employee")}
              />
            </div>
            {styleError && (
              <div className="mt-4 rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">
                {styleError}
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep("first-employee")}
              className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 text-sm font-black uppercase tracking-widest text-ink/40"
            >
              <SkipForward className="h-4 w-4" />
              skip for now
            </button>
          </>
        )}

        {step === "first-employee" && (
          <>
            <h1 className="mt-2 text-4xl font-black leading-none tracking-tighter text-ink">
              add your first teammate.
            </h1>
            <p className="mt-3 text-[15px] font-semibold text-ink/50">
              Optional — you can always add people later from Team.
            </p>

            <div className="mt-6 inline-flex w-full rounded-full border-2 border-ink bg-white p-1">
              {(
                [
                  { id: "type", label: "type details", icon: Keyboard },
                  { id: "scan", label: "scan their card", icon: Camera },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-black uppercase tracking-tight transition-colors ${
                    mode === opt.id ? "bg-ink text-acid" : "text-ink/45"
                  }`}
                >
                  <opt.icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>

            {mode === "scan" && (
              <label className="mt-4 flex h-24 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/20 text-sm font-bold text-ink/50 transition-colors hover:border-acid">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) scanEmployeeCard(file);
                  }}
                />
                {scanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> reading…
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" /> tap to photograph their card
                  </>
                )}
              </label>
            )}

            <form onSubmit={addFirstEmployee} className="mt-4 space-y-3">
              <input
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={field}
              />
              <input
                type="email"
                placeholder="Email (their login)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={field}
              />
              <input
                placeholder="Job title (optional)"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className={field}
              />
              <input
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={field}
              />

              {employeeError && (
                <div className="rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">
                  {employeeError}
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="sticker sticker-press flex h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-acid text-base font-black uppercase tracking-tight text-ink disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : "create their card"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                router.push(next);
                router.refresh();
              }}
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 text-sm font-black uppercase tracking-widest text-ink/40"
            >
              <SkipForward className="h-4 w-4" />
              I&apos;ll do this later
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function CompanySetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-ink">
          <Loader2 className="h-6 w-6 animate-spin text-acid" />
        </div>
      }
    >
      <CompanySetupForm />
    </Suspense>
  );
}
