"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  Copy,
  ExternalLink,
  Keyboard,
  Loader2,
  Pencil,
  Plus,
  UserX,
  UserCheck,
  Trash2,
} from "lucide-react";
import { createEmployee, deleteEmployeeCard, suspendEmployee } from "./actions";
import { downscale, toDataUrl } from "@/components/card-editor/ImagePicker";
import { scanCardText } from "@/lib/card-ocr";
import { scanCardWithClaude } from "@/lib/card-scan-ai";
import HouseStyleSection from "@/components/dashboard/HouseStyleSection";
import { physicalCardShortLabel, type PhysicalCardStatus } from "@/lib/nfc-lifecycle";

export type EmployeeCard = {
  id: string;
  username: string;
  full_name: string;
  email: string | null;
  published: boolean;
  owner_suspended: boolean;
  created_at: string;
};

/** Shown once, right after creating a login — this is the only time the
 *  password is ever visible anywhere. */
type FreshCredentials = { email: string; password: string; username: string };

export default function TeamManager({
  companySlug,
  companyName,
  houseTemplate,
  houseAccentColor,
  employees,
  physicalByProfile = {},
}: {
  companySlug: string;
  companyName: string;
  houseTemplate: string | null;
  houseAccentColor: string | null;
  employees: EmployeeCard[];
  /** Keyed by card_profiles.id — empty for an employee with no physical order. */
  physicalByProfile?: Record<string, PhysicalCardStatus>;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [mode, setMode] = useState<"type" | "scan">("type");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [headline, setHeadline] = useState("");
  const [phone, setPhone] = useState("");
  const [scanning, setScanning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<FreshCredentials | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const resetAddForm = () => {
    setFullName("");
    setEmail("");
    setHeadline("");
    setPhone("");
    setMode("type");
  };

  // The employee's card photo — only read for their own contact details
  // (name/headline/phone/email). Colour and template stay uniform across the
  // company, set once below via the company's own card, not re-derived per
  // employee.
  const scanEmployeeCard = async (file: File) => {
    setScanning(true);
    setError(null);
    try {
      const blob = await downscale(file, "scan");

      const claudeFields = await scanCardWithClaude([await toDataUrl(blob)]);
      if (claudeFields) {
        if (claudeFields.full_name) setFullName(claudeFields.full_name);
        if (claudeFields.headline) setHeadline(claudeFields.headline);
        // An employee card only needs one of each — no multi-select UI here,
        // unlike the individual scan flow. First one found wins.
        if (claudeFields.phones[0]) setPhone(claudeFields.phones[0].value);
        if (claudeFields.emails[0]) setEmail(claudeFields.emails[0].value);
        return;
      }

      const result = await scanCardText([blob]);
      if (result.full_name) setFullName(result.full_name.text);
      if (result.headline) setHeadline(result.headline.text);
      if (result.phone) setPhone(result.phone.text);
      if (result.email) setEmail(result.email.text);
      if (!result.ok) {
        setError("Couldn't read that photo automatically — check the fields below and fill in anything missing.");
      }
    } catch {
      setError("Something went wrong reading that photo — fill the fields in manually below.");
    } finally {
      setScanning(false);
    }
  };

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    const r = await createEmployee({
      fullName,
      email,
      headline: headline.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    setCreating(false);
    if (!r.ok || !r.data) {
      setError(r.error ?? "Could not create that account.");
      return;
    }

    setFresh(r.data);
    resetAddForm();
    setShowAdd(false);
    router.refresh();
  };

  const toggleSuspend = async (card: EmployeeCard) => {
    setBusyId(card.id);
    const r = await suspendEmployee(card.id, !card.owner_suspended);
    setBusyId(null);
    if (!r.ok) {
      setError(r.error ?? "That didn't go through.");
      return;
    }
    router.refresh();
  };

  const remove = async (card: EmployeeCard) => {
    if (
      !confirm(
        `Remove ${card.full_name || card.username}? This deletes their card and their login — they won't be able to sign in again. Can't be undone.`
      )
    )
      return;
    setBusyId(card.id);
    const r = await deleteEmployeeCard(card.id);
    setBusyId(null);
    if (!r.ok) {
      setError(r.error ?? "That card could not be deleted.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-sc-text">Team</h1>
          <p className="mt-1 text-sm font-medium text-sc-text-dim">
            {companyName || "Your company"}&apos;s cards live at{" "}
            <span className="font-mono text-sc-text-dim">/u/{companySlug}-…</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-sc-border px-4 text-xs font-black uppercase tracking-tight text-sc-text transition-colors hover:border-sc-gold hover:text-sc-gold"
        >
          <Plus className="h-4 w-4" />
          add employee
        </button>
      </div>

      <HouseStyleSection
        houseTemplate={houseTemplate}
        houseAccentColor={houseAccentColor}
        onError={setError}
      />

      {/* The one moment this password is visible. Closing it does not delete
          the account — only the on-screen copy of the credentials goes away. */}
      {fresh && (
        <div className="app-panel app-panel-pad border-sc-gold/40">
          <p className="text-sm font-black text-sc-gold">Account created — copy this now.</p>
          <p className="mt-1 text-xs font-semibold text-sc-text-dim">
            It won&apos;t be shown again. Send it to them directly.
          </p>
          <div className="mt-3 space-y-2 font-mono text-sm text-sc-text">
            <CredentialLine label="email" value={fresh.email} />
            <CredentialLine label="password" value={fresh.password} />
            <CredentialLine label="card" value={"/u/" + fresh.username} />
          </div>
          <button
            type="button"
            onClick={() => setFresh(null)}
            className="mt-4 text-xs font-black uppercase tracking-widest text-sc-text-dimmer"
          >
            done
          </button>
        </div>
      )}

      {showAdd && (
        <form onSubmit={addEmployee} className="app-panel app-panel-pad space-y-3">
          {/* Type it, or read it off their card — either way lands in the
              same fields below, editable either way. */}
          <div className="inline-flex rounded-full border-2 border-sc-border bg-sc-surface-2 p-1">
            {(
              [
                { id: "type", label: "type their details", icon: Keyboard },
                { id: "scan", label: "scan their card", icon: Camera },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id)}
                className={
                  "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black uppercase tracking-tight transition-colors " +
                  (mode === opt.id ? "bg-sc-gold text-sc-gold-ink" : "text-sc-text-dim")
                }
              >
                <opt.icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            ))}
          </div>

          {mode === "scan" && (
            <label className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-sc-border bg-sc-surface-2 text-sm font-bold text-sc-text-dim transition-colors hover:border-sc-gold/50">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) scanEmployeeCard(file);
                }}
              />
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> reading…
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" /> tap to photograph their card
                </>
              )}
            </label>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="emp-name" className="text-xs font-bold uppercase tracking-wide text-sc-text-dim">
                full name
              </label>
              <input
                id="emp-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="app-input"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="emp-email" className="text-xs font-bold uppercase tracking-wide text-sc-text-dim">
                email
              </label>
              <input
                id="emp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                required
                className="app-input"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="emp-headline" className="text-xs font-bold uppercase tracking-wide text-sc-text-dim">
                headline / title <span className="normal-case text-sc-text-dimmer">(optional)</span>
              </label>
              <input
                id="emp-headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Sales Manager"
                className="app-input"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="emp-phone" className="text-xs font-bold uppercase tracking-wide text-sc-text-dim">
                phone <span className="normal-case text-sc-text-dimmer">(optional)</span>
              </label>
              <input
                id="emp-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="app-input"
              />
            </div>
          </div>
          {fullName.trim() && (
            <p className="text-xs font-semibold text-sc-text-dimmer">
              Card address:{" "}
              <span className="font-mono text-sc-text/60">
                /u/{companySlug}-{fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "…"}
              </span>
            </p>
          )}
          <button
            type="submit"
            disabled={creating}
            className="app-btn app-btn-primary disabled:opacity-60"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            create login
          </button>
        </form>
      )}

      {error && (
        <p className="rounded-xl border-2 border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-200">
          {error}
        </p>
      )}

      {employees.length === 0 && !showAdd ? (
        <div className="app-panel app-panel-pad text-center">
          <p className="text-[17px] font-black text-sc-text">Your team is ready to grow.</p>
          <p className="app-sub mx-auto mt-1 max-w-sm">
            Add your first employee to create their digital business card.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("type");
                setShowAdd(true);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-sc-gold px-4 text-xs font-black uppercase tracking-tight text-sc-gold-ink"
            >
              <Plus className="h-4 w-4" />
              add employee
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("scan");
                setShowAdd(true);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-sc-border px-4 text-xs font-black uppercase tracking-tight text-sc-text transition-colors hover:border-sc-gold hover:text-sc-gold"
            >
              <Camera className="h-4 w-4" />
              scan business card
            </button>
          </div>
        </div>
      ) : employees.length > 0 ? (
        <div className="space-y-2.5">
          {employees.map((card) => {
            const physical = physicalByProfile[card.id];
            return (
            <div key={card.id} className="app-panel flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-sc-text">
                  {card.full_name || "Untitled"}
                </p>
                <p className="truncate text-xs font-semibold text-sc-text-dimmer">
                  /u/{card.username}
                  {card.email ? " · " + card.email : ""}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <span
                  className={
                    "rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-tight " +
                    (card.owner_suspended
                      ? "bg-rose-400/15 text-rose-300"
                      : card.published
                        ? "bg-sc-gold/15 text-sc-gold"
                        : "bg-sc-surface-2 text-sc-text-dim")
                  }
                >
                  {card.owner_suspended ? "suspended" : card.published ? "live" : "draft"}
                </span>

                {/* Physical card — a separate fact from the digital card
                    above, never merged into one status. No order at all
                    reads as a next action, not a state. */}
                {physical ? (
                  <Link
                    href={"/dashboard/orders/" + physical.orderId}
                    className="rounded-full bg-sc-surface-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-tight text-sc-text-dim transition-colors hover:text-sc-gold"
                  >
                    {physicalCardShortLabel(physical)}
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/nfc"
                    className="rounded-full border-2 border-dashed border-sc-border px-3 py-1.5 text-[11px] font-black uppercase tracking-tight text-sc-text-dimmer transition-colors hover:border-sc-gold hover:text-sc-gold"
                  >
                    No NFC order
                  </Link>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Link
                  href={"/dashboard/team/" + card.id + "/edit"}
                  title="Edit card"
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-sc-text-dim transition-colors hover:bg-sc-surface-2 hover:text-sc-text"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <a
                  href={"/u/" + card.username}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View card"
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-sc-text-dim transition-colors hover:bg-sc-surface-2 hover:text-sc-text"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => toggleSuspend(card)}
                  disabled={busyId === card.id}
                  title={card.owner_suspended ? "Reactivate" : "Suspend"}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-sc-text-dim transition-colors hover:bg-sc-surface-2 hover:text-sc-text disabled:opacity-50"
                >
                  {busyId === card.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : card.owner_suspended ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <UserX className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(card)}
                  disabled={busyId === card.id}
                  title="Remove"
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-sc-text-dim transition-colors hover:bg-rose-400/10 hover:text-rose-300 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Sets the look new employee cards start from — read from a photo of the
 * company's own card, not typed in. Deliberately no OCR here (see
 * src/lib/card-ocr.ts / card-scan-color.ts): only the photo's colours and
 * mood matter for this, not its text.
 */

function CredentialLine({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex w-full items-center justify-between gap-3 rounded-lg bg-sc-surface-2 px-3 py-2 text-left transition-colors hover:bg-sc-surface"
    >
      <span className="truncate">
        <span className="text-sc-text-dimmer">{label}: </span>
        {value}
      </span>
      {copied ? (
        <Check className="h-3.5 w-3.5 shrink-0 text-sc-gold" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0 text-sc-text-dimmer" />
      )}
    </button>
  );
}
