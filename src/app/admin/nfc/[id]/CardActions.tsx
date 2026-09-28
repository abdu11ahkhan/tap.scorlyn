"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cloneCard, createCard, deleteCard, setCardStatus } from "../actions";

const BTN =
  "inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-sc-border px-4 text-xs font-black lowercase text-sc-text transition-colors hover:border-acid hover:text-acid disabled:opacity-50";
const DANGER =
  "inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-sc-border px-4 text-xs font-black lowercase text-sc-text transition-colors hover:border-hotpink hover:text-hotpink disabled:opacity-50";

export default function CardActions({
  cardId,
  serial,
  status,
  assigned,
}: {
  cardId: string;
  serial: string;
  status: string;
  assigned: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const go = (key: string, confirmText: string | null, fn: () => Promise<{ ok: boolean; error?: string; data?: { id: string } }>, after?: (id?: string) => void) =>
    () => {
      if (confirmText && !window.confirm(confirmText)) return;
      setError(null);
      setBusy(key);
      startTransition(async () => {
        const r = await fn();
        setBusy(null);
        if (!r.ok) setError(r.error ?? "Something went wrong.");
        else if (after) after(r.data?.id);
      });
    };

  const spin = (key: string) => (pending && busy === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {status === "active" && (
          <button
            type="button"
            className={DANGER}
            disabled={pending}
            onClick={go("suspend", `Suspend ${serial}? Taps will show "card not active" until you reactivate it.`, () =>
              setCardStatus(cardId, "suspend")
            )}
          >
            {spin("suspend")} suspend
          </button>
        )}
        {(status === "suspended" || status === "retired") && (
          <button
            type="button"
            className={BTN}
            disabled={pending}
            onClick={go("reactivate", null, () => setCardStatus(cardId, "reactivate"))}
          >
            {spin("reactivate")} reactivate
          </button>
        )}
        {assigned && (
          <button
            type="button"
            className={BTN}
            disabled={pending}
            onClick={go("clone", null, () => cloneCard(cardId), (id) => id && router.push(`/admin/nfc/${id}?created=1`))}
          >
            {spin("clone")} clone card
          </button>
        )}
        <button
          type="button"
          className={BTN}
          disabled={pending}
          onClick={go("another", null, () => createCard(), (id) => id && router.push(`/admin/nfc/${id}?created=1`))}
        >
          {spin("another")} generate another
        </button>
        {status !== "retired" && (
          <button
            type="button"
            className={DANGER}
            disabled={pending}
            onClick={go(
              "retire",
              `Retire ${serial}? It is unassigned and stops working, but stays in history. You can reactivate it later.`,
              () => setCardStatus(cardId, "retire")
            )}
          >
            {spin("retire")} retire
          </button>
        )}
        <button
          type="button"
          className={DANGER}
          disabled={pending}
          onClick={go(
            "delete",
            `Delete ${serial} permanently? Any printed QR or programmed chip for it stops working for good. Retire is usually the better choice.`,
            () => deleteCard(cardId),
            () => router.push("/admin/nfc")
          )}
        >
          {spin("delete")} delete
        </button>
      </div>
      {error && <p className="text-xs font-bold text-hotpink">{error}</p>}
    </div>
  );
}
