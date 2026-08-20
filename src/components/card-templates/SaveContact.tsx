"use client";

import { buildVCard, vcardFilename, type VCardSource } from "@/lib/vcard";
import { trackCardEvent } from "@/lib/track-event";

/**
 * "Save to contacts", for every template.
 *
 * There is no browser API for writing to an address book — the Contact Picker
 * is read-only by design — so handing the operating system a vCard is the only
 * route, and *how* it is handed over decides whether the person ends up with a
 * saved contact or a file they have to go and find.
 *
 * On a published card the link is followed normally, so the response arrives
 * as `text/vcard` and the OS recognises it: iOS opens the contact with "Add to
 * Contacts", Android passes it to Contacts. Building a blob and clicking a
 * download instead drops a .vcf into Files, which is the behaviour people were
 * complaining about.
 *
 * Everywhere else the blob is still correct: `/api/vcard/[username]` can only
 * see published rows, so on a template preview (a demo persona) or in the
 * editor (an unsaved draft) following the link would 404 — and that is exactly
 * where people press it while deciding whether to buy.
 */
export default function SaveContact({
  card,
  className,
  style,
  children,
}: {
  card: VCardSource;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const download = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks behave like a normal link.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

    // Every real save attempt counts, on the published route or not — this
    // never blocks the click either way.
    trackCardEvent(card.username, "contact_save");

    // The visitor's own note (ReferenceNote, rendered once at the bottom of
    // the page, independent of wherever this template puts its own "save"
    // button) — read at click time since the two are separate client
    // component instances with no shared React tree to pass state through.
    let note = "";
    try {
      note = sessionStorage.getItem(`scorlyntap_ref_note:${card.username}`) ?? "";
    } catch {
      // Private-browsing / storage-disabled — save still works, just without a note.
    }

    // A real card is served by the API route, and letting the navigation
    // happen is what gets the contact into the phone rather than into Files.
    // Still needs to happen through here rather than the plain href, though,
    // so the note above can ride along — a plain click-through would only
    // ever hit the no-note URL.
    if (window.location.pathname.startsWith("/u/")) {
      event.preventDefault();
      const target = note.trim()
        ? `/api/vcard/${card.username}?note=${encodeURIComponent(note.trim())}`
        : `/api/vcard/${card.username}`;
      window.location.href = target;
      return;
    }

    event.preventDefault();

    const blob = new Blob([buildVCard(card, window.location.origin, note)], {
      type: "text/vcard;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = vcardFilename(card);
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  return (
    <a
      href={`/api/vcard/${card.username}`}
      onClick={download}
      data-save-contact=""
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}
