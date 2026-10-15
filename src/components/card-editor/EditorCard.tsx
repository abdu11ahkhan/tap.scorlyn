/**
 * A grouped block that's always open — same bordered-card language used
 * throughout the editor, with no collapse. Design and Settings only ever
 * hold a handful of these at once, so there's nothing to hide by default.
 */
export default function EditorCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border-2 border-sc-border-soft bg-sc-surface p-4">
      <p className="text-[15px] font-black lowercase leading-tight text-sc-text">{title}</p>
      {hint && <p className="mt-0.5 text-xs font-semibold text-sc-text-dimmer">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}
