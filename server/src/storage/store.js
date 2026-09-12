import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

function filePath(name) {
  return path.join(env.dataDir, `${name}.json`);
}

function ensureDataDir() {
  if (!fs.existsSync(env.dataDir)) {
    fs.mkdirSync(env.dataDir, { recursive: true });
  }
}

export async function readJSON(name) {
  ensureDataDir();
  const target = filePath(name);
  try {
    const raw = await fsp.readFile(target, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeJSON(name, data) {
  ensureDataDir();
  const target = filePath(name);
  const tmp = path.join(env.dataDir, `.${name}.${process.pid}.${Date.now()}.tmp`);
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fsp.rename(tmp, target);
  return data;
}

const locks = new Map();
const LOG_CAP = 5000;

async function withFileLock(name, fn) {
  const previous = locks.get(name) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  locks.set(name, previous.then(() => current));
  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(name) === current) {
      locks.delete(name);
    }
  }
}

export async function readModifyWrite(name, mutate) {
  return withFileLock(name, async () => {
    const data = await readJSON(name);
    const result = await mutate(data);
    await writeJSON(name, result.data ?? data);
    return result;
  });
}

export async function appendLog(entry) {
  await withFileLock("systemLogs", async () => {
    const logs = await readJSON("systemLogs");
    logs.unshift({ ...entry, timestamp: entry.timestamp || new Date().toISOString() });
    if (logs.length > LOG_CAP) {
      logs.length = LOG_CAP;
    }
    await writeJSON("systemLogs", logs);
    return { data: logs };
  });
}
