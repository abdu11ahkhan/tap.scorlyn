"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { deleteShopPayment, saveShopPayment } from "../actions";

export type ShopPayment = {
  id: string;
  label: string;
  kind: string;
  account_name: string | null;
  account_number: string | null;
  iban: string | null;
  note: string | null;
  enabled: boolean;
  sort_order: number;
};

const KINDS = [
  { id: "bank", label: "Bank" },
  { id: "easypaisa", label: "EasyPaisa" },
  { id: "jazzcash", label: "JazzCash" },
  { id: "other", label: "Other" },
];

type Draft = {
  id?: string;
  label: string;
  kind: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  note: string;
  enabled: boolean;
  sortOrder: number;
};

const blank = (sortOrder: number): Draft => ({
  label: "",
  kind: "bank",
  accountName: "",
  accountNumber: "",
  iban: "",
  note: "",
  enabled: true,
  sortOrder,
});

const toDraft = (m: ShopPayment): Draft => ({
  id: m.id,
  label: m.label,
  kind: m.kind,
  accountName: m.account_name ?? "",
  accountNumber: m.account_number ?? "",
  iban: m.iban ?? "",
  note: m.note ?? "",
  enabled: m.enabled,
  sortOrder: m.sort_order,
});

/**
 * The accounts customers are told to pay into.
 *
 * Any number of them, because a Pakistani buyer choosing between a bank
 * transfer, EasyPaisa and JazzCash is the normal case, not an edge one.
 */
export default function PaymentMethods({ methods }: { methods: ShopPayment[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const save = (draft: Draft) => {
    setError(null);
    startTransition(async () => {
      const r = await saveShopPayment(draft);
      if (!r.ok) setError(r.error ?? "Could not save.");
      else {
        setEditing(null);
        router.refresh();
      }
    });
  };

  const remove = (id: string) => {
    setError(null);
    startTransition(async () => {
      const r = await deleteShopPayment(id);
      if (!r.ok) setError(r.error ?? "Could not delete.");
      else router.refresh();
    });
  };

  return (
    <section className="app-panel app-panel-pad">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-black lowercase">payment methods</h2>
          <p className="app-sub mt-1">
            Shown to a customer on their order page, with tap-to-copy on every
            line. Add as many as you accept.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(blank(methods.length))}
          className="app-btn app-btn-primary shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add account
        </button>
      </div>

      {error && <p className="mt-3 text-[13px] font-semibold text-hotpink">{error}</p>}

      {methods.length === 0 && !editing && (
        <p className="app-sub mt-5">
          Nothing here yet — until you add one, the order page has no account to
          show and customers can&apos;t pay.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {methods.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">
                {m.label}
                {!m.enabled && (
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white/50">
                    hidden
                  </span>
                )}
              </p>
              <p className="app-sub mt-0.5 font-mono text-[13px]">
                {[m.account_name, m.account_number, m.iban].filter(Boolean).join("  ·  ")}
              </p>
              {m.note && <p className="mt-1 text-[12px] text-white/35">{m.note}</p>}
            </div>

            <button
              type="button"
              onClick={() => setEditing(toDraft(m))}
              className="app-btn app-btn-ghost shrink-0"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(m.id)}
              aria-label={`Delete ${m.label}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:text-hotpink"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="mt-4 rounded-xl border border-acid/30 bg-white/[0.03] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="app-sub">Name shown to customers</span>
              <input
                value={editing.label}
                onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                placeholder="Meezan Bank"
                className="app-input mt-1.5"
              />
            </label>

            <label className="block">
              <span className="app-sub">Type</span>
              <select
                value={editing.kind}
                onChange={(e) => setEditing({ ...editing, kind: e.target.value })}
                className="app-input mt-1.5 bg-ink"
              >
                {KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="app-sub">Account name</span>
              <input
                value={editing.accountName}
                onChange={(e) => setEditing({ ...editing, accountName: e.target.value })}
                placeholder="Abdullah Khan"
                className="app-input mt-1.5"
              />
            </label>

            <label className="block">
              <span className="app-sub">Account number</span>
              <input
                value={editing.accountNumber}
                onChange={(e) => setEditing({ ...editing, accountNumber: e.target.value })}
                placeholder="02340112924467"
                className="app-input mt-1.5 font-mono"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="app-sub">IBAN (optional)</span>
              <input
                value={editing.iban}
                onChange={(e) => setEditing({ ...editing, iban: e.target.value })}
                placeholder="PK34MEZN0002340112924467"
                className="app-input mt-1.5 font-mono"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="app-sub">Note (optional)</span>
              <input
                value={editing.note}
                onChange={(e) => setEditing({ ...editing, note: e.target.value })}
                placeholder="Send the screenshot after paying"
                className="app-input mt-1.5"
              />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={editing.enabled}
              onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
              className="h-4 w-4 accent-lime-400"
            />
            <span className="app-sub">Show this one to customers</span>
          </label>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="app-btn app-btn-ghost"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => save(editing)}
              className="app-btn app-btn-primary"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
