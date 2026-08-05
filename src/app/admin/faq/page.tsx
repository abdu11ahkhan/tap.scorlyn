import { createClient } from "@/lib/supabase/server";
import FaqEditor from "./FaqEditor";

export const dynamic = "force-dynamic";

export default async function AdminFaq() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("id, question, answer, sort_order, published")
    .order("sort_order");

  return (
    <div className="max-w-3xl space-y-5">
      <header>
        <h1 className="app-h1">FAQ</h1>
        <p className="app-sub mt-1">
          Shown publicly at <code className="text-acid">/faq</code>. Unpublished
          entries stay hidden.
        </p>
      </header>

      {error && (
        <p className="app-panel app-panel-pad text-[13px] font-medium text-hotpink">
          {error.message}
        </p>
      )}

      <FaqEditor items={data ?? []} />
    </div>
  );
}
