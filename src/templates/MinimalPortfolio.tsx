import { Hero, Skills, Projects } from "@/components/sections/template-blocks";

export default function MinimalPortfolio({ data }: { data?: any }) {
  const safeData = data || {};
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <Hero data={safeData.hero} variant="minimal" />
      <Skills data={safeData.skills} variant="minimal" />
      <Projects data={safeData.projects} variant="minimal" />
    </div>
  );
}
