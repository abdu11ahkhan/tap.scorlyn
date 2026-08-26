"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flag, Loader2, StickyNote, Eye } from "lucide-react";
import { setOrderStatus, setOrderFlag, setOrderNote, getProofUrl } from "../actions";
import { STATUS_LABELS, statusTone } from "@/app/dashboard/orders/status";

export type AdminOrder = {
  id: string;
  reference: string;
  status: string;
  plan_id: string | null;
  quantity: number;
  amount_pkr: number;
  user_id: string | null;
  full_name: string;
  phone: string;
  city: string;
  address: string;
  flagged: boolean;
  internal_note: string | null;
  payment_proof_url: string | null;
  branding: string | null;
  admin_seen_at: string | null;
  created_at: string;
};

const STATUSES = ["pending", "paid", "printing", "shipped", "delivered", "cancelled"];

export default function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const allSelected = orders.length > 0 && selected.size === orders.length;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const bulk = (status: string) => {
    setError(null);
    startTransition(async () => {
      const r = await setOrderStatus([...selected], status);
      if (!r.ok) setError(r.error ?? "Failed.");
      else {
        setSelected(new Set());
        router.refresh();
      }
    });
  };

  const openProof = (path: string) => {
    startTransition(async () => {
      const r = await getProofUrl(path);
      if (!r.ok || !r.data) setError(r.error ?? "Could not open proof.");
      else window.open(r.data.url, "_blank", "noopener");
    });
  };

  return (
    <div className="space-y-4">
      {/* Bulk bar — only when something is picked. */}
      {selected.size > 0 && (
        <div className="sticker flex flex-wrap items-center gap-2 rounded-2xl border-2 border-ink bg-acid p-4 text-ink">
          <span className="text-sm font-black">
            {selected.size} selected — mark as
          </span>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => bulk(s)}
              className="rounded-full border-2 border-ink bg-white px-3.5 py-1.5 text-xs font-black lowercase disabled:opacity-50"
            >
              {s}
            </button>
          ))}
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      )}

      {error && (
        <p className="rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-sc-text">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border-2 border-sc-border-soft">
        <table className="app-table w-full md:min-w-[900px] text-left">
          <thead className="bg-sc-surface-2">
            <tr className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">
              <th className="px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() =>
                    setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)))
                  }
                  aria-label="Select all"
                  className="h-4 w-4 accent-acid"
                />
              </th>
              <th className="px-4 py-3.5">Order</th>
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Plan</th>
              <th className="px-4 py-3.5">Amount</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sc-border-soft">
            {orders.map((o) => (
              <tr
                key={o.id}
                className={`transition-colors hover:bg-sc-surface-2 ${o.flagged ? "bg-hotpink/10" : ""}`}
              >
                <td data-label="" className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selected.has(o.id)}
                    onChange={() => toggle(o.id)}
                    aria-label={`Select ${o.reference}`}
                    className="h-4 w-4 accent-acid"
                  />
                </td>
                <td data-label="Order" className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {/* The reference opens the full order — address included,
                        which the table has no room for. */}
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono text-sm font-black text-sc-text hover:text-acid hover:underline"
                    >
                      {o.reference}
                    </Link>
                    {/* Survives the badge being cleared on open, so an admin can
                        still tell which orders are the ones that just came in. */}
                    {!o.admin_seen_at && (
                      <span className="rounded-full bg-hotpink px-1.5 text-[10px] font-black uppercase text-sc-text">
                        new
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-sc-text-dimmer">
                    {new Date(o.created_at).toLocaleDateString("en-GB")}
                  </p>
                  {o.internal_note && (
                    <p className="mt-1 max-w-[200px] text-[11px] font-semibold text-acid">
                      {o.internal_note}
                    </p>
                  )}
                </td>
                <td data-label="Customer" className="px-4 py-4">
                  {/* Through to the customer's record: the question an order
                      raises is almost always about the person who placed it. */}
                  {o.user_id ? (
                    <Link
                      href={`/admin/users/${o.user_id}`}
                      className="group/cust block"
                    >
                      <p className="text-sm font-black text-sc-text group-hover/cust:underline">
                        {o.full_name}
                      </p>
                      <p className="text-xs font-semibold text-sc-text-dimmer">{o.phone}</p>
                      <p className="text-xs font-semibold text-sc-text-dimmer">{o.city}</p>
                    </Link>
                  ) : (
                    <>
                      <p className="text-sm font-black text-sc-text">{o.full_name}</p>
                      <p className="text-xs font-semibold text-sc-text-dimmer">{o.phone}</p>
                      <p className="text-xs font-semibold text-sc-text-dimmer">{o.city}</p>
                    </>
                  )}
                </td>
                <td data-label="Plan" className="px-4 py-4 text-sm font-bold lowercase text-sc-text">
                  {o.quantity} × {o.plan_id}
                  {/* Printing needs to know this before the card goes out. */}
                  {o.branding === "unbranded" && (
                    <span className="mt-1 block text-[11px] font-black uppercase tracking-wide text-acid">
                      no branding
                    </span>
                  )}
                </td>
                <td data-label="Amount" className="px-4 py-4 text-sm font-black tabular-nums text-sc-text">
                  Rs.{o.amount_pkr.toLocaleString()}
                </td>
                <td data-label="Status" className="px-4 py-4">
                  <select
                    value={o.status}
                    disabled={pending}
                    onChange={(e) => {
                      const status = e.target.value;
                      startTransition(async () => {
                        const r = await setOrderStatus([o.id], status);
                        if (!r.ok) setError(r.error ?? "Failed.");
                        else router.refresh();
                      });
                    }}
                    className={`rounded-full border-2 border-ink px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone(o.status)}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-ink text-sc-text">
                        {STATUS_LABELS[s] ?? s}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="Actions" className="px-4 py-4">
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {o.payment_proof_url && (
                      <button
                        type="button"
                        onClick={() => openProof(o.payment_proof_url!)}
                        title="View payment proof"
                        className="rounded-full border-2 border-sc-border p-2 text-sc-text-dim transition-colors hover:border-acid hover:text-acid"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      title={o.flagged ? "Unflag" : "Flag for review"}
                      onClick={() =>
                        startTransition(async () => {
                          const r = await setOrderFlag(o.id, !o.flagged);
                          if (!r.ok) setError(r.error ?? "Failed.");
                          else router.refresh();
                        })
                      }
                      className={`rounded-full border-2 p-2 transition-colors ${
                        o.flagged
                          ? "border-hotpink bg-hotpink text-sc-text"
                          : "border-sc-border text-sc-text-dim hover:border-hotpink hover:text-hotpink"
                      }`}
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Internal note"
                      onClick={() => {
                        setNoteFor(o.id);
                        setNoteText(o.internal_note ?? "");
                      }}
                      className="rounded-full border-2 border-sc-border p-2 text-sc-text-dim transition-colors hover:border-acid hover:text-acid"
                    >
                      <StickyNote className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note editor */}
      {noteFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="app-panel w-full max-w-md p-6">
            <p className="text-lg font-black text-sc-text">Internal note</p>
            <p className="mt-1 text-xs font-semibold text-sc-text-dimmer">
              Only staff see this. The customer never does.
            </p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              autoFocus
              className="mt-4 w-full rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 p-3 text-sm font-semibold text-sc-text outline-none focus:border-acid"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const r = await setOrderNote(noteFor, noteText);
                    if (!r.ok) setError(r.error ?? "Failed.");
                    else {
                      setNoteFor(null);
                      router.refresh();
                    }
                  })
                }
                className="app-btn app-btn-primary flex-1 disabled:opacity-60"
              >
                {pending ? "saving" : "save note"}
              </button>
              <button
                type="button"
                onClick={() => setNoteFor(null)}
                className="app-btn app-btn-ghost"
              >
                cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
