"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import {
  changeEmail,
  changePassword,
  deleteAccount,
  saveNotifications,
  switchToCorporate,
  switchToIndividual,
} from "./actions";
import { COMPANY_SLUG_MAX, COMPANY_SLUG_PATTERN, slugify } from "@/lib/org";
import { createClient } from "@/lib/supabase/client";

type Result = { ok: boolean; error?: string };

/** Small wrapper so every panel gets identical pending / error / saved states. */
function Panel({
  title,
  help,
  children,
  onSave,
  saveLabel = "Save",
  danger,
  confirmText,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
  onSave: () => Promise<Result>;
  saveLabel?: string;
  danger?: boolean;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <section className="app-panel app-panel-pad">
      <h2 className="text-[15px] font-semibold text-sc-text">{title}</h2>
      {help && <p className="app-sub mt-1">{help}</p>}

      <div className="mt-4 space-y-3">{children}</div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirmText && !window.confirm(confirmText)) return;
            setError(null);
            setSaved(false);
            startTransition(async () => {
              const r = await onSave();
              if (!r.ok) setError(r.error ?? "Something went wrong.");
              else setSaved(true);
            });
          }}
          className={`app-btn ${danger ? "app-btn-danger" : "app-btn-primary"}`}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : null}
          {saved ? "Saved" : saveLabel}
        </button>
        {error && <span className="text-[13px] font-medium text-sc-error">{error}</span>}
      </div>
    </section>
  );
}

