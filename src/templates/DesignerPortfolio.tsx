import { Hero, Skills, Projects } from "@/components/sections/template-blocks";

export default function DesignerPortfolio({ data }: { data?: any }) {
  const safeData = data || {};

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white font-sans">
      <Hero data={safeData.hero} variant="designer" />
      <Projects data={safeData.projects} variant="designer" />
      <Skills data={safeData.skills} variant="designer" />
    </div>
  );
}
