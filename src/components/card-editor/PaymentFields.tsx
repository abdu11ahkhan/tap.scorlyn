"use client";

import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentMethod } from "@/lib/card";

const FIELD =
  "border-2 border-white/15 bg-white/[0.04] font-semibold text-white placeholder:text-white/25 focus-visible:border-acid focus-visible:ring-0";

const PAYMENT_KINDS: { id: PaymentMethod["kind"]; label: string }[] = [
  { id: "bank", label: "Bank" },
  { id: "easypaisa", label: "EasyPaisa" },
  { id: "jazzcash", label: "JazzCash" },
  { id: "other", label: "Other" },
];

/**
 * Bank details, edited alongside the links rather than buried in "extras".
 *
 * They behave like a link — a thing people tap on your card to act on — so
 * they belong with the other things people tap, not in a drawer of optional
 * profile fields where nobody found them.
 */
export default function PaymentFields({
  enabled,
  methods,
  onChange,
}: {
  enabled: boolean;
  methods: PaymentMethod[];
  onChange: (patch: { payment_enabled?: boolean; payment_methods?: PaymentMethod[] }) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <Label>Payment details</Label>
        <p className="mt-1 text-xs text-slate-500">
          For getting paid directly. Off by default.
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange({ payment_enabled: !enabled })}
        aria-pressed={enabled}
        className={`rounded-full border-2 px-5 py-2.5 text-sm font-black lowercase transition-colors ${
          enabled
            ? "border-ink bg-acid text-ink"
            : "border-white/20 text-white/55 hover:text-white"
        }`}
      >
        show payment details {enabled ? "on" : "off"}
      </button>

      {enabled && (
        <>
          {/* Worth one clear sentence — this is money, on a public URL. */}
          <div className="flex items-start gap-3 rounded-2xl border-2 border-hotpink/40 bg-hotpink/10 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-hotpink" />
            <p className="text-sm font-semibold leading-relaxed text-white/70">
              Your card is a public page — anyone with the link sees these
              details, and anyone can screenshot them. Don&apos;t put anything
              here you wouldn&apos;t print on a poster.
            </p>
          </div>

          {methods.map((m, i) => {
            const set = (patch: Partial<PaymentMethod>) => {
              const next = [...methods];
              next[i] = { ...next[i], ...patch };
              onChange({ payment_methods: next });
            };
            return (
              <div
                key={i}
                className="min-w-0 space-y-2 rounded-2xl border-2 border-white/12 bg-white/[0.03] p-3"
              >
                <div className="flex min-w-0 gap-2">
                  <select
                    value={m.kind}
                    onChange={(e) =>
                      set({ kind: e.target.value as PaymentMethod["kind"] })
                    }
                    className="h-11 rounded-lg border-2 border-white/15 bg-ink px-2 text-base font-bold text-white sm:h-10 sm:w-36 sm:text-sm"
                  >
                    {PAYMENT_KINDS.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={m.label ?? ""}
                    onChange={(e) => set({ label: e.target.value })}
                    placeholder="Meezan Bank"
                    className={`${FIELD} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ payment_methods: methods.filter((_, x) => x !== i) })
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-red-400 sm:h-9 sm:w-9"
                    aria-label="Remove payment method"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <Input
                    value={m.account_name ?? ""}
                    onChange={(e) => set({ account_name: e.target.value })}
                    placeholder="Account name"
                    className={FIELD}
                  />
                  <Input
                    value={m.account_number ?? ""}
                    onChange={(e) => set({ account_number: e.target.value })}
                    placeholder="Account number"
                    className={FIELD}
                  />
                  <Input
                    value={m.iban ?? ""}
                    onChange={(e) => set({ iban: e.target.value })}
                    placeholder="IBAN (optional)"
                    className={FIELD}
                  />
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() =>
              onChange({
                payment_methods: [...methods, { label: "", kind: "bank" }],
              })
            }
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-4 py-2.5 text-sm font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
          >
            <Plus className="h-4 w-4" />
            add payment method
          </button>
        </>
      )}
    </section>
  );
}
