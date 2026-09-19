import { Router } from "express";
import { readJSON } from "../storage/store.js";
import { requireFeature } from "../auth/permissions.js";
import { partyLoanTotals } from "../utils/loanBalances.js";

const router = Router();

router.get("/", requireFeature("accounts", "view"), async (req, res) => {
  const [suppliers, slaughterhouses, purchaseOrders, invoices, payments, loans] = await Promise.all([
    readJSON("suppliers"),
    readJSON("slaughterhouses"),
    readJSON("purchaseOrders"),
    readJSON("salesInvoices"),
    readJSON("payments"),
    readJSON("loans"),
  ]);

  const supplierSummaries = suppliers.map((s) => {
    const supplierOrders = purchaseOrders.filter((o) => o.supplierId === s.id);
    const ordersTotal = supplierOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const { gross: loansTotal, outstanding: loansOutstanding } = partyLoanTotals(loans, payments, "supplier", s.id);
    const totalPurchases = ordersTotal + loansTotal;
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
      invoicesTotal: Math.round(ordersTotal),
      loansTotal: Math.round(loansTotal),
      loansOutstanding: Math.round(loansOutstanding),
      paid: Math.round(paid),
      remaining: Math.round(totalPurchases - paid),
    };
  });

  const slaughterhouseSummaries = slaughterhouses.map((s) => {
    const houseInvoices = invoices.filter((i) => i.slaughterhouse === s.name);
    const invoicesTotal = houseInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const { gross: loansTotal, outstanding: loansOutstanding } = partyLoanTotals(loans, payments, "slaughterhouse", s.id);
    const totalSales = invoicesTotal + loansTotal;
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
      invoicesTotal: Math.round(invoicesTotal),
      loansTotal: Math.round(loansTotal),
      loansOutstanding: Math.round(loansOutstanding),
      paid: Math.round(paid),
      remaining: Math.round(totalSales - paid),
    };
  });

  res.json({ suppliers: supplierSummaries, slaughterhouses: slaughterhouseSummaries });
});

export default router;
