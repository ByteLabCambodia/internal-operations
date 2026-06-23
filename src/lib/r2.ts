import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 (S3-compatible) access for receipt/image uploads.
 *
 * Flow: the client requests a presigned PUT URL from a server route, uploads
 * the file directly to R2 (never streaming large files through serverless),
 * and we persist only the `object_key`. Reads use short-TTL presigned GETs or
 * the public base URL.
 */

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET;

let _client: S3Client | null = null;

function client(): S3Client {
  if (_client) return _client;
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    throw new Error("R2 credentials are not configured");
  }
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
  });
  return _client;
}

/** Presigned URL for a direct client-side PUT upload. */
export function presignUpload(objectKey: string, contentType: string, ttlSeconds = 300) {
  return getSignedUrl(
    client(),
    new PutObjectCommand({ Bucket: BUCKET, Key: objectKey, ContentType: contentType }),
    { expiresIn: ttlSeconds },
  );
}

/** Short-lived presigned URL for reading a stored object. */
export function presignDownload(objectKey: string, ttlSeconds = 300) {
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: BUCKET, Key: objectKey }),
    { expiresIn: ttlSeconds },
  );
}

/** Public URL when the bucket is served via a custom/public domain. */
export function publicUrl(objectKey: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL ?? "";
  return `${base.replace(/\/$/, "")}/${objectKey}`;
}
