"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { getProofUrl } from "../../actions";

/**
 * The payment screenshot, shown rather than linked.
 *
 * Verifying a transfer means reading an amount and a reference off an image,
 * and a button that opens a new tab put that two clicks away on every order.
 * The proof lives in a private bucket, so it still needs a signed URL — that
 * is now fetched on mount instead of on click.
 */
export default function ProofLink({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path));

  useEffect(() => {
    if (!path) return;
    let cancelled = false;

    (async () => {
      const r = await getProofUrl(path);
      if (cancelled) return;
      if (r.ok && r.data) setUrl(r.data.url);
      else setError(r.error ?? "Could not load it.");
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) return <p className="app-sub mt-1">Not uploaded yet.</p>;

  if (loading) {
    return (
      <p className="app-sub mt-2 flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading proof…
      </p>
    );
  }

  if (error || !url) {
    return <p className="mt-2 text-[13px] font-semibold text-hotpink">{error}</p>;
  }

  // A PDF receipt cannot go in an <img>, and some banks issue those.
  const isPdf = /\.pdf(\?|$)/i.test(path);

  return (
    <div className="mt-2 space-y-2">
      {!isPdf && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Payment proof"
            className="max-h-80 w-full rounded-lg border border-white/10 bg-black/30 object-contain"
          />
        </a>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="app-btn app-btn-ghost"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {isPdf ? "Open receipt" : "Open full size"}
      </a>
    </div>
  );
}
