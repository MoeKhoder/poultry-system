import { buildCrudRouter } from "../crud/buildCrudRouter.js";
import { validatePhotoDataUrl } from "../files/photo.js";

function nextCode(items) {
  const max = items.reduce((acc, item) => {
    const match = /^S(\d+)$/.exec(item.code || "");
    if (!match) return acc;
    return Math.max(acc, Number(match[1]));
  }, 0);
  return `S${String(max + 1).padStart(3, "0")}`;
}

function cleanPhoto(body) {
  if (body.photo === undefined) return body;
  if (!body.photo || !validatePhotoDataUrl(body.photo).valid) {
    return { ...body, photo: null };
  }
  return body;
}

const router = buildCrudRouter({
  file: "suppliers",
  moduleLabel: "suppliers",
  feature: "suppliers",
  uniqueFields: ["phone"],
  protectedFields: ["code"],
  beforeCreate: async (body, items) => ({
    ...cleanPhoto(body),
    code: nextCode(items),
    totalPurchases: body.totalPurchases ?? 0,
    balance: body.balance ?? 0,
    status: body.status ?? "مسدّد",
  }),
  beforeUpdate: async (body) => cleanPhoto(body),
});

export default router;
