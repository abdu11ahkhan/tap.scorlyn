/**
 * Storage that can't take the page down.
 *
 * Safari throws on Storage access in two real situations, and neither is rare:
 *
 *   1. Private Browsing on older versions — `setItem` throws QuotaExceededError
 *      because the quota is zero.
 *   2. "Prevent cross-site tracking" / "Block all cookies" — touching
 *      `window.localStorage` at all throws a SecurityError. Note this fires on
 *      the *property access*, so even a read, and even a `typeof` guard placed
 *      after the access, is too late.
 *
 * Chrome never does this, which is why it presented as "works sometimes, blank
 * other times" — normal window versus private window on the same phone.
 *
 * An uncaught throw inside a useEffect during hydration takes React's whole
 * tree down, so a card that failed here rendered a blank page. Analytics and a
 * dismissed banner are not worth a blank page; every call degrades to a no-op.
 */

function store(kind: "local" | "session"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    // The access itself is what throws — it has to be inside the try.
    const s = kind === "local" ? window.localStorage : window.sessionStorage;
    // Safari Private Browsing exposes the object but rejects writes, so probe.
    const probe = "__scorlyntap_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function readStorage(kind: "local" | "session", key: string): string | null {
  try {
    return store(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(kind: "local" | "session", key: string, value: string): void {
  try {
    store(kind)?.setItem(key, value);
  } catch {
    // Nothing to do — the feature degrades, the page survives.
  }
}

export function removeStorage(kind: "local" | "session", key: string): void {
  try {
    store(kind)?.removeItem(key);
  } catch {
    // As above.
  }
}
