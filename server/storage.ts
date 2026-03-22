import { ENV } from './_core/env';
import fs from 'node:fs/promises';
import * as nodePath from 'node:path';
import { existsSync } from 'node:fs';
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _s3Client: S3Client | null = null;

function getS3Client() {
  if (_s3Client) return _s3Client;

  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKey = process.env.S3_ACCESS_KEY_ID;
  const secretKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !bucket || !accessKey || !secretKey) {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
      console.error("[Storage] CRITICAL ERROR: S3/Spaces variables are missing in production/staging environment.");
      // In staging/prod we DO NOT fallback to local to avoid data loss on container restart
      return null;
    }
    return null; // Fallback to local later in logic if env is development
  }

  console.log(`[Storage] Initializing S3 Client for endpoint: ${endpoint} (Bucket: ${bucket})`);
  _s3Client = new S3Client({
    endpoint: endpoint.startsWith('http') ? endpoint : `https://${endpoint}`,
    region: "us-east-1", // DO Spaces uses us-east-1 for compatibility
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: false, // DigitalOcean requires false
  });
  return _s3Client;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function getLocalFilePath(relKey: string): string {
  return nodePath.join(process.cwd(), ENV.uploadDir || 'uploads', normalizeKey(relKey));
}

function getLocalUrl(relKey: string): string {
  const baseUrl = ENV.baseUrl || "";
  return `${baseUrl}/uploads/${normalizeKey(relKey)}`;
}

async function ensureDirectoryExists(filePath: string) {
  const dirname = nodePath.dirname(filePath);
  if (!existsSync(dirname)) {
    await fs.mkdir(dirname, { recursive: true });
  }
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const s3 = getS3Client();

  if (s3) {
    const bucket = process.env.S3_BUCKET!;
    const body = typeof data === 'string' ? Buffer.from(data) : data;
    
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
    }));

    // Construct URL for DO Spaces
    // https://BUCKET.ENDPOINT/KEY
    const endpoint = process.env.S3_ENDPOINT!.replace(/^https?:\/\//, '');
    const url = `https://${bucket}.${endpoint}/${key}`;
    return { key, url };
  }

  // Fallback to local ONLY in development
  if (process.env.NODE_ENV === 'development') {
    const filePath = getLocalFilePath(key);
    await ensureDirectoryExists(filePath);
    const buffer = typeof data === 'string' ? data : Buffer.from(data);
    await fs.writeFile(filePath, buffer);
    return { key, url: getLocalUrl(key) };
  }

  throw new Error("[Storage] Storage put failed: S3 not configured and local fallback disabled in this environment.");
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const key = normalizeKey(relKey);
  const s3 = getS3Client();

  if (s3) {
    const bucket = process.env.S3_BUCKET!;
    const endpoint = process.env.S3_ENDPOINT!.replace(/^https?:\/\//, '');
    const url = `https://${bucket}.${endpoint}/${key}`;
    return { key, url };
  }

  if (process.env.NODE_ENV === 'development') {
    return { key, url: getLocalUrl(key) };
  }

  throw new Error("[Storage] Storage get failed: S3 not configured.");
}

export async function storageGetBuffer(relKey: string): Promise<Buffer | null> {
  const key = normalizeKey(relKey);
  const s3 = getS3Client();

  if (s3) {
    try {
      const bucket = process.env.S3_BUCKET!;
      const response = await s3.send(new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }));
      const streamToBuffer = (stream: any): Promise<Buffer> =>
        new Promise((resolve, reject) => {
          const chunks: any[] = [];
          stream.on("data", (chunk: any) => chunks.push(chunk));
          stream.on("error", reject);
          stream.on("end", () => resolve(Buffer.concat(chunks)));
        });
      
      return await streamToBuffer(response.Body);
    } catch (e) {
      console.error(`[Storage] Failed to fetch buffer from S3 for ${key}`, e);
      return null;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    const filePath = getLocalFilePath(key);
    try {
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  return null;
}
