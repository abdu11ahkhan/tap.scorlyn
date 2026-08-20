import Link from "next/link";
import { Check } from "lucide-react";
import type { PhysicalCardStatus as Status } from "@/lib/nfc-lifecycle";

/**
 * One vertical timeline covering both systems — order fulfillment and NFC
 * assignment — presented as a single honest sequence instead of two panels
 * that leave the customer to connect them.
 */
export default function PhysicalCardStatus({ status }: { status: Status }) {
  const { steps, headline, nextAction, assignments, cancelled } = status;

  return (
    <section className="app-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sc-text-dimmer">
            physical card
          </p>
          <p className="mt-1 text-sm font-black text-sc-text">{headline}</p>
        </div>
        {assignments.length > 1 && (
          <span className="shrink-0 rounded-full bg-sc-surface-2 px-3 py-1 text-[11px] font-black text-sc-text-dim">
            {assignments.length} cards linked
          </span>
        )}
      </div>

      {!cancelled && (
        <ol className="mt-5 space-y-0">
          {steps.map((step, i) => (
            <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
              {i < steps.length - 1 && (
                <span
                  className={`absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-0.5 ${
                    step.done ? "bg-sc-gold" : "bg-sc-border"
                  }`}
                  aria-hidden="true"
                />
              )}
              <span
                className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                  step.done
                    ? "bg-sc-gold text-sc-gold-ink"
                    : step.current
                      ? "border-2 border-sc-gold bg-sc-surface text-sc-gold"
                      : "bg-sc-surface-2 text-sc-text-dimmer"
                }`}
              >
                {step.done ? <Check className="h-3 w-3" strokeWidth={3.5} /> : null}
              </span>
              <p
                className={`pt-0.5 text-sm font-bold ${
                  step.done || step.current ? "text-sc-text" : "text-sc-text-dimmer"
                }`}
              >
                {step.label}
              </p>
            </li>
          ))}
        </ol>
      )}

      {assignments.length > 1 && (
        <div className="mt-4 space-y-2 border-t border-sc-border-soft pt-4">
          {assignments.map((a, i) => (
            <div key={a.nfcCardId} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-sc-text-dim">Physical card {i + 1}</span>
              <span className={`text-xs font-black ${a.firstTapAt ? "text-sc-success" : "text-sc-gold"}`}>
                {a.firstTapAt ? "Active" : "Ready to tap"}
              </span>
            </div>
          ))}
        </div>
      )}

      {nextAction && (
        <div className="mt-5">
          {nextAction.href ? (
            <Link href={nextAction.href} className="app-btn app-btn-primary rounded-full px-5">
              {nextAction.label}
            </Link>
          ) : (
            <p className="text-sm font-semibold text-sc-text-dim">{nextAction.label}</p>
          )}
        </div>
      )}
    </section>
  );
}
