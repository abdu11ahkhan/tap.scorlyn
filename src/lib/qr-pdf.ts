import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { qrModules } from "./qr";

const MM = 72 / 25.4;
const QUIET = 4;

/**
 * A single-card PDF with the QR drawn as vector rectangles, not an embedded
 * bitmap — so it stays sharp at any print size and a print shop can place it
 * directly. Horizontal runs are merged into one rectangle each, which also
 * avoids the hairline seams some viewers draw between adjacent squares.
 */
export async function qrPdf(text: string, label?: string, sublabel?: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const qrSize = 50 * MM;
  const pad = 10 * MM;
  const textBlock = label ? (sublabel ? 16 : 10) * MM : 0;
  const page = doc.addPage([qrSize + pad * 2, qrSize + pad * 2 + textBlock]);

  const { size, dark } = qrModules(text);
  const cell = qrSize / (size + QUIET * 2);
  const left = pad;
  const top = page.getHeight() - pad;

  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      if (!dark(x, y)) {
        x++;
        continue;
      }
      const start = x;
      while (x < size && dark(x, y)) x++;
      page.drawRectangle({
        x: left + (start + QUIET) * cell,
        y: top - (y + QUIET + 1) * cell,
        width: (x - start) * cell,
        height: cell,
        color: rgb(0, 0, 0),
      });
    }
  }

  if (label) {
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const labelSize = 11;
    page.drawText(label, {
      x: (page.getWidth() - bold.widthOfTextAtSize(label, labelSize)) / 2,
      y: pad + (sublabel ? 7 * MM : 1 * MM),
      size: labelSize,
      font: bold,
      color: rgb(0, 0, 0),
    });
    if (sublabel) {
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const subSize = 7;
      page.drawText(sublabel, {
        x: (page.getWidth() - font.widthOfTextAtSize(sublabel, subSize)) / 2,
        y: pad,
        size: subSize,
        font,
        color: rgb(0.25, 0.25, 0.25),
      });
    }
  }

  return doc.save();
}
