import { Hero } from "@/components/sections/template-blocks";

export default function CarrdLinksPortfolio({ data }: { data?: any }) {
  const safeData = data || {};
  return (
    <div className="min-h-screen bg-[#23222A] text-white font-serif flex items-center justify-center">
      <Hero data={safeData.hero} variant="carrd-links" />
    </div>
  );
}
