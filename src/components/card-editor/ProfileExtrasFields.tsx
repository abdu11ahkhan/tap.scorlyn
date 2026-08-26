"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessHour, PaymentMethod } from "@/lib/card";

const FIELD =
  "border-2 border-sc-border bg-sc-surface-2 font-semibold text-sc-text placeholder:text-sc-text-dimmer focus-visible:border-sc-gold focus-visible:ring-0";

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
                ? "border-sc-gold bg-sc-gold text-sc-gold-ink"
                : "border-sc-border text-sc-text-dim hover:text-sc-text"
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
          <p className="mt-1 text-xs text-sc-text-dimmer">
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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sc-text-dimmer transition-colors hover:text-sc-error sm:h-9 sm:w-9"
              aria-label="Remove hours row"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => onChange({ business_hours: [...hours, { day: "", hours: "" }] })}
          className="inline-flex items-center gap-2 rounded-full border-2 border-sc-border px-4 py-2.5 text-sm font-black lowercase text-sc-text-dim transition-colors hover:border-sc-gold hover:text-sc-gold-text"
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
        <p className="text-xs text-sc-text-dimmer">
          YouTube, Vimeo or TikTok. Embeds below your links.
        </p>
      </section>
    </div>
  );
}
