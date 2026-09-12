import { Router } from "express";
import rateLimit from "express-rate-limit";
import { readJSON, readModifyWrite } from "../storage/store.js";
import { hashPassword, verifyPassword } from "../utils/hash.js";
import { createSession, revokeSession, revokeAllSessionsForUser } from "./sessions.js";
import { requireAuth } from "../middleware/auth.js";
import { recordAudit } from "../utils/audit.js";

const router = Router();

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_attempts" },
});

router.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username_and_password_required" });
  }
  const users = await readJSON("users");
  const user = users.find((u) => u.username === username);
  if (!user || user.active === false) {
    return res.status(401).json({ error: "invalid_credentials" });
  }
  const valid = verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "invalid_credentials" });
  }
  const token = await createSession(user);
  const { passwordHash, passwordSalt, ...safeUser } = user;
  req.user = safeUser;
  await recordAudit({ req, action: "login", module: "auth", recordId: user.id, result: "success" });
  res.json({ token, user: safeUser });
});

router.post("/logout", requireAuth, async (req, res) => {
  await revokeSession(req.sessionToken);
  await recordAudit({ req, action: "logout", module: "auth", recordId: req.user.id, result: "success" });
  res.json({ ok: true });
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "current_and_new_password_required" });
  }
  const users = await readJSON("users");
  const user = users.find((u) => u.id === req.user.id);
  const valid = verifyPassword(currentPassword, user.passwordSalt, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "invalid_current_password" });
  }
  const { salt, hash } = hashPassword(newPassword);
  await readModifyWrite("users", async (users) => {
    const next = users.map((u) => (u.id === user.id ? { ...u, passwordSalt: salt, passwordHash: hash } : u));
    return { data: next };
  });
  await revokeAllSessionsForUser(user.id, req.sessionToken);
  await recordAudit({ req, action: "changePassword", module: "auth", recordId: user.id, result: "success" });
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
