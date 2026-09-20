import { buildCrudRouter } from "../crud/buildCrudRouter.js";
import { readJSON } from "../storage/store.js";
import { loanRemaining } from "../utils/loanBalances.js";

async function assertLoanPaymentAmount(body, payments, { excludePaymentId } = {}) {
  if (!body.loanId) return body;
  const loans = await readJSON("loans");
  const loan = loans.find((l) => l.id === body.loanId);
  if (!loan) {
    const err = new Error("loan_not_found");
    err.status = 400;
    throw err;
  }
  const remaining = loanRemaining(loan, payments, { excludePaymentId });
  if (Number(body.amount) > remaining) {
    const err = new Error("amount_exceeds_loan_remaining");
    err.status = 400;
    throw err;
  }
  return body;
}

const router = buildCrudRouter({
  file: "payments",
  moduleLabel: "payments",
  feature: "accounts",
  protectedFields: [],
  beforeCreate: async (body, payments) => {
    const normalized = { ...body, amount: Number(body.amount) };
    return assertLoanPaymentAmount(normalized, payments);
  },
  beforeUpdate: async (body, existing, payments) => {
    const normalized = { ...body, amount: Number(body.amount ?? existing.amount) };
    const loanId = body.loanId !== undefined ? body.loanId : existing.loanId;
    return assertLoanPaymentAmount({ ...normalized, loanId }, payments, { excludePaymentId: existing.id });
  },
});

export default router;
