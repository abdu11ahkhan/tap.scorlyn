"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { placeOrder, type Branding } from "@/app/orders/actions";

type Plan = { id: string; name: string; price_pkr: number; blurb: string | null; perks: string[] };

const FIELD =
  "h-12 w-full rounded-xl border-2 border-white/15 bg-white/[0.04] px-4 font-semibold text-white outline-none placeholder:text-white/25 focus:border-acid";

export default function OrderForm({
  plans,
  defaults,
  unbrandedSurcharge,
}: {
  plans: Plan[];
  defaults: { fullName: string; phone: string };
  /** Per card, set by an admin. Server recomputes it — this is display only. */
  unbrandedSurcharge: number;
}) {
  const router = useRouter();
  const [planId, setPlanId] = useState(plans.find((p) => p.price_pkr > 0)?.id ?? plans[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [branding, setBranding] = useState<Branding>("branded");
  const [fullName, setFullName] = useState(defaults.fullName);
  const [phone, setPhone] = useState(defaults.phone);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((p) => p.id === planId);

  // Nothing gets printed on a digital plan, so there's no logo to remove.
  const isPhysical = (plan?.price_pkr ?? 0) > 0;
  const surcharge = isPhysical && branding === "unbranded" ? unbrandedSurcharge : 0;
  const total = ((plan?.price_pkr ?? 0) + surcharge) * quantity;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const r = await placeOrder({
            planId: planId!,
            quantity,
            fullName,
            phone,
            address,
            city,
            branding,
            note,
          });
          if (!r.ok) setError(r.error ?? "Could not place the order.");
          else router.push(`/dashboard/orders/${r.data!.id}`);
        });
      }}
      className="space-y-7"
    >
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
                className={`rounded-2xl border-2 p-5 text-left transition-all ${
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

      {/* Branding — physical cards only. */}
      {isPhysical && (
        <section>
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
            card branding
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  id: "branded" as const,
                  name: "with ScorlynTap mark",
                  price: 0,
                  blurb: "A small ScorlynTap logo on the back of the card.",
                },
                {
                  id: "unbranded" as const,
                  name: "no branding",
                  price: unbrandedSurcharge,
                  blurb: "Your design only. Nothing of ours on the card.",
                },
              ]
            ).map((option) => {
              const active = option.id === branding;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setBranding(option.id)}
                  aria-pressed={active}
                  className={`rounded-2xl border-2 p-5 text-left transition-all ${
                    active
                      ? "sticker-lg border-ink bg-acid text-ink"
                      : "border-white/15 bg-white/[0.03] text-white hover:border-white/40"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-base font-black lowercase">{option.name}</p>
                    <p className="shrink-0 text-lg font-black tracking-tighter">
                      {option.price === 0
                        ? "included"
                        : `+Rs.${option.price.toLocaleString()}`}
                    </p>
                  </div>
                  <p
                    className={`mt-1.5 text-xs font-semibold ${
                      active ? "opacity-70" : "text-white/45"
                    }`}
                  >
                    {option.blurb}
                  </p>
                  {option.price > 0 && (
                    <p
                      className={`mt-1 text-[11px] font-bold ${
                        active ? "opacity-55" : "text-white/30"
                      }`}
                    >
                      per card
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Delivery */}
      <section className="space-y-3">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          where it goes
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            required
            className={FIELD}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03xx xxxxxxx"
            required
            className={FIELD}
          />
        </div>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House / street / area"
          required
          className={FIELD}
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            required
            className={FIELD}
          />
          <input
            type="number"
            min={1}
            max={50}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            aria-label="How many cards"
            className={FIELD}
          />
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything we should know? (optional)"
          className={FIELD}
        />
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
            {surcharge > 0 && ` + Rs.${surcharge.toLocaleString()} no-branding`}
          </p>
        </div>
        <button
          type="submit"
          disabled={pending}
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
