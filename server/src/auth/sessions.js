import { readJSON, writeJSON, readModifyWrite } from "../storage/store.js";
import { generateToken } from "../utils/hash.js";

const SESSIONS_FILE = "sessions";

export async function createSession(user) {
  const token = generateToken();
  const session = {
    token,
    userId: user.id,
    username: user.username,
    createdAt: new Date().toISOString(),
  };
  await readModifyWrite(SESSIONS_FILE, async (sessions) => {
    sessions.push(session);
    return { data: sessions };
  });
  return token;
}

export async function findSession(token) {
  const sessions = await readJSON(SESSIONS_FILE);
  return sessions.find((s) => s.token === token) || null;
}

export async function revokeSession(token) {
  await readModifyWrite(SESSIONS_FILE, async (sessions) => {
    return { data: sessions.filter((s) => s.token !== token) };
  });
}

export async function revokeAllSessionsForUser(userId, exceptToken = null) {
  await readModifyWrite(SESSIONS_FILE, async (sessions) => {
    return { data: sessions.filter((s) => s.userId !== userId || s.token === exceptToken) };
  });
}
