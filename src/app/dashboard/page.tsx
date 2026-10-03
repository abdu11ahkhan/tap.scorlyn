"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Check,
  Circle,
  Eye,
  LayoutTemplate,
  MessageCircle,
  Share2,
  SmartphoneNfc,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { readStorage, writeStorage } from "@/lib/safe-storage";
import { useClientValue } from "@/lib/use-client-value";
import NfcFormatPrompt from "@/components/card-design/NfcFormatPrompt";
import CorporateDashboard, { type EmployeeSummary } from "@/components/dashboard/CorporateDashboard";
import { STATUS_LABELS, statusTone } from "@/app/dashboard/orders/status";
import { buildPhysicalCardStatus, physicalCardShortLabel, type NfcAssignment } from "@/lib/nfc-lifecycle";
import type { CardButton, CardProfile } from "@/lib/card";

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
/** Dismissal of the getting-started checklist. */
const CHECKLIST_KEY = "scorlyntap_checklist_dismissed";

/** Order states after which there is nothing left to track. */
const ORDER_DONE = new Set(["delivered", "completed", "cancelled", "refunded"]);

/** The whole row: the NFC picker below renders the real card art from it. */
type CardRow = CardProfile & {
  id: string;
  /** Not on CardProfile: the templates never need to know. */
  published: boolean;
  nfc_finish: string | null;
};

type Stats = { visits: number; saves: number; whatsapp: number };

