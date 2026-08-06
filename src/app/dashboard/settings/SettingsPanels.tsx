"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import {
  changeEmail,
  changePassword,
  deleteAccount,
  saveNotifications,
} from "./actions";

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
      <h2 className="text-[15px] font-semibold text-white">{title}</h2>
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
        {error && <span className="text-[13px] font-medium text-hotpink">{error}</span>}
      </div>
    </section>
  );
}

export default function SettingsPanels({
  email,
  notify,
}: {
  email: string;
  notify: { email: boolean; whatsapp: boolean; number: string };
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
            <span className="text-[14px] text-white/75">{t.label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={t.value}
              onClick={() => t.set(!t.value)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                t.value ? "bg-acid" : "bg-white/15"
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

      {/* Delete */}
      <section className="app-panel app-panel-pad border-hotpink/25">
        <h2 className="text-[15px] font-semibold text-white">Delete account</h2>
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
      {error && <span className="text-[13px] font-medium text-hotpink">{error}</span>}
    </div>
  );
}
