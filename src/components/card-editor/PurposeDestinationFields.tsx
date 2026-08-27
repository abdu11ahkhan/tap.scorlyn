"use client";

import { createElement } from "react";
import { iconFor } from "@/components/card-templates/button-icons";
import type { ButtonKind, CardButton, CardPurpose } from "@/lib/card";

const FIELD =
  "h-12 w-full rounded-xl border border-line bg-mist px-4 text-[15px] font-semibold text-ink outline-none placeholder:text-ink-dim/60 focus:border-teal";

/** createElement, not JSX: the icon component is only known at render time
 *  (looked up from the button kind), and eslint-plugin-react-hooks's
 *  static-components rule can't verify iconFor() returns a stable reference
 *  when it's assigned to a variable and used as a JSX tag directly. */
function purposeIcon(kind: ButtonKind, className?: string) {
  return createElement(iconFor(kind), { className });
}

/**
 * The one thing a single-purpose card needs: where it goes.
 *
 * Stands in for the normal editor's name/bio/links section — a card built
 * from /single/new has no "who you are" to fill in, only the one action it
 * performs on every tap.
 */
export default function PurposeDestinationFields({
  purpose,
  button,
  onChange,
}: {
  purpose: CardPurpose;
  button: CardButton;
  onChange: (patch: Partial<CardButton>) => void;
}) {
  return (
    <div className="mb-8 rounded-2xl border border-line bg-paper p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-acid/15 text-ink">
          {purposeIcon(purpose.kind, "h-4.5 w-4.5")}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black lowercase text-ink">{purpose.label}</p>
          <p className="truncate text-xs font-semibold text-ink-dim">{purpose.blurb}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label className="text-xs font-bold uppercase tracking-wide text-ink-dim">
          {purpose.fieldLabel}
        </label>
        <input
          value={button.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder={purpose.placeholder}
          className={FIELD}
          autoFocus
        />
      </div>

      {purpose.kind === "whatsapp" && (
        <div className="mt-4 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wide text-ink-dim">
            Pre-filled message <span className="normal-case text-ink-dim/70">(optional)</span>
          </label>
          <textarea
            value={button.message ?? ""}
            onChange={(e) => onChange({ message: e.target.value })}
            rows={2}
            placeholder="Hi! I'd like to know more..."
            className="w-full rounded-xl border border-line bg-mist px-4 py-3 text-[15px] font-semibold text-ink outline-none placeholder:text-ink-dim/60 focus:border-teal"
          />
        </div>
      )}
    </div>
  );
}
