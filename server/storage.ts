import { ENV } from './_core/env';
import fs from 'node:fs/promises';
import * as nodePath from 'node:path';
import { existsSync } from 'node:fs';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    if (ENV.storageType === 's3') {
      throw new Error(
        "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
      );
    }
    return { baseUrl: "", apiKey: "" };
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

// Local storage helpers
async function ensureDirectoryExists(filePath: string) {
  const dirname = nodePath.dirname(filePath);
  if (!existsSync(dirname)) {
    await fs.mkdir(dirname, { recursive: true });
  }
}

function getLocalFilePath(relKey: string): string {
  return nodePath.join(process.cwd(), ENV.uploadDir, normalizeKey(relKey));
}

function getLocalUrl(relKey: string): string {
  const baseUrl = ENV.baseUrl || "";
  return `${baseUrl}/uploads/${normalizeKey(relKey)}`;
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  if (ENV.storageType === 'local') {
    const filePath = getLocalFilePath(key);
    await ensureDirectoryExists(filePath);

    let buffer: Buffer | string;
    if (typeof data === 'string') {
      buffer = data;
    } else if (data instanceof Uint8Array) {
      buffer = Buffer.from(data);
    } else {
      buffer = data;
    }

    await fs.writeFile(filePath, buffer);
    return { key, url: getLocalUrl(key) };
  }

  const { baseUrl, apiKey } = getStorageConfig();
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const key = normalizeKey(relKey);

  if (ENV.storageType === 'local') {
    return {
      key,
      url: getLocalUrl(key),
    };
  }

  const { baseUrl, apiKey } = getStorageConfig();
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}

export async function storageGetBuffer(relKey: string): Promise<Buffer | null> {
  const key = normalizeKey(relKey);

  if (ENV.storageType === 'local') {
    const filePath = getLocalFilePath(key);
    try {
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  // Remote
  try {
    const { url } = await storageGet(key);
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.error(`[Storage] Failed to fetch buffer for ${key}`, e);
    return null;
  }
}
