import { createClient } from "@/lib/supabase/client";

/**
 * Upload one image to the card-images bucket.
 *
 * Straight from the browser with the anon key, not through the server: the
 * bucket's policies (migration 011) restrict writes to `<user_id>/…`, so the
 * user's own session is enough authority and no elevated key is involved.
 *
 * Returns null when nobody is signed in — the public editor works without an
 * account, so the caller keeps the image inline in the draft and it uploads at
 * publish time instead.
 */
const BUCKET = "card-images";

export async function uploadImage(blob: Blob): Promise<string | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  // Timestamped so replacing a photo can't be served from a cache of the old.
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}
