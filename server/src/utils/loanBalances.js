export function sumPaidOnLoan(loanId, payments, { excludePaymentId } = {}) {
  return payments
    .filter((p) => p.loanId === loanId && p.id !== excludePaymentId && p.type !== "خصم")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
}

export function loanRemaining(loan, payments, options) {
  const paid = sumPaidOnLoan(loan.id, payments, options);
  return Math.max(0, (Number(loan.amount) || 0) - paid);
}

export function loanSettlementStatus(loan, payments, options) {
  const remaining = loanRemaining(loan, payments, options);
  if (remaining <= 0) return "مسدّد";
  const paid = sumPaidOnLoan(loan.id, payments, options);
  if (paid > 0) return "جزئي";
  return "غير مسدد";
}

export function partyLoanTotals(loans, payments, partyType, partyId) {
  const partyLoans = loans.filter((l) => l.partyType === partyType && l.partyId === partyId);
  const gross = partyLoans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const outstanding = partyLoans.reduce((sum, l) => sum + loanRemaining(l, payments), 0);
  return { gross: Math.round(gross), outstanding: Math.round(outstanding) };
}
