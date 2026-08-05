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
}: {
  src: string;
  templateId: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b-2 border-white/10 px-4 py-3">
        <Link
          href="/templates"
          className="flex items-center gap-2 rounded-full border-2 border-white/20 px-4 py-2 text-xs font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          templates
        </Link>

        <Link
          href={`/templates/${templateId}/edit`}
          className="sticker sticker-press rounded-full border-2 border-ink bg-acid px-5 py-2.5 text-xs font-black uppercase tracking-tight text-ink"
        >
          customise
        </Link>
      </header>

      <div className="flex flex-1 items-start justify-center overflow-auto p-4 sm:p-6">
        <div
          className="h-[780px] w-[390px] max-w-full overflow-hidden rounded-[2rem] border-2 border-ink bg-black shadow-[7px_7px_0_0_theme(colors.hotpink)]"
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
