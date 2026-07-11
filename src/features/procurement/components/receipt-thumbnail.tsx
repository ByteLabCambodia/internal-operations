import { FileText } from "lucide-react";

/**
 * Receipt preview for the payments table. Links through /api/r2/view which
 * generates a fresh presigned URL on each click — no expiry issues.
 */
export function ReceiptThumbnail({ objectKey }: { objectKey: string }) {
  const isImage = /\.(png|jpe?g|gif|webp|avif|heic)$/i.test(objectKey);
  const viewUrl = `/api/r2/view?key=${encodeURIComponent(objectKey)}`;

  return (
    <a
      href={viewUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-md hover:opacity-80"
      title="Open receipt"
    >
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={viewUrl}
          alt="Receipt"
          className="size-12 rounded border object-cover"
        />
      ) : (
        <span className="inline-flex items-center gap-1 text-primary underline underline-offset-2">
          <FileText className="size-4" /> PDF
        </span>
      )}
    </a>
  );
}
