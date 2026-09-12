import { Router } from "express";
import { readJSON, readModifyWrite } from "../storage/store.js";
import { requireIT } from "../auth/permissions.js";
import { recordAudit } from "../utils/audit.js";
import { sanitizeInput } from "../utils/sanitize.js";
import { getRoleDefaults, CONFIGURABLE_ROLES } from "../auth/permissions.js";

const router = Router();

router.get("/", requireIT, async (req, res) => {
  const defaults = await getRoleDefaults();
  res.json(defaults);
});

router.put("/", requireIT, async (req, res) => {
  const body = sanitizeInput(req.body || {});
  let updated = null;
  let previous = null;

  await readModifyWrite("roleDefaults", async (all) => {
    previous = all[0] || {};
    const next = { ...previous };
    for (const role of CONFIGURABLE_ROLES) {
      if (body[role]) {
        next[role] = { ...(previous[role] || {}), ...body[role] };
      }
    }
    next._version = (previous._version || 0) + 1;
    updated = next;
    return { data: [next] };
  });

  await recordAudit({ req, action: "update", module: "roleDefaults", oldValue: previous, newValue: updated, result: "success" });
  res.json(await getRoleDefaults());
});

export default router;
