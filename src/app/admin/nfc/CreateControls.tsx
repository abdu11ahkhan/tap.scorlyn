"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Layers, Loader2, Plus, Printer, ScanLine } from "lucide-react";
import { createBatch, createCard } from "./actions";

const FIELD =
  "h-12 w-full rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 px-4 font-semibold text-sc-text outline-none placeholder:text-sc-text-dimmer focus:border-acid";
const LABEL = "mb-1.5 block text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer";
const GHOST =
  "inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-sc-border px-5 text-sm font-black lowercase text-sc-text transition-colors hover:border-acid hover:text-acid disabled:opacity-50";

export default function CreateControls({ printHref }: { printHref: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [batchOpen, setBatchOpen] = useState(false);
  const [quantity, setQuantity] = useState(100);
  const [name, setName] = useState("");
  const [productType, setProductType] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const r = await createCard();
              if (!r.ok || !r.data) setError(r.error ?? "Could not create the card.");
              else router.push(`/admin/nfc/${r.data.id}?created=1`);
            });
          }}
          className="sticker sticker-press inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-acid px-5 text-sm font-black uppercase tracking-tight text-ink disabled:opacity-60"
        >
          {pending && !batchOpen ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          create card
        </button>
        <button type="button" onClick={() => setBatchOpen((v) => !v)} className={GHOST} aria-expanded={batchOpen}>
          <Layers className="h-4 w-4" /> create batch
        </button>
        <Link href="/admin/nfc/scan" className={GHOST}>
          <ScanLine className="h-4 w-4" /> scan card
        </Link>
        <Link href={printHref} className={GHOST}>
          <Printer className="h-4 w-4" /> print center
        </Link>
      </div>

      {batchOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              const r = await createBatch({ quantity, name, productType });
              if (!r.ok || !r.data) setError(r.error ?? "Could not create the batch.");
              else {
                setBatchOpen(false);
                setName("");
                setProductType("");
                router.push(`/admin/nfc?batch=${r.data.batchId}`);
              }
            });
          }}
          className="grid gap-3 rounded-2xl border-2 border-sc-border-soft bg-sc-surface-2 p-5 sm:grid-cols-[8rem_1fr_1fr_auto] sm:items-end"
        >
          <div>
            <label className={LABEL} htmlFor="batch-qty">quantity</label>
            <input
              id="batch-qty"
              type="number"
              min={1}
              max={1000}
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="batch-name">batch name</label>
            <input
              id="batch-name"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="September 2026 review cards"
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="batch-type">product / type</label>
            <input
              id="batch-type"
              maxLength={120}
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="Universal review card"
              className={FIELD}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="sticker sticker-press inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-acid px-6 text-sm font-black uppercase tracking-tight text-ink disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
            {pending ? `generating ${quantity}…` : "generate batch"}
          </button>
        </form>
      )}

      {error && <p className="text-sm font-bold text-hotpink">{error}</p>}
    </div>
  );
}
