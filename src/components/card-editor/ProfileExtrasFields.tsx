"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessHour, PaymentMethod } from "@/lib/card";

const FIELD =
  "border-2 border-white/15 bg-white/[0.04] font-semibold text-white placeholder:text-white/25 focus-visible:border-acid focus-visible:ring-0";

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
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-red-400 sm:h-9 sm:w-9"
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
    </div>
  );
}
