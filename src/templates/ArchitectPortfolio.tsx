import { Hero } from "@/components/sections/template-blocks";

export default function ArchitectPortfolio({ data }: { data?: any }) {
  return (
    <div className="min-h-screen bg-[#fafaf8] font-sans text-[#1c1c1e]">
      <Hero data={data?.hero} variant="architect" />
    </div>
  );
}
