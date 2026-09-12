import { buildCrudRouter } from "../crud/buildCrudRouter.js";

function nextTripId(items) {
  const max = items.reduce((acc, item) => {
    const match = /^T-(\d+)$/.exec(item.tripNumber || "");
    if (!match) return acc;
    return Math.max(acc, Number(match[1]));
  }, 2800);
  return `T-${max + 1}`;
}

function normalizeStops(stops) {
  if (!Array.isArray(stops)) return [];
  return stops.map((s, i) => ({
    id: s.id || `stop-${Date.now()}-${i}`,
    customerName: s.customerName || "",
    amountDue: Number(s.amountDue) || 0,
    collected: !!s.collected,
  }));
}

const router = buildCrudRouter({
  file: "distributionTrips",
  moduleLabel: "distributionTrips",
  feature: "distributionTrips",
  protectedFields: ["tripNumber"],
  beforeCreate: async (body, items) => {
    const dieselCost = Number(body.dieselCost) || 0;
    const pickupCost = Number(body.pickupCost) || 0;
    const stops = normalizeStops(body.stops);
    return {
      ...body,
      tripNumber: nextTripId(items),
      status: body.status ?? "جارية",
      dieselCost,
      pickupCost,
      transportCost: dieselCost + pickupCost,
      stops,
      totalAmount: stops.reduce((sum, s) => sum + s.amountDue, 0),
    };
  },
  beforeUpdate: async (body, existing) => {
    const next = { ...body };
    const dieselCost = next.dieselCost !== undefined ? Number(next.dieselCost) || 0 : existing.dieselCost || 0;
    const pickupCost = next.pickupCost !== undefined ? Number(next.pickupCost) || 0 : existing.pickupCost || 0;
    if (next.dieselCost !== undefined || next.pickupCost !== undefined) {
      next.dieselCost = dieselCost;
      next.pickupCost = pickupCost;
      next.transportCost = dieselCost + pickupCost;
    }
    if (next.stops !== undefined) {
      const stops = normalizeStops(next.stops);
      next.stops = stops;
      next.totalAmount = stops.reduce((sum, s) => sum + s.amountDue, 0);
    }
    return next;
  },
});

export default router;
