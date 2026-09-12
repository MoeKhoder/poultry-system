import { readJSON } from "../storage/store.js";
import { findSession } from "../auth/sessions.js";

async function resolveUserFromToken(token) {
  if (!token) return null;
  const session = await findSession(token);
  if (!session) return null;
  const users = await readJSON("users");
  const user = users.find((u) => u.id === session.userId);
  if (!user || user.active === false) return null;
  const { passwordHash, passwordSalt, ...safeUser } = user;
  return safeUser;
}

function extractHeaderToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) return token;
  return null;
}

export async function requireAuth(req, res, next) {
  const token = extractHeaderToken(req);
  const user = await resolveUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "unauthorized" });
  }
  req.user = user;
  req.sessionToken = token;
  next();
}

export async function requireAuthAny(req, res, next) {
  const token = extractHeaderToken(req) || req.query.token;
  const user = await resolveUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "unauthorized" });
  }
  req.user = user;
  req.sessionToken = token;
  next();
}
