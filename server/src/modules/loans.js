import { Router } from "express";
import { buildCrudRouter } from "../crud/buildCrudRouter.js";
import { readJSON } from "../storage/store.js";
import { requireFeature } from "../auth/permissions.js";

const router = Router();

router.get("/history", requireFeature("accounts", "view"), async (req, res) => {
  const logs = await readJSON("systemLogs");
  const { partyType, partyId } = req.query;
  const history = logs.filter(
    (log) =>
      log.module === "loans" &&
      (!partyType || log.oldValue?.partyType === partyType || log.newValue?.partyType === partyType) &&
      (!partyId || log.oldValue?.partyId === partyId || log.newValue?.partyId === partyId),
  );
  res.json(history);
});

router.use(buildCrudRouter({
  file: "loans",
  moduleLabel: "loans",
  feature: "accounts",
  protectedFields: [],
  beforeCreate: async (body) => ({
    ...body,
    amount: Number(body.amount),
  }),
}));

export default router;
