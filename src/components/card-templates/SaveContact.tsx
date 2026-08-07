"use client";

import { buildVCard, vcardFilename, type VCardSource } from "@/lib/vcard";

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

    // A real card is served by the API route, and letting the navigation
    // happen is what gets the contact into the phone rather than into Files.
    if (window.location.pathname.startsWith("/u/")) return;

    event.preventDefault();

    const blob = new Blob([buildVCard(card, window.location.origin)], {
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