export default function SettingsPanels({
  email,
  notify,
  accountType,
  companyName,
  employeeCount,
}: {
  email: string;
  notify: { email: boolean; whatsapp: boolean; number: string };
  accountType: "individual" | "corporate";
  companyName: string | null;
  employeeCount: number;
}) {
  const router = useRouter();

  const [newEmail, setNewEmail] = useState(email);
  const [password, setPassword] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(notify.email);
  const [notifyWa, setNotifyWa] = useState(notify.whatsapp);
  const [waNumber, setWaNumber] = useState(notify.number);
  const [confirmDelete, setConfirmDelete] = useState("");

  return (
    <div className="space-y-4">
      {/* Email */}
      <Panel
        title="Email address"
        help="We send a confirmation link to the new address before it takes effect."
        onSave={() => changeEmail(newEmail)}
        saveLabel="Update email"
      >
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="app-input max-w-sm"
        />
      </Panel>

      {/* Password */}
      <Panel
        title="Password"
        help="At least 8 characters."
        onSave={() => changePassword(password)}
        saveLabel="Update password"
      >
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="app-input max-w-sm"
        />
      </Panel>

      {/* Notifications */}
      <Panel
        title="Notifications"
        help="How we reach you about orders."
        onSave={() =>
          saveNotifications({
            notifyEmail,
            notifyWhatsapp: notifyWa,
            whatsapp: waNumber,
          })
        }
      >
        {[
          { label: "Email updates", value: notifyEmail, set: setNotifyEmail },
          { label: "WhatsApp updates", value: notifyWa, set: setNotifyWa },
        ].map((t) => (
          <label key={t.label} className="flex cursor-pointer items-center justify-between">
            <span className="text-[14px] text-sc-text-dim">{t.label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={t.value}
              onClick={() => t.set(!t.value)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                t.value ? "bg-sc-gold" : "bg-sc-surface-2"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  t.value ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        ))}

        {notifyWa && (
          <input
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            placeholder="923001234567"
            className="app-input max-w-sm"
          />
        )}
      </Panel>

      {/* Account type */}
      <AccountTypeSection
        accountType={accountType}
        companyName={companyName}
        employeeCount={employeeCount}
      />

      {/* Delete */}
      <section className="app-panel app-panel-pad border-sc-error/25">
        <h2 className="text-[15px] font-semibold text-sc-text">Delete account</h2>
        <p className="app-sub mt-1">
          Removes your card and orders. Any printed card stops
          working immediately. This cannot be undone.
        </p>

        <input
          value={confirmDelete}
          onChange={(e) => setConfirmDelete(e.target.value)}
          placeholder="Type DELETE to confirm"
          className="app-input mt-4 max-w-xs"
        />

        <DeleteButton
          enabled={confirmDelete === "DELETE"}
          onDone={() => router.push("/")}
        />
      </section>
    </div>
  );
}

/**
 * Individual ↔ corporate, in one place — the two directions need genuinely
 * different UI (corporate needs a company name typed in; downgrading needs
 * nothing but a confirmation, or a hard block if a team still exists), so
 * this isn't built on the generic Panel above.
 */
function AccountTypeSection({
  accountType,
  companyName,
  employeeCount,
}: {
  accountType: "individual" | "corporate";
  companyName: string | null;
  employeeCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (accountType === "individual") {
    // Full reload, not router.refresh(): DashboardLayout's sidebar (Team
    // link, account badge) reads account_type from its own client-side
    // effect that only runs on mount, so a soft refresh leaves it stale.
    return <SwitchToCorporateForm onDone={() => window.location.reload()} />;
  }

  return (
    <section className="app-panel app-panel-pad">
      <h2 className="text-[15px] font-semibold text-sc-text">Account type</h2>
      <p className="app-sub mt-1">
        Corporate account{companyName ? ` — ${companyName}` : ""}.
      </p>

      {employeeCount > 0 ? (
        <p className="mt-4 text-[13px] font-medium text-sc-text-dim">
          You have {employeeCount} employee card{employeeCount === 1 ? "" : "s"}. Remove
          everyone from your team (Team page) before switching to an individual account.
        </p>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (
                !window.confirm(
                  "Switch to an individual account? Team management stays off until you switch back."
                )
              )
                return;
              setError(null);
              startTransition(async () => {
                const r = await switchToIndividual();
                if (!r.ok) setError(r.error ?? "Could not switch.");
                else window.location.reload();
              });
            }}
            className="app-btn app-btn-secondary"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Switch to individual account
          </button>
          {error && <span className="text-[13px] font-medium text-sc-error">{error}</span>}
        </div>
      )}
    </section>
  );
}

function SwitchToCorporateForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [checkedStatus, setCheckedStatus] = useState<"idle" | "checking" | "free" | "taken">("idle");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const slug = slugify(companyName, COMPANY_SLUG_MAX);

  // Same split as AccountTypePicker/UsernameField: the idle/invalid cases
  // are derivable straight from props/state during render, so only the
  // genuinely async "is it actually available" check goes through an
  // effect (and only that branch ever calls setState from inside one).
  const staticStatus: "idle" | "invalid" | null =
    !open || !companyName.trim()
      ? "idle"
      : !COMPANY_SLUG_PATTERN.test(slug)
        ? "invalid"
        : null;

  const status = staticStatus ?? checkedStatus;

  useEffect(() => {
    if (staticStatus !== null) return;

    let cancelled = false;
    const mark = setTimeout(() => setCheckedStatus("checking"), 0);
    const timer = setTimeout(async () => {
      const { data, error: checkError } = await supabase.rpc("company_slug_available", {
        candidate: slug,
      });
      if (cancelled) return;
      setCheckedStatus(checkError ? "idle" : data ? "free" : "taken");
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(mark);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticStatus, slug]);

  return (
    <section className="app-panel app-panel-pad">
      <h2 className="text-[15px] font-semibold text-sc-text">Account type</h2>
      <p className="app-sub mt-1">Individual account.</p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="app-btn app-btn-secondary mt-4"
        >
          Switch to a corporate account
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="switch-company-name" className="text-xs font-bold uppercase tracking-wide text-sc-text-dim">
              Company name
            </label>
            <input
              id="switch-company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Studio"
              className="app-input max-w-sm"
            />
            {slug && (
              <p className="text-xs text-sc-text-dimmer">
                Employees will get cards like{" "}
                <span className="font-mono text-sc-text-dim">/u/{slug}-jane</span>
                {status === "taken" && <span className="text-sc-error"> — that name is taken</span>}
                {status === "invalid" && <span className="text-sc-error"> — try adding a word or two</span>}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={pending || status !== "free"}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const r = await switchToCorporate(companyName);
                  if (!r.ok) setError(r.error ?? "Could not switch.");
                  else onDone();
                });
              }}
              className="app-btn app-btn-primary disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Switch to corporate
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCompanyName("");
                setError(null);
              }}
              className="text-[13px] font-bold text-sc-text-dimmer hover:text-sc-text-dim"
            >
              Cancel
            </button>
            {error && <span className="text-[13px] font-medium text-sc-error">{error}</span>}
          </div>
        </div>
      )}
    </section>
  );
}

function DeleteButton({ enabled, onDone }: { enabled: boolean; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        type="button"
        disabled={!enabled || pending}
        onClick={() => {
          if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;
          setError(null);
          startTransition(async () => {
            const r = await deleteAccount();
            if (!r.ok) setError(r.error ?? "Could not delete.");
            else onDone();
          });
        }}
        className="app-btn app-btn-danger"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Delete my account
      </button>
      {error && <span className="text-[13px] font-medium text-sc-error">{error}</span>}
    </div>
  );
}
