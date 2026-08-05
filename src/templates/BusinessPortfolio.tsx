import { Hero, Skills, Projects } from "@/components/sections/template-blocks";

export default function BusinessPortfolio({ data }: { data?: any }) {
  const safeData = data || {};
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] font-sans">
      <Hero data={safeData.hero} variant="business" />
      <Skills data={safeData.skills} variant="business" />
      <Projects data={safeData.projects} variant="business" />
    </div>
  );
}
