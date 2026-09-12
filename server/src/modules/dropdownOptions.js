import { Router } from "express";
import crypto from "node:crypto";
import { readJSON, readModifyWrite } from "../storage/store.js";
import { requireIT } from "../auth/permissions.js";
import { recordAudit } from "../utils/audit.js";
import { sanitizeInput } from "../utils/sanitize.js";

const router = Router();

router.get("/", async (req, res) => {
  const lists = await readJSON("dropdownOptions");
  res.json(lists);
});

router.post("/", requireIT, async (req, res) => {
  const body = sanitizeInput(req.body || {});
  if (!body.label) {
    return res.status(400).json({ error: "label_required" });
  }

  let created = null;
  await readModifyWrite("dropdownOptions", async (lists) => {
    created = {
      id: crypto.randomUUID(),
      label: body.label,
      values: Array.isArray(body.values) ? body.values : [],
      createdAt: new Date().toISOString(),
      createdBy: req.user.username,
      _version: 1,
    };
    lists.push(created);
    return { data: lists };
  });

  await recordAudit({ req, action: "create", module: "dropdownOptions", recordId: created.id, newValue: created, result: "success" });
  res.status(201).json(created);
});

router.put("/:id", requireIT, async (req, res) => {
  const body = sanitizeInput(req.body || {});
  let outcome = null;
  let previous = null;

  await readModifyWrite("dropdownOptions", async (lists) => {
    const index = lists.findIndex((l) => l.id === req.params.id);
    if (index === -1) {
      outcome = { status: 404, payload: { error: "not_found" } };
      return { data: lists };
    }
    const existing = lists[index];
    previous = existing;

    if (body._expectedVersion !== undefined && existing._version !== body._expectedVersion) {
      outcome = { status: 409, payload: { conflict: true, currentVersion: existing._version } };
      return { data: lists };
    }

    const updated = {
      ...existing,
      label: body.label ?? existing.label,
      values: Array.isArray(body.values) ? body.values : existing.values,
      _version: existing._version + 1,
    };
    lists[index] = updated;
    outcome = { status: 200, payload: updated };
    return { data: lists };
  });

  if (outcome.status !== 200) {
    return res.status(outcome.status).json(outcome.payload);
  }

  await recordAudit({ req, action: "update", module: "dropdownOptions", recordId: req.params.id, oldValue: previous, newValue: outcome.payload, result: "success" });
  res.json(outcome.payload);
});

router.delete("/:id", requireIT, async (req, res) => {
  let removed = null;
  let found = false;

  await readModifyWrite("dropdownOptions", async (lists) => {
    const index = lists.findIndex((l) => l.id === req.params.id);
    if (index === -1) return { data: lists };
    found = true;
    removed = lists[index];
    const next = lists.slice();
    next.splice(index, 1);
    return { data: next };
  });

  if (!found) {
    return res.status(404).json({ error: "not_found" });
  }

  await recordAudit({ req, action: "delete", module: "dropdownOptions", recordId: req.params.id, oldValue: removed, result: "success" });
  res.json({ ok: true });
});

export default router;
