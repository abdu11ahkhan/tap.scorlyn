"use client";

import { useEffect, useState } from "react";

/**
 * A deliberately primitive diagnostics page.
 *
 * Plain HTML with inline styles and no Tailwind class, no animation library
 * and no framework feature beyond useState — so it renders even on a device
 * where the rest of the site does not. Its whole job is to be screenshotable
 * from the phone that is failing and report what actually happened there.
 */
export default function Diagnostics() {
  const [errors, setErrors] = useState<string[]>([]);
  const [info, setInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    const onError = (e: ErrorEvent) =>
      setErrors((prev) => [...prev, `${e.message} @ ${e.filename?.split("/").pop()}:${e.lineno}`]);
    const onReject = (e: PromiseRejectionEvent) =>
      setErrors((prev) => [...prev, `unhandled rejection: ${String(e.reason).slice(0, 120)}`]);

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onReject);

    const supports = (prop: string, value: string) => {
      try {
        return CSS.supports(prop, value) ? "yes" : "NO";
      } catch {
        return "threw";
      }
    };

    setInfo({
      "user agent": navigator.userAgent,
      "screen": `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}x`,
      "@property": typeof CSS !== "undefined" && "registerProperty" in CSS ? "yes" : "NO",
      "color-mix()": supports("color", "color-mix(in srgb, red, blue)"),
      "lab()": supports("color", "lab(50% 0 0)"),
      "oklch()": supports("color", "oklch(50% 0 0)"),
      "backdrop-filter": supports("backdrop-filter", "blur(4px)"),
      "individual rotate": supports("rotate", "3deg"),
      "reduced motion": window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "ON" : "off",
      "cookies enabled": String(navigator.cookieEnabled),
      "react mounted": "yes",
    });

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onReject);
    };
  }, []);

  const box: React.CSSProperties = {
    background: "#111",
    color: "#fff",
    fontFamily: "-apple-system, system-ui, sans-serif",
    padding: 16,
    minHeight: "100vh",
    fontSize: 13,
    lineHeight: 1.5,
  };

  return (
    <div style={box}>
      <h1 style={{ fontSize: 20, margin: "0 0 4px", fontWeight: 700 }}>ScorlynTap diagnostics</h1>
      <p style={{ margin: "0 0 16px", color: "#999" }}>
        Screenshot this whole page and send it over.
      </p>

      {Object.entries(info).map(([k, v]) => (
        <div
          key={k}
          style={{
            display: "flex",
            gap: 10,
            padding: "7px 0",
            borderBottom: "1px solid #262626",
            wordBreak: "break-word",
          }}
        >
          <span style={{ color: "#8a8a8a", flex: "0 0 42%" }}>{k}</span>
          <span style={{ flex: 1, color: v === "NO" || v === "ON" ? "#ff6b6b" : "#ccff00" }}>{v}</span>
        </div>
      ))}

      <h2 style={{ fontSize: 15, margin: "22px 0 6px", fontWeight: 700 }}>
        JavaScript errors ({errors.length})
      </h2>
      {errors.length === 0 ? (
        <p style={{ margin: 0, color: "#7a7a7a" }}>None captured on this page.</p>
      ) : (
        errors.map((e, i) => (
          <p key={i} style={{ margin: "0 0 8px", color: "#ff6b6b", wordBreak: "break-word" }}>
            {e}
          </p>
        ))
      )}

      <h2 style={{ fontSize: 15, margin: "22px 0 6px", fontWeight: 700 }}>Home page, in a frame</h2>
      <p style={{ margin: "0 0 8px", color: "#8a8a8a" }}>
        If this frame is blank or plain green but this page is fine, the problem is in the home
        page itself rather than the browser.
      </p>
      <iframe
        src="/"
        title="home"
        style={{ width: "100%", height: 340, border: "1px solid #333", background: "#000" }}
      />
    </div>
  );
}
