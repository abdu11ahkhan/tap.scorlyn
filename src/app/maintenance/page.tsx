import { createClient } from "@/lib/supabase/server";
import { Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Maintenance() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("maintenance_message")
    .maybeSingle();

  return (
    <div className="grain flex min-h-screen flex-col items-center justify-center gap-5 bg-ink px-6 text-center text-white">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-acid">
        <Wrench className="h-6 w-6 text-ink" />
      </span>
      <h1 className="text-4xl font-black tracking-tighter">back shortly.</h1>
      <p className="max-w-sm font-medium text-white/50">
        {data?.maintenance_message ||
          "We're making some changes. Existing cards keep working — only the site is paused."}
      </p>
    </div>
  );
}
