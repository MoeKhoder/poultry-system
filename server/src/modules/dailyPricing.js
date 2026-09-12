import { buildCrudRouter } from "../crud/buildCrudRouter.js";
import { readJSON } from "../storage/store.js";

async function pricingSettings() {
  const settingsArr = await readJSON("settings");
  const s = settingsArr[0] || {};
  return {
    weight: s.fixedCageWeight || 8,
    marginPercent: s.purchaseMarginPercent ?? 20,
  };
}

function computeCagePrice(kgPrice, weight, marginPercent) {
  return Number((kgPrice * weight * (1 - marginPercent / 100)).toFixed(2));
}

const router = buildCrudRouter({
  file: "dailyPrices",
  moduleLabel: "dailyPricing",
  feature: "dailyPricing",
  protectedFields: ["date"],
  beforeCreate: async (body, items) => {
    const { weight, marginPercent } = await pricingSettings();
    const kgPrice = Number(body.kgPrice);
    const sellPrice = body.sellPrice !== undefined ? Number(body.sellPrice) : null;
    items.forEach((item) => {
      item.status = "منتهي";
    });
    return {
      ...body,
      kgPrice,
      sellPrice,
      fixedWeight: weight,
      cagePrice: computeCagePrice(kgPrice, weight, marginPercent),
      status: "نشط",
    };
  },
  beforeUpdate: async (body, existing, items) => {
    if (body.status === "نشط") {
      items.forEach((item) => {
        if (item.id !== existing.id) {
          item.status = "منتهي";
        }
      });
    }
    const next = { ...body };
    if (next.sellPrice !== undefined) next.sellPrice = Number(next.sellPrice);
    return next;
  },
});

export default router;
