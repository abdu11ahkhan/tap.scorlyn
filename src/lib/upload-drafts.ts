import { uploadImage } from "@/lib/upload-image";

/**
 * Photos picked before there was an account.
 *
 * The public editor works without signing in, so a photo chosen there can't be
 * uploaded yet — ImagePicker keeps it as a `data:` URL in the draft instead.
 * By the time the card is published there *is* an account, so anything still
 * inline gets uploaded and swapped for its real URL. Otherwise the whole image
 * would be written into a database column and re-sent on every page view.
 */

function isInline(url: string | null | undefined): boolean {
  return Boolean(url && url.startsWith("data:"));
}

async function uploadDataUrl(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const url = await uploadImage(blob);
  if (!url) throw new Error("Please log in again before publishing.");
  return url;
}

/**
 * Swap every inline image for an uploaded one.
 *
 * Returns the same shapes back, so the caller can hand the result straight to
 * the save. Throws if an upload fails — publishing a card whose photos point
 * at nothing is worse than telling the person to try again.
 */
export async function uploadPendingImages<
  T extends { avatar_url?: string; cover_url?: string },
>(
  form: T,
  gallery: { url: string; caption?: string; href?: string }[]
): Promise<{ form: T; gallery: typeof gallery }> {
  const next = { ...form };

  if (isInline(next.avatar_url)) {
    next.avatar_url = await uploadDataUrl(next.avatar_url as string);
  }
  if (isInline(next.cover_url)) {
    next.cover_url = await uploadDataUrl(next.cover_url as string);
  }

  const nextGallery = await Promise.all(
    gallery.map(async (item) =>
      isInline(item.url) ? { ...item, url: await uploadDataUrl(item.url) } : item
    )
  );

  return { form: next, gallery: nextGallery };
}
