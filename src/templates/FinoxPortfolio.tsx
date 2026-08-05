import { Hero, About, Gallery } from "@/components/sections/template-blocks";

export default function FinoxPortfolio({ data }: { data?: any }) {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Hero data={data?.hero} variant="finox" />
      <About data={data?.about} variant="finox" />
      <Gallery data={data?.gallery} variant="finox" />
    </div>
  );
}
