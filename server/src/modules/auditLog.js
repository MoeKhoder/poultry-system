import { Router } from "express";
import { readJSON } from "../storage/store.js";
import { requireIT } from "../auth/permissions.js";

const router = Router();

router.get("/", requireIT, async (req, res) => {
  const logs = await readJSON("systemLogs");
  const limit = Math.min(Number(req.query.limit) || 200, 5000);
  res.json(logs.slice(0, limit));
});

export default router;
