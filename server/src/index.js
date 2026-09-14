import express from "express";
import fs from "node:fs";
import https from "node:https";
import { env } from "./config/env.js";
import { buildHelmet, buildCors, apiRateLimiter, noCacheForShell } from "./middleware/security.js";
import { requireAuth } from "./middleware/auth.js";
import authRoutes from "./auth/authRoutes.js";
import usersRoutes from "./modules/users.js";
import settingsRoutes from "./modules/settings.js";
import auditLogRoutes from "./modules/auditLog.js";
import documentsRoutes from "./files/documents.js";
import backupRoutes from "./modules/backup.js";
import roleDefaultsRoutes from "./modules/roleDefaults.js";
import dropdownOptionsRoutes from "./modules/dropdownOptions.js";
import purchaseOrdersRoutes from "./modules/purchaseOrders.js";
import suppliersRoutes from "./modules/suppliers.js";
import slaughterhousesRoutes from "./modules/slaughterhouses.js";
import dailyPricingRoutes from "./modules/dailyPricing.js";
import salesInvoicesRoutes from "./modules/salesInvoices.js";
import distributionTripsRoutes from "./modules/distributionTrips.js";
import vehiclesRoutes from "./modules/vehicles.js";
import driversRoutes from "./modules/drivers.js";
import expensesRoutes from "./modules/expenses.js";
import paymentsRoutes from "./modules/payments.js";
import loansRoutes from "./modules/loans.js";
import accountsSummaryRoutes from "./modules/accountsSummary.js";

const app = express();

if (env.trustProxy) {
  app.set("trust proxy", 1);
}

app.use(buildHelmet());
app.use(buildCors());
app.use(express.json({ limit: "1mb" }));
app.use(noCacheForShell);
app.use("/api", apiRateLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", requireAuth, usersRoutes);
app.use("/api/settings", requireAuth, settingsRoutes);
app.use("/api/audit-log", requireAuth, auditLogRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/backup", requireAuth, backupRoutes);
app.use("/api/role-defaults", requireAuth, roleDefaultsRoutes);
app.use("/api/dropdown-options", requireAuth, dropdownOptionsRoutes);
app.use("/api/purchase-orders", requireAuth, purchaseOrdersRoutes);
app.use("/api/suppliers", requireAuth, suppliersRoutes);
app.use("/api/slaughterhouses", requireAuth, slaughterhousesRoutes);
app.use("/api/daily-pricing", requireAuth, dailyPricingRoutes);
app.use("/api/sales-invoices", requireAuth, salesInvoicesRoutes);
app.use("/api/distribution-trips", requireAuth, distributionTripsRoutes);
app.use("/api/vehicles", requireAuth, vehiclesRoutes);
app.use("/api/drivers", requireAuth, driversRoutes);
app.use("/api/expenses", requireAuth, expensesRoutes);
app.use("/api/payments", requireAuth, paymentsRoutes);
app.use("/api/loans", requireAuth, loansRoutes);
app.use("/api/accounts-summary", requireAuth, accountsSummaryRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  if (err && err.message === "not_allowed_by_cors") {
    return res.status(403).json({ error: "origin_not_allowed" });
  }
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

function start() {
  if (env.tlsCertPath && env.tlsKeyPath) {
    const options = {
      cert: fs.readFileSync(env.tlsCertPath),
      key: fs.readFileSync(env.tlsKeyPath),
    };
    https.createServer(options, app).listen(env.port, () => {
      console.log(`server listening (https) on port ${env.port}`);
    });
    return;
  }
  app.listen(env.port, () => {
    console.log(`server listening (http) on port ${env.port}`);
  });
}

start();
