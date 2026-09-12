import { Router } from "express";
import { readJSON, writeJSON } from "../storage/store.js";
import { requireIT } from "../auth/permissions.js";
import { recordAudit } from "../utils/audit.js";

const COLLECTIONS = [
  "suppliers",
  "slaughterhouses",
  "dailyPrices",
  "salesInvoices",
  "distributionTrips",
  "expenses",
  "settings",
  "systemLogs",
];

const router = Router();

router.get("/", requireIT, async (req, res) => {
  const bundle = {};
  for (const name of COLLECTIONS) {
    bundle[name] = await readJSON(name);
  }

  const users = await readJSON("users");
  bundle.users = users.map(({ passwordHash, passwordSalt, ...safe }) => safe);
  bundle.generatedAt = new Date().toISOString();
  bundle.generatedBy = req.user.username;

  await recordAudit({ req, action: "download", module: "backup", result: "success" });

  const filename = `poultry-backup-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/json");
  res.json(bundle);
});

router.post("/restore", requireIT, async (req, res) => {
  const body = req.body || {};
  const restorable = COLLECTIONS.filter((name) => Array.isArray(body[name]));

  if (restorable.length === 0) {
    return res.status(400).json({ error: "no_restorable_collections" });
  }

  for (const name of restorable) {
    await writeJSON(name, body[name]);
  }

  await recordAudit({
    req,
    action: "restore",
    module: "backup",
    newValue: { restoredCollections: restorable },
    result: "success",
  });

  res.json({ ok: true, restoredCollections: restorable });
});

export default router;
