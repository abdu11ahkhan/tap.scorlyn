import { ChevronDown } from "lucide-react";

/**
 * One collapsible block of the editor.
 *
 * The editor used to show every field at once — style, identity, photos,
 * links and extras in a single column — which read as a wall of inputs and
 * meant scrolling past four sections to reach the fifth on a phone.
 *
 * Native <details> rather than useState: it collapses without JavaScript, the
 * keyboard and screen-reader behaviour is free, and browser find-in-page can
 * still open a closed section.
 */
export default function EditorSection({
  title,
  hint,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint: string;
  /** Short summary of what's inside, e.g. how many links are set up. */
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group min-w-0 rounded-2xl border-2 border-white/12 bg-white/[0.02] open:bg-white/[0.035]"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-black lowercase leading-tight">{title}</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-white/40">{hint}</p>
        </div>

        {badge && (
          <span className="shrink-0 rounded-full border-2 border-white/15 px-2.5 py-0.5 text-[11px] font-black text-white/50">
            {badge}
          </span>
        )}

        <ChevronDown className="h-4 w-4 shrink-0 text-white/40 transition-transform group-open:rotate-180" />
      </summary>

      <div className="min-w-0 border-t-2 border-white/8 px-4 pb-5 pt-5">{children}</div>
    </details>
  );
}
