"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { codeFromScan } from "@/lib/card-codes";
import { findCardByCode } from "../actions";

type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

/**
 * Point the phone at a card's QR and land on that card's page — for handing
 * out stock fast. Uses the browser's own BarcodeDetector where it exists
 * (Android Chrome) and falls back to jsQR on a canvas elsewhere (iOS Safari).
 */
export default function ScanCard() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "starting" | "scanning" | "looking" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const stream = useRef<MediaStream | null>(null);
  const handled = useRef(false);

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  const lookup = useCallback(
    async (raw: string) => {
      const code = codeFromScan(raw);
      if (!code) {
        setMessage("That QR isn't a Scorlyn card.");
        return false;
      }
      setState("looking");
      const r = await findCardByCode(code);
      if (r.ok && r.data) {
        stop();
        router.push(`/admin/nfc/${r.data.id}`);
        return true;
      }
      setMessage(r.error ?? "Card not found.");
      setState(stream.current ? "scanning" : "idle");
      return false;
    },
    [router, stop]
  );

  const start = async () => {
    setMessage(null);
    setState("starting");
    handled.current = false;
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      stream.current = media;
      if (video.current) {
        video.current.srcObject = media;
        await video.current.play();
      }
      setState("scanning");
    } catch {
      setState("error");
      setMessage("Camera unavailable. Allow camera access, or type the code below.");
    }
  };

  useEffect(() => {
    if (state !== "scanning") return;
    let raf = 0;
    let stopped = false;
    let detector: Detector | null = null;
    const Ctor = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (Ctor) detector = new Ctor({ formats: ["qr_code"] });
    let jsQR: ((d: Uint8ClampedArray, w: number, h: number) => { data: string } | null) | null = null;
    if (!detector) import("jsqr").then((m) => (jsQR = m.default));

    const tick = async () => {
      if (stopped || handled.current) return;
      const v = video.current;
      if (v && v.readyState >= 2) {
        let found: string | null = null;
        if (detector) {
          const codes = await detector.detect(v).catch(() => []);
          found = codes[0]?.rawValue ?? null;
        } else if (jsQR && canvas.current) {
          const c = canvas.current;
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          const ctx = c.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(v, 0, 0, c.width, c.height);
            const img = ctx.getImageData(0, 0, c.width, c.height);
            found = jsQR(img.data, img.width, img.height)?.data ?? null;
          }
        }
        if (found && !handled.current) {
          handled.current = true;
          const ok = await lookup(found);
          if (!ok) setTimeout(() => (handled.current = false), 1500);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [state, lookup]);

  useEffect(() => stop, [stop]);

  return (
    <div className="space-y-5">
      <Link href="/admin/nfc" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-sc-text-dim hover:text-acid">
        <ArrowLeft className="h-4 w-4" /> all cards
      </Link>
      <div>
        <h1 className="app-h1">Scan card</h1>
        <p className="app-sub mt-1">Point the camera at a card&apos;s QR to open it — then assign it on the spot.</p>
      </div>

      <div className="app-panel app-panel-pad space-y-4">
        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-black">
          <video ref={video} playsInline muted className="h-full w-full object-cover" />
          <canvas ref={canvas} className="hidden" />
          {state !== "scanning" && state !== "looking" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                onClick={start}
                disabled={state === "starting"}
                className="sticker sticker-press inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-acid px-6 text-sm font-black uppercase tracking-tight text-ink disabled:opacity-60"
              >
                {state === "starting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                start camera
              </button>
            </div>
          )}
          {state === "scanning" && (
            <div className="pointer-events-none absolute inset-[18%] rounded-2xl border-4 border-acid/80" />
          )}
          {state === "looking" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="h-8 w-8 animate-spin text-acid" />
            </div>
          )}
        </div>
        {message && <p className="text-center text-sm font-bold text-hotpink">{message}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMessage(null);
            void lookup(manual);
          }}
          className="flex gap-2"
        >
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="or type the code / paste the URL"
            className="h-11 min-w-0 flex-1 rounded-full border-2 border-sc-border-soft bg-sc-surface-2 px-4 font-mono text-sm font-semibold text-sc-text outline-none placeholder:text-sc-text-dimmer focus:border-acid"
          />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-full border-2 border-sc-border px-5 text-sm font-black lowercase text-sc-text hover:border-acid hover:text-acid"
          >
            find
          </button>
        </form>
      </div>
    </div>
  );
}
