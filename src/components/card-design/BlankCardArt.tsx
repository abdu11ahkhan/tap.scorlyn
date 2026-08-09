"use client";

import { CARD_ASPECT } from "./NfcCardArt";

/**
 * What a blank card actually looks like: nothing.
 *
 * Not the customer's artwork with the details switched off — that would show
 * them a design they are not buying. A blank card is bare on both faces; the
 * link lives on the chip inside, so there is nothing to print. Drawing it
 * honestly is the point, because the whole decision is blank versus printed.
 */
export default function BlankCardArt({
  width = 340,
  tone = "dark",
}: {
  width?: number;
  /** Both are sold; showing one of each is what makes the choice concrete. */
  tone?: "dark" | "light";
}) {
  const height = width / CARD_ASPECT;
  const u = width / 100;
  const dark = tone === "dark";
  const bg = dark ? "#131316" : "#F4F4F2";
  const fg = dark ? "#FFFFFF" : "#111111";

  return (
    <div
      data-nfc-card="blank"
      className="relative shrink-0 overflow-hidden"
      style={{
        width,
        height,
        borderRadius: u * 4.2,
        background: bg,
        color: fg,
        border: `1px solid ${dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`,
        boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
      }}
    />
  );
}
