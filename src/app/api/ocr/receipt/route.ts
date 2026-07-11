import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";

interface OcrResult {
  ParsedResults?: Array<{ ParsedText?: string }>;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string;
}

export interface ScannedFields {
  amount: number | null;
  currency: "USD" | "KHR" | "CNY" | null;
  reference: string | null;
  trx_id: string | null;
  sender: string | null;
  transfer_to: string | null;
  remark: string | null;
  bank_account: string | null;
  paid_at: string | null;
  qty: number | null;
}

function parseReceipt(ocr: OcrResult): ScannedFields {
  const rawText = ocr.ParsedResults?.[0]?.ParsedText ?? "";

  // OCR Engine 2 with isTable=true returns tab-separated key\tvalue rows.
  // Build a label→value map from those rows.
  const tabPairs: Record<string, string> = {};
  for (const row of rawText.split(/\r?\n/)) {
    const parts = row.split("\t").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      // First part is the label (may end with ":"), rest joined is the value
      tabPairs[parts[0].replace(/:$/, "").toLowerCase()] = parts.slice(1).join(" ");
    }
  }

  const get = (pattern: RegExp) =>
    Object.entries(tabPairs).find(([k]) => pattern.test(k))?.[1]?.trim() ?? "";

  const rawAmount     = get(/original.?amount/i) || get(/^amount/i);
  const rawRef        = get(/reference/i);
  const rawTo         = get(/to.?account/i);
  const rawDate       = get(/transaction.?date/i);
  const rawTrxId      = get(/trx.*(id|no)/i);
  const rawSender     = get(/^sender/i);
  const rawRemark     = get(/^remark/i);

  // "Transfer to NAME" appears as the subtitle line in the receipt header
  const transferToMatch = rawText.match(/Transfer\s+to\s+([A-Z][A-Z\s]+?)(?:\t|\r|\n|$)/i);
  const rawTransferTo = transferToMatch?.[1]?.trim() ?? null;

  // Parse amount + currency
  const amountMatch = rawAmount.match(/([0-9,]+\.?\d*)\s*(USD|KHR|CNY)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null;
  const currency = amountMatch
    ? (amountMatch[2].toUpperCase() as "USD" | "KHR" | "CNY")
    : null;

  // Parse date ("Jun 27, 2026 03:30 PM" etc.)
  let paidAt: string | null = null;
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) paidAt = d.toISOString().slice(0, 10);
  }

  // Fix OCR misreads at the start of reference strings (I→1, O→0)
  const cleanRef = (rawRef || rawTrxId)
    .replace(/^[IO]+/g, (m) => m.replace(/I/g, "1").replace(/O/g, "0"))
    .trim();

  // Quantity — for delivery / purchase receipts (claim context)
  const qtyMatch =
    rawText.match(/(?:qty|quantity|units?|pcs|pieces?)[:\s×x*]+(\d+(?:\.\d+)?)/i) ||
    rawText.match(/(\d+(?:\.\d+)?)\s*(?:pcs|pieces?|units?)/i);
  const qty = qtyMatch ? parseFloat(qtyMatch[1]) : null;

  return {
    amount,
    currency,
    reference: cleanRef || null,
    trx_id: rawTrxId || null,
    sender: rawSender || null,
    transfer_to: rawTransferTo,
    remark: rawRemark || null,
    bank_account: rawTo || null,
    paid_at: paidAt,
    qty,
  };
}

export async function POST(req: NextRequest) {
  await requireUser();

  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OCR not configured (missing OCR_SPACE_API_KEY)" }, { status: 503 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > 1_000_000) {
    return Response.json({ error: "File too large (max 1 MB for OCR scan)" }, { status: 413 });
  }

  // Encode as base64 data URI for OCR.space
  const bytes = await file.arrayBuffer();
  const b64 = Buffer.from(bytes).toString("base64");
  const dataUri = `data:${file.type};base64,${b64}`;

  const ocrForm = new FormData();
  ocrForm.append("base64Image", dataUri);
  ocrForm.append("isTable", "true");
  ocrForm.append("OCREngine", "2");
  ocrForm.append("language", "eng");

  const ocrRes = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { apikey: apiKey },
    body: ocrForm,
  });

  if (!ocrRes.ok) {
    return Response.json({ error: "OCR service error" }, { status: 502 });
  }

  const ocrData: OcrResult = await ocrRes.json();

  if (ocrData.IsErroredOnProcessing) {
    return Response.json(
      { error: ocrData.ErrorMessage ?? "OCR processing failed" },
      { status: 422 }
    );
  }

  return Response.json(parseReceipt(ocrData));
}
