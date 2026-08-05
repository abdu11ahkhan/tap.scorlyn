import { Hero } from "@/components/sections/template-blocks";

export default function MotionPortfolio({ data }: { data?: any }) {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans">
      <Hero data={data?.hero} variant="motion" />
    </div>
  );
}
