import { Router } from "express";
import { readJSON } from "../storage/store.js";
import { requireAuth } from "../middleware/auth.js";
import { hasAccess } from "../auth/permissions.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const [suppliers, slaughterhouses, invoices, trips, expenses] = await Promise.all([
    readJSON("suppliers"),
    readJSON("slaughterhouses"),
    readJSON("salesInvoices"),
    readJSON("distributionTrips"),
    readJSON("expenses"),
  ]);

  const totalSales = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalPurchases = suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0);
  const totalWeightKg = trips.reduce((sum, t) => sum + (t.weightKg || 0), 0);

  const payload = {
    totalSales,
    totalPurchases,
    totalWeightKg,
    supplierCount: suppliers.length,
    slaughterhouseCount: slaughterhouses.length,
    recentTrips: trips.slice(0, 6),
  };

  if (await hasAccess(req.user, "accounts", "view")) {
    payload.accounts = {
      totalSupplierDebt: suppliers.reduce((sum, s) => sum + (s.balance || 0), 0),
      totalSlaughterhouseDue: slaughterhouses.reduce((sum, s) => sum + (s.dueBalance || 0), 0),
    };
  }

  if (await hasAccess(req.user, "expenses", "view")) {
    payload.totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }

  res.json(payload);
});

export default router;
