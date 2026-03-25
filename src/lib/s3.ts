import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";

// Detect local storage mode (no S3 credentials configured)
const isLocalMode = !process.env.S3_ACCESS_KEY_ID;
const LOCAL_STORAGE_DIR = process.env.LOCAL_STORAGE_DIR || "./uploads";

// --- Local filesystem helpers ---

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function localPath(key: string): string {
  return path.join(LOCAL_STORAGE_DIR, key.replace(/\//g, "_"));
}

async function uploadLocal(key: string, body: Buffer): Promise<void> {
  await ensureDir(LOCAL_STORAGE_DIR);
  await fs.writeFile(localPath(key), body);
}

async function downloadLocal(key: string): Promise<Buffer> {
  return fs.readFile(localPath(key));
}

async function deleteLocal(key: string): Promise<void> {
  await fs.unlink(localPath(key)).catch(() => {});
}

function localUrl(key: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/api/files/${encodeURIComponent(key)}`;
}

// --- S3 client (only used when credentials are set) ---

const s3Client = isLocalMode
  ? null
  : new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

const BUCKET = process.env.S3_BUCKET || "ondu-sign-documents";

// --- Public API (works in both local and S3 mode) ---

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  if (isLocalMode) {
    await uploadLocal(key, body);
    return;
  }
  await s3Client!.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function downloadFile(key: string): Promise<Buffer> {
  if (isLocalMode) {
    return downloadLocal(key);
  }
  const response = await s3Client!.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  );
  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) throw new Error("Failed to download file");
  return Buffer.from(bytes);
}

export async function deleteFile(key: string): Promise<void> {
  if (isLocalMode) {
    await deleteLocal(key);
    return;
  }
  await s3Client!.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  if (isLocalMode) {
    return localUrl(key);
  }
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3Client!, command, { expiresIn });
}

export function generateS3Key(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `documents/${userId}/${timestamp}-${sanitized}`;
}

export function generateFinalS3Key(documentId: string): string {
  return `documents/final/${documentId}-signed.pdf`;
}

export { isLocalMode };
