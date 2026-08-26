import Link from "next/link";
import {  } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Features } from "@/components/sections/Features";
import { TemplateShowcase } from "@/components/sections/TemplateShowcase";
import { AudienceSplit } from "@/components/sections/AudienceSplit";
import { Pricing } from "@/components/sections/Pricing";
import { Contact } from "@/components/sections/Contact";
import BrandMark from "@/components/layout/BrandMark";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Copy the admin can change without a deploy. NULL means "use the default",
  // so an emptied field can never ship a blank headline.
  const supabase = await createClient();
  const { data: content } = await supabase
    .from("app_settings")
    .select("hero_title, hero_subtitle, pricing_note, support_whatsapp, support_email")
    .maybeSingle();

  return (
    <main className="flex-1 bg-paper">
      <Navbar />
      <Hero title={content?.hero_title} subtitle={content?.hero_subtitle} />

      <Marquee className="bg-acid text-ink" />
      <HowItWorks />
      <Features />
      <Marquee reverse className="bg-teal text-white" />
      <TemplateShowcase />
      <AudienceSplit />
      <Pricing note={content?.pricing_note} />
      <Contact
        whatsapp={content?.support_whatsapp}
        email={content?.support_email}
      />

      {/* Closing call to action */}
      <section className="relative overflow-hidden bg-paper py-24 text-ink">
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-[clamp(2.6rem,8vw,5.5rem)] font-black leading-[0.88] tracking-[-0.05em] text-ink">
            go make <span className="text-teal">one.</span>
            <br />
            takes 2 minutes.
          </h2>
          <Link
            href="/templates"
            className="sticker-lg sticker-press mt-10 inline-flex h-16 items-center justify-center rounded-full bg-teal px-12 text-lg font-black uppercase tracking-tight text-white"
          >
            build my card
          </Link>
        </div>
      </section>

      <footer className="border-t border-line bg-mist py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={36} />
            <span className="text-xl font-black tracking-tighter text-ink">ScorlynTap</span>
          </Link>

          {/* inline-flex + min-h-11 so each link is a thumb-sized target, not
              just a 20px line of text. */}
          <div className="flex items-center gap-4 text-sm font-bold text-ink-dim sm:gap-7">
            <Link
              href="/templates"
              className="inline-flex min-h-11 items-center px-1 transition-colors hover:text-teal"
            >
              templates
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex min-h-11 items-center px-1 transition-colors hover:text-teal"
            >
              pricing
            </Link>
            <Link
              href="/#contact"
              className="inline-flex min-h-11 items-center px-1 transition-colors hover:text-teal"
            >
              contact
            </Link>
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-ink-dim">
            © {new Date().getFullYear()} ScorlynTap
          </p>
        </div>
      </footer>
    </main>
  );
}
