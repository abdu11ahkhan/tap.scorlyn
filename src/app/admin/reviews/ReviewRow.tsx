"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { resetFeedbackLink, saveReviewSettings } from "./actions";

const FIELD =
  "h-11 w-full rounded-xl border-2 border-sc-border-soft bg-sc-surface-2 px-3.5 text-sm font-semibold text-sc-text outline-none placeholder:text-sc-text-dimmer focus:border-acid";
const LABEL = "mb-1 block text-[10px] font-black uppercase tracking-widest text-sc-text-dimmer";
const GHOST =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 border-sc-border px-4 text-xs font-black lowercase text-sc-text transition-colors hover:border-acid hover:text-acid disabled:opacity-50";

export type ReviewRowData = {
  id: string;
  username: string;
  fullName: string;
  published: boolean;
  googleUrl: string;
  notifyEmail: string;
  notifyWhatsapp: string;
  token: string | null;
  ratings: number;
  average: number;
  googleClicks: number;
  feedback: number;
};

export default function ReviewRow({ row, origin }: { row: ReviewRowData; origin: string }) {
  const [googleUrl, setGoogleUrl] = useState(row.googleUrl);
  const [notifyEmail, setNotifyEmail] = useState(row.notifyEmail);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(row.notifyWhatsapp);
  const [token, setToken] = useState(row.token);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const link = token ? `${origin}/feedback/${token}` : null;

  return (
    <article className="app-panel app-panel-pad space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-black">{row.fullName}</p>
          <p className="text-xs font-semibold text-sc-text-dimmer">
            @{row.username}
            {!row.published && <span className="ml-2 font-bold text-hotpink">unpublished</span>}
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-right text-xs font-semibold text-sc-text-dim">
          <div>
            <dt className="sr-only">Average</dt>
            <dd>
              <span className="text-base font-black text-sc-text">{row.ratings ? row.average.toFixed(1) : "—"}</span> ★ ·{" "}
              {row.ratings} rating{row.ratings === 1 ? "" : "s"}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Google</dt>
            <dd>{row.googleClicks} to Google</dd>
          </div>
          <div>
            <dt className="sr-only">Feedback</dt>
            <dd>{row.feedback} feedback</dd>
          </div>
        </dl>
      </div>

      <form
        className="grid gap-3 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          setStatus(null);
          start(async () => {
            const r = await saveReviewSettings(row.id, { googleUrl, notifyEmail, notifyWhatsapp });
            if (!r.ok) setStatus({ ok: false, text: r.error ?? "Could not save." });
            else {
              setToken(r.data?.token ?? token);
              setStatus({ ok: true, text: "Saved." });
            }
          });
        }}
      >
        <div className="sm:col-span-3">
          <label className={LABEL} htmlFor={`g-${row.id}`}>google review link</label>
          <input id={`g-${row.id}`} type="url" value={googleUrl} onChange={(e) => setGoogleUrl(e.target.value)} placeholder="https://g.page/r/…/review" className={FIELD} />
        </div>
        <div>
          <label className={LABEL} htmlFor={`e-${row.id}`}>email feedback to</label>
          <input id={`e-${row.id}`} type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="owner@business.com" className={FIELD} />
        </div>
        <div>
          <label className={LABEL} htmlFor={`w-${row.id}`}>whatsapp (once connected)</label>
          <input id={`w-${row.id}`} inputMode="tel" value={notifyWhatsapp} onChange={(e) => setNotifyWhatsapp(e.target.value)} placeholder="923001234567" className={FIELD} />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={pending}
            className="sticker sticker-press inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-acid px-5 text-xs font-black uppercase tracking-tight text-ink disabled:opacity-60"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            save
          </button>
          {status && <span className={`text-xs font-bold ${status.ok ? "text-acid" : "text-hotpink"}`}>{status.text}</span>}
        </div>
      </form>

      <div className="rounded-xl border-2 border-sc-border-soft p-3">
        <p className={LABEL}>private feedback page — send this to the business</p>
        {link ? (
          <>
            <p className="break-all font-mono text-xs font-semibold text-acid">{link}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={GHOST}
                onClick={async () => {
                  await navigator.clipboard.writeText(link).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} copy link
              </button>
              <a href={link} target="_blank" rel="noopener noreferrer" className={GHOST}>
                <ExternalLink className="h-3.5 w-3.5" /> open
              </a>
              <button
                type="button"
                disabled={pending}
                className={GHOST}
                onClick={() => {
                  if (!window.confirm("Reset the link? The old one stops working immediately — you'll need to send the new one.")) return;
                  start(async () => {
                    const r = await resetFeedbackLink(row.id);
                    if (r.ok && r.data) setToken(r.data.token);
                    else setStatus({ ok: false, text: r.error ?? "Could not reset." });
                  });
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" /> reset link
              </button>
            </div>
          </>
        ) : (
          <p className="text-xs font-semibold text-sc-text-dimmer">Press save once to create the link.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/admin/cards/${row.id}/edit`} className={GHOST}>edit card &amp; wording</Link>
        <a href={`/u/${row.username}`} target="_blank" rel="noopener noreferrer" className={GHOST}>
          <ExternalLink className="h-3.5 w-3.5" /> open review card
        </a>
      </div>
    </article>
  );
}
