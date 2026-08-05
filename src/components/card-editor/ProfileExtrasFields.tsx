"use client";

import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessHour, PaymentMethod } from "@/lib/card";

const FIELD =
  "border-2 border-white/15 bg-white/[0.04] font-semibold text-white placeholder:text-white/25 focus-visible:border-acid focus-visible:ring-0";

const PAYMENT_KINDS: { id: PaymentMethod["kind"]; label: string }[] = [
  { id: "bank", label: "Bank" },
  { id: "easypaisa", label: "EasyPaisa" },
  { id: "jazzcash", label: "JazzCash" },
  { id: "other", label: "Other" },
];

export type ExtrasState = {
  available_for_work: boolean;
  availability_note: string;
  business_hours: BusinessHour[];
  video_url: string;
  payment_enabled: boolean;
  payment_methods: PaymentMethod[];
};

export default function ProfileExtrasFields({
  value,
  onChange,
}: {
  value: ExtrasState;
  onChange: (patch: Partial<ExtrasState>) => void;
}) {
  const hours = value.business_hours ?? [];
  const methods = value.payment_methods ?? [];

  return (
    <div className="min-w-0 space-y-9">
      {/* ------------------ availability ------------------ */}
      <section className="space-y-3">
        <Label>Availability</Label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onChange({ available_for_work: !value.available_for_work })}
            aria-pressed={value.available_for_work}
            className={`rounded-full border-2 px-5 py-2.5 text-sm font-black lowercase transition-colors ${
              value.available_for_work
                ? "border-ink bg-acid text-ink"
                : "border-white/20 text-white/55 hover:text-white"
            }`}
          >
            available for work
          </button>
          <Input
            value={value.availability_note}
            onChange={(e) => onChange({ availability_note: e.target.value })}
            placeholder="Taking new work this month"
            className={`${FIELD} flex-1`}
            disabled={!value.available_for_work}
          />
        </div>
      </section>

      {/* ------------------ hours ------------------ */}
      <section className="space-y-3">
        <div>
          <Label>Business hours</Label>
          <p className="mt-1 text-xs text-slate-500">
            Leave empty to hide the section entirely.
          </p>
        </div>

        {hours.map((h, i) => (
          <div key={i} className="flex min-w-0 gap-2">
            <Input
              value={h.day}
              onChange={(e) => {
                const next = [...hours];
                next[i] = { ...next[i], day: e.target.value };
                onChange({ business_hours: next });
              }}
              placeholder="Mon – Fri"
              className={`${FIELD} sm:max-w-[180px]`}
            />
            <Input
              value={h.hours}
              onChange={(e) => {
                const next = [...hours];
                next[i] = { ...next[i], hours: e.target.value };
                onChange({ business_hours: next });
              }}
              placeholder="10am – 7pm"
              className={`${FIELD} flex-1`}
            />
            <button
              type="button"
              onClick={() => onChange({ business_hours: hours.filter((_, x) => x !== i) })}
              className="p-2.5 text-slate-500 transition-colors hover:text-red-400"
              aria-label="Remove hours row"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => onChange({ business_hours: [...hours, { day: "", hours: "" }] })}
          className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-4 py-2.5 text-sm font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
        >
          <Plus className="h-4 w-4" />
          add hours
        </button>
      </section>

      {/* ------------------ video ------------------ */}
      <section className="space-y-2">
        <Label htmlFor="video_url">Video</Label>
        <Input
          id="video_url"
          value={value.video_url}
          onChange={(e) => onChange({ video_url: e.target.value })}
          placeholder="https://youtube.com/watch?v=..."
          className={FIELD}
        />
        <p className="text-xs text-slate-500">
          YouTube, Vimeo or TikTok. Embeds below your links.
        </p>
      </section>

      {/* ------------------ payment ------------------ */}
      <section className="space-y-3">
        <div>
          <Label>Payment details</Label>
          <p className="mt-1 text-xs text-slate-500">
            For getting paid directly. Off by default.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChange({ payment_enabled: !value.payment_enabled })}
          aria-pressed={value.payment_enabled}
          className={`rounded-full border-2 px-5 py-2.5 text-sm font-black lowercase transition-colors ${
            value.payment_enabled
              ? "border-ink bg-acid text-ink"
              : "border-white/20 text-white/55 hover:text-white"
          }`}
        >
          show payment details {value.payment_enabled ? "on" : "off"}
        </button>

        {value.payment_enabled && (
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
                      className="h-10 rounded-lg border-2 border-white/15 bg-ink px-2 text-sm font-bold text-white sm:w-36"
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
                      className="p-2.5 text-slate-500 transition-colors hover:text-red-400"
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
    </div>
  );
}
