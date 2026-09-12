import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";

const ITERATIONS = 210000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

function ensureSecretKey() {
  const target = env.sessionSecretFile;
  const dir = path.dirname(target);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(target)) {
    const secret = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(target, secret, { mode: 0o600 });
    return secret;
  }
  return fs.readFileSync(target, "utf-8").trim();
}

export const serverSecret = ensureSecretKey();

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = crypto
    .pbkdf2Sync(`${password}:${serverSecret}`, salt, ITERATIONS, KEY_LENGTH, DIGEST)
    .toString("hex");
  return { salt, hash: derived };
}

export function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}
