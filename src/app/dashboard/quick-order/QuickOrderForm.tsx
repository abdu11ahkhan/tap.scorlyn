"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { placeOrder } from "@/app/orders/actions";
import CardDesigner from "@/components/card-design/CardDesigner";
import { DEFAULT_CARD_FIELDS, type CardFields, type CardFinish } from "@/components/card-design/NfcCardArt";
import { iconFor } from "@/components/card-templates/button-icons";
import { CARD_PURPOSES, cardLinkUrl, type CardProfile, type CardPurpose } from "@/lib/card";

type Plan = { id: string; name: string; price_pkr: number };

const FIELD = "app-input";

/**
 * A Pakistani mobile, as people actually type it. Duplicated from OrderForm's
 * own private copy rather than shared — that one isn't exported, and the two
 * forms are small enough that pulling a shared module out for one function
 * would be more ceremony than the duplication it removes.
 */
function checkPhone(raw: string): { digits: string; error: string | null } {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0092")) d = d.slice(4);
  if (d.startsWith("92")) d = "0" + d.slice(2);

  if (!d) return { digits: "", error: "We need a number to arrange delivery." };
  if (!/^03/.test(d)) return { digits: d, error: "Should start 03." };
  if (d.length !== 11) {
    return { digits: d, error: `That's ${d.length} digits — a mobile number is 11.` };
  }
  return { digits: d, error: null };
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-baseline gap-1.5">
        <span className="text-sm font-black text-sc-text">{label}</span>
        {required && <span className="text-sm font-black text-sc-error">*</span>}
        {hint && !error && (
          <span className="text-[11px] font-semibold text-sc-text-dimmer">{hint}</span>
        )}
      </span>
      {children}
      {error && <span className="app-helper-error mt-1.5 block">{error}</span>}
    </label>
  );
}

/**
 * The fast track: destination + a physical card design + delivery details,
 * one page, no template gallery or digital preview to sit through.
 *
 * The single-purpose card this creates never has its digital page visited by
 * anyone — a tap redirects straight past it — so there is nothing lost by
 * skipping the template/colour/photo customisation /single/new offers. What
 * actually matters is the printed card, which CardDesigner already covers.
 */
