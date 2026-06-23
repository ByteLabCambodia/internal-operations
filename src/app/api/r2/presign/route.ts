import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import { getUser } from "@/lib/auth";
import { presignUpload } from "@/lib/r2";

/**
 * Issues a presigned R2 PUT URL for a direct client upload (receipts/images).
 * Authenticates the caller and validates content-type + size before signing.
 * The client uploads to the URL, then stores the returned object_key on the
 * payment/record.
 */
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { contentType?: string; size?: number; ext?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const contentType = body.contentType ?? "";
  if (!ALLOWED.has(contentType)) {
    return NextResponse.json({ error: "unsupported content type" }, { status: 415 });
  }
  if (!body.size || body.size <= 0 || body.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 413 });
  }

  const ext = (body.ext ?? contentType.split("/")[1] ?? "bin").replace(/[^a-z0-9]/gi, "");
  const objectKey = `receipts/${user.id}/${Date.now()}-${randomUUID()}.${ext}`;

  try {
    const uploadUrl = await presignUpload(objectKey, contentType);
    return NextResponse.json({ uploadUrl, objectKey });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "presign failed" },
      { status: 500 },
    );
  }
}
