import { buildCrudRouter } from "../crud/buildCrudRouter.js";

const router = buildCrudRouter({
  file: "drivers",
  moduleLabel: "drivers",
  feature: "fleetManagement",
  uniqueFields: ["phone"],
  beforeCreate: async (body) => ({
    ...body,
    status: body.status ?? "متاح",
  }),
});

export default router;
