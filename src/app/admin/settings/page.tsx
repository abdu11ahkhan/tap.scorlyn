import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("app_settings").select("*").maybeSingle();

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-4xl font-black tracking-tighter">
          site<span className="text-acid">.</span>
        </h1>
        <p className="mt-2 font-medium text-white/50">
          Switches that affect everyone.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border-2 border-ink bg-hotpink px-4 py-3 text-sm font-bold text-white">
          {error.message}
        </div>
      )}

      <SettingsForm
        initial={{
          signupsOpen: data?.signups_open ?? true,
          publishingOpen: data?.publishing_open ?? true,
          announcement: data?.announcement ?? "",
        }}
      />
    </div>
  );
}
