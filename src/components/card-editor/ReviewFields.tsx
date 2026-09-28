"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REVIEW_DEFAULTS, type ReviewConfig } from "@/lib/card";

const FIELD =
  "border-2 border-sc-border bg-sc-surface-2 font-semibold text-sc-text placeholder:text-sc-text-dimmer focus-visible:border-sc-gold focus-visible:ring-0";

type TextKey = Exclude<keyof ReviewConfig, "categories" | "google_url">;

const TEXTS: { key: TextKey; label: string }[] = [
  { key: "heading", label: "Question" },
  { key: "subheading", label: "Hint under the stars" },
  { key: "thanks_heading", label: "After rating" },
  { key: "google_prompt", label: "Google invitation" },
  { key: "google_cta", label: "Google button" },
  { key: "feedback_heading", label: "Feedback button & heading" },
  { key: "feedback_description", label: "Feedback description" },
  { key: "success_message", label: "Feedback sent message" },
];

/**
 * Settings for the Review Card template. Blank fields show their default as
 * the placeholder, so a business only fills in what it wants to change — the
 * Google link is the one thing that has no sensible default.
 */
export default function ReviewFields({
  value,
  onChange,
}: {
  value: ReviewConfig | null;
  onChange: (config: ReviewConfig) => void;
}) {
  const config = value ?? {};
  const set = (patch: Partial<ReviewConfig>) => onChange({ ...config, ...patch });
  const [categoriesText, setCategoriesText] = useState((config.categories ?? []).join("\n"));
  const url = config.google_url?.trim() ?? "";
  const badUrl = url !== "" && !/^https:\/\/\S+$/i.test(url);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="review-google-url">Google review link</Label>
        <Input
          id="review-google-url"
          type="url"
          inputMode="url"
          value={config.google_url ?? ""}
          onChange={(e) => set({ google_url: e.target.value })}
          placeholder="https://g.page/r/…/review"
          className={FIELD}
        />
        <p className={`text-xs font-semibold ${badUrl ? "text-sc-error" : "text-sc-text-dimmer"}`}>
          {badUrl
            ? "Use the full https:// link."
            : "Google Business Profile → Ask for reviews → copy the link. Every customer who rates is offered it, whatever they rate — that's what keeps you within Google's review rules."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TEXTS.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`review-${key}`}>{label}</Label>
            <Input
              id={`review-${key}`}
              value={config[key] ?? ""}
              maxLength={140}
              onChange={(e) => set({ [key]: e.target.value })}
              placeholder={REVIEW_DEFAULTS[key]}
              className={FIELD}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-categories">Feedback topics</Label>
        <textarea
          id="review-categories"
          rows={4}
          value={categoriesText}
          onChange={(e) => {
            setCategoriesText(e.target.value);
            set({
              categories: e.target.value
                .split("\n")
                .map((c) => c.trim())
                .filter(Boolean)
                .slice(0, 12),
            });
          }}
          placeholder={REVIEW_DEFAULTS.categories.join("\n")}
          className={`w-full rounded-md px-3 py-2 text-sm ${FIELD}`}
        />
        <p className="text-xs font-semibold text-sc-text-dimmer">One per line, up to 12. Leave empty for the defaults.</p>
      </div>

      <p className="text-xs font-semibold text-sc-text-dimmer">
        Business name, logo, description (bio), category (headline) and location come from your details above.
        Tapping stars in the preview only simulates — nothing is recorded.
      </p>
    </div>
  );
}
