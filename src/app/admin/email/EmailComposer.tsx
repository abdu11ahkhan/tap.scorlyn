"use client";

import { useState, useTransition } from "react";
import { Loader2, Send, CalendarClock, Trash2 } from "lucide-react";
import { EMAIL_PRESETS } from "@/lib/email-presets";
import { sendNow, schedule, cancelScheduled, type Audience } from "./actions";

type Campaign = {
  id: string;
  subject: string;
  audience: string;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  recipient_count: number;
  last_error: string | null;
};

const AUDIENCES: { value: Audience; label: string; hint: string }[] = [
  { value: "test", label: "Just me", hint: "Sends only to your own address." },
  { value: "customers_with_cards", label: "Customers with a card", hint: "Anyone who has set one up." },
  { value: "all", label: "Everyone", hint: "Every registered account." },
];

export default function EmailComposer({
  campaigns,
  configured,
}: {
  campaigns: Campaign[];
  configured: boolean;
}) {
  const [subject, setSubject] = useState(EMAIL_PRESETS[0].subject);
  const [body, setBody] = useState(EMAIL_PRESETS[0].body);
  const [audience, setAudience] = useState<Audience>("test");
  const [when, setWhen] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const usePreset = (id: string) => {
    const p = EMAIL_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setSubject(p.subject);
    setBody(p.body);
    setMsg(null);
  };

  const run = (fn: () => Promise<{ ok: boolean; error?: string; data?: unknown }>, okText: string) =>
    start(async () => {
      setMsg(null);
      const r = await fn();
      if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Something went wrong." });
      const d = r.data as { sent: number; failed: number } | undefined;
      setMsg({
        ok: true,
        text: d ? `${okText} ${d.sent} sent${d.failed ? `, ${d.failed} failed` : ""}.` : okText,
      });
    });

  const field =
    "w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/30";

  return (
    <div className="space-y-6">
      {!configured && (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Email isn&apos;t configured on the server yet — set <code>SMTP_USER</code> and{" "}
          <code>SMTP_PASS</code>. You can still write and schedule; nothing will send until then.
        </p>
      )}

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Start from</p>
        <div className="flex flex-wrap gap-2">
          {EMAIL_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => usePreset(p.id)}
              className="rounded-full border border-white/12 px-3.5 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-white/35 hover:text-white"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className={field}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className={`${field} font-mono text-[13px] leading-relaxed`}
        />
        <p className="text-xs text-white/40">
          <code>{"{{link}}"}</code> is replaced with each person&apos;s own referral link, so the
          same message credits whoever it goes to.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Send to</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {AUDIENCES.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setAudience(a.value)}
              className={`rounded-xl border px-3.5 py-3 text-left transition-colors ${
                audience === a.value
                  ? "border-white/45 bg-white/[0.07]"
                  : "border-white/12 hover:border-white/25"
              }`}
            >
              <span className="block text-sm font-semibold text-white">{a.label}</span>
              <span className="mt-0.5 block text-xs text-white/40">{a.hint}</span>
            </button>
          ))}
        </div>
        {audience === "all" && (
          <p className="text-xs text-amber-200/80">
            Promotional mail to everyone from a Gmail account risks the sending account. Test on
            yourself first.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => sendNow(subject, body, audience), "Sent.")}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-black disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send now
        </button>

        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={`${field} h-11 w-auto`}
          />
          <button
            type="button"
            disabled={pending || !when}
            onClick={() => run(() => schedule(subject, body, audience, when), "Scheduled.")}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            <CalendarClock className="h-4 w-4" />
            Schedule
          </button>
        </div>
      </div>

      {msg && (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            msg.ok
              ? "bg-emerald-400/10 text-emerald-200"
              : "bg-rose-500/10 text-rose-200"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="space-y-3 pt-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">History</p>
        {campaigns.length === 0 ? (
          <p className="text-sm text-white/35">Nothing sent yet.</p>
        ) : (
          <ul className="space-y-2">
            {campaigns.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{c.subject}</p>
                  <p className="mt-0.5 text-xs text-white/40">
                    {c.status}
                    {c.sent_at && ` · ${new Date(c.sent_at).toLocaleString()} · ${c.recipient_count} sent`}
                    {c.scheduled_for && !c.sent_at && ` · ${new Date(c.scheduled_for).toLocaleString()}`}
                  </p>
                  {c.last_error && (
                    <p className="mt-1 truncate text-xs text-rose-300/80">{c.last_error}</p>
                  )}
                </div>
                {c.status === "scheduled" && (
                  <button
                    type="button"
                    onClick={() => run(() => cancelScheduled(c.id), "Cancelled.")}
                    className="shrink-0 rounded-lg border border-white/12 p-2 text-white/50 hover:text-white"
                    aria-label="Cancel"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
