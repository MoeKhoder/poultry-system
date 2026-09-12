import { buildCrudRouter } from "../crud/buildCrudRouter.js";

const router = buildCrudRouter({
  file: "vehicles",
  moduleLabel: "vehicles",
  feature: "fleetManagement",
  uniqueFields: ["plateNumber"],
  beforeCreate: async (body) => ({
    ...body,
    capacity: Number(body.capacity) || 0,
    status: body.status ?? "متاح",
    tripsCount: 0,
  }),
});

export default router;
