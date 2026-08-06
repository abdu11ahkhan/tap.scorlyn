"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { saveSiteContent } from "../actions";

type Field = {
  key: keyof State;
  label: string;
  help: string;
  fallback: string;
  long?: boolean;
};

type State = {
  heroTitle: string;
  heroSubtitle: string;
  pricingNote: string;
  supportWhatsapp: string;
  supportEmail: string;
};

/**
 * Landing copy, editable without a deploy.
 *
 * Every field shows the compiled-in text as its placeholder, and an empty
 * field falls back to it. That way clearing a box can't leave the homepage
 * with a blank headline — the worst outcome for a page whose whole job is the
 * first sentence.
 */
const FIELDS: Field[] = [
  {
    key: "heroTitle",
    label: "Headline",
    help: "The first line on the homepage.",
    fallback: "paper cards are dead. yours isn't.",
    long: true,
  },
  {
    key: "heroSubtitle",
    label: "Subheading",
    help: "The sentence under it.",
    fallback:
      "Tap your card on any phone and your whole profile opens instantly. No app. No QR. Build it in about two minutes.",
    long: true,
  },
  {
    key: "pricingNote",
    label: "Pricing note",
    help: "Small print under the price cards.",
    fallback: "Prices in PKR. Bulk orders for teams — just ask.",
  },
  {
    key: "supportWhatsapp",
    label: "Support WhatsApp",
    help: "Where customers reach you. Local 03xx is fine.",
    fallback: "not set",
  },
  {
    key: "supportEmail",
    label: "Support email",
    help: "Shown on order pages and the FAQ.",
    fallback: "not set",
  },
];

export default function ContentForm({ initial }: { initial: State }) {
  const [state, setState] = useState<State>(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {FIELDS.map((f) => (
        <div key={f.key} className="app-panel app-panel-pad">
          <label htmlFor={f.key} className="text-[15px] font-semibold">
            {f.label}
          </label>
          <p className="app-sub mt-0.5">{f.help}</p>

          {f.long ? (
            <textarea
              id={f.key}
              rows={2}
              value={state[f.key]}
              onChange={(e) => {
                setState({ ...state, [f.key]: e.target.value });
                setSaved(false);
              }}
              placeholder={f.fallback}
              className="app-input mt-3 h-auto py-2.5"
            />
          ) : (
            <input
              id={f.key}
              value={state[f.key]}
              onChange={(e) => {
                setState({ ...state, [f.key]: e.target.value });
                setSaved(false);
              }}
              placeholder={f.fallback}
              className="app-input mt-3"
            />
          )}

          <p className="mt-2 text-[12px] text-white/30">
            Leave empty to use the default.
          </p>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const r = await saveSiteContent(state);
              if (!r.ok) setError(r.error ?? "Could not save.");
              else setSaved(true);
            });
          }}
          className="app-btn app-btn-primary"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : null}
          {saved ? "Saved" : "Save content"}
        </button>
        {error && <span className="text-[13px] font-semibold text-hotpink">{error}</span>}
      </div>
    </div>
  );
}
