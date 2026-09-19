import { buildCrudRouter } from "../crud/buildCrudRouter.js";

function nextCode(items) {
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^S${year}(\\d+)$`);
  const max = items.reduce((acc, item) => {
    const match = pattern.exec(item.code || "");
    if (!match) return acc;
    return Math.max(acc, Number(match[1]));
  }, 0);
  return `S${year}${String(max + 1).padStart(3, "0")}`;
}

const router = buildCrudRouter({
  file: "purchaseOrders",
  moduleLabel: "purchaseOrders",
  feature: "suppliers",
  protectedFields: ["code", "date"],
  beforeCreate: async (body, items) => {
    const weightKg = Number(body.weightKg) || 0;
    const kgPrice = Number(body.kgPrice) || 0;
    const hasExplicitTotal = body.total !== undefined && body.total !== null && body.total !== "";
    const total = hasExplicitTotal ? Number(body.total) : Math.round(weightKg * kgPrice);
    return {
      ...body,
      cages: Number(body.cages) || 0,
      weights: Array.isArray(body.weights) ? body.weights.map(Number).filter((weight) => weight > 0) : [],
      weightKg,
      kgPrice,
      total,
      paid: Number(body.paid) || 0,
      code: nextCode(items),
    };
  },
  beforeUpdate: async (body, existing) => {
    const next = { ...body };
    if (next.total !== undefined) next.total = Number(next.total) || 0;
    if (next.paid !== undefined) next.paid = Number(next.paid) || 0;
    if (next.weightKg !== undefined) next.weightKg = Number(next.weightKg) || 0;
    if (next.kgPrice !== undefined) next.kgPrice = Number(next.kgPrice) || 0;
    if (next.cages !== undefined) next.cages = Number(next.cages) || 0;
    if (next.weights !== undefined) next.weights = Array.isArray(next.weights) ? next.weights.map(Number).filter((weight) => weight > 0) : [];
    return next;
  },
});

export default router;