export default function QuickOrderForm({ plans, customPlanId }: { plans: Plan[]; customPlanId: string }) {
  const router = useRouter();

  const [purposeId, setPurposeId] = useState<string | null>(null);
  const purpose: CardPurpose | null = CARD_PURPOSES.find((p) => p.id === purposeId) ?? null;
  const [destValue, setDestValue] = useState("");
  const [destMessage, setDestMessage] = useState("");

  const [finish, setFinish] = useState<CardFinish>("minimal");
  const [fields, setFields] = useState<CardFields | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { digits: phoneDigits, error: phoneError } = checkPhone(phone);

  const plan = plans.find((p) => p.id === customPlanId);
  const total = (plan?.price_pkr ?? 0) * quantity;

  const previewCard: CardProfile = useMemo(
    () => ({
      id: "preview",
      username: "your-card",
      full_name: purpose ? `${purpose.label} Card` : "Your card",
      headline: null,
      company: null,
      bio: null,
      avatar_url: null,
      cover_url: null,
      logo_url: null,
      show_qr: true,
      surface_color: null,
      background_effect: "none",
      intro_style: "rise",
      cover_mode: "cover",
      gallery: [],
      location: null,
      whatsapp: null,
      phone: null,
      email: null,
      buttons: purpose
        ? [{ label: purpose.label, kind: purpose.kind, value: destValue, message: destMessage || undefined }]
        : [],
      available_for_work: false,
      availability_note: null,
      business_hours: [],
      video_url: null,
      background_style: "accent",
      payment_enabled: false,
      payment_methods: [],
      view_count: 0,
      accent_color: "#111111",
      template: "minimal",
      font: "sans",
      referral_code: null,
      is_single_purpose: true,
    }),
    [purpose, destValue, destMessage]
  );

  const profileUrl = cardLinkUrl(previewCard, typeof window === "undefined" ? "" : window.location.origin);

  const destinationMissing = !purpose || !destValue.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (destinationMissing) {
      setError(purpose ? `Enter your ${purpose.fieldLabel.toLowerCase()}.` : "Pick what a tap should do.");
      return;
    }
    if (phoneError) {
      setPhoneTouched(true);
      setError(phoneError);
      return;
    }
    for (const [label, v] of [
      ["name", fullName],
      ["address", address],
      ["city", city],
    ] as const) {
      if (!v.trim()) {
        setError(`Please fill in your ${label}.`);
        return;
      }
    }

    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Your session expired — sign in again.");
        return;
      }

      const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const { data: card, error: cardErr } = await supabase
        .from("card_profiles")
        .insert({
          user_id: user.id,
          username: `sp-${suffix}`,
          full_name: `${purpose!.label} Card`,
          template: "minimal",
          accent_color: "#111111",
          published: true,
          is_single_purpose: true,
          buttons: [
            {
              label: purpose!.label,
              kind: purpose!.kind,
              value: destValue.trim(),
              ...(purpose!.kind === "whatsapp" && destMessage.trim() ? { message: destMessage.trim() } : {}),
            },
          ],
          nfc_finish: finish,
          nfc_fields: fields ?? DEFAULT_CARD_FIELDS,
          nfc_chosen_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (cardErr || !card) {
        setError(cardErr?.message ?? "Could not create your card.");
        return;
      }

      const result = await placeOrder({
        planId: customPlanId,
        quantity,
        fullName,
        phone: phoneDigits,
        address,
        city,
        note: "Placed through “order an NFC card”.",
        finish,
        fields,
        accent: "#111111",
        cardProfileId: card.id,
        quick: true,
      });

      if (!result.ok) {
        setError(result.error ?? "Could not place the order.");
        return;
      }
      router.push(`/dashboard/orders/${result.data!.id}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* ---- what does it open ---- */}
      <section className="app-panel p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sc-text-dimmer">
          what should a tap do?
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CARD_PURPOSES.map((p) => {
            const Icon = iconFor(p.kind);
            const active = p.id === purposeId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPurposeId(p.id)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-xs font-black lowercase transition-colors ${
                  active
                    ? "border-sc-gold bg-sc-gold/10 text-sc-gold-text"
                    : "border-sc-border-soft text-sc-text-dim hover:border-sc-border hover:text-sc-text"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{p.label}</span>
              </button>
            );
          })}
        </div>

        {purpose && (
          <div className="mt-5 space-y-4 border-t border-sc-border-soft pt-5">
            <Field label={purpose.fieldLabel} required>
              <input
                value={destValue}
                onChange={(e) => setDestValue(e.target.value)}
                placeholder={purpose.placeholder}
                required
                className={FIELD}
              />
            </Field>

            {purpose.kind === "whatsapp" && (
              <Field label="Pre-filled message" hint="Optional">
                <textarea
                  value={destMessage}
                  onChange={(e) => setDestMessage(e.target.value)}
                  rows={2}
                  placeholder="Hi! I'd like to know more..."
                  className="app-input"
                />
              </Field>
            )}
          </div>
        )}
      </section>

      {/* ---- card design ---- */}
      <section className="app-panel p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sc-text-dimmer">
          your printed card
        </p>
        <p className="mt-1.5 text-sm font-semibold text-sc-text-dim">
          This is what we print and post to you. Pick a finish — the chip
          performs the action above either way.
        </p>
        <div className="mt-4">
          <CardDesigner
            card={previewCard}
            profileUrl={profileUrl}
            width={340}
            onChange={(d) => {
              setFinish(d.finish);
              setFields(d.fields);
            }}
          />
        </div>
      </section>

      {/* ---- delivery ---- */}
      <section className="app-panel space-y-4 p-5">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sc-text-dimmer">
          where it goes
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ayesha Siddiqui"
              required
              autoComplete="name"
              className={FIELD}
            />
          </Field>

          <Field
            label="Mobile number"
            required
            hint="11 digits, starting 03"
            error={phoneTouched ? phoneError : null}
          >
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setPhoneTouched(true)}
              placeholder="e.g. 03001234567"
              required
              inputMode="numeric"
              autoComplete="tel"
              maxLength={17}
              aria-invalid={phoneTouched && Boolean(phoneError)}
              className={FIELD}
            />
          </Field>
        </div>

        <Field label="Address" required hint="House or flat, street, area">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. House 12, Street 4, DHA Phase 5"
            required
            autoComplete="street-address"
            className={FIELD}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
          <Field label="City" required>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Lahore"
              required
              autoComplete="address-level2"
              className={FIELD}
            />
          </Field>

          <Field label="How many" hint="1 to 50">
            <input
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className={FIELD}
            />
          </Field>
        </div>
      </section>

      {/* ---- total ---- */}
      <div className="app-panel flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">total</p>
          <p className="text-3xl font-black tracking-tighter text-sc-text">
            Rs.{total.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-bold text-sc-text-dimmer">
            {quantity} × {plan?.name ?? "Your design"}
          </p>
        </div>
        <button
          type="submit"
          disabled={pending || destinationMissing || Boolean(phoneError)}
          className="app-btn app-btn-primary h-14 px-8"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          place order
        </button>
      </div>

      {error && (
        <p className="rounded-xl border-2 border-sc-error/40 bg-sc-error/10 px-4 py-3 text-sm font-bold text-sc-error">
          {error}
        </p>
      )}

      <p className="text-xs font-semibold text-sc-text-dimmer">
        Nothing is charged here. You&apos;ll get bank details and can upload proof of
        payment on the order page — we confirm it manually.
      </p>
    </form>
  );
}
