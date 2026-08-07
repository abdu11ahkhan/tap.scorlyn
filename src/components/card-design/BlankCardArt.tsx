"use client";

import { QRCodeSVG } from "qrcode.react";
import { CARD_ASPECT } from "./NfcCardArt";

/**
 * What a blank card actually looks like.
 *
 * Not the customer's artwork with the details switched off — that would show
 * them a design they are not buying. A blank card is a plain card: the chip,
 * our small mark, and the QR that opens the same page. Drawing it honestly is
 * the point, because the whole decision is blank versus printed.
 */
export default function BlankCardArt({
  profileUrl,
  width = 340,
  tone = "dark",
}: {
  profileUrl: string;
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
    >
      <div
        className="flex h-full flex-col justify-between"
        style={{ padding: u * 7 }}
      >
        <div className="flex items-start justify-between">
          <span
            style={{
              fontSize: u * 3.2,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              opacity: 0.9,
            }}
          >
            ScorlynTap
          </span>

          {/* The chip mark, same as the printed cards use. */}
          <svg
            viewBox="0 0 24 24"
            width={u * 6}
            height={u * 6}
            fill="none"
            stroke={fg}
            strokeWidth={2}
            strokeLinecap="round"
            style={{ opacity: 0.55 }}
            aria-hidden="true"
          >
            <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" />
            <path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" />
            <path d="M12.91 4.1a15.91 15.91 0 0 1 .01 15.8" />
          </svg>
        </div>

        <div className="flex items-end justify-between">
          <span style={{ fontSize: u * 2.4, opacity: 0.45, letterSpacing: "0.02em" }}>
            tap or scan to open
          </span>
          <div
            style={{
              background: "#FFFFFF",
              padding: u * 1.1,
              borderRadius: u * 1.4,
              lineHeight: 0,
            }}
          >
            <QRCodeSVG value={profileUrl} size={u * 13} bgColor="#FFFFFF" fgColor="#0A0A0A" level="M" />
          </div>
        </div>
      </div>
    </div>
  );
}
