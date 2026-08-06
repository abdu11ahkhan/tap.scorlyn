"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { placeOrder } from "@/app/orders/actions";

type Plan = { id: string; name: string; price_pkr: number; blurb: string | null; perks: string[] };

const FIELD =
  "h-12 w-full rounded-xl border-2 border-white/15 bg-white/[0.04] px-4 font-semibold text-white outline-none placeholder:text-white/25 focus:border-acid";

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
  const [fullName, setFullName] = useState(defaults.fullName);
  const [phone, setPhone] = useState(defaults.phone);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((p) => p.id === planId);
  const total = (plan?.price_pkr ?? 0) * quantity;

  // A physical card is a chip holding a link to your page. Without a page
  // there is no link, and an admin cannot assign the chip to anything — the
  // customer would pay for something we can't send.
  const needsCard = !hasCard && (plan?.price_pkr ?? 0) > 0;

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
          </p>
        </div>
        <button
          type="submit"
          disabled={pending || needsCard}
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