const hasKind = (buttons: CardButton[] | null | undefined, kinds: string[]) =>
  (buttons ?? []).some((b) => kinds.includes(b.kind) && b.value?.trim());

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("there");
  const [card, setCard] = useState<CardRow | null>(null);
  const [cardCount, setCardCount] = useState(0);
  const [stats, setStats] = useState<Stats>({ visits: 0, saves: 0, whatsapp: 0 });
  const [nfcCount, setNfcCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<Account | null>(null);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [latestOrder, setLatestOrder] = useState<LatestOrder | null>(null);
  const [nfcAssignments, setNfcAssignments] = useState<NfcAssignment[]>([]);
  /** Signups/orders referral_events already attributes to this user. */
  const [referralCount, setReferralCount] = useState(0);
  const [refLinkCopied, setRefLinkCopied] = useState(false);
  /** Open when they act on the banner, not on arrival. */
  const [choosing, setChoosing] = useState(false);
  /**
   * localStorage does not exist during the server render, and defaulting to
   * dismissed keeps the banners from flashing in and out.
   */
  const nfcBannerStored = useClientValue(() => readStorage("local", NFC_BANNER_KEY) === "1", true);
  const checklistStored = useClientValue(() => readStorage("local", CHECKLIST_KEY) === "1", true);
  const [nfcBannerNow, setNfcBannerNow] = useState(false);
  const [checklistNow, setChecklistNow] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const shareCard = async (username: string) => {
    const url = `${window.location.origin}/u/${username}`;
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
        router.replace("/login?next=%2Fdashboard");
        return;
      }

      setName(user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there");

      // RLS scopes every one of these to this user. Employees come back
      // empty for an individual account — cheaper than a second round-trip
      // gated on knowing account_type first.
      const [
        { data: cards },
        { count: nfcCardCount },
        { data: profile },
        { data: employeeRows },
        { data: orderRows },
        { count: referralCountRaw },
      ] = await Promise.all([
        supabase.from("card_profiles").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("nfc_cards").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("account_type, company_name, company_slug").eq("id", user.id).maybeSingle(),
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
        supabase
          .from("referral_events")
          .select("id", { count: "exact", head: true })
          .eq("referrer_user_id", user.id)
          .in("event_type", ["signup", "order"]),
      ]);

      // Last 30 days across every card they own: the three numbers that
      // answer "is this doing anything for me".
      const ids = (cards ?? []).map((c) => c.id);
      if (ids.length) {
        const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
        const { data: events } = await supabase
          .from("card_taps")
          .select("event_type")
          .in("card_profile_id", ids)
          .in("event_type", ["view", "contact_save", "whatsapp_click"])
          .gte("created_at", since)
          .limit(10_000);
        const n = (t: string) => (events ?? []).filter((e) => e.event_type === t).length;
        setStats({ visits: n("view"), saves: n("contact_save"), whatsapp: n("whatsapp_click") });
      }

      const latest = (orderRows?.[0] as LatestOrder | undefined) ?? null;

      // Same correlation the order-detail page uses: nfc_cards has no FK to
      // orders, only the card_profile_id both tables happen to share.
      let assignments: NfcAssignment[] = [];
      if (latest && latest.amount_pkr > 0 && latest.card_profile_id) {
        const { data: nfcRows } = await supabase.from("nfc_cards").select("id").eq("card_profile_id", latest.card_profile_id);

        if (nfcRows && nfcRows.length > 0) {
          const nfcIds = nfcRows.map((r) => r.id);
          const { data: tapRows } = await supabase
            .from("card_taps")
            .select("nfc_card_id, created_at")
            .in("nfc_card_id", nfcIds)
            .order("created_at", { ascending: true });

          const firstTap = new Map<string, string>();
          for (const t of tapRows ?? []) {
            if (t.nfc_card_id && !firstTap.has(t.nfc_card_id)) firstTap.set(t.nfc_card_id, t.created_at);
          }
          assignments = nfcRows.map((r) => ({ nfcCardId: r.id, firstTapAt: firstTap.get(r.id) ?? null }));
        }
      }
      setNfcAssignments(assignments);

      setCard((cards?.[0] as CardRow | undefined) ?? null);
      setCardCount(cards?.length ?? 0);
      setNfcCount(nfcCardCount ?? 0);
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

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4 pb-10">
        <div className="app-panel h-24 animate-pulse" />
        <div className="app-panel h-28 animate-pulse" />
      </div>
    );
  }

  // A genuinely different dashboard, not the individual one with a Team
  // button added — CorporateDashboard.tsx has its own header.
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

  // ---------------------------------------------------------------- no card
  if (!card) {
    return (
      <div className="max-w-3xl space-y-5 pb-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="app-h1">Hey {name}</h1>
          <p className="app-sub mt-1">Let&apos;s make your Scorlyn card. It&apos;s free and takes about two minutes.</p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StartTile
            href="/templates"
            icon={LayoutTemplate}
            title="Start with a design"
            body="Pick one of 44 designs, then add your details."
            primary
          />
          <StartTile href="/templates/scan" icon={Camera} title="Use my business card" body="Take a photo — we fill in your details for you." />
        </div>
        <Link
          href="/single/new"
          className="flex min-h-12 items-center gap-2 px-1 text-[13.5px] font-semibold text-sc-text-dim hover:text-sc-text"
        >
          <Zap className="h-4 w-4 shrink-0" />
          Only need a card that opens one link, like WhatsApp or Instagram?
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      </div>
    );
  }

  // ------------------------------------------------------------ has a card
  const placeholder = /^new-card-[a-z0-9]{1,8}$/.test(card.username);
  const live = card.published !== false && !placeholder;
  const buttons = card.buttons as CardButton[] | null;

  const isPhysicalOrder = !!latestOrder && latestOrder.amount_pkr > 0 && !!latestOrder.card_profile_id;
  const physicalStatus =
    latestOrder && isPhysicalOrder
      ? buildPhysicalCardStatus({
          order: { id: latestOrder.id, reference: latestOrder.reference, status: latestOrder.status },
          assignments: nfcAssignments,
        })
      : null;
  const hasPhysical = nfcCount > 0 || isPhysicalOrder;
  const orderOpen = !!latestOrder && !ORDER_DONE.has(latestOrder.status);

  // Getting-started checklist — real fields on their card, nothing invented.
  const checklist = [
    { label: "Card published", done: live },
    { label: "Profile photo added", done: Boolean(card.avatar_url) },
    { label: "Phone number added", done: Boolean(card.phone) || hasKind(buttons, ["phone"]) },
    { label: "WhatsApp added", done: Boolean(card.whatsapp) || hasKind(buttons, ["whatsapp"]) },
    { label: "A social link added", done: hasKind(buttons, ["instagram", "facebook", "linkedin", "x", "tiktok", "youtube"]) },
    { label: "Physical NFC card", done: hasPhysical },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checklist.length) * 100);
  const showChecklist = doneCount < checklist.length && !checklistStored && !checklistNow;
  const profileIncomplete = checklist.slice(1, 5).some((c) => !c.done);

  // One next step, picked by where they are — not every feature at once.
  const next = !live
    ? {
        title: "Publish your card",
        body: "It's saved as a draft. Publish it to get your link and QR.",
        href: `/dashboard/card?id=${card.id}`,
        cta: "Finish & publish",
        icon: ArrowRight,
      }
    : profileIncomplete && stats.visits < 5
      ? {
          title: "Complete your profile",
          body: "Cards with a photo and contact buttons get far more saves.",
          href: `/dashboard/card?id=${card.id}`,
          cta: "Edit card",
          icon: ArrowRight,
        }
      : !hasPhysical
        ? {
            title: "Get your NFC card",
            body: "Put your card on a physical NFC card — share it with one tap.",
            href: "/dashboard/nfc",
            cta: "See NFC cards",
            icon: SmartphoneNfc,
          }
        : orderOpen
          ? {
              title: "Track your order",
              body: `Order #${latestOrder!.reference} — ${STATUS_LABELS[latestOrder!.status] ?? latestOrder!.status}.`,
              href: `/dashboard/orders/${latestOrder!.id}`,
              cta: "Track order",
              icon: ArrowRight,
            }
          : {
              title: "Share your card",
              body: "Every share is another person who can save your contact.",
              href: "/dashboard/my-card",
              cta: "Share",
              icon: Share2,
            };

  return (
    <div className="max-w-3xl space-y-4 pb-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="app-h1">Hey {name}</h1>
      </motion.div>

      {/* 1 — Is my card working? */}
      <section className="app-panel app-panel-pad flex flex-wrap items-center gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            live ? "bg-sc-success/15 text-sc-success" : "bg-sc-warning/15 text-sc-warning"
          }`}
          aria-hidden
        >
          <Circle className="h-4 w-4 fill-current" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold leading-tight text-sc-text">
            {live ? "Your card is live" : "Your card is a draft"}
          </p>
          <p className="app-sub mt-0.5 truncate">
            {live ? `tap.scorlyn.com/u/${card.username}` : "Nobody can open it until you publish."}
            {cardCount > 1 && ` · ${cardCount} cards`}
          </p>
        </div>
        {live && (
          <div className="flex w-full gap-2 sm:w-auto">
            <a
              href={`/u/${card.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="app-btn app-btn-ghost min-h-11 flex-1 justify-center sm:flex-none"
            >
              <Eye className="h-4 w-4" />
              View
            </a>
            <button
              type="button"
              onClick={() => shareCard(card.username)}
              className="app-btn app-btn-ghost min-h-11 flex-1 justify-center sm:flex-none"
            >
              <Share2 className="h-4 w-4" />
              {shareCopied ? "Copied!" : "Share"}
            </button>
          </div>
        )}
      </section>

      {/* 2 — How is it performing? */}
      {live && (
        <section className="app-panel app-panel-pad">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-[13px] font-semibold text-sc-text-dim">Last 30 days</h2>
            <Link href="/dashboard/analytics" className="text-[13px] font-bold text-sc-gold-text hover:underline">
              All stats →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric icon={Eye} value={stats.visits} label="visits" />
            <Metric icon={UserPlus} value={stats.saves} label="contact saves" />
            <Metric icon={MessageCircle} value={stats.whatsapp} label="WhatsApp clicks" />
          </div>
          {stats.visits === 0 && (
            <p className="mt-3 text-[13px] text-sc-text-dimmer">
              No visits yet — share your link or tap your card on a phone to see it count.
            </p>
          )}
        </section>
      )}

      {/* 3 — What should I do next? */}
      <section className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-4 border-sc-gold/50 bg-sc-gold/5">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sc-gold-text">Next step</p>
          <p className="mt-1 text-[16px] font-semibold text-sc-text">{next.title}</p>
          <p className="app-sub mt-0.5">{next.body}</p>
        </div>
        <Link href={next.href} className="app-btn app-btn-primary min-h-12 w-full justify-center sm:w-auto">
          <next.icon className="h-4 w-4" />
          {next.cta}
        </Link>
      </section>

      {/* Getting-started checklist — quietly goes away when done or dismissed. */}
      {showChecklist && (
        <section className="app-panel app-panel-pad">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-sc-text">Your Scorlyn card is {percent}% complete</h2>
              <div className="mt-2 h-2 w-48 max-w-full overflow-hidden rounded-full bg-sc-surface-2">
                <div className="h-full rounded-full bg-sc-gold" style={{ width: `${percent}%` }} />
              </div>
            </div>
            <button
              type="button"
              aria-label="Hide checklist"
              onClick={() => {
                writeStorage("local", CHECKLIST_KEY, "1");
                setChecklistNow(true);
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sc-text-dimmer hover:bg-sc-surface-2 hover:text-sc-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2.5 text-[14px]">
                {c.done ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sc-success text-white">
                    <Check className="h-3 w-3" strokeWidth={3.5} />
                  </span>
                ) : (
                  <span className="h-5 w-5 shrink-0 rounded-full border-2 border-sc-border" />
                )}
                <span className={c.done ? "text-sc-text-dim line-through decoration-sc-text-dimmer/50" : "font-semibold text-sc-text"}>
                  {c.label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Everyone who published before the design question existed never got
          asked, so there is nothing on their profile to print. This reaches
          them once, then gets out of the way. */}
      {live && !card.nfc_finish && !nfcBannerStored && !nfcBannerNow && (
        <section className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-black text-sc-text">Pick the NFC card you want printed</p>
            <p className="mt-1 text-sm font-semibold text-sc-text-dim">
              Choose a design and we&apos;ll keep it on your profile, ready whenever you order.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                writeStorage("local", NFC_BANNER_KEY, "1");
                setNfcBannerNow(true);
              }}
              className="min-h-11 px-2 text-sm font-bold text-sc-text-dim transition-colors hover:text-sc-text"
            >
              Not now
            </button>
            <button type="button" onClick={() => setChoosing(true)} className="app-btn app-btn-primary min-h-11 rounded-full px-5">
              <SmartphoneNfc className="h-4 w-4" />
              Choose design
            </button>
          </div>
        </section>
      )}

      {/* Real order status when there is one — never a fake timeline. */}
      {latestOrder && (
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
            {physicalStatus ? physicalCardShortLabel(physicalStatus) : (STATUS_LABELS[latestOrder.status] ?? latestOrder.status)}
          </span>
        </Link>
      )}

      {/* Referral — real counts only. */}
      {live && (
        <section className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-black text-sc-text">Your referral link</p>
            <p className="app-sub mt-0.5 truncate">
              {referralCount > 0
                ? `${referralCount} signup${referralCount === 1 ? "" : "s"} or order${referralCount === 1 ? "" : "s"} so far`
                : "People who sign up through your card count here."}
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
            className="app-btn app-btn-ghost min-h-11 shrink-0"
          >
            {refLinkCopied ? "Copied!" : "Copy link"}
          </button>
        </section>
      )}

      {choosing && (
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

function Metric({ icon: Icon, value, label }: { icon: typeof Eye; value: number; label: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-sc-surface-2 p-3">
      <Icon className="h-4 w-4 text-sc-gold-text" />
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-sc-text">{value}</p>
      <p className="text-[12px] leading-tight text-sc-text-dim">{label}</p>
    </div>
  );
}

function StartTile({
  href,
  icon: Icon,
  title,
  body,
  primary = false,
}: {
  href: string;
  icon: typeof Camera;
  title: string;
  body: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex min-h-32 flex-col gap-3 rounded-2xl border-2 p-5 transition-colors ${
        primary ? "border-sc-gold bg-sc-gold/5" : "border-sc-border hover:border-sc-gold"
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sc-surface-2 text-sc-gold-text">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-[16px] font-black text-sc-text">{title}</span>
        <span className="app-sub mt-0.5 block text-[13px]">{body}</span>
      </span>
    </Link>
  );
}
