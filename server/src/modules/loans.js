import { buildCrudRouter } from "../crud/buildCrudRouter.js";

const router = buildCrudRouter({
  file: "loans",
  moduleLabel: "loans",
  feature: "accounts",
  protectedFields: [],
  beforeCreate: async (body) => ({
    ...body,
    amount: Number(body.amount),
  }),
});

export default router;
