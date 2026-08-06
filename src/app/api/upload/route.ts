import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BUCKET = "card-images";
const MAX_BYTES = 3 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Image upload for the card editor.
 *
 * Writes run through the service key rather than the browser's anon key: the
 * bucket's RLS would otherwise need a policy per case, and the key must never
 * reach the client. The session is checked first, so the elevated rights only
 * ever act on behalf of a signed-in user, and every file is written under a
 * prefix of that user's id — a caller cannot name a path into someone else's
 * folder.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in to upload." }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json(
      { error: "Uploads aren't configured on this server." },
      { status: 503 }
    );
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const candidate = form.get("file");
    if (candidate instanceof File) file = candidate;
  } catch {
    return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "No file was sent." }, { status: 400 });
  }

  const extension = TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Only JPEG, PNG and WebP images are allowed." },
      { status: 415 }
    );
  }

  // The browser downscales before sending, so anything this large is either a
  // bug or someone calling the route directly.
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That image is over 3MB. Try a smaller one." },
      { status: 413 }
    );
  }

  const service = createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Timestamped so replacing a photo busts any CDN cache of the old one.
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error } = await service.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = service.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
