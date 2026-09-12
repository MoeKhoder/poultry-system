const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_STRING_LENGTH = 5000;

export function sanitizeInput(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeInput);
  }
  if (value && typeof value === "object") {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      clean[key] = sanitizeInput(val);
    }
    return clean;
  }
  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH ? value.slice(0, MAX_STRING_LENGTH) : value;
  }
  return value;
}
