import { createClient } from "@/lib/supabase/server";
import ContentForm from "./ContentForm";

export const dynamic = "force-dynamic";

export default async function AdminContent() {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("*").maybeSingle();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="app-h1">Content</h1>
        <p className="app-sub mt-1">
          Words on the public site. Changes go live immediately — no deploy.
        </p>
      </div>

      <ContentForm
        initial={{
          heroTitle: data?.hero_title ?? "",
          heroSubtitle: data?.hero_subtitle ?? "",
          pricingNote: data?.pricing_note ?? "",
          supportWhatsapp: data?.support_whatsapp ?? "",
          supportEmail: data?.support_email ?? "",
        }}
      />
    </div>
  );
}
