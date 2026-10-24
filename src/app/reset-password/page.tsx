"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/auth/PasswordInput";

const field =
  "h-13 w-full rounded-xl border-2 border-ink bg-white px-4 py-3 font-semibold text-ink outline-none placeholder:text-ink/30 focus:border-acid focus:bg-acid/20";

/**
 * Where an emailed reset link lands (via /auth/callback or /auth/confirm),
 * already signed in by that link. Without that session there is nothing to
 * update, so it points back to requesting a new link.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ready" | "no-session" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setState(data.user ? "ready" : "no-session"));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");

    setSaving(true);
    const { error } = await createClient().auth.updateUser({ password });
    setSaving(false);
    if (error) {
      return setError(
        error.code === "same_password" || /different from the old/i.test(error.message)
          ? "That's your current password. Choose a new one."
          : error.message
      );
    }

    setState("done");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  };

  return (
    <AuthShell>
      {state === "checking" && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-ink" />
        </div>
      )}

      {state === "no-session" && (
        <>
          <h1 className="text-4xl font-black leading-none tracking-tighter text-ink">link expired.</h1>
          <p className="mt-3 text-[15px] font-semibold text-ink/60">
            This reset link has expired or was already used. Request a new one and use the latest email.
          </p>
          <Link
            href="/forgot-password"
            className="sticker sticker-press mt-7 flex h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-acid text-base font-black uppercase tracking-tight text-ink"
          >
            send a new link
          </Link>
        </>
      )}

      {state === "done" && (
        <>
          <CheckCircle2 className="h-10 w-10 text-ink" />
          <h1 className="mt-4 text-4xl font-black leading-none tracking-tighter text-ink">password updated.</h1>
          <p className="mt-3 text-[15px] font-semibold text-ink/60">Taking you to your dashboard…</p>
        </>
      )}

      {state === "ready" && (
        <>
          <h1 className="text-4xl font-black leading-none tracking-tighter text-ink">set a new password.</h1>
          <p className="mt-3 text-[15px] font-semibold text-ink/50">At least 8 characters.</p>

          {error && (
            <div className="mt-6 rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">{error}</div>
          )}

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-black uppercase tracking-wide text-ink">
                new password
              </label>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={field}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-black uppercase tracking-wide text-ink">
                confirm password
              </label>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className={field}
              />
            </div>
            <button
              disabled={saving}
              type="submit"
              className="sticker sticker-press flex h-14 w-full items-center justify-center rounded-full border-2 border-ink bg-acid text-base font-black uppercase tracking-tight text-ink disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "save new password"}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
