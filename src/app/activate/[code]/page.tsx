import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Lock, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CARD_TEMPLATES } from "@/lib/card";
import { formatSerial, isCardCode } from "@/lib/card-codes";
import BrandMark from "@/components/layout/BrandMark";
import RequestForm from "./RequestForm";
import CardPicker, { type MyPage } from "./CardPicker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Activate your card", robots: { index: false, follow: false } };

type Status = {
  exists: boolean;
  serial?: number;
  status?: string;
  claimable?: boolean;
  pending_other?: boolean;
  my_claim?: string | null;
  is_owner?: boolean;
};

function Shell({ serial, children }: { serial?: number; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sc-bg font-sans text-sc-text">
      <div className="mx-auto max-w-xl px-5 pb-16 pt-[max(2rem,env(safe-area-inset-top))]">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark size={30} />
            <span className="text-lg font-black tracking-tighter">ScorlynTap</span>
          </Link>
          {serial != null && (
            <span className="rounded-full border-2 border-sc-border px-3 py-1 font-mono text-xs font-bold text-sc-text-dim">
              {formatSerial(serial)}
            </span>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}

function Message({ icon: Icon, title, body }: { icon: typeof Clock; title: string; body: React.ReactNode }) {
  return (
    <div className="app-panel app-panel-pad space-y-3 text-center">
      <Icon className="mx-auto h-8 w-8 text-sc-text-dim" />
      <h1 className="text-2xl font-black">{title}</h1>
      <div className="text-sm font-medium leading-relaxed text-sc-text-dim">{body}</div>
    </div>
  );
}

/**
 * Where a scanned, unclaimed card lands. Walks the customer through sign-in,
 * claiming (instantly with the activation code, or by request), and choosing
 * what the card opens. Every decision is made by database functions keyed to
 * the signed-in user — this page only displays what they report.
 */
export default async function ActivateCard({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!isCardCode(code)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase.rpc("card_claim_status", { p_code: code });
  const s = (data ?? { exists: false }) as Status;
  if (!s.exists) notFound();

  const next = encodeURIComponent(`/activate/${code}`);

  if (s.is_owner) {
    const { data: pages } = await supabase
      .from("card_profiles")
      .select("id, username, full_name, template, is_single_purpose")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: true });
    const myPages: MyPage[] = (pages ?? []).map((p) => ({
      id: p.id,
      name: p.full_name,
      username: p.username,
      kind: p.is_single_purpose ? "Single link" : CARD_TEMPLATES.find((t) => t.id === p.template)?.name ?? p.template,
    }));
    return (
      <Shell serial={s.serial}>
        <CardPicker code={code} pages={myPages} active={s.status === "active"} />
      </Shell>
    );
  }

  if (s.status !== "in_stock") {
    return (
      <Shell serial={s.serial}>
        <Message
          icon={Lock}
          title="This card is already in use"
          body="It belongs to someone else. If you bought it, contact ScorlynTap and we'll sort it out."
        />
      </Shell>
    );
  }

  if (!s.claimable) {
    return (
      <Shell serial={s.serial}>
        <Message icon={Lock} title="This card isn't ready yet" body="It hasn't been set up for activation. If it's in your hands, message ScorlynTap and we'll switch it on." />
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell serial={s.serial}>
        <div className="app-panel app-panel-pad space-y-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">new card</p>
            <h1 className="mt-1 text-3xl font-black leading-tight">Activate your Scorlyn card</h1>
          </div>
          <ol className="space-y-2.5">
            {["Sign in or create a free account", "Enter the activation code from the packaging", "Choose what the card opens"].map(
              (step, i) => (
                <li key={step} className="flex items-center gap-3 text-[14px] font-semibold">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sc-gold text-[13px] font-black text-sc-gold-ink">
                    {i + 1}
                  </span>
                  {step}
                </li>
              )
            )}
          </ol>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link href={`/signup?next=${next}`} className="app-btn app-btn-primary min-h-12 justify-center">
              Create account
            </Link>
            <Link href={`/login?next=${next}`} className="app-btn app-btn-ghost min-h-12 justify-center">
              I have an account
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  if (s.my_claim === "pending") {
    return (
      <Shell serial={s.serial}>
        <Message
          icon={Clock}
          title="Request sent"
          body={
            <>
              We&apos;ll confirm this card shortly and email you at <b>{user.email}</b>. After that, scan it again (or
              open <Link href="/dashboard/cards" className="font-bold underline">My cards</Link>) to choose what it opens.
              <br />
              Have the activation code from the packaging? Enter it below to skip the wait.
            </>
          }
        />
        <div className="mt-4">
          <RequestForm code={code} codeOnly />
        </div>
      </Shell>
    );
  }

  if (s.pending_other) {
    return (
      <Shell serial={s.serial}>
        <Message
          icon={Clock}
          title="Someone has already asked for this card"
          body="If it's yours, enter the activation code from the packaging below, or contact ScorlynTap."
        />
        <div className="mt-4">
          <RequestForm code={code} codeOnly />
        </div>
      </Shell>
    );
  }

  return (
    <Shell serial={s.serial}>
      {s.my_claim === "rejected" && (
        <div className="mb-4">
          <Message icon={XCircle} title="Your last request was declined" body="Contact ScorlynTap, or use the activation code from the packaging." />
        </div>
      )}
      <div className="app-panel app-panel-pad space-y-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-sc-text-dimmer">step 2 of 3</p>
          <h1 className="mt-1 text-2xl font-black leading-tight">Enter your activation code</h1>
          <p className="mt-1 text-sm font-medium text-sc-text-dim">
            Signed in as <b>{user.email}</b>.
          </p>
        </div>
        <RequestForm code={code} />
      </div>
    </Shell>
  );
}
