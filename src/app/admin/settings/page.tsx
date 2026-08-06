import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("app_settings").select("*").maybeSingle();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="app-h1">Site</h1>
        <p className="app-sub mt-1">
          Switches that affect everyone.
        </p>
      </div>

      {error && (
        <div className="app-panel app-panel-pad text-[13px] font-medium text-hotpink">
          {error.message}
        </div>
      )}

      <SettingsForm
        initial={{
          signupsOpen: data?.signups_open ?? true,
          publishingOpen: data?.publishing_open ?? true,
          announcement: data?.announcement ?? "",
          maintenanceMode: data?.maintenance_mode ?? false,
          maintenanceMessage: data?.maintenance_message ?? "",
        }}
      />
    </div>
  );
}
