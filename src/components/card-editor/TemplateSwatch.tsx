/**
 * Miniature of each layout for the template picker.
 *
 * Hand-drawing one per template stopped scaling at ten — eleven of the
 * twenty-one silently fell through to the same blank white default, which made
 * the picker useless for half the library. Each template now declares a
 * background and a layout family instead, so adding one is a single line.
 */

type Shape = "stack" | "hero" | "split" | "grid" | "reel" | "form" | "rows";
type Skin = { bg: string; ink: string; shape: Shape; paper?: boolean };

const SKINS: Record<string, Skin> = {
  // profile
  minimal: { bg: "#ffffff", ink: "#e5e5e5", shape: "stack", paper: true },
  bold: { bg: "#FAFAF8", ink: "#111111", shape: "rows" },
  split: { bg: "#ffffff", ink: "#e5e5e5", shape: "split" },
  glass: { bg: "#05070C", ink: "#ffffff", shape: "stack" },
  mono: { bg: "#0C0C0C", ink: "#ffffff", shape: "rows" },
  sticker: { bg: "#FFFDF5", ink: "#0a0a0a", shape: "rows" },
  aurora: { bg: "#0B0614", ink: "#ffffff", shape: "stack" },
  editorial: { bg: "#FAF6EF", ink: "#1C1A17", shape: "stack", paper: true },
  neon: { bg: "#000000", ink: "#ffffff", shape: "stack" },
  tape: { bg: "#F4F1EA", ink: "#1A1A1A", shape: "rows" },
  // landing
  pitch: { bg: "#0a0a0a", ink: "#ffffff", shape: "hero" },
  waitlist: { bg: "#08060F", ink: "#ffffff", shape: "form" },
  poster: { bg: "#0a0a0a", ink: "#ffffff", shape: "hero" },
  app: { bg: "#F6F7FB", ink: "#0F172A", shape: "hero", paper: true },
  // portfolio
  grid: { bg: "#FBFBFA", ink: "#111111", shape: "grid", paper: true },
  showcase: { bg: "#0C0A0B", ink: "#ffffff", shape: "hero" },
  reel: { bg: "#0B0B0B", ink: "#ffffff", shape: "reel" },
  // sectioned
  stack: { bg: "#ffffff", ink: "#101010", shape: "split", paper: true },
  agency: { bg: "#0D0D0F", ink: "#ffffff", shape: "grid" },
  // form
  reply: { bg: "#F7F7FB", ink: "#111111", shape: "form", paper: true },
  booking: { bg: "#F4F7F7", ink: "#0F1A1A", shape: "form", paper: true },

  // The rest of the library. Fifteen templates had no entry at all and fell
  // through to a blank white default, so half the picker advertised nothing.
  case: { bg: "#ffffff", ink: "#111111", shape: "stack", paper: true },
  contactsheet: { bg: "#F2F1EC", ink: "#111111", shape: "grid", paper: true },
  dock: { bg: "#000000", ink: "#ffffff", shape: "rows" },
  filmstrip: { bg: "#0B0B0F", ink: "#ffffff", shape: "reel" },
  frames: { bg: "#EFEAE1", ink: "#111111", shape: "grid", paper: true },
  journal: { bg: "#FDFCF8", ink: "#111111", shape: "stack", paper: true },
  launch: { bg: "#08080A", ink: "#ffffff", shape: "hero" },
  lookbook: { bg: "#0A0A0A", ink: "#ffffff", shape: "reel" },
  masonry: { bg: "#ffffff", ink: "#111111", shape: "grid", paper: true },
  menu: { bg: "#FCFBF7", ink: "#111111", shape: "rows", paper: true },
  mosaic: { bg: "#0F0F12", ink: "#ffffff", shape: "grid" },
  orbit: { bg: "#0B0B0F", ink: "#ffffff", shape: "stack" },
  quote: { bg: "#F7F8F8", ink: "#111111", shape: "form", paper: true },
  studio: { bg: "#ffffff", ink: "#111111", shape: "split", paper: true },
  tiles: { bg: "#F4F4F2", ink: "#111111", shape: "grid", paper: true },};

