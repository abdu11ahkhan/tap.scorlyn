import { Hero } from "@/components/sections/template-blocks";

export default function TheoPortfolio({ data }: { data?: any }) {
  return (
    <div className="min-h-screen font-sans">
      <Hero data={data?.hero} variant="theo" />
    </div>
  );
}
