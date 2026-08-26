"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Share2 } from "lucide-react";
import { shareInvoice } from "../../actions";

/**
 * A link to send the customer.
 *
 * The invoice itself is admin-only, so sharing mints a token rather than
 * loosening that. The customer opens the link and saves their own PDF, which
 * is simpler than emailing a file and keeps one copy of the truth.
 */
export default function ShareInvoice({
  invoiceId,
  existingToken,
}: {
  invoiceId: string;
  existingToken: string | null;
}) {
  const [token, setToken] = useState<string | null>(existingToken);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = token
    ? `${typeof window === "undefined" ? "https://tap.scorlyn.com" : window.location.origin}/i/${token}`
    : null;

  const share = async () => {
    setError(null);
    let link = url;

    if (!link) {
      setBusy(true);
      const result = await shareInvoice(invoiceId);
      setBusy(false);
      if (!result.ok || !result.data) {
        setError(result.error ?? "Could not create a link.");
        return;
      }
      setToken(result.data.token);
      link = `${window.location.origin}/i/${result.data.token}`;
    }

    // The share sheet on a phone, the clipboard everywhere else.
    if (navigator.share) {
      try {
        await navigator.share({ title: "Invoice", url: link });
        return;
      } catch {
        // Cancelled, or unavailable — fall through to copying.
      }
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={share}
        disabled={busy}
        className="app-pill inline-flex items-center gap-1.5 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : copied ? (
          <Check className="h-3.5 w-3.5 text-acid" />
        ) : token ? (
          <Copy className="h-3.5 w-3.5" />
        ) : (
          <Share2 className="h-3.5 w-3.5" />
        )}
        {copied ? "link copied" : token ? "copy link" : "share"}
      </button>
      {error && <span className="text-xs font-bold text-sc-error">{error}</span>}
    </div>
  );
}
