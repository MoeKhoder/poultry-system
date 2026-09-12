import "dotenv/config";

function parseBool(value, fallback) {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  dataDir: process.env.DATA_DIR || "./data",
  uploadsDir: process.env.UPLOADS_DIR || "./uploads",
  sessionSecretFile: process.env.SESSION_SECRET_FILE || "./data/.session-secret",
  allowedOrigins: (process.env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  trustProxy: parseBool(process.env.TRUST_PROXY, false),
  tlsCertPath: process.env.TLS_CERT_PATH || "",
  tlsKeyPath: process.env.TLS_KEY_PATH || "",
};
