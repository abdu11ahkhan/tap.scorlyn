"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { placeEmployeeOrder } from "./actions";

type Plan = { id: string; price_pkr: number };

/**
 * The corporate owner's own version of /dashboard/orders — same fields,
 * same server-side price/phone validation (placeEmployeeOrder mirrors
 * placeOrder's checks), but tied to one employee's card instead of the
 * owner's own, and reached without leaving the team roster.
 */
export default function OrderForEmployeeModal({
  employeeName,
  cardId,
  plans,
  onClose,
}: {
  employeeName: string;
  cardId: string;
  plans: Plan[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState(employeeName);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((p) => p.id === planId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const r = await placeEmployeeOrder({
      cardId,
      planId,
      quantity,
      fullName,
      phone,
      address,
      city,
    });

    setSubmitting(false);
    if (!r.ok) {
      setError(r.error ?? "Could not place that order.");
      return;
    }

    onClose();
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="app-panel w-full max-w-md rounded-b-none p-6 sm:rounded-b-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sc-text-dimmer">
              order physical card
            </p>
            <p className="mt-1 text-sm font-black text-sc-text">for {employeeName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sc-text-dim hover:bg-sc-surface-2 hover:text-sc-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlanId(p.id)}
                className={
                  "rounded-xl border-2 p-3 text-left transition-colors " +
                  (planId === p.id ? "border-sc-gold bg-sc-gold/10" : "border-sc-border")
                }
              >
                <p className="text-xs font-black uppercase tracking-tight text-sc-text-dim">{p.id}</p>
                <p className="mt-0.5 text-sm font-black text-sc-text">Rs.{p.price_pkr.toLocaleString()}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-sc-text-dim">name on card</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="app-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-sc-text-dim">phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03001234567"
                required
                className="app-input"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wide text-sc-text-dim">address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} required className="app-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-sc-text-dim">city</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} required className="app-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-sc-text-dim">quantity</label>
              <input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                className="app-input"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border-2 border-sc-error/40 bg-sc-error/10 px-4 py-3 text-sm font-bold text-sc-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !plan}
            className="app-btn app-btn-primary w-full disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {plan ? `Order — Rs.${(plan.price_pkr * quantity).toLocaleString()}` : "Order"}
          </button>
        </form>
      </div>
    </div>
  );
}
