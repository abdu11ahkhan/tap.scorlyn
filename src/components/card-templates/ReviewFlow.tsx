"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, Loader2, MessageSquare, Star } from "lucide-react";

type Colors = {
  fg: string;
  fgDim: string;
  fgMuted: string;
  border: string;
  accent: string;
  onAccent: string;
  panel: string;
  field: string;
};

type Config = {
  google_url: string;
  heading: string;
  subheading: string;
  thanks_heading: string;
  google_prompt: string;
  google_cta: string;
  feedback_heading: string;
  feedback_description: string;
  categories: string[];
  success_message: string;
};

const STAR = "#F5A524";
const RATING_WORDS = ["", "Terrible", "Poor", "Okay", "Good", "Excellent"];

/**
 * The interactive part of the Review Card.
 *
 * 4–5 stars go straight to the business's Google review page, same tab.
 * 1–3 stars open the private feedback form first — but the Google link stays
 * on that screen too. Google's policy forbids *selectively soliciting*
 * positive reviews; routing unhappy customers to feedback first is allowed
 * only while nobody is blocked from Google, so that link must never be
 * removed for low ratings.
 *
 * Only records anything on a real card page (/u/...). In the editor preview
 * and the template gallery it runs the same flow but sends nothing.
 */
export default function ReviewFlow({
  username,
  businessName,
  config,
  colors,
}: {
  username: string;
  businessName: string;
  config: Config;
  colors: Colors;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [step, setStep] = useState<"rate" | "next" | "feedback" | "sent" | "google">("rate");
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [contactOpen, setContactOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const context = useRef<{ live: boolean; source: string; nfcCode: string | null }>({
    live: false,
    source: "link",
    nfcCode: null,
  });
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const live = window.location.pathname.startsWith("/u/");
    const params = new URLSearchParams(window.location.search);
    const src = params.get("src");
    context.current = {
      live,
      source: src === "nfc" || src === "qr" ? src : "link",
      nfcCode: params.get("nfc"),
    };
  }, []);

  // Back from Google restores this page from the back-forward cache still on
  // "Taking you to Google…"; show the thank-you screen instead.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setStep((s) => (s === "google" ? "next" : s));
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  // Moving focus with the step keeps screen readers on the new content.
  useEffect(() => {
    if (step !== "rate") heading.current?.focus();
  }, [step]);

  const track = (eventType: string, target?: string) => {
    const { live, source, nfcCode } = context.current;
    if (!live) return;
    fetch("/api/tap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, source, nfcCode: nfcCode || undefined, eventType, target }),
      keepalive: true,
    }).catch(() => {});
  };

  const choose = (n: number) => {
    setRating(n);
    track("rating", String(n));
    // A beat to see the stars fill before the view changes.
    setTimeout(() => {
      if (n >= 4 && config.google_url) {
        track("review_click", String(n));
        setStep("google");
        // In the editor preview and the gallery this only simulates — leaving
        // the page there would throw away the owner's unsaved edits.
        if (context.current.live) window.location.assign(config.google_url);
      } else if (n <= 3) {
        track("feedback_open");
        setStep("feedback");
      } else {
        setStep("next");
      }
    }, 280);
  };

  const openFeedback = () => {
    track("feedback_open");
    setStep("feedback");
  };

  const submit = async () => {
    setError(null);
    if (!message.trim() && !category) {
      setError("Pick a topic or write a few words.");
      return;
    }
    const { live, source, nfcCode } = context.current;
    if (!live) {
      setStep("sent");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/review-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          nfcCode,
          source,
          rating,
          category,
          message,
          name,
          phone,
          email,
          website: trap,
        }),
      });
      if (!res.ok) throw new Error();
      track("feedback_submit", String(rating));
      setStep("sent");
    } catch {
      setError("Couldn't send that — check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const shown = hover || rating;

  const googleButton = config.google_url ? (
    <a
      href={config.google_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("review_click", String(rating))}
      className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-semibold transition-transform active:scale-[0.98]"
      style={{ background: colors.accent, color: colors.onAccent }}
    >
      {config.google_cta}
      <ArrowRight className="h-4 w-4 shrink-0" />
    </a>
  ) : null;

  const fieldStyle = { background: colors.field, borderColor: colors.border, color: colors.fg };

  return (
    <div
      className="rounded-[28px] border p-6 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.18)]"
      style={{ background: colors.panel, borderColor: colors.border }}
      aria-live="polite"
    >
      {step === "rate" && (
        <div className="text-center">
          <h2 className="text-[21px] font-semibold leading-tight tracking-tight">{config.heading}</h2>
          <div
            className="mt-6 flex justify-center gap-1"
            role="radiogroup"
            aria-label="Your rating"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n === 1 ? "" : "s"}, ${RATING_WORDS[n]}`}
                onClick={() => choose(n)}
                onMouseEnter={() => setHover(n)}
                onFocus={() => setHover(n)}
                onBlur={() => setHover(0)}
                className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-150 active:scale-90 motion-safe:hover:scale-110"
              >
                <Star
                  className="h-10 w-10 transition-colors duration-150"
                  strokeWidth={1.6}
                  style={{
                    color: n <= shown ? STAR : colors.border,
                    fill: n <= shown ? STAR : "transparent",
                  }}
                />
              </button>
            ))}
          </div>
          <p className="mt-3 h-5 text-[13px] font-medium" style={{ color: colors.fgMuted }}>
            {shown ? RATING_WORDS[shown] : config.subheading}
          </p>
        </div>
      )}

      {step !== "rate" && (
        <div className="mb-5 flex justify-center gap-1" aria-label={`You rated ${rating} out of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className="h-5 w-5"
              strokeWidth={1.6}
              style={{ color: n <= rating ? STAR : colors.border, fill: n <= rating ? STAR : "transparent" }}
            />
          ))}
        </div>
      )}

      {step === "google" && (
        <div className="review-step space-y-3 text-center">
          <h2 ref={heading} tabIndex={-1} className="text-[20px] font-semibold tracking-tight outline-none">
            {config.thanks_heading}
          </h2>
          <p className="flex items-center justify-center gap-2 text-[14px]" style={{ color: colors.fgDim }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Taking you to Google…
          </p>
          {googleButton}
        </div>
      )}

      {step === "next" && (
        <div className="review-step space-y-3 text-center">
          <h2 ref={heading} tabIndex={-1} className="text-[22px] font-semibold tracking-tight outline-none">
            {config.thanks_heading}
          </h2>
          {googleButton && (
            <>
              <p className="pb-1 text-[14px] leading-relaxed" style={{ color: colors.fgDim }}>
                {config.google_prompt}
              </p>
              {googleButton}
            </>
          )}
          <button
            type="button"
            onClick={openFeedback}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border px-5 text-[15px] font-semibold transition-transform active:scale-[0.98]"
            style={{ borderColor: colors.border, color: colors.fg }}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            {config.feedback_heading}
          </button>
          <p className="pt-1 text-[12px]" style={{ color: colors.fgMuted }}>
            Feedback goes privately to {businessName}.
          </p>
        </div>
      )}

      {step === "feedback" && (
        <form
          className="review-step space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="text-center">
            <h2 ref={heading} tabIndex={-1} className="text-[20px] font-semibold tracking-tight outline-none">
              {config.feedback_heading}
            </h2>
            <p className="mt-1 text-[14px]" style={{ color: colors.fgDim }}>
              {config.feedback_description}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Topic">
            {config.categories.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(active ? null : c)}
                  className="min-h-11 rounded-full border px-4 text-[13px] font-medium transition-colors"
                  style={
                    active
                      ? { background: colors.accent, borderColor: colors.accent, color: colors.onAccent }
                      : { borderColor: colors.border, color: colors.fgDim }
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>

          <label className="block">
            <span className="sr-only">Your feedback</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Tell us what happened…"
              className="w-full resize-none rounded-2xl border px-4 py-3 text-[16px] outline-none"
              style={fieldStyle}
            />
          </label>

          {/* Bots fill every field; people never see this one. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={trap}
            onChange={(e) => setTrap(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            name="website"
          />

          <div>
            <button
              type="button"
              onClick={() => setContactOpen((v) => !v)}
              aria-expanded={contactOpen}
              className="flex min-h-11 items-center gap-1.5 text-[13px] font-medium"
              style={{ color: colors.fgDim }}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${contactOpen ? "rotate-180" : ""}`} />
              Want a reply? Leave your details (optional)
            </button>
            {contactOpen && (
              <div className="mt-2 grid gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" placeholder="Name" className="h-12 rounded-xl border px-4 text-[16px] outline-none" style={fieldStyle} />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} inputMode="tel" autoComplete="tel" placeholder="Phone" className="h-12 rounded-xl border px-4 text-[16px] outline-none" style={fieldStyle} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} type="email" autoComplete="email" placeholder="Email" className="h-12 rounded-xl border px-4 text-[16px] outline-none" style={fieldStyle} />
              </div>
            )}
          </div>

          {error && (
            <p className="text-center text-[13px] font-medium" style={{ color: "#DC2626" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-70"
            style={{ background: colors.fg, color: colors.panel }}
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit feedback
          </button>

          {googleButton && (
            <a
              href={config.google_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("review_click", String(rating))}
              className="flex min-h-11 items-center justify-center text-[13px] font-medium underline underline-offset-4"
              style={{ color: colors.fgDim }}
            >
              Or {config.google_cta.charAt(0).toLowerCase() + config.google_cta.slice(1)}
            </a>
          )}
        </form>
      )}

      {step === "sent" && (
        <div className="review-step space-y-4 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: `${colors.accent}1f`, color: colors.accent }}
          >
            <Check className="h-7 w-7" strokeWidth={2.5} />
          </span>
          <h2 ref={heading} tabIndex={-1} className="text-[20px] font-semibold tracking-tight outline-none">
            {config.success_message}
          </h2>
          {googleButton && (
            <>
              <p className="text-[14px]" style={{ color: colors.fgDim }}>
                {config.google_prompt}
              </p>
              {googleButton}
            </>
          )}
        </div>
      )}
    </div>
  );
}
