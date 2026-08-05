import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import DeveloperPortfolio from "@/templates/DeveloperPortfolio";
import DesignerPortfolio from "@/templates/DesignerPortfolio";
import AIEngineerPortfolio from "@/templates/AIEngineerPortfolio";
import BusinessPortfolio from "@/templates/BusinessPortfolio";
import MinimalPortfolio from "@/templates/MinimalPortfolio";
import CarrdSplitPortfolio from "@/templates/CarrdSplitPortfolio";
import CarrdLinksPortfolio from "@/templates/CarrdLinksPortfolio";
import FinoxPortfolio from "@/templates/FinoxPortfolio";
import GlassPortfolio from "@/templates/GlassPortfolio";
import TheoPortfolio from "@/templates/TheoPortfolio";
import ArchitectPortfolio from "@/templates/ArchitectPortfolio";
import MotionPortfolio from "@/templates/MotionPortfolio";

export const dynamic = 'force-dynamic';

export default async function WebsiteRoute({ params }: { params: Promise<{ websiteSlug: string }> }) {
  const { websiteSlug } = await params;
  
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {}
      }
    }
  );

  const { data: website, error } = await supabase
    .from('websites')
    .select('*')
    .eq('slug', websiteSlug)
    .single();

  if (error || !website) {
    return notFound();
  }

  // Parse the content_json. If it's saved by the editor, it has { blocks: [] }
  let dataToPass: any = {};
  if (website.content_json?.blocks) {
    // Map blocks back to { hero: {...}, about: {...} } format expected by templates
    website.content_json.blocks.forEach((block: any) => {
      dataToPass[block.type] = block.content;
    });
  } else {
    dataToPass = website.content_json || {};
  }

  const renderTemplate = () => {
    switch (website.template_name) {
      case "theo":
        return <TheoPortfolio data={dataToPass} />;
      case "glass-portfolio":
        return <GlassPortfolio data={dataToPass} />;
      case "finox":
        return <FinoxPortfolio data={dataToPass} />;
      case "developer":
        return <DeveloperPortfolio data={dataToPass} />;
      case "designer":
        return <DesignerPortfolio data={dataToPass} />;
      case "ai-engineer":
        return <AIEngineerPortfolio data={dataToPass} />;
      case "business":
        return <BusinessPortfolio data={dataToPass} />;
      case "architect":
        return <ArchitectPortfolio data={dataToPass} />;
      case "motion":
        return <MotionPortfolio data={dataToPass} />;
      case "minimal":
        return <MinimalPortfolio data={dataToPass} />;
      case "carrd-split":
        return <CarrdSplitPortfolio data={dataToPass} />;
      case "carrd-links":
        return <CarrdLinksPortfolio data={dataToPass} />;
      default:
        return null;
    }
  };

  const Template = renderTemplate();

  if (!Template) {
    return notFound();
  }

  return (
    <>
      {Template}
    </>
  );
}
