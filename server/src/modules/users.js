import { Router } from "express";
import crypto from "node:crypto";
import { readJSON, readModifyWrite } from "../storage/store.js";
import { requireIT } from "../auth/permissions.js";
import { hashPassword } from "../utils/hash.js";
import { revokeAllSessionsForUser } from "../auth/sessions.js";
import { recordAudit } from "../utils/audit.js";
import { sanitizeInput } from "../utils/sanitize.js";

const router = Router();

function stripSecrets(user) {
  const { passwordHash, passwordSalt, ...safe } = user;
  return safe;
}

router.get("/", requireIT, async (req, res) => {
  const users = await readJSON("users");
  res.json(users.map(stripSecrets));
});

router.get("/:id", requireIT, async (req, res) => {
  const users = await readJSON("users");
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "not_found" });
  res.json(stripSecrets(user));
});

router.post("/", requireIT, async (req, res) => {
  const body = sanitizeInput(req.body || {});
  if (!body.username || !body.password || !body.role) {
    return res.status(400).json({ error: "username_password_role_required" });
  }

  let result = null;
  let duplicate = false;

  await readModifyWrite("users", async (users) => {
    if (users.some((u) => u.username === body.username)) {
      duplicate = true;
      return { data: users };
    }
    const { salt, hash } = hashPassword(body.password);
    const newUser = {
      id: crypto.randomUUID(),
      username: body.username,
      email: body.email || null,
      role: body.role,
      permissions: body.permissions || {},
      active: true,
      passwordSalt: salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.username || "system",
      _version: 1,
    };
    users.push(newUser);
    result = newUser;
    return { data: users };
  });

  if (duplicate) {
    return res.status(409).json({ error: "username_taken" });
  }

  await recordAudit({ req, action: "create", module: "users", recordId: result.id, newValue: stripSecrets(result), result: "success" });
  res.status(201).json(stripSecrets(result));
});

router.put("/:id", requireIT, async (req, res) => {
  const body = sanitizeInput(req.body || {});
  let outcome = null;
  let previous = null;
  let deactivated = false;

  await readModifyWrite("users", async (users) => {
    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) {
      outcome = { status: 404, payload: { error: "not_found" } };
      return { data: users };
    }
    const existing = users[index];
    previous = existing;

    if (req.body._expectedVersion !== undefined && existing._version !== req.body._expectedVersion) {
      outcome = { status: 409, payload: { conflict: true, currentVersion: existing._version } };
      return { data: users };
    }

    if (body.active === false && existing.active !== false) {
      deactivated = true;
    }

    const updated = {
      ...existing,
      role: body.role ?? existing.role,
      permissions: body.permissions ?? existing.permissions,
      active: body.active ?? existing.active,
      id: existing.id,
      username: existing.username,
      passwordHash: existing.passwordHash,
      passwordSalt: existing.passwordSalt,
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
      _version: existing._version + 1,
    };
    users[index] = updated;
    outcome = { status: 200, payload: updated };
    return { data: users };
  });

  if (outcome.status !== 200) {
    return res.status(outcome.status).json(outcome.payload);
  }

  if (deactivated) {
    await revokeAllSessionsForUser(req.params.id);
  }

  await recordAudit({
    req,
    action: deactivated ? "deactivate" : "update",
    module: "users",
    recordId: req.params.id,
    oldValue: stripSecrets(previous),
    newValue: stripSecrets(outcome.payload),
    result: "success",
  });

  res.json(stripSecrets(outcome.payload));
});

router.post("/:id/reset-password", requireIT, async (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword) {
    return res.status(400).json({ error: "new_password_required" });
  }

  let found = false;

  await readModifyWrite("users", async (users) => {
    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) return { data: users };
    found = true;
    const { salt, hash } = hashPassword(newPassword);
    const next = users.slice();
    next[index] = { ...next[index], passwordSalt: salt, passwordHash: hash, _version: next[index]._version + 1 };
    return { data: next };
  });

  if (!found) {
    return res.status(404).json({ error: "not_found" });
  }

  await revokeAllSessionsForUser(req.params.id);
  await recordAudit({ req, action: "resetPassword", module: "users", recordId: req.params.id, result: "success" });
  res.json({ ok: true });
});

router.delete("/:id", requireIT, async (req, res) => {
  let removed = null;
  let found = false;

  await readModifyWrite("users", async (users) => {
    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) return { data: users };
    found = true;
    removed = users[index];
    const next = users.slice();
    next.splice(index, 1);
    return { data: next };
  });

  if (!found) {
    return res.status(404).json({ error: "not_found" });
  }

  await revokeAllSessionsForUser(req.params.id);
  await recordAudit({ req, action: "delete", module: "users", recordId: req.params.id, oldValue: stripSecrets(removed), result: "success" });
  res.json({ ok: true });
});

export default router;
