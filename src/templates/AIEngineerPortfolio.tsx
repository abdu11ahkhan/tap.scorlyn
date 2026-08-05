import { Hero, Skills, Projects } from "@/components/sections/template-blocks";

export default function AIEngineerPortfolio({ data }: { data?: any }) {
  const safeData = data || {};

  return (
    <div className="min-h-screen bg-[#05050A] text-gray-300 selection:bg-purple-500/30 font-sans">
      <Hero data={safeData.hero} variant="ai-engineer" />
      <Projects data={safeData.projects} variant="ai-engineer" />
      <Skills data={safeData.skills} variant="ai-engineer" />
    </div>
  );
}
