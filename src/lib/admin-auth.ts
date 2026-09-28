import { createClient } from "@/lib/supabase/server";

/**
 * Every admin mutation funnels through this.
 *
 * Server Actions are reachable by direct POST, not just through the UI, so a
 * page-level check is not a security boundary. RLS is the real backstop — the
 * admin policies all require is_admin() — but failing loudly here gives a
 * clear error instead of a silent no-op when a policy blocks the write.
 */
export async function assertAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) throw new Error("Admins only.");

  return { supabase, user };
}
