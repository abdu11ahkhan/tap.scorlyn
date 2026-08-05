"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { attachPaymentProof } from "@/app/orders/actions";

/**
 * Payment proof upload.
 *
 * The file goes straight from the browser to Supabase Storage, then a Server
 * Action records the path. Routing the bytes through a Server Action instead
 * would mean base64-ing a 5MB screenshot through a form post.
 *
 * The path starts with the user's id because the storage policy keys off the
 * first folder segment — that's what stops one customer reading another's.
 */
export default function ProofUpload({
  orderId,
  userId,
  reference,
  existing,
}: {
  orderId: string;
  userId: string;
  reference: string;
  existing: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(Boolean(existing));

  const upload = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("That file is over 5MB — try a screenshot instead.");
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${userId}/${reference}-${Date.now()}.${ext}`;

      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, { upsert: true });

      if (upErr) throw new Error(upErr.message);

      startTransition(async () => {
        const r = await attachPaymentProof(orderId, path);
        if (!r.ok) setError(r.error ?? "Could not save.");
        else {
          setDone(true);
          router.refresh();
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const working = busy || pending;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />

      <button
        type="button"
        disabled={working}
        onClick={() => inputRef.current?.click()}
        className={`flex h-13 w-full items-center justify-center gap-2 rounded-full border-2 py-3.5 text-sm font-black uppercase tracking-tight transition-colors disabled:opacity-60 ${
          done
            ? "border-ink bg-acid text-ink"
            : "border-white/25 text-white hover:border-acid hover:text-acid"
        }`}
      >
        {working ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : done ? (
          <Check className="h-4 w-4" strokeWidth={3} />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {done ? "proof uploaded — replace" : "upload payment proof"}
      </button>

      {error && <p className="mt-2 text-sm font-bold text-hotpink">{error}</p>}
      <p className="mt-2 text-xs font-semibold text-white/35">
        Screenshot or PDF, up to 5MB. Only you and our team can see it.
      </p>
    </div>
  );
}
