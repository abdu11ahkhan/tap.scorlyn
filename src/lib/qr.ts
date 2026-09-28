import QRCode from "qrcode";

/**
 * QR output for physical printing.
 *
 * Error correction Q (~25% recoverable) survives scuffs, gloss glare and a
 * slightly soft print; the 4-module quiet zone is what the spec requires and
 * what cheap phone scanners actually need around the code.
 */
const OPTIONS = { errorCorrectionLevel: "Q" as const, margin: 4 };

/**
 * Vector SVG: one path, pure black on white, no scaling transforms — the
 * shape CorelDRAW/Illustrator import cleanly and can recolour.
 */
export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { ...OPTIONS, type: "svg", color: { dark: "#000000", light: "#ffffff" } });
}

/** High-resolution PNG (default 1200px — ~10cm at 300dpi). */
export async function qrPngDataUrl(text: string, size = 1200): Promise<string> {
  return QRCode.toDataURL(text, { ...OPTIONS, width: size, color: { dark: "#000000", light: "#ffffff" } });
}

export async function qrPngBlob(text: string, size = 1200): Promise<Blob> {
  const res = await fetch(await qrPngDataUrl(text, size));
  return res.blob();
}

/** The module grid itself, for drawing the QR as vector rectangles (PDF). */
export function qrModules(text: string): { size: number; dark: (x: number, y: number) => boolean } {
  const qr = QRCode.create(text, { errorCorrectionLevel: OPTIONS.errorCorrectionLevel });
  const { size, data } = qr.modules;
  return { size, dark: (x, y) => Boolean(data[y * size + x]) };
}
