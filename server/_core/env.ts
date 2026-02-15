export const ENV = {
  appId: process.env.VITE_APP_ID ?? "ods-energy-local",
  cookieSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  storageType: (process.env.STORAGE_TYPE || "local") as "s3" | "local",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  baseUrl: process.env.BASE_URL || "",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  // S3 / Forge Storage
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || process.env.S3_ENDPOINT || "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || process.env.S3_ACCESS_KEY || "",
  // Optional if needed for direct S3
  bucketName: process.env.S3_BUCKET_NAME || "",

  // Email
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: process.env.SMTP_PORT || "587",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "no_reply@odsenergy.es",
};

console.log(`[ENV] Initialized. Storage: ${ENV.storageType}`);
