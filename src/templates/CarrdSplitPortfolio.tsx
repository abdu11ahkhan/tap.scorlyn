import { Hero, Skills, Projects } from "@/components/sections/template-blocks";

export default function CarrdSplitPortfolio({ data }: { data?: any }) {
  const safeData = data || {};
  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans flex items-center justify-center">
      <Hero data={safeData.hero} variant="carrd-split" />
    </div>
  );
}
