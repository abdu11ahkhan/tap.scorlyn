import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Features } from "@/components/sections/Features";
import { TemplateShowcase } from "@/components/sections/TemplateShowcase";
import { AudienceSplit } from "@/components/sections/AudienceSplit";
import { Pricing } from "@/components/sections/Pricing";
import { Contact } from "@/components/sections/Contact";
import { SEOContent } from "@/components/sections/SEOContent";
import SiteFooter from "@/components/layout/SiteFooter";
import BuildMyCardButton from "@/components/nfc/BuildMyCardButton";
import { createClient } from "@supabase/supabase-js";

// Cached at the edge rather than rendered per visit: the only data here is
// public site copy, and every save in the admin content/settings pages
// already calls revalidatePath("/", "layout"), so edits still show at once.
// Per-visit rendering meant the first visitor after each deploy waited out a
// cold start (~9s measured).
export const revalidate = 300;

export default async function Home() {
  // Copy the admin can change without a deploy. NULL means "use the default",
  // so an emptied field can never ship a blank headline.
  // Cookieless on purpose — reading the session would force per-request
  // rendering, and nothing here depends on who is looking.
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data: content } = await supabase
    .from("app_settings")
    .select("hero_title, hero_subtitle, pricing_note, support_whatsapp, support_email")
    .maybeSingle();

  return (
    <main className="flex-1 bg-cream">
      <Navbar />
      <Hero title={content?.hero_title} subtitle={content?.hero_subtitle} />

      <Marquee className="bg-sun text-char" />
      <HowItWorks />
      <Features />
      <Marquee reverse className="bg-char text-sun" />
      <TemplateShowcase />
      <AudienceSplit />
      <Pricing note={content?.pricing_note} />
      <Contact
        whatsapp={content?.support_whatsapp}
        email={content?.support_email}
      />

      <SEOContent />

      {/* Closing call to action */}
      <section className="dot-grid-light relative overflow-hidden border-b-[3px] border-char bg-sea py-24">
        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-6">
          <h2 className="display text-[clamp(3rem,10vw,6.5rem)] text-white">
            Go make{" "}
            <span className="brut inline-block -rotate-2 bg-white px-3 pt-1 text-sun">one</span>
            <br />
            takes 2 minutes.
          </h2>
          <BuildMyCardButton className="brut brut-press mt-10 inline-flex h-16 items-center justify-center rounded-full bg-sun px-12 text-lg font-black uppercase tracking-tight text-char" />
        </div>
      </section>

      <SiteFooter whatsapp={content?.support_whatsapp} email={content?.support_email} />
    </main>
  );
}
