"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { getProofUrl } from "../../actions";

/**
 * Payment proof lives in a private bucket, so it needs a signed URL rather
 * than a plain link — which means fetching one on demand.
 */
export default function ProofLink({ path }: { path: string | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!path) {
    return <p className="app-sub mt-1">Not uploaded yet.</p>;
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const r = await getProofUrl(path);
            if (r.ok && r.data) window.open(r.data.url, "_blank", "noopener");
            else setError(r.error ?? "Could not open it.");
          });
        }}
        className="app-btn app-btn-ghost"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ExternalLink className="h-3.5 w-3.5" />
        )}
        View proof
      </button>
      {error && <p className="mt-2 text-[13px] font-semibold text-hotpink">{error}</p>}
    </div>
  );
}
