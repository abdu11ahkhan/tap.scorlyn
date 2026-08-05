import { Hero } from "@/components/sections/template-blocks";

export default function GlassPortfolio({ data }: { data?: any }) {
  return (
    <div className="min-h-screen font-sans">
      <Hero data={data?.hero} variant="glass-portfolio" />
    </div>
  );
}
