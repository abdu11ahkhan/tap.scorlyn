"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  Camera,
  ExternalLink,
  IdCard,
  LayoutTemplate,
  Plus,
  SmartphoneNfc,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { readStorage, writeStorage } from "@/lib/safe-storage";
import { useClientValue } from "@/lib/use-client-value";
import NfcFormatPrompt from "@/components/card-design/NfcFormatPrompt";
import CardList, { type CardSummary } from "@/components/dashboard/CardList";
import type { CardProfile } from "@/lib/card";

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
  const [name, setName] = useState("there");
  const [card, setCard] = useState<CardRow | null>(null);
  /** Every card they own — the dashboard used to assume exactly one. */
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [taps, setTaps] = useState(0);
  const [nfcCount, setNfcCount] = useState(0);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setName(user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there");

      // RLS scopes all three to this user.
      const [{ data: cards }, { count: tapCount }, { count: cardCount }] = await Promise.all([
        supabase
          .from("card_profiles")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase.from("card_taps").select("id", { count: "exact", head: true }),
        supabase
          .from("nfc_cards")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      setCard(cards?.[0] ?? null);
      setCards((cards ?? []) as CardSummary[]);
      setTaps(tapCount ?? 0);
      setNfcCount(cardCount ?? 0);
      setLoading(false);
    };

    load();
  }, []);

  const stats = [
    { label: "taps", value: taps, icon: SmartphoneNfc },
    { label: "nfc cards linked", value: nfcCount, icon: IdCard },
    {
      label: "card status",
      value: card ? (card.published ? "live" : "hidden") : "none",
      icon: BarChart3,
    },
  ];

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

      {loading ? (
        <div className="app-panel h-28 animate-pulse" />
      ) : card ? (
        <>
          {/* Everyone who published before the design question existed never
              got asked, so there is nothing on their profile to print. This
              reaches them once, then gets out of the way. */}
          {card.published && !card.nfc_finish && !dismissed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="app-panel app-panel-pad flex flex-wrap items-center justify-between gap-4 border-acid/40"
            >
              <div className="min-w-0">
                <p className="text-sm font-black text-white">
                  Pick the NFC card you want printed
                </p>
                <p className="mt-1 text-sm font-semibold text-white/45">
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
                  className="text-sm font-bold text-white/45 transition-colors hover:text-white"
                >
                  Not now
                </button>
                <button
                  type="button"
                  onClick={() => setChoosing(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-ink bg-acid px-5 text-sm font-black uppercase tracking-tight text-ink"
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
                <p className="text-[17px] font-semibold leading-tight text-white">
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
              <Link
                href="/dashboard/card"
                className="app-btn app-btn-primary"
              >
                Edit card
              </Link>
            </div>
          </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="app-panel app-panel-pad">
                  <Icon className="mb-3 h-4 w-4 text-acid" />
                  <p className="text-2xl font-semibold capitalize tabular-nums tracking-tight text-white">
                    {s.value}
                  </p>
                  <p className="app-sub mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="app-panel app-panel-pad">
          <p className="text-[17px] font-semibold text-white">Let&apos;s create your card.</p>
          <p className="app-sub mt-1 max-w-md">
            Three ways in — all of them land in the same editor, and you can
            change anything afterward.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Link
              href="/templates/scan"
              className="group flex flex-col gap-3 rounded-2xl border-2 border-white/10 p-4 transition-colors hover:border-acid"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-acid transition-colors group-hover:bg-acid group-hover:text-ink">
                <Camera className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black text-white">Scan a business card</span>
                <span className="app-sub mt-0.5 block text-[13px]">
                  We read the details, colours and logo off a photo.
                </span>
              </span>
            </Link>
            <Link
              href="/templates"
              className="group flex flex-col gap-3 rounded-2xl border-2 border-white/10 p-4 transition-colors hover:border-acid"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-acid transition-colors group-hover:bg-acid group-hover:text-ink">
                <LayoutTemplate className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black text-white">Choose a template</span>
                <span className="app-sub mt-0.5 block text-[13px]">
                  Browse all 39 designs and pick one to start from.
                </span>
              </span>
            </Link>
            <Link
              href="/templates/minimal/edit"
              className="group flex flex-col gap-3 rounded-2xl border-2 border-white/10 p-4 transition-colors hover:border-acid"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-acid transition-colors group-hover:bg-acid group-hover:text-ink">
                <Plus className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-black text-white">Start from scratch</span>
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
