"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { REF_COOKIE, REF_COOKIE_MAX_AGE, REF_PARAM } from "@/lib/referral";

/**
 * Parks a referral code from the URL into its cookie.
 *
 * The signup page already does this, but the referral CTA no longer goes
 * through signup — it drops you straight into the editor, because the whole
 * product is "edit first, sign in only to publish". Attribution still has to
 * survive that detour, and the person may not create an account for days.
 */
function Catcher() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get(REF_PARAM);
    if (!ref) return;
    document.cookie = `${REF_COOKIE}=${encodeURIComponent(
      ref
    )}; path=/; max-age=${REF_COOKIE_MAX_AGE}; SameSite=Lax`;
  }, [searchParams]);

  return null;
}

export default function RefCatcher() {
  // useSearchParams suspends, and this sits inside otherwise-static pages.
  return (
    <Suspense fallback={null}>
      <Catcher />
    </Suspense>
  );
}
