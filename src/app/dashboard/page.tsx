"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Camera,
  ExternalLink,
  IdCard,
  LayoutTemplate,
  Pencil,
  Plus,
  Share2,
  SmartphoneNfc,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { readStorage, writeStorage } from "@/lib/safe-storage";
import { useClientValue } from "@/lib/use-client-value";
import NfcFormatPrompt from "@/components/card-design/NfcFormatPrompt";
import CardList, { type CardSummary } from "@/components/dashboard/CardList";
import CorporateDashboard, { type EmployeeSummary } from "@/components/dashboard/CorporateDashboard";
import { STATUS_LABELS, statusTone } from "@/app/dashboard/orders/status";
import { buildPhysicalCardStatus, physicalCardShortLabel, type NfcAssignment } from "@/lib/nfc-lifecycle";
import type { CardProfile } from "@/lib/card";

type Account = { type: "individual" | "corporate"; companyName: string | null; companySlug: string | null };
type LatestOrder = {
  id: string;
  reference: string;
  status: string;
  amount_pkr: number;
  card_profile_id: string | null;
};

/** Dismissal of the "choose your printed card" banner. */
const NFC_BANNER_KEY = "scorlyntap_nfc_banner_dismissed";

/** The whole row: the NFC picker below renders the real card art from it. */
type CardRow = CardProfile & {
  id: string;
  /** Not on CardProfile: the templates never need to know. */
  published: boolean;
  nfc_finish: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("there");
  const [card, setCard] = useState<CardRow | null>(null);
  /** Every card they own — the dashboard used to assume exactly one. */
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [taps, setTaps] = useState(0);
  const [nfcCount, setNfcCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<Account | null>(null);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [latestOrder, setLatestOrder] = useState<LatestOrder | null>(null);
  const [nfcAssignments, setNfcAssignments] = useState<NfcAssignment[]>([]);
  /** Signups/orders referral_events already attributes to this user — the
   *  referral loop (src/lib/referral.ts, ReferralBanner) has always tracked
   *  this, it just never showed the referrer anything. */
  const [referralCount, setReferralCount] = useState(0);
  const [refLinkCopied, setRefLinkCopied] = useState(false);
  /** Open when they act on the banner, not on arrival — nobody wants a modal
   *  thrown at them for something they did not ask for. */
  const [choosing, setChoosing] = useState(false);
  /**
   * localStorage does not exist during the server render, and defaulting to
   * dismissed keeps the banner from flashing in and out. Read through the
   * store rather than filled in from an effect, so it arrives on the first
   * client render instead of costing a second one.
   */
  const stored = useClientValue(() => readStorage("local", NFC_BANNER_KEY) === "1", true);
  const [dismissedNow, setDismissedNow] = useState(false);
  const dismissed = stored || dismissedNow;
  const [shareCopied, setShareCopied] = useState(false);

  const shareCard = async (username: string) => {
    const url = `${window.location.origin}/u/${username}`;
    // Native share sheet where it exists (mobile, mostly) — a link copied to
    // the clipboard with no feedback is what "sharing" used to mean here.
    if (navigator.share) {
      try {
        await navigator.share({ title: "My digital card", url });
        return;
      } catch {
        // Cancelled or unsupported mid-call — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard needs a secure context; nothing useful to do beyond this.
    }
  };

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Every sibling dashboard route (analytics, admin) already does
        // this — this was the one page that instead silently rendered the
        // empty-account shell for a logged-out visitor, which reads as
        // "you have no card yet" rather than "you're not signed in."
        router.replace("/login?next=%2Fdashboard");
        return;
      }

      setName(user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there");

      // RLS scopes every one of these to this user. Employees and the
      // company's own row on card_profiles/orders simply come back empty for
      // an individual account — cheaper than a second round-trip gated on
      // knowing account_type first.
      const [
        { data: cards },
        { count: tapCount },
        { count: cardCount },
        { data: profile },
        { data: employeeRows },
        { data: orderRows },
        { count: referralCountRaw },
      ] = await Promise.all([
        supabase
          .from("card_profiles")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        // event_type filter keeps this a page-view count now that card_taps
        // also records clicks/saves/shares/QR opens (Phase 7) — without it
        // this would silently start counting every interaction, not visits.
        supabase.from("card_taps").select("id", { count: "exact", head: true }).eq("event_type", "view"),
        supabase
          .from("nfc_cards")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("account_type, company_name, company_slug")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("card_profiles")
          .select("id, username, full_name, headline, published, owner_suspended")
          .eq("org_owner_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id, reference, status, amount_pkr, card_profile_id")
          .order("created_at", { ascending: false })
          .limit(1),
        // "Referrers can read their own referral events." (auth.uid() =
        // referrer_user_id) already covers this — no new policy needed.
        // signup/order are real conversions; banner_view/banner_click are
        // just impressions, not counted here.
        supabase
          .from("referral_events")
          .select("id", { count: "exact", head: true })
          .eq("referrer_user_id", user.id)
          .in("event_type", ["signup", "order"]),
      ]);

      const latest = (orderRows?.[0] as LatestOrder | undefined) ?? null;

      // Same correlation the order-detail page uses: nfc_cards has no FK to
      // orders, only the card_profile_id both tables happen to share.
      let assignments: NfcAssignment[] = [];
      if (latest && latest.amount_pkr > 0 && latest.card_profile_id) {
        const { data: nfcRows } = await supabase
          .from("nfc_cards")
          .select("id")
          .eq("card_profile_id", latest.card_profile_id);

        if (nfcRows && nfcRows.length > 0) {
          const ids = nfcRows.map((r) => r.id);
          const { data: tapRows } = await supabase
            .from("card_taps")
            .select("nfc_card_id, created_at")
            .in("nfc_card_id", ids)
            .order("created_at", { ascending: true });

          const firstTap = new Map<string, string>();
          for (const t of tapRows ?? []) {
            if (t.nfc_card_id && !firstTap.has(t.nfc_card_id)) {
              firstTap.set(t.nfc_card_id, t.created_at);
            }
          }
          assignments = nfcRows.map((r) => ({
            nfcCardId: r.id,
            firstTapAt: firstTap.get(r.id) ?? null,
          }));
        }
      }
      setNfcAssignments(assignments);

      setCard(cards?.[0] ?? null);
      setCards((cards ?? []) as CardSummary[]);
      setTaps(tapCount ?? 0);
      setNfcCount(cardCount ?? 0);
      setAccount(
        profile
          ? {
              type: profile.account_type === "corporate" ? "corporate" : "individual",
              companyName: profile.company_name,
              companySlug: profile.company_slug,
            }
          : null
      );
      setEmployees((employeeRows ?? []) as EmployeeSummary[]);
      setLatestOrder(latest);
      setReferralCount(referralCountRaw ?? 0);
      setLoading(false);
    };

    load();
  }, [router]);

  const isPhysicalOrder = !!latestOrder && latestOrder.amount_pkr > 0 && !!latestOrder.card_profile_id;
  const physicalStatus =
    latestOrder && isPhysicalOrder
      ? buildPhysicalCardStatus({
          order: { id: latestOrder.id, reference: latestOrder.reference, status: latestOrder.status },
          assignments: nfcAssignments,
        })
      : null;

  const stats = [
    { label: "taps", value: taps, icon: SmartphoneNfc },
    { label: "nfc cards linked", value: nfcCount, icon: IdCard },
    {
      label: "card status",
      value: card ? (card.published ? "live" : "hidden") : "none",
      icon: BarChart3,
    },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl space-y-5 pb-16">
        <div className="app-panel h-28 animate-pulse" />
      </div>
    );
  }

  // A genuinely different dashboard, not the individual one with a Team
  // button added — CorporateDashboard.tsx has its own header, so this
  // returns instead of falling into the individual JSX below.
  if (account?.type === "corporate") {
    return (
      <CorporateDashboard
        name={name}
        companyName={account.companyName}
        companySlug={account.companySlug}
        employees={employees}
        nfcCount={nfcCount}
      />
    );
  }

  return (
    <div className="max-w-4xl space-y-5 pb-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="app-h1">Hey {name}</h1>
        <p className="app-sub mt-1">
          {card
            ? "Your card is set up. Here's how it's doing."
            : "Let's get your card built — it takes about two minutes."}
        </p>
      </motion.div>

      {card ? (
        <>
          {/* Everyone who published before the design question existed never
              got asked, so there is nothing on their profile to print. This
              reaches them once, then gets out of the way. */}
          {card.published && !card.nfc_finish && !dismissed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-4 border-sc-gold/40"
            >
              <div className="min-w-0">
                <p className="text-sm font-black text-sc-text">
                  Pick the NFC card you want printed
                </p>
                <p className="mt-1 text-sm font-semibold text-sc-text-dim">
                  Choose a design and we will keep it on your profile, ready
                  whenever you order. Takes a few seconds.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    writeStorage("local", NFC_BANNER_KEY, "1");
                    setDismissedNow(true);
                  }}
                  className="text-sm font-bold text-sc-text-dim transition-colors hover:text-sc-text"
                >
                  Not now
                </button>
                <button
                  type="button"
                  onClick={() => setChoosing(true)}
                  className="app-btn app-btn-primary rounded-full px-5"
                >
                  <SmartphoneNfc className="h-4 w-4" />
                  Choose design
                </button>
              </div>
            </motion.div>
          )}

          {/* Always: this is also where "new card" lives, so gating it on
              already having two made a second card impossible to create. */}
          <CardList cards={cards} />

          {/* The card itself — only when there is exactly one, otherwise the
              list above already says everything this does. */}
          {cards.length <= 1 && (
          <div className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                style={{ background: card.accent_color || "#111111", color: "#fff" }}
              >
                {card.full_name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-[17px] font-semibold leading-tight text-sc-text">
                  {card.full_name}
                </p>
                <p className="app-sub mt-0.5">
                  {card.headline || "No headline yet"} · {card.template}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/u/${card.username}`}
                target="_blank"
                className="app-btn app-btn-ghost"
              >
                <ExternalLink className="h-4 w-4" />
                /u/{card.username}
              </Link>
              <button
                type="button"
                onClick={() => shareCard(card.username)}
                className="app-btn app-btn-ghost"
              >
                <Share2 className="h-4 w-4" />
                {shareCopied ? "Copied!" : "Share"}
              </button>
              <Link
                href="/dashboard/card"
                className="app-btn app-btn-primary"
              >
                Edit card
              </Link>
            </div>
          </div>
          )}

          {/* Quick actions — the things an owner comes back to do again and
              again, not buried in the sidebar. */}
          {cards.length <= 1 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <QuickAction href="/dashboard/card" icon={Pencil} label="Edit card" />
              <QuickAction
                href="#"
                icon={Share2}
                label={shareCopied ? "Copied!" : "Share card"}
                onClick={(e) => {
                  e.preventDefault();
                  shareCard(card.username);
                }}
              />
              <QuickAction href="/templates/scan" icon={Camera} label="Scan a card" />
              <QuickAction href="/dashboard/nfc" icon={SmartphoneNfc} label="Get NFC card" />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="app-panel app-panel-pad">
                  <Icon className="mb-3 h-4 w-4 text-sc-gold-text" />
                  <p className="text-2xl font-semibold capitalize tabular-nums tracking-tight text-sc-text">
                    {s.value}
                  </p>
                  <p className="app-sub mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* The referral loop (src/lib/referral.ts, ReferralBanner on every
              public card page) has always tracked this via referral_events —
              it just never showed the referrer their own link or whether it
              was working. Real counts only; nothing here is invented. */}
          {card.username && (
            <div className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-black text-sc-text">Your referral link</p>
                <p className="app-sub mt-0.5 truncate">
                  {referralCount > 0
                    ? `${referralCount} signup${referralCount === 1 ? "" : "s"} or order${referralCount === 1 ? "" : "s"} so far`
                    : "Share it — people who sign up through it count here."}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const url = `${window.location.origin}/u/${card.username}${card.referral_code ? `?ref=${card.referral_code}` : ""}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    setRefLinkCopied(true);
                    setTimeout(() => setRefLinkCopied(false), 1800);
                  } catch {
                    // Clipboard needs a secure context; nothing useful to do beyond this.
                  }
                }}
                className="app-btn app-btn-ghost shrink-0"
              >
                {refLinkCopied ? "Copied!" : "Copy link"}
              </button>
            </div>
          )}

          {/* Real order status when there is one to show — never a fake
              timeline for an order that doesn't exist. For a physical order,
              the label answers "what's happening with my physical card",
              not just the raw order status — assignment and first-tap are
              states orders.status alone can't express. */}
          {latestOrder ? (
            <Link
              href={`/dashboard/orders/${latestOrder.id}`}
              className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-4 transition-colors hover:border-sc-gold/50"
            >
              <div className="min-w-0">
                <p className="text-sm font-black text-sc-text">Your physical card</p>
                <p className="app-sub mt-0.5">Order #{latestOrder.reference}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-tight ${
                  physicalStatus
                    ? statusTone(physicalStatus.assignments.some((a) => a.firstTapAt) ? "delivered" : latestOrder.status)
                    : statusTone(latestOrder.status)
                }`}
              >
                {physicalStatus
                  ? physicalCardShortLabel(physicalStatus)
                  : (STATUS_LABELS[latestOrder.status] ?? latestOrder.status)}
              </span>
            </Link>
          ) : (
            <div className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-black text-sc-text">Get your NFC card</p>
                <p className="app-sub mt-0.5">Order the physical card that shares this with one tap.</p>
              </div>
              <Link href="/dashboard/nfc" className="app-btn app-btn-primary shrink-0">
                <SmartphoneNfc className="h-4 w-4" />
                Get NFC card
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="app-panel app-panel-pad">
          <p className="text-[17px] font-semibold text-sc-text">Let&apos;s create your card.</p>
          <p className="app-sub mt-1 max-w-md">
            Three ways in — all of them land in the same editor, and you can
            change anything afterward.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link
              href="/templates/scan"
              className="group flex flex-col gap-3 rounded-2xl border-2 border-sc-border p-4 transition-colors hover:border-sc-gold"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sc-surface-2 text-sc-gold-text transition-colors group-hover:bg-sc-gold group-hover:text-sc-gold-ink">
                <Camera className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black text-sc-text">Scan a business card</span>
                <span className="app-sub mt-0.5 block text-[13px]">
                  We read the details, colours and logo off a photo.
                </span>
              </span>
            </Link>
            <Link
              href="/templates"
              className="group flex flex-col gap-3 rounded-2xl border-2 border-sc-border p-4 transition-colors hover:border-sc-gold"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sc-surface-2 text-sc-gold-text transition-colors group-hover:bg-sc-gold group-hover:text-sc-gold-ink">
                <LayoutTemplate className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black text-sc-text">Choose a template</span>
                <span className="app-sub mt-0.5 block text-[13px]">
                  Browse all 36 designs and pick one to start from.
                </span>
              </span>
            </Link>
            <Link
              href="/templates/minimal/edit"
              className="group flex flex-col gap-3 rounded-2xl border-2 border-sc-border p-4 transition-colors hover:border-sc-gold"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sc-surface-2 text-sc-gold-text transition-colors group-hover:bg-sc-gold group-hover:text-sc-gold-ink">
                <Plus className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black text-sc-text">Start from scratch</span>
                <span className="app-sub mt-0.5 block text-[13px]">
                  A blank card, ready to fill in yourself.
                </span>
              </span>
            </Link>
          </div>
        </div>
      )}
      {choosing && card && (
        <NfcFormatPrompt
          card={card}
          cardId={card.id}
          onDone={(finish) => {
            setChoosing(false);
            if (finish) setCard({ ...card, nfc_finish: finish });
          }}
        />
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: typeof SmartphoneNfc;
  label: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex flex-col items-start gap-2.5 rounded-2xl border-2 border-sc-border p-4 transition-colors hover:border-sc-gold"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sc-surface-2 text-sc-gold-text transition-colors group-hover:bg-sc-gold group-hover:text-sc-gold-ink">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[13px] font-black leading-tight text-sc-text">{label}</span>
    </Link>
  );
}
