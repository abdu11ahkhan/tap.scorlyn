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
          {/* The card itself */}
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

          <Link
            href="/dashboard/analytics"
            className="app-btn app-btn-ghost group"
          >
            See full analytics
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </>
      ) : (
        <div className="app-panel app-panel-pad">
          <p className="text-[17px] font-semibold text-white">No card yet.</p>
          <p className="app-sub mt-1 max-w-md">
            Pick a template, fill in your details, and publish. You can change the
            design any time without reprinting anything.
          </p>
          <Link
            href="/templates"
            className="app-btn app-btn-primary mt-5"
          >
            <Plus className="h-4 w-4" />
            Build my card
          </Link>
        </div>
      )}
    </div>
  );
}
