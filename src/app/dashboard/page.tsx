"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  ExternalLink,
  IdCard,
  Plus,
  SmartphoneNfc,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type CardRow = {
  username: string;
  full_name: string;
  headline: string | null;
  template: string;
  published: boolean;
  accent_color: string | null;
};

export default function DashboardPage() {
  const [name, setName] = useState("there");
  const [card, setCard] = useState<CardRow | null>(null);
  const [taps, setTaps] = useState(0);
  const [nfcCount, setNfcCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
          .select("username, full_name, headline, template, published, accent_color")
          .eq("user_id", user.id)
          .maybeSingle()
          .then((r) => ({ data: r.data ? [r.data] : [] })),
        supabase.from("card_taps").select("id", { count: "exact", head: true }),
        supabase
          .from("nfc_cards")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      setCard(cards[0] ?? null);
      setTaps(tapCount ?? 0);
      setNfcCount(cardCount ?? 0);
      setLoading(false);
    };

    load();
  }, []);

  const stats = [
    { label: "taps", value: taps, icon: SmartphoneNfc, tile: "bg-acid text-ink" },
    { label: "nfc cards linked", value: nfcCount, icon: IdCard, tile: "bg-hotpink text-white" },
    {
      label: "card status",
      value: card ? (card.published ? "live" : "hidden") : "none",
      icon: BarChart3,
      tile: "bg-violet-pop text-white",
    },
  ];

  return (
    <div className="max-w-5xl space-y-8 pb-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black tracking-tighter text-white">
          hey {name}<span className="text-acid">.</span>
        </h1>
        <p className="mt-2 font-medium text-white/50">
          {card
            ? "Your card is set up. Here's how it's doing."
            : "Let's get your card built — it takes about two minutes."}
        </p>
      </motion.div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl border-2 border-white/10 bg-white/[0.03]" />
      ) : card ? (
        <>
          {/* The card itself */}
          <div className="sticker-lg flex flex-wrap items-center justify-between gap-5 rounded-2xl border-2 border-ink bg-white p-6 text-ink">
            <div className="flex items-center gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-ink text-lg font-black"
                style={{ background: card.accent_color || "#111111", color: "#fff" }}
              >
                {card.full_name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-2xl font-black leading-none tracking-tight">
                  {card.full_name}
                </p>
                <p className="mt-1 text-sm font-bold text-ink/50">
                  {card.headline || "No headline yet"} · {card.template}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/u/${card.username}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink px-5 py-3 text-sm font-black lowercase transition-colors hover:bg-ink hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
                /u/{card.username}
              </Link>
              <Link
                href="/dashboard/card"
                className="sticker sticker-press inline-flex items-center gap-2 rounded-full border-2 border-ink bg-acid px-5 py-3 text-sm font-black uppercase tracking-tight"
              >
                edit card
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className={`sticker-lg rounded-2xl border-2 border-ink p-5 ${s.tile}`}
                >
                  <Icon className="mb-4 h-5 w-5" />
                  <p className="text-4xl font-black lowercase tabular-nums tracking-tighter">
                    {s.value}
                  </p>
                  <p className="mt-1 text-sm font-black lowercase">{s.label}</p>
                </div>
              );
            })}
          </div>

          <Link
            href="/dashboard/analytics"
            className="group inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-6 py-3.5 font-black lowercase text-white/70 transition-colors hover:border-acid hover:text-acid"
          >
            see full analytics
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </>
      ) : (
        <div className="sticker-lg rounded-2xl border-2 border-ink bg-acid p-8 text-ink">
          <p className="text-2xl font-black tracking-tight">No card yet.</p>
          <p className="mt-2 max-w-md font-semibold opacity-70">
            Pick a template, fill in your details, and publish. You can change the
            design any time without reprinting anything.
          </p>
          <Link
            href="/templates"
            className="sticker sticker-press mt-6 inline-flex h-14 items-center gap-2 rounded-full border-2 border-ink bg-ink px-8 font-black uppercase tracking-tight text-acid"
          >
            <Plus className="h-4 w-4" />
            build my card
          </Link>
        </div>
      )}
    </div>
  );
}
