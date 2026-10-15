"use client";

import { ChevronRight } from "lucide-react";

/**
 * One row in the Content tab's section list — opens the matching
 * EditorSheet on tap. The icon+title+hint+count shape mirrors the picker
 * rows already used throughout the dashboard (e.g. the "put this on a real
 * card" prompt), kept consistent rather than invented fresh for this list.
 */
export default function EditorRow({
  icon: Icon,
  title,
  hint,
  badge,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  /** Short summary of what's inside, e.g. how many links are set up. */
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[72px] w-full items-center gap-3 rounded-2xl border-2 border-sc-border-soft bg-sc-surface p-3.5 text-left transition-colors hover:border-sc-border"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 text-sc-text-dim">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-black text-sc-text">{title}</span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-sc-text-dimmer">{hint}</span>
      </span>
      {badge && (
        <span className="shrink-0 rounded-lg bg-sc-gold/15 px-2 py-1 text-[11px] font-black text-sc-gold-text">
          {badge}
        </span>
      )}
      <ChevronRight className="h-5 w-5 shrink-0 text-sc-text-dimmer" />
    </button>
  );
}
