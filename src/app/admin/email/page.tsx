import { createClient } from "@/lib/supabase/server";
import { mailerConfigured } from "@/lib/email";
import EmailComposer from "./EmailComposer";

export const dynamic = "force-dynamic";

export default async function AdminEmail() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("email_campaigns")
    .select("id, subject, audience, status, scheduled_for, sent_at, recipient_count, last_error")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="app-h1">Email</h1>
        <p className="app-sub mt-1">
          Send an announcement or offer to customers, now or at a set time.
        </p>
      </div>

      <EmailComposer campaigns={data ?? []} configured={mailerConfigured()} />
    </div>
  );
}
