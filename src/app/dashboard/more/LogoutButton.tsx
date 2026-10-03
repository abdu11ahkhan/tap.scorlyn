"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-sc-border-soft px-4 text-left text-[15px] font-semibold text-sc-text-dim transition-colors hover:border-sc-error/50 hover:text-sc-error"
    >
      <LogOut className="h-5 w-5 shrink-0" />
      Log out
    </button>
  );
}
