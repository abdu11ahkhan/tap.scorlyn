"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Repeat } from "lucide-react";
import { reorder } from "@/app/orders/actions";

/** Repeat an order — same plan, same address, one click. */
export default function ReorderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const r = await reorder(orderId);
            if (!r.ok) setError(r.error ?? "Could not reorder.");
            else router.push("/dashboard/orders");
          });
        }}
        className="sticker sticker-press inline-flex items-center gap-2 rounded-full border-2 border-ink bg-acid px-6 py-3 text-sm font-black uppercase tracking-tight text-ink disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4" />}
        order again
      </button>
      {error && <span className="text-xs font-bold text-hotpink">{error}</span>}
    </span>
  );
}
