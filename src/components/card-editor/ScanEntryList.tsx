"use client";

/**
 * One phone/email candidate on a scan review screen: editable, and — when a
 * card had more than one — individually toggleable, since a business card
 * printing both a landline and a cell isn't a mistake to resolve, it's a
 * choice the person scanning should make. Shared between /templates/scan and
 * the admin scan-test page so both offer the same control, not two that
 * quietly drift apart.
 */
export type Entry = { label: string; value: string; use: boolean };

export const EMPTY_ENTRY: Entry[] = [{ label: "", value: "", use: true }];

export function EntryListField({
  label,
  entries,
  onChange,
  type = "text",
}: {
  label: string;
  entries: Entry[];
  onChange: (entries: Entry[]) => void;
  type?: string;
}) {
  const update = (i: number, patch: Partial<Entry>) =>
    onChange(entries.map((entry, j) => (j === i ? { ...entry, ...patch } : entry)));

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wide text-white/50">{label}</label>
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            {entries.length > 1 && (
              <input
                type="checkbox"
                checked={entry.use}
                onChange={(e) => update(i, { use: e.target.checked })}
                className="h-4 w-4 shrink-0 rounded border-2 border-white/30 accent-acid"
              />
            )}
            {entry.label && (
              <span className="shrink-0 rounded-full border border-white/15 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white/40">
                {entry.label}
              </span>
            )}
            <input
              type={type}
              value={entry.value}
              onChange={(e) => update(i, { value: e.target.value })}
              className="h-11 flex-1 rounded-xl border-2 border-white/15 bg-white/[0.03] px-3.5 text-sm font-semibold text-white outline-none focus:border-acid"
            />
          </div>
        ))}
      </div>
      {entries.length > 1 && (
        <p className="text-[11px] font-semibold text-white/35">
          Found {entries.length} — pick which ones to put on the card.
        </p>
      )}
    </div>
  );
}