const FALLBACK: Skin = { bg: "#ffffff", ink: "#e5e5e5", shape: "stack", paper: true };

export default function TemplateSwatch({ id, accent }: { id: string; accent: string }) {
  const skin = SKINS[id] ?? FALLBACK;
  const line = skin.paper ? `${skin.ink}` : `${skin.ink}44`;

  const bar = (w: string, color = line, h = "h-1") => (
    <div className={`${h} rounded-full`} style={{ width: w, background: color }} />
  );

  return (
    <div
      className="flex h-full w-full flex-col gap-1 p-2"
      style={{ background: skin.bg }}
    >
      {skin.shape === "stack" && (
        <>
          <div className="mx-auto h-4 w-4 rounded-full" style={{ background: accent }} />
          <div className="mx-auto">{bar("48px", skin.ink)}</div>
          <div className="mx-auto">{bar("30px", accent)}</div>
          <div className="mt-auto w-full space-y-1">
            <div className="h-2 rounded-full border" style={{ borderColor: line }} />
            <div className="h-2 rounded-full border" style={{ borderColor: line }} />
          </div>
        </>
      )}

      {skin.shape === "rows" && (
        <>
          <div className="h-3 w-3 rounded" style={{ background: accent }} />
          {bar("85%", skin.ink, "h-1.5")}
          {bar("60%", skin.ink, "h-1.5")}
          <div className="mt-auto w-full space-y-1">
            <div className="h-2 rounded" style={{ background: accent }} />
            <div className="h-2 rounded" style={{ background: accent, opacity: 0.65 }} />
          </div>
        </>
      )}

      {skin.shape === "split" && (
        <div className="-m-2 flex h-full w-[calc(100%+16px)]">
          <div className="w-[42%] p-1.5" style={{ background: accent }}>
            <div className="h-2.5 w-2.5 rounded-full bg-white/50" />
            <div className="mt-1 h-1 w-[80%] rounded-full bg-white/80" />
          </div>
          <div className="flex-1 space-y-1 p-1.5">
            {bar("100%")}
            {bar("100%")}
            {bar("70%")}
          </div>
        </div>
      )}

      {skin.shape === "hero" && (
        <>
          <div
            className="-mx-2 -mt-2 h-[46%]"
            style={{ background: `linear-gradient(160deg, ${accent}, ${accent}55)` }}
          />
          <div className="mt-1">{bar("80%", skin.ink, "h-1.5")}</div>
          {bar("55%", accent)}
          <div className="mt-auto h-2.5 rounded-full" style={{ background: accent }} />
        </>
      )}

      {skin.shape === "grid" && (
        <>
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
            {bar("40%", skin.ink)}
          </div>
          <div className="mt-1 grid flex-1 grid-cols-2 gap-1">
            <div className="col-span-2 rounded-sm" style={{ background: `${accent}cc` }} />
            <div className="rounded-sm" style={{ background: `${accent}99` }} />
            <div className="rounded-sm" style={{ background: `${accent}77` }} />
          </div>
        </>
      )}

      {skin.shape === "reel" && (
        <div className="-m-2 flex h-[calc(100%+16px)] w-[calc(100%+16px)] flex-col gap-0.5">
          <div className="h-3 shrink-0" style={{ background: `${skin.ink}22` }} />
          <div className="flex-1" style={{ background: `${accent}cc` }} />
          <div className="flex-1" style={{ background: `${accent}88` }} />
        </div>
      )}

      {skin.shape === "form" && (
        <>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded" style={{ background: accent }} />
            {bar("45%", skin.ink)}
          </div>
          <div
            className="mt-1 flex flex-1 flex-col gap-1 rounded-md border p-1.5"
            style={{ borderColor: line, background: skin.paper ? "#fff" : `${skin.ink}0d` }}
          >
            <div className="h-2 rounded-sm border" style={{ borderColor: line }} />
            <div className="h-4 rounded-sm border" style={{ borderColor: line }} />
            <div className="mt-auto h-2.5 rounded-sm" style={{ background: accent }} />
          </div>
        </>
      )}
    </div>
  );
}
