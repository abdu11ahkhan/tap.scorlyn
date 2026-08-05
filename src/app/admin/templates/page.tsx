import { Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CARD_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/card";
import TemplateRow from "./TemplateRow";

export const dynamic = "force-dynamic";

type Settings = {
  template_id: string;
  enabled: boolean;
  name: string | null;
  blurb: string | null;
  category: string | null;
  sort_order: number;
  is_new: boolean;
};

export default async function AdminTemplates() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("template_settings").select("*");

  const byId = new Map<string, Settings>(
    (data ?? []).map((s: Settings) => [s.template_id, s])
  );

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-4xl font-black tracking-tighter">
          templates<span className="text-acid">.</span>
        </h1>
        <p className="mt-2 max-w-2xl font-medium text-white/50">
          {CARD_TEMPLATES.length} designs across {TEMPLATE_CATEGORIES.length} sectors.
          Control which are offered, what they&apos;re called and where they sit.
        </p>
      </div>

      {/* Being straight about the limit rather than implying a UI can author React. */}
      <div className="flex items-start gap-4 rounded-2xl border-2 border-white/12 bg-white/[0.03] p-5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-acid" />
        <div className="text-sm font-medium text-white/55">
          <p className="font-black text-white">Adding a brand-new design needs code.</p>
          <p className="mt-1">
            Each template is a React component in{" "}
            <code className="text-acid">src/components/card-templates/</code>, registered
            in that folder&apos;s <code className="text-acid">index.tsx</code> and listed
            in <code className="text-acid">src/lib/card.ts</code>. Add those three and it
            appears here automatically, ready to configure. What this page controls is the
            catalogue: what&apos;s live, its name, sector and order.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">
          {error.message}
        </div>
      )}

      {TEMPLATE_CATEGORIES.map((category) => {
        const inCategory = CARD_TEMPLATES.filter((t) => {
          const override = byId.get(t.id)?.category;
          return (override ?? t.category) === category.id;
        });
        if (inCategory.length === 0) return null;

        return (
          <section key={category.id}>
            <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.25em] text-white/35">
              {category.name} · {inCategory.length}
            </h2>
            <div className="space-y-3">
              {inCategory.map((t) => (
                <TemplateRow
                  key={t.id}
                  templateId={t.id}
                  defaults={{ name: t.name, blurb: t.blurb, category: t.category }}
                  settings={byId.get(t.id) ?? null}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
