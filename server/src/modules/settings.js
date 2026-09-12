import { Router } from "express";
import { readJSON, readModifyWrite } from "../storage/store.js";
import { requireIT } from "../auth/permissions.js";
import { recordAudit } from "../utils/audit.js";
import { sanitizeInput } from "../utils/sanitize.js";

const router = Router();
const DEFAULT_SETTINGS = {
  companyName: "",
  vatNumber: "",
  commercialRegister: "",
  phone: "",
  city: "",
  address: "",
  email: "",
  currency: "$",
  weightUnit: "كغ",
  fixedCageWeight: 8,
  purchaseMarginPercent: 20,
  invoicePrefix: "INV-2026-",
  debtReminderDays: 7,
  invoiceFooterNote: "شكراً لتعاملكم معنا",
  alertSlaughterhouseDebtEnabled: true,
  alertSlaughterhouseDebtThreshold: 50000,
  alertDriverLicenseEnabled: true,
  alertDriverLicenseDays: 30,
  dailyEmailReportEnabled: false,
  alertMissingDailyPriceEnabled: true,
};

router.get("/", async (req, res) => {
  const all = await readJSON("settings");
  res.json(all[0] || DEFAULT_SETTINGS);
});

router.put("/", requireIT, async (req, res) => {
  const body = sanitizeInput(req.body || {});
  let updated = null;
  let previous = null;

  await readModifyWrite("settings", async (all) => {
    previous = all[0] || DEFAULT_SETTINGS;
    updated = { ...previous, ...body, _version: (previous._version || 0) + 1 };
    return { data: [updated] };
  });

  await recordAudit({ req, action: "update", module: "settings", oldValue: previous, newValue: updated, result: "success" });
  res.json(updated);
});

export default router;
