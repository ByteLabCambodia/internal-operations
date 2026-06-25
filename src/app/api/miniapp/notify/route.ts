import { NextResponse, type NextRequest } from "next/server";

import { notify } from "@/lib/telegram";

/** Fire-and-forget notification proxy for the Telegram Mini App.
 *  The Mini App can't call server actions (no cookie session), so it POSTs here. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.event) return NextResponse.json({ ok: false }, { status: 400 });

  await notify(body.event, body).catch(() => {});
  return NextResponse.json({ ok: true });
}
