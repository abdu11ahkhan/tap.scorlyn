"use client";

import { useEffect, useState } from "react";
import { MessageSquarePlus } from "lucide-react";

const KEY_PREFIX = "scorlyntap_ref_note:";

/**
 * A private note for whoever is *visiting* the card, not the owner —
 * "met at the conference", "follow up about the quote" — that rides
 * along into the vCard when they actually save the contact.
 *
 * Rendered once, at the true bottom of every card page (see
 * src/app/u/[username]/page.tsx), independent of which of the 36
 * templates is active — a template's own "save to contacts" control can
 * sit anywhere on the page, so the two are bridged through sessionStorage
 * rather than React state: SaveContact is a completely separate client
 * component instance, possibly rendered by server-rendered template
 * markup with no shared component tree to pass state through.
 *
 * sessionStorage, not localStorage: this is a note about *this specific
 * visit*, not something that should reappear the next time the same
 * browser opens a different card, or opens this one again next week.
 */
export default function ReferenceNote({ username }: { username: string }) {
  const [note, setNote] = useState("");

  // A genuine exception to "don't setState in an effect": sessionStorage
  // doesn't exist during the server render, so the field has to start
  // empty there, then sync to whatever the visitor already typed earlier
  // in this tab's session once the client mounts — there is no way to
  // know that value before mount, so this isn't derivable from props/state
  // the way the lint rule's usual target is.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(KEY_PREFIX + username);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setNote(stored);
    } catch {
      // Private-browsing / storage-disabled — the field still works for
      // the current keystroke, it just won't survive to the save click.
    }
  }, [username]);

  const update = (value: string) => {
    setNote(value);
    try {
      if (value.trim()) sessionStorage.setItem(KEY_PREFIX + username, value);
      else sessionStorage.removeItem(KEY_PREFIX + username);
    } catch {
      // Same as above — nothing to recover from, the input still works.
    }
  };

  return (
    <div className="relative z-10 mx-auto mb-28 mt-8 w-full max-w-sm px-6">
      <div className="sticker rounded-2xl border-2 border-black/10 bg-white p-4 text-black">
        <label
          htmlFor="reference-note"
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-black/50"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          note for yourself
        </label>
        <p className="mt-1 text-[11px] font-semibold text-black/40">
          Saved with the contact when you tap &quot;save to contacts&quot; above.
        </p>
        <input
          id="reference-note"
          value={note}
          onChange={(e) => update(e.target.value)}
          placeholder="e.g. met at the conference"
          maxLength={300}
          className="mt-2.5 h-11 w-full rounded-xl border-2 border-black/10 bg-black/[0.03] px-3 text-sm font-semibold text-black outline-none placeholder:text-black/30 focus:border-black/30"
        />
      </div>
    </div>
  );
}
