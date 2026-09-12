import { buildCrudRouter } from "../crud/buildCrudRouter.js";

const router = buildCrudRouter({
  file: "expenses",
  moduleLabel: "expenses",
  feature: "expenses",
});

export default router;
