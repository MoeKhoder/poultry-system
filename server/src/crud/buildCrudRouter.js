import { Router } from "express";
import crypto from "node:crypto";
import { readJSON, readModifyWrite } from "../storage/store.js";
import { sanitizeInput } from "../utils/sanitize.js";
import { recordAudit } from "../utils/audit.js";
import { requireFeature } from "../auth/permissions.js";

function guardFor(feature, level, customGuard) {
  if (customGuard) return customGuard;
  return requireFeature(feature, level);
}

export function buildCrudRouter({
  file,
  moduleLabel,
  feature,
  uniqueFields = [],
  protectedFields = [],
  beforeCreate,
  afterCreate,
  beforeUpdate,
  readGuard,
  writeGuard,
}) {
  const router = Router();
  const viewGuard = guardFor(feature, "view", readGuard);
  const manageGuard = guardFor(feature, "manage", writeGuard);

  router.get("/", viewGuard, async (req, res) => {
    const items = await readJSON(file);
    res.json(items);
  });

  router.get("/:id", viewGuard, async (req, res) => {
    const items = await readJSON(file);
    const item = items.find((i) => i.id === req.params.id);
    if (!item) return res.status(404).json({ error: "not_found" });
    res.json(item);
  });

  router.post("/", manageGuard, async (req, res) => {
    const body = sanitizeInput(req.body || {});

    let result = null;
    let duplicateField = null;

    await readModifyWrite(file, async (items) => {
      for (const field of uniqueFields) {
        if (body[field] !== undefined && items.some((i) => i[field] === body[field])) {
          duplicateField = field;
          return { data: items };
        }
      }

      let candidate = { ...body };
      if (beforeCreate) {
        candidate = await beforeCreate(candidate, items);
      }
      const newItem = {
        ...candidate,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        createdBy: req.user?.username || "system",
        _version: 1,
      };
      items.push(newItem);
      result = newItem;
      return { data: items };
    });

    if (duplicateField) {
      return res.status(409).json({ error: "duplicate_field", field: duplicateField });
    }

    await recordAudit({
      req,
      action: "create",
      module: moduleLabel,
      recordId: result.id,
      newValue: result,
      result: "success",
    });

    res.status(201).json(result);

    if (afterCreate) {
      Promise.resolve()
        .then(() => afterCreate(result, req))
        .catch((err) => {
          console.error(`[afterCreate:${moduleLabel}]`, err);
        });
    }
  });

  router.put("/:id", manageGuard, async (req, res) => {
    const body = sanitizeInput(req.body || {});
    const { _expectedVersion } = req.body || {};

    let outcome = null;
    let previous = null;

    await readModifyWrite(file, async (items) => {
      const index = items.findIndex((i) => i.id === req.params.id);
      if (index === -1) {
        outcome = { status: 404, payload: { error: "not_found" } };
        return { data: items };
      }

      const existing = items[index];
      previous = existing;

      if (_expectedVersion !== undefined && existing._version !== _expectedVersion) {
        outcome = {
          status: 409,
          payload: { conflict: true, currentVersion: existing._version },
        };
        return { data: items };
      }

      const protectedSnapshot = {};
      for (const field of protectedFields) {
        protectedSnapshot[field] = existing[field];
      }

      let mergedBody = body;
      if (beforeUpdate) {
        mergedBody = await beforeUpdate(body, existing, items);
      }

      const updated = {
        ...existing,
        ...mergedBody,
        id: existing.id,
        createdAt: existing.createdAt,
        createdBy: existing.createdBy,
        ...protectedSnapshot,
        _version: existing._version + 1,
      };

      items[index] = updated;
      outcome = { status: 200, payload: updated };
      return { data: items };
    });

    if (outcome.status !== 200) {
      return res.status(outcome.status).json(outcome.payload);
    }

    await recordAudit({
      req,
      action: "update",
      module: moduleLabel,
      recordId: req.params.id,
      oldValue: previous,
      newValue: outcome.payload,
      result: "success",
    });

    res.json(outcome.payload);
  });

  router.delete("/:id", manageGuard, async (req, res) => {
    let removed = null;
    let found = false;

    await readModifyWrite(file, async (items) => {
      const index = items.findIndex((i) => i.id === req.params.id);
      if (index === -1) {
        return { data: items };
      }
      found = true;
      removed = items[index];
      const next = items.slice();
      next.splice(index, 1);
      return { data: next };
    });

    if (!found) {
      return res.status(404).json({ error: "not_found" });
    }

    await recordAudit({
      req,
      action: "delete",
      module: moduleLabel,
      recordId: req.params.id,
      oldValue: removed,
      result: "success",
    });

    res.json({ ok: true });
  });

  return router;
}
