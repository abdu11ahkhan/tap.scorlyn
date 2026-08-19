"use client";

import Link from "next/link";
import {
  Building2,
  Camera,
  ExternalLink,
  IdCard,
  Pencil,
  Plus,
  SmartphoneNfc,
  Users,
} from "lucide-react";

export type EmployeeSummary = {
  id: string;
  username: string;
  full_name: string;
  headline: string | null;
  published: boolean;
  owner_suspended: boolean;
};

/**
 * The corporate owner's landing screen — genuinely different from the
 * individual one, not the same page with a Team button bolted on. Company
 * identity first, then the actions an owner actually takes repeatedly, then
 * the roster. Full employee management (suspend/remove/scan/house style)
 * still lives at /dashboard/team; this is the "what's the state of my
 * company" view, that links there for anything beyond a glance.
 */
export default function CorporateDashboard({
  name,
  companyName,
  companySlug,
  employees,
  nfcCount,
}: {
  name: string;
  companyName: string | null;
  companySlug: string | null;
  employees: EmployeeSummary[];
  nfcCount: number;
}) {
  const activeCards = employees.filter((e) => e.published && !e.owner_suspended).length;

  return (
    <div className="max-w-4xl space-y-5 pb-16">
      <div>
        <h1 className="app-h1">Hey {name}</h1>
        <p className="app-sub mt-1">Your team at a glance.</p>
      </div>

      {/* Company overview */}
      <div className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sc-gold/15 text-sc-gold">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[17px] font-semibold leading-tight text-sc-text">
              {companyName || "Your company"}
            </p>
            <p className="app-sub mt-0.5">
              {companySlug ? (
                <span className="font-mono">tap.scorlyn.com/u/{companySlug}-…</span>
              ) : (
                "No company URL yet"
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-sc-text">
              {employees.length}
            </p>
            <p className="app-sub mt-0.5">employees</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-sc-text">
              {activeCards}
            </p>
            <p className="app-sub mt-0.5">active cards</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction href="/dashboard/team" icon={Plus} label="Add employee" />
        <QuickAction href="/dashboard/team" icon={Camera} label="Scan a card" />
        <QuickAction href="/dashboard/card" icon={Pencil} label="Company card" />
        <QuickAction href="/dashboard/nfc" icon={SmartphoneNfc} label="Order NFC" />
      </div>

      {/* Team overview */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-sc-text-dimmer">
            team
          </h2>
          <Link
            href="/dashboard/team"
            className="flex min-h-11 items-center text-xs font-black uppercase tracking-tight text-sc-text-dim transition-colors hover:text-sc-gold"
          >
            manage team →
          </Link>
        </div>

        {employees.length === 0 ? (
          <div className="app-panel app-panel-pad text-center">
            <p className="text-[15px] font-black text-sc-text">Your team is ready to grow.</p>
            <p className="app-sub mx-auto mt-1 max-w-sm">
              Add your first employee to create their digital business card.
            </p>
            <Link
              href="/dashboard/team"
              className="app-btn app-btn-primary mt-4 inline-flex"
            >
              <Plus className="h-4 w-4" />
              Add employee
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {employees.slice(0, 6).map((e) => (
              <Link
                key={e.id}
                href={`/dashboard/team/${e.id}/edit`}
                className="app-panel flex items-center gap-3 p-3.5 transition-colors hover:border-sc-gold/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-sc-text">
                    {e.full_name || "Untitled"}
                  </p>
                  <p className="truncate text-xs font-semibold text-sc-text-dimmer">
                    {e.headline || `/u/${e.username}`}
                  </p>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-tight " +
                    (e.owner_suspended
                      ? "bg-rose-400/15 text-rose-300"
                      : e.published
                        ? "bg-sc-gold/15 text-sc-gold"
                        : "bg-sc-surface-2 text-sc-text-dim")
                  }
                >
                  {e.owner_suspended ? "suspended" : e.published ? "active" : "draft"}
                </span>
              </Link>
            ))}
            {employees.length > 6 && (
              <Link
                href="/dashboard/team"
                className="block text-center text-xs font-black uppercase tracking-widest text-sc-text-dimmer hover:text-sc-gold"
              >
                +{employees.length - 6} more
              </Link>
            )}
          </div>
        )}
      </div>

      {/* NFC */}
      <div className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sc-surface-2 text-sc-gold">
            <IdCard className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-black text-sc-text">{nfcCount} NFC card{nfcCount === 1 ? "" : "s"} linked</p>
            <p className="app-sub mt-0.5 text-[13px]">Order physical cards for anyone on the team.</p>
          </div>
        </div>
        <Link href="/dashboard/nfc" className="app-btn app-btn-ghost shrink-0">
          <ExternalLink className="h-4 w-4" />
          Order NFC cards
        </Link>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Users;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-2.5 rounded-2xl border-2 border-sc-border-soft p-4 transition-colors hover:border-sc-gold"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sc-surface-2 text-sc-gold transition-colors group-hover:bg-sc-gold group-hover:text-sc-gold-ink">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[13px] font-black leading-tight text-sc-text">{label}</span>
    </Link>
  );
}
