import "server-only";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const R2 = {
  accountId: process.env.R2_ACCOUNT_ID || "",
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  bucket: process.env.R2_BUCKET || "",
  publicUrl: (process.env.R2_PUBLIC_URL || "").replace(/\/$/, ""),
};

export function isR2Configured(): boolean {
  return Boolean(
    R2.accountId && R2.accessKeyId && R2.secretAccessKey && R2.bucket && R2.publicUrl
  );
}

// Detect an uploaded file by shape rather than `instanceof File`. The `File`
// global isn't defined on older Node runtimes (e.g. Node 18 on some hosts),
// so `x instanceof File` throws there. Duck-typing works on every version.
export function isUploadedFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function" &&
    typeof (value as { size?: unknown }).size === "number"
  );
}

function safeExt(filename: string, contentType: string): string {
  const fromName = path.extname(filename || "").toLowerCase().replace(/[^.a-z0-9]/g, "");
  if (fromName) return fromName;
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
  };
  return map[contentType] || "";
}

function makeKey(folder: string, filename: string, contentType: string): string {
  const id = crypto.randomBytes(8).toString("hex");
  const ext = safeExt(filename, contentType);
  const clean = (folder || "misc").replace(/[^a-z0-9/_-]/gi, "");
  return `${clean}/${Date.now()}-${id}${ext}`;
}

/**
 * Store a file and return its public URL.
 * Uses Cloudflare R2 when configured, otherwise writes to /public/uploads.
 */
export async function uploadFile(
  data: Buffer | Uint8Array,
  filename: string,
  contentType: string,
  folder = "products"
): Promise<string> {
  const key = makeKey(folder, filename, contentType);
  const body = Buffer.isBuffer(data) ? data : Buffer.from(data);

  if (isR2Configured()) {
    // Dynamic import so the AWS SDK isn't pulled in when R2 is unused.
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${R2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2.accessKeyId,
        secretAccessKey: R2.secretAccessKey,
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: R2.bucket,
        Key: key,
        Body: body,
        ContentType: contentType || "application/octet-stream",
      })
    );
    return `${R2.publicUrl}/${key}`;
  }

  // Local fallback.
  const dest = path.join(process.cwd(), "public", "uploads", key);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, body);
  return `/uploads/${key}`;
}

// Convenience for handling a browser File from FormData.
export async function uploadFormFile(
  file: File | null | undefined,
  folder = "products"
): Promise<string | null> {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) return null;
  const buf = Buffer.from(await file.arrayBuffer());
  return uploadFile(buf, file.name || "upload", file.type || "application/octet-stream", folder);
}
