import { buildCrudRouter } from "../crud/buildCrudRouter.js";
import { readJSON } from "../storage/store.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function nextInvoiceNumber(items) {
  const settingsArr = await readJSON("settings");
  const prefix = settingsArr[0]?.invoicePrefix || "SL";
  const pattern = new RegExp(`^${escapeRegex(prefix)}(\\d+)$`);
  const max = items.reduce((acc, item) => {
    const match = pattern.exec(item.invoiceNumber || "");
    if (!match) return acc;
    return Math.max(acc, Number(match[1]));
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

const router = buildCrudRouter({
  file: "salesInvoices",
  moduleLabel: "salesInvoices",
  feature: "salesInvoices",
  protectedFields: ["invoiceNumber", "date"],
  beforeCreate: async (body, items) => ({
    ...body,
    invoiceNumber: await nextInvoiceNumber(items),
    weights: Array.isArray(body.weights) ? body.weights.map(Number).filter((weight) => weight > 0) : [],
    total: Number(body.total) || 0,
    paid: Number(body.paid) || 0,
  }),
  beforeUpdate: async (body) => {
    const next = { ...body };
    if (next.total !== undefined) next.total = Number(next.total) || 0;
    if (next.paid !== undefined) next.paid = Number(next.paid) || 0;
    if (next.weightKg !== undefined) next.weightKg = Number(next.weightKg) || 0;
    if (next.cages !== undefined) next.cages = Number(next.cages) || 0;
    if (next.weights !== undefined) next.weights = Array.isArray(next.weights) ? next.weights.map(Number).filter((weight) => weight > 0) : [];
    return next;
  },
});

export default router;
