"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Switches between the customer dashboard and the admin area.
 *
 * Renders nothing at all for a normal customer — an admin is also a customer,
 * so the two areas belong to the same person and typing /admin every time is
 * friction, but a toggle that merely *looks* disabled for everyone else would
 * advertise that the admin area exists.
 *
 * This is convenience, not a permission check. Every admin page and action
 * verifies is_admin server-side, and RLS is the real boundary underneath.
 */
export default function AreaSwitch() {
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) setIsAdmin(Boolean(data?.is_admin));
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isAdmin) return null;

  const onAdmin = pathname?.startsWith("/admin");

  const tab = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
      active ? "bg-white text-black" : "text-white/55 hover:text-white"
    }`;

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-white/12 bg-white/[0.04] p-0.5">
      <Link href="/dashboard" className={tab(!onAdmin)}>
        Dashboard
      </Link>
      <Link href="/admin" className={tab(Boolean(onAdmin))}>
        Admin
      </Link>
    </div>
  );
}
