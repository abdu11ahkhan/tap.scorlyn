"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Standalone preview page.
 *
 * The card renders in an iframe rather than a resized wrapper: several
 * templates position elements with `fixed` (Poster's full-bleed photo, Reel's
 * sticky bar), which escape any CSS-constrained container. An iframe is a real
 * viewport, so the layout behaves exactly as it would on a phone.
 */
export default function PreviewChrome({
  src,
  templateId,
  purpose,
}: {
  src: string;
  templateId: string;
  /** Carried from the gallery when this preview was opened mid single-purpose
   *  flow, so "customise" continues it instead of starting a normal card. */
  purpose?: string | null;
}) {
  const purposeQuery = purpose ? `?purpose=${encodeURIComponent(purpose)}` : "";

  return (
    <div className="flex min-h-screen flex-col bg-mist">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3">
        <Link
          href={`/templates${purposeQuery}`}
          className="flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-xs font-black lowercase text-ink-dim transition-colors hover:border-teal hover:text-teal"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          templates
        </Link>

        <Link
          href={`/templates/${templateId}/edit${purposeQuery}`}
          className="sticker sticker-press rounded-full bg-acid px-5 py-2.5 text-xs font-black uppercase tracking-tight text-ink"
        >
          customise
        </Link>
      </header>

      <div className="flex flex-1 items-start justify-center overflow-auto p-4 sm:p-6">
        <div
          className="sticker-lg h-[780px] w-[390px] max-w-full overflow-hidden rounded-[2rem] bg-black"
        >
          <iframe
            src={src}
            title="Card preview"
            className="h-full w-full border-0"
            // Same-origin: the preview is our own page, so no sandbox needed
            // and links inside behave normally.
          />
        </div>
      </div>
    </div>
  );
}
