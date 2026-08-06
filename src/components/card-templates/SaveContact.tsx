"use client";

import { buildVCard, vcardFilename, type VCardSource } from "@/lib/vcard";

/**
 * "Save to contacts", for every template.
 *
 * The file is built in the browser from the profile already on screen rather
 * than fetched from `/api/vcard/[username]`, because that route can only see
 * *published* rows — so the button used to 404 on template previews (demo
 * personas) and in the editor (an unsaved draft), which is exactly where
 * people click it while deciding whether to buy.
 *
 * The href is kept as the API route so the link still means something without
 * JavaScript, and so it stays a real link for middle-click and long-press.
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
