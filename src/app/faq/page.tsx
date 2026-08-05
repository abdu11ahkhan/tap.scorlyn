import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ — Tapzar",
  description: "Common questions about Tapzar NFC cards.",
};

export default async function FaqPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("faqs")
    .select("id, question, answer")
    .eq("published", true)
    .order("sort_order");

  const faqs = data ?? [];

  return (
    <div className="grain relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="float-orb pointer-events-none absolute -top-32 left-1/4 h-[520px] w-[600px] rounded-full bg-acid/15 blur-[150px]" />

      <div className="relative mx-auto max-w-2xl px-6 py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/60 transition-colors hover:border-acid hover:text-acid"
        >
          ← tapzar
        </Link>

        <h1 className="mt-7 text-[clamp(2.4rem,7vw,4rem)] font-black leading-[0.9] tracking-[-0.04em]">
          questions<span className="text-acid">.</span>
        </h1>

        {faqs.length === 0 ? (
          <p className="mt-8 font-medium text-white/45">Nothing here yet.</p>
        ) : (
          <div className="mt-10 space-y-3">
            {faqs.map((f) => (
              <details
                key={f.id}
                className="group rounded-2xl border-2 border-white/12 bg-white/[0.03] p-5 open:border-acid/40"
              >
                <summary className="cursor-pointer list-none text-lg font-black tracking-tight marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {f.question}
                    <span className="shrink-0 text-acid transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-[15px] font-medium leading-relaxed text-white/60">
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
