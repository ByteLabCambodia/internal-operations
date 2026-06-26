import { FileText } from "lucide-react";

/**
 * Receipt preview for the payments table. Renders a small image thumbnail for
 * image receipts (click to open full size) or a labelled icon link for PDFs.
 * `url` is a short-lived presigned GET URL; `objectKey` is used only to detect
 * the file type from its extension.
 */
export function ReceiptThumbnail({ url, objectKey }: { url: string; objectKey: string }) {
  const isImage = /\.(png|jpe?g|gif|webp|avif|heic)$/i.test(objectKey);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-md hover:opacity-80"
      title="Open receipt"
    >
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- presigned URLs are dynamic/short-lived; next/image optimization is a poor fit
        <img
          src={url}
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
