import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuickOrderForm from "./QuickOrderForm";

export const dynamic = "force-dynamic";

/**
 * The fast track to a physical NFC card — no profile, no template gallery.
 *
 * Reached from the homepage's "order an NFC card" button. Still requires an
 * account (the card and order need an owner), but skips straight from login
 * to "what should it open + what should it look like" — the two things that
 * actually decide what gets printed.
 */
export default async function QuickOrderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=%2Fdashboard%2Fquick-order");

  const { data: plans } = await supabase
    .from("plans")
    .select("id, name, price_pkr")
    .eq("enabled", true);

  const list = plans ?? [];
  const customPlan = list.find((p) => p.id === "custom") ?? list.find((p) => p.price_pkr > 0) ?? list[0];

  if (!customPlan) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="app-h1">not available right now</h1>
        <p className="app-sub mt-3">No printable plan is set up yet — check back soon.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 pb-16">
      <div>
        <h1 className="app-h1">order an nfc card.</h1>
        <p className="app-sub mt-2 max-w-xl">
          No profile to build — pick what a tap should do, choose a card design,
          and tell us where to send it.
        </p>
      </div>

      <QuickOrderForm plans={list} customPlanId={customPlan.id} />
    </div>
  );
}
