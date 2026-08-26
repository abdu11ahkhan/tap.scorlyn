"use client";

import { useEffect, useState } from "react";
import { Check, Clock, Copy, FileUp, Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ShopMethod = {
  id: string;
  label: string;
  account_name: string | null;
  account_number: string | null;
  iban: string | null;
  note: string | null;
};

/**
 * Paying for an extra card, on the card itself.
 *
 * The fee used to be collected off-system: the card sat unpublished until
 * admin happened to hear that money had arrived. Attaching the receipt here
 * is what tells us there is something to check, and it arrives already tied
 * to the card it paid for rather than as a screenshot in a chat.
 */
export default function CardFeePanel({
  cardId,
  status,
  fee,
  note,
  onSubmitted,
}: {
  cardId: string;
  status: string;
  fee: number | null;
  note: string | null;
  onSubmitted: () => void;
}) {
  const [methods, setMethods] = useState<ShopMethod[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "awaiting_payment") return;
    createClient()
      .from("shop_payment_methods")
      .select("id, label, account_name, account_number, iban, note")
      .eq("enabled", true)
      .order("sort_order")
      .then(({ data }) => setMethods(data ?? []));
  }, [status]);

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("Your session expired — sign in again.");
      return;
    }

    // <user_id>/ is what the bucket policy keys off; anything else is refused.
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-70);
    const path = `${user.id}/card-${cardId}-${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { upsert: false });
    if (upErr) {
      setBusy(false);
      setError(`Could not upload that: ${upErr.message}`);
      return;
    }

    // The receipt and the status move together: a trigger refuses the status
    // change without a receipt attached, so the path has to be in this same
    // write rather than a second one that might not happen.
    const { data, error: saveErr } = await supabase
      .from("card_profiles")
      .update({
        approval_proof_path: path,
        approval_proof_name: file.name,
        approval_status: "awaiting_review",
        approval_submitted_at: new Date().toISOString(),
        // What they say they sent. Nothing here talks to a bank, but it turns
        // approving from "the screenshot looks right" into "this matches a
        // line on the statement".
        approval_amount_pkr: fee ?? 500,
        approval_reference: reference.trim() || null,
      })
      .eq("id", cardId)
      .select("id");

    setBusy(false);
    if (saveErr) {
      setError(saveErr.message);
      return;
    }
    if (!data?.length) {
      setError("That did not save — reload and try again.");
      return;
    }
    onSubmitted();
  };

  if (status === "awaiting_review") {
    return (
      <div className="app-panel app-panel-pad border-sc-warning/40">
        <p className="flex items-center gap-2 text-sm font-black text-sc-warning">
          <Clock className="h-4 w-4" />
          We are checking your payment
        </p>
        <p className="mt-1 text-sm font-semibold text-sc-text-dim">
          Your card stays private until it is approved. You can keep editing it
          in the meantime — nothing you change here is lost.
        </p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="app-panel app-panel-pad border-sc-error/40">
        <p className="text-sm font-black text-sc-error">This card was not approved</p>
        <p className="mt-1 text-sm font-semibold text-sc-text-dim">
          {note || "Get in touch and we will sort it out."}
        </p>
      </div>
    );
  }

  if (status !== "awaiting_payment") return null;

  return (
    <div className="app-panel app-panel-pad border-sc-warning/40">
      <p className="flex items-center gap-2 text-sm font-black text-sc-text">
        <Lock className="h-4 w-4 text-sc-warning" />
        Rs.{fee ?? 500} to publish this card
      </p>
      <p className="mt-1 text-sm font-semibold text-sc-text-dim">
        Your first card is free. This is an extra one — build it now, pay when
        you are ready, and it goes live once we have checked the transfer.
      </p>

      {methods.length > 0 && (
        <div className="mt-4 space-y-2">
          {methods.map((m) => {
            const value = m.iban || m.account_number || "";
            return (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-xl border-2 border-sc-border-soft px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-tight text-sc-text-dim">
                    {m.label}
                  </p>
                  <p className="truncate text-sm font-bold text-sc-text">{value}</p>
                  {m.account_name && (
                    <p className="truncate text-xs font-semibold text-sc-text-dimmer">
                      {m.account_name}
                    </p>
                  )}
                </div>
                {value && (
                  <button
                    type="button"
                    onClick={() => copy(value)}
                    className="shrink-0 rounded-full border-2 border-sc-border p-2 text-sc-text-dim transition-colors hover:border-sc-gold hover:text-sc-gold-text"
                    aria-label={`Copy ${m.label}`}
                  >
                    {copied === value ? (
                      <Check className="h-4 w-4 text-sc-gold-text" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-xl border-2 border-sc-error/40 bg-sc-error/10 px-3 py-2 text-sm font-bold text-sc-error">
          {error}
        </p>
      )}

      <div className="mt-4">
        <label className="text-xs font-bold text-sc-text-dim">
          Transfer reference or last 4 digits
        </label>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. TRX8842991"
          className="mt-1.5 w-full rounded-xl border-2 border-sc-border bg-sc-surface px-3.5 py-2.5 text-sm font-semibold text-sc-text placeholder:text-sc-text-dimmer focus-visible:border-sc-gold focus-visible:outline-none"
        />
        <p className="mt-1 text-xs font-semibold text-sc-text-dimmer">
          Helps us find your payment on the statement, so it is approved faster.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-sc-border px-4 text-xs font-black uppercase tracking-tight text-sc-text transition-colors hover:border-sc-gold hover:text-sc-gold-text">
          <FileUp className="h-4 w-4" />
          {file ? "change receipt" : "attach receipt"}
          <input
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={(e) => {
              const picked = e.target.files?.[0];
              if (!picked) return;
              if (picked.size > 5 * 1024 * 1024) {
                setError("That file is over 5 MB — a screenshot is plenty.");
                return;
              }
              setError(null);
              setFile(picked);
            }}
          />
        </label>

        {file && (
          <span className="max-w-[14rem] truncate text-xs font-bold text-sc-text-dim">
            {file.name}
          </span>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!file || busy}
          className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-sc-gold bg-sc-gold px-5 text-xs font-black uppercase tracking-tight text-sc-gold-ink disabled:opacity-40"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          I have paid
        </button>
      </div>
    </div>
  );
}
