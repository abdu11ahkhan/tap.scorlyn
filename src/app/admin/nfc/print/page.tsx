import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { cardUrl, formatActivationCode, formatSerial } from "@/lib/card-codes";
import { STATUS_FILTERS, loadCards } from "../load-cards";
import PrintSheet from "./PrintSheet";

export const dynamic = "force-dynamic";

export default async function PrintCenter({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; batch?: string }>;
}) {
  const params = await searchParams;
  const batch = params.batch && /^[0-9a-f-]{36}$/.test(params.batch) ? params.batch : undefined;
  const status = STATUS_FILTERS.some((s) => s.id === params.status) ? params.status : batch ? "all" : "in_stock";

  const host = (await headers()).get("host") ?? "";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  const supabase = await createClient();
  const cards = await loadCards(supabase, { status, batch, sort: "serial" });

  return (
    <div className="space-y-5">
      <Link href="/admin/nfc" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-sc-text-dim hover:text-acid print:hidden">
        <ArrowLeft className="h-4 w-4" /> all cards
      </Link>
      <div className="print:hidden">
        <h1 className="app-h1">Print center</h1>
        <p className="app-sub mt-1 max-w-2xl">
          {cards.length} card{cards.length === 1 ? "" : "s"} {batch ? "in this batch" : `· ${status?.replace("_", " ")}`}.
          Change the filter on the cards page to print a different set.
        </p>
      </div>
      {cards.length === 0 ? (
        <p className="app-panel app-panel-pad text-center text-sm font-semibold text-sc-text-dimmer">Nothing to print for this filter.</p>
      ) : (
        <PrintSheet
          cards={cards.map((c) => ({
            id: c.id,
            serial: formatSerial(c.serial),
            url: cardUrl(origin, c.card_url, "qr"),
            nickname: c.nickname,
            activation: formatActivationCode(c.activation_code),
          }))}
        />
      )}
    </div>
  );
}
