import { buildCrudRouter } from "../crud/buildCrudRouter.js";
import { validatePhotoDataUrl } from "../files/photo.js";

function nextCode(items) {
  const max = items.reduce((acc, item) => {
    const match = /^SL(\d+)$/.exec(item.code || "");
    if (!match) return acc;
    return Math.max(acc, Number(match[1]));
  }, 0);
  return `SL${String(max + 1).padStart(3, "0")}`;
}

function cleanPhoto(body) {
  if (body.photo === undefined) return body;
  if (!body.photo || !validatePhotoDataUrl(body.photo).valid) {
    return { ...body, photo: null };
  }
  return body;
}

const router = buildCrudRouter({
  file: "slaughterhouses",
  moduleLabel: "slaughterhouses",
  feature: "slaughterhouses",
  uniqueFields: ["phone"],
  protectedFields: ["code"],
  beforeCreate: async (body, items) => ({
    ...cleanPhoto(body),
    code: nextCode(items),
    totalSales: body.totalSales ?? 0,
    dueBalance: body.dueBalance ?? 0,
    remainingBalance: body.remainingBalance ?? 0,
  }),
  beforeUpdate: async (body) => cleanPhoto(body),
});

export default router;
