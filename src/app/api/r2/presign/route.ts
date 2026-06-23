import { NextResponse } from "next/server";

/**
 * Issues a presigned R2 PUT URL for direct client uploads (receipts/images).
 * Implemented in Phase 3.
 *
 * Must authenticate the caller, validate content-type and size server-side
 * before signing, and return only the object_key + upload URL.
 */
export async function POST() {
  return NextResponse.json({ ok: true, phase: "stub" });
}
