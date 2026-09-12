import { Router } from "express";
import { readJSON } from "../storage/store.js";
import { requireFeature } from "../auth/permissions.js";

const router = Router();

router.get("/", requireFeature("accounts", "view"), async (req, res) => {
  const [suppliers, slaughterhouses, purchaseOrders, invoices, payments] = await Promise.all([
    readJSON("suppliers"),
    readJSON("slaughterhouses"),
    readJSON("purchaseOrders"),
    readJSON("salesInvoices"),
    readJSON("payments"),
  ]);

  const supplierSummaries = suppliers.map((s) => {
    const supplierOrders = purchaseOrders.filter((o) => o.supplierId === s.id);
    const totalPurchases = supplierOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const paidOnOrders = supplierOrders.reduce((sum, o) => sum + (o.paid || 0), 0);
    const paidViaLedger = payments
      .filter((p) => p.partyType === "supplier" && p.partyId === s.id)
      .reduce((sum, p) => sum + p.amount, 0);
    const paid = paidOnOrders + paidViaLedger;
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      region: s.region,
      contact: s.contact,
      phone: s.phone,
      totalPurchases: Math.round(totalPurchases),
      paid: Math.round(paid),
      remaining: Math.round(totalPurchases - paid),
    };
  });

  const slaughterhouseSummaries = slaughterhouses.map((s) => {
    const houseInvoices = invoices.filter((i) => i.slaughterhouse === s.name);
    const totalSales = houseInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const paidOnInvoices = houseInvoices.reduce((sum, i) => sum + (i.paid || 0), 0);
    const paidViaLedger = payments
      .filter((p) => p.partyType === "slaughterhouse" && p.partyId === s.id)
      .reduce((sum, p) => sum + p.amount, 0);
    const paid = paidOnInvoices + paidViaLedger;
    return {
      id: s.id,
      code: s.code,
      name: s.name,
      region: s.region,
      contact: s.contact,
      phone: s.phone,
      capacityPerDay: s.capacityPerDay,
      totalSales: Math.round(totalSales),
      paid: Math.round(paid),
      remaining: Math.round(totalSales - paid),
    };
  });

  res.json({ suppliers: supplierSummaries, slaughterhouses: slaughterhouseSummaries });
});

export default router;
