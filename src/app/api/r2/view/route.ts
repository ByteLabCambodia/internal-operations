import { type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { presignDownload } from "@/lib/r2";

/**
 * GET /api/r2/view?key=<objectKey>
 *
 * Generates a fresh presigned GET URL for the requested R2 object and
 * redirects to it. Using this as the `href` / `src` means the URL is always
 * current — no more "ExpiredRequest" errors from URLs baked into the page at
 * render time.
 */
export async function GET(req: NextRequest) {
  await requireUser();

  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return Response.json({ error: "Missing key" }, { status: 400 });
  }

  const url = await presignDownload(key, 300);
  return Response.redirect(url, 302);
}
