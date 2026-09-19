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
  return { gross, outstanding };
}

export function partyOpenLoans(loans, payments, partyType, partyId) {
  return loans
    .filter((l) => l.partyType === partyType && l.partyId === partyId)
    .filter((l) => loanRemaining(l, payments) > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function paymentDetailLabel(payment, loans) {
  const parts = [];
  if (payment.loanId) {
    const loan = loans.find((l) => l.id === payment.loanId);
    parts.push(loan?.note ? `تسديد دين — ${loan.note}` : "تسديد دين");
  } else if (payment.type === "خصم") {
    parts.push(payment.note ? `خصم — ${payment.note}` : "خصم من الحساب");
  } else {
    parts.push(payment.method || "دفعة");
  }
  if (payment.note && !payment.loanId && payment.type !== "خصم") parts.push(payment.note);
  return parts.join(" · ") || "—";
}
