import Link from "next/link";
import { Zap } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { Features } from "@/components/sections/Features";
import { Pricing } from "@/components/sections/Pricing";

export default function Home() {
  return (
    <main className="flex-1 bg-ink">
      <Navbar />
      <Hero />

      <Marquee className="bg-acid text-ink" />
      <Features />
      <Marquee reverse className="bg-hotpink text-white" />
      <Pricing />

      {/* Closing call to action */}
      <section className="grain relative overflow-hidden bg-acid py-24 text-ink">
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-[clamp(2.6rem,8vw,5.5rem)] font-black leading-[0.88] tracking-[-0.05em]">
            go make one.
            <br />
            takes 2 minutes.
          </h2>
          <Link
            href="/templates"
            className="sticker-lg sticker-press mt-10 inline-flex h-16 items-center justify-center rounded-full border-2 border-ink bg-ink px-12 text-lg font-black uppercase tracking-tight text-acid"
          >
            build my card
          </Link>
        </div>
      </section>

      <footer className="border-t-2 border-white/10 bg-ink py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-acid">
              <Zap className="h-4 w-4 fill-ink text-ink" />
            </span>
            <span className="text-xl font-black tracking-tighter text-white">klyro</span>
          </Link>

          <div className="flex items-center gap-7 text-sm font-bold text-white/50">
            <Link href="/templates" className="transition-colors hover:text-acid">
              templates
            </Link>
            <Link href="/#pricing" className="transition-colors hover:text-acid">
              pricing
            </Link>
            <Link href="/login" className="transition-colors hover:text-acid">
              log in
            </Link>
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-white/30">
            © {new Date().getFullYear()} klyro
          </p>
        </div>
      </footer>
    </main>
  );
}
