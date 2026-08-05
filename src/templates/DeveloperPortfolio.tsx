import { Hero, Skills, Projects } from "@/components/sections/template-blocks";

export default function DeveloperPortfolio({ data }: { data?: any }) {
  const safeData = data || {};
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-primary/30 font-sans">
      <Hero data={safeData.hero} variant="developer" />
      <Skills data={safeData.skills} variant="developer" />
      <Projects data={safeData.projects} variant="developer" />
    </div>
  );
}
