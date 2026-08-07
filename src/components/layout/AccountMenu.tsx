"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, IdCard, LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Account = { avatarUrl: string | null; name: string; email: string };

/**
 * Signed-out: a "log in" link. Signed-in: the person's photo, and the way
 * across to their dashboard.
 *
 * The navbar previously said "log in" whether or not you were, so a signed-in
 * visitor on the marketing site had no indication they had an account and no
 * route back to it except typing /dashboard.
 */
export default function AccountMenu() {
  // `undefined` while unknown, so the first paint shows neither state and the
  // button doesn't visibly flip from "log in" to an avatar.
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const read = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setAccount(null);
        return;
      }

      const { data: card } = await supabase
        .from("card_profiles")
        .select("avatar_url, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setAccount({
          avatarUrl: card?.avatar_url ?? null,
          name: card?.full_name || user.email?.split("@")[0] || "Account",
          email: user.email ?? "",
        });
      }
    };

    read();

    // Signing in or out in another tab should be reflected here too.
    const { data: sub } = supabase.auth.onAuthStateChange(() => read());

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Click-away and Escape, so the menu behaves like a menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const logout = async () => {
    await createClient().auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  // Unknown: hold the space so the navbar doesn't jump once auth resolves.
  if (account === undefined) return <span className="h-10 w-10" aria-hidden />;

  if (account === null) {
    return (
      <Link
        href="/login"
        className="hidden rounded-full px-4 py-2 text-[15px] font-bold text-ink/70 transition-colors hover:text-ink sm:block"
      >
        log in
      </Link>
    );
  }

  const initials = account.name.trim().slice(0, 1).toUpperCase() || "A";
  const item =
    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-bold text-ink hover:bg-acid";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-acid text-[15px] font-black text-ink"
      >
        {account.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={account.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="sticker absolute right-0 z-50 mt-2 w-60 rounded-2xl border-2 border-ink bg-white p-2"
        >
          <div className="border-b-2 border-ink/10 px-3 pb-2.5 pt-1.5">
            <p className="truncate text-[14px] font-black text-ink">{account.name}</p>
            <p className="truncate text-[12px] font-semibold text-ink/45">{account.email}</p>
          </div>

          <div className="pt-1.5">
            <Link href="/dashboard" onClick={() => setOpen(false)} className={item} role="menuitem">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/card"
              onClick={() => setOpen(false)}
              className={item}
              role="menuitem"
            >
              <IdCard className="h-4 w-4" />
              My card
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className={item}
              role="menuitem"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button type="button" onClick={logout} className={`${item} w-full`} role="menuitem">
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The same thing for the mobile sheet, where a dropdown inside a dropdown
 * would be awkward — the destinations are listed flat instead.
 */
export function MobileAccountLinks({ onNavigate }: { onNavigate: () => void }) {
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setSignedIn(Boolean(data.user));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const row = "block rounded-xl px-4 py-3 text-lg font-black text-ink hover:bg-acid";

  if (signedIn === undefined) return null;

  if (!signedIn) {
    return (
      <Link href="/login" onClick={onNavigate} className={row}>
        log in
      </Link>
    );
  }

  return (
    <>
      <Link href="/dashboard" onClick={onNavigate} className={row}>
        dashboard
      </Link>
      <Link href="/dashboard/card" onClick={onNavigate} className={row}>
        my card
      </Link>
      <button
        type="button"
        onClick={async () => {
          await createClient().auth.signOut();
          onNavigate();
          router.push("/");
          router.refresh();
        }}
        className={`${row} w-full text-left`}
      >
        log out
      </button>
    </>
  );
}
