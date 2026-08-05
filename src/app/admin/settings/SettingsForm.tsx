"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { saveAppSettings } from "../actions";

export default function SettingsForm({
  initial,
}: {
  initial: { signupsOpen: boolean; publishingOpen: boolean; announcement: string };
}) {
  const [signupsOpen, setSignupsOpen] = useState(initial.signupsOpen);
  const [publishingOpen, setPublishingOpen] = useState(initial.publishingOpen);
  const [announcement, setAnnouncement] = useState(initial.announcement);

  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggles = [
    {
      label: "signups open",
      help: "Off stops new accounts being created.",
      value: signupsOpen,
      set: setSignupsOpen,
    },
    {
      label: "publishing open",
      help: "Off stops new cards going live. Existing cards keep working.",
      value: publishingOpen,
      set: setPublishingOpen,
    },
  ];

  return (
    <div className="space-y-5">
      {toggles.map((t) => (
        <div
          key={t.label}
          className="flex items-center justify-between gap-4 rounded-2xl border-2 border-white/12 bg-white/[0.03] p-5"
        >
          <div>
            <p className="text-lg font-black lowercase">{t.label}</p>
            <p className="mt-0.5 text-sm font-medium text-white/45">{t.help}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              t.set(!t.value);
              setSaved(false);
            }}
            aria-pressed={t.value}
            className={`shrink-0 rounded-full border-2 px-5 py-2.5 text-xs font-black lowercase transition-colors ${
              t.value
                ? "border-ink bg-acid text-ink"
                : "border-white/20 text-white/50 hover:text-white"
            }`}
          >
            {t.value ? "on" : "off"}
          </button>
        </div>
      ))}

      <div className="rounded-2xl border-2 border-white/12 bg-white/[0.03] p-5">
        <label className="text-lg font-black lowercase">announcement</label>
        <p className="mt-0.5 text-sm font-medium text-white/45">
          Leave empty for none. Stored site-wide, ready to surface in a banner.
        </p>
        <input
          value={announcement}
          onChange={(e) => {
            setAnnouncement(e.target.value);
            setSaved(false);
          }}
          placeholder="e.g. Cards ship in 3 days this week"
          className="mt-3 h-12 w-full rounded-xl border-2 border-white/15 bg-white/[0.04] px-4 font-semibold text-white outline-none placeholder:text-white/25 focus:border-acid"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const r = await saveAppSettings({ signupsOpen, publishingOpen, announcement });
              if (!r.ok) setError(r.error ?? "Failed.");
              else setSaved(true);
            });
          }}
          className="sticker sticker-press flex h-14 items-center gap-2 rounded-full border-2 border-ink bg-acid px-8 font-black uppercase tracking-tight text-ink disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" strokeWidth={3} />
          ) : null}
          {saved ? "saved" : "save settings"}
        </button>
        {error && <span className="text-sm font-bold text-hotpink">{error}</span>}
      </div>
    </div>
  );
}
