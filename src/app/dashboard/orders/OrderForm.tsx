"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { placeOrder } from "@/app/orders/actions";

type Plan = { id: string; name: string; price_pkr: number; blurb: string | null; perks: string[] };

const FIELD =
  "h-12 w-full rounded-xl border-2 border-white/15 bg-white/[0.04] px-4 font-semibold text-white outline-none placeholder:text-white/25 focus:border-acid";

/**
 * A labelled field.
 *
 * The form used to be bare inputs whose placeholder was the only label, so the
 * moment you typed, the question disappeared — and a delivery address you
 * can't re-read is one a card gets posted to wrongly.
 */
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
        <span className="text-sm font-black text-white">{label}</span>
        {required && <span className="text-sm font-black text-hotpink">*</span>}
        {hint && !error && (
          <span className="text-[11px] font-semibold text-white/35">{hint}</span>
        )}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 block text-[12px] font-bold text-hotpink">{error}</span>
      )}
    </label>
  );
}

/**
 * A Pakistani mobile, as people actually type it.
 *
 * Accepts 03001234567, 0300-1234567, +92 300 1234567 and 923001234567; they
 * are the same number. What matters is that it comes to eleven digits starting
 * 03 — a courier ringing a ten-digit number reaches nobody.
 */
function checkPhone(raw: string): { digits: string; error: string | null } {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0092")) d = d.slice(4);
  if (d.startsWith("92")) d = "0" + d.slice(2);

  if (!d) return { digits: "", error: "We need a number to arrange delivery." };
  if (!/^03/.test(d)) return { digits: d, error: "Should start 03." };
  if (d.length !== 11) {
    return {
      digits: d,
      error: `That's ${d.length} digits — a mobile number is 11.`,
    };
  }
  return { digits: d, error: null };
}

export default function OrderForm({
  plans,
  defaults,
  hasCard,
}: {
  plans: Plan[];
  defaults: { fullName: string; phone: string };
  /** Whether this account has a card page yet. A printed card is a link to
   *  one, so without it there is nothing to program the chip with. */
  hasCard: boolean;
}) {
  const router = useRouter();
  const [planId, setPlanId] = useState(plans.find((p) => p.price_pkr > 0)?.id ?? plans[0]?.id);
  const [quantity, setQuantity] = useState(1);
  // Deliberately not pre-filled from the account. The person ordering may not
  // be the person the card is posted to, and a box that already holds a name
  // gets skimmed past rather than read.
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((p) => p.id === planId);
  const total = (plan?.price_pkr ?? 0) * quantity;

  const { digits: phoneDigits, error: phoneError } = checkPhone(phone);

  // A physical card is a chip holding a link to your page. Without a page
  // there is no link, and an admin cannot assign the chip to anything — the
  // customer would pay for something we can't send.
  const needsCard = !hasCard && (plan?.price_pkr ?? 0) > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        if (phoneError) {
          setPhoneTouched(true);
          setError(phoneError);
          return;
        }

        setError(null);
        startTransition(async () => {
          const r = await placeOrder({
            planId: planId!,
            quantity,
            fullName,
            phone: phoneDigits,
            address,
            city,
            note,
          });
          if (!r.ok) setError(r.error ?? "Could not place the order.");
          else router.push(`/dashboard/orders/${r.data!.id}`);
        });
      }}
      className="space-y-7"
    >
      {!hasCard && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-hotpink/40 bg-hotpink/10 p-5">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-black text-white">
              Make your card first
            </p>
            <p className="mt-1 text-sm font-semibold text-white/60">
              A printed card is a chip holding the link to your page. Until
              there&apos;s a page, there&apos;s nothing to write onto it.
            </p>
          </div>
          <Link
            href="/dashboard/card"
            className="sticker sticker-press shrink-0 rounded-full border-2 border-ink bg-acid px-5 py-3 text-sm font-black uppercase tracking-tight text-ink"
          >
            build my card
          </Link>
        </div>
      )}

      {/* Plan */}
      <section>
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          what you&apos;re ordering
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {plans.map((p) => {
            const active = p.id === planId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlanId(p.id)}
                disabled={!hasCard && p.price_pkr > 0}
                className={`rounded-2xl border-2 p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? "sticker-lg border-ink bg-acid text-ink"
                    : "border-white/15 bg-white/[0.03] text-white hover:border-white/40"
                }`}
              >
                <p className="text-lg font-black lowercase">{p.name}</p>
                <p className="mt-1 text-2xl font-black tracking-tighter">
                  {p.price_pkr === 0 ? "Free" : `Rs.${p.price_pkr.toLocaleString()}`}
                </p>
                {p.blurb && (
                  <p className={`mt-2 text-xs font-semibold ${active ? "opacity-70" : "text-white/45"}`}>
                    {p.blurb}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Delivery */}
      <section className="space-y-4">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
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
              className={`${FIELD} ${
                phoneTouched && phoneError ? "border-hotpink" : ""
              }`}
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

        <Field label="Anything we should know?" hint="Optional">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. deliver after 6pm, call before arriving"
            className={FIELD}
          />
        </Field>
      </section>

      {/* Total */}
      <div className="sticker-lg flex items-center justify-between rounded-2xl border-2 border-ink bg-white p-6 text-ink">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest opacity-50">total</p>
          <p className="text-3xl font-black tracking-tighter">
            {total === 0 ? "Free" : `Rs.${total.toLocaleString()}`}
          </p>
          <p className="mt-1 text-xs font-bold opacity-50">
            {quantity} × {plan?.name}
          </p>
        </div>
        <button
          type="submit"
          disabled={pending || needsCard || Boolean(phoneError)}
          className="sticker sticker-press flex h-14 items-center gap-2 rounded-full border-2 border-ink bg-acid px-8 font-black uppercase tracking-tight disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          place order
        </button>
      </div>

      {error && (
        <p className="rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">
          {error}
        </p>
      )}

      <p className="text-xs font-semibold text-white/35">
        Nothing is charged here. You&apos;ll get bank details and can upload proof of
        payment on the next screen — we confirm it manually.
      </p>
    </form>
  );
}
