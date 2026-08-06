"use client";

import { useEffect, useRef } from "react";
import { markOrdersSeen } from "../actions";

/**
 * Clears the new-order badge once the orders list has been opened.
 *
 * Renders nothing. The rows themselves are already marked "new" in the table,
 * so the admin can still see which ones arrived since last time even though
 * the count has gone.
 */
export default function MarkSeen({ unseen }: { unseen: number }) {
  const done = useRef(false);

  useEffect(() => {
    // Effects run twice in dev StrictMode; the update is idempotent but the
    // round trip isn't free.
    if (unseen < 1 || done.current) return;
    done.current = true;
    void markOrdersSeen();
  }, [unseen]);

  return null;
}
