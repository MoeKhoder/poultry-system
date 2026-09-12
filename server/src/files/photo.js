const DATA_URL_PATTERN = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/;
const MAX_DECODED_BYTES = 3 * 1024 * 1024;

export function validatePhotoDataUrl(value) {
  if (typeof value !== "string") {
    return { valid: false, reason: "not_a_string" };
  }
  const match = value.match(DATA_URL_PATTERN);
  if (!match) {
    return { valid: false, reason: "invalid_format" };
  }
  const base64Body = match[2];
  const decodedSize = Math.floor((base64Body.length * 3) / 4);
  if (decodedSize > MAX_DECODED_BYTES) {
    return { valid: false, reason: "too_large" };
  }
  return { valid: true };
}
