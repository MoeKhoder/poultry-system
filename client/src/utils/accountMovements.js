/** تسميات موحّدة لحركات الدفع/الخصم في كشف الحساب والطباعة */
export function paymentMovementLabel(p, linkedLoan) {
  if (p.type === "خصم") {
    return p.note ? `خصم — ${p.note}` : "خصم من الحساب";
  }
  if (p.loanId) {
    const suffix = linkedLoan?.note ? ` — ${linkedLoan.note}` : "";
    return `تسديد دين${suffix}`;
  }
  return `دفعة نقدية #${String(p.id || "").slice(0, 8)}${p.note ? ` — ${p.note}` : ""}`;
}

export function formatLedgerBalance(balance, fmtMoney) {
  return `${fmtMoney(Math.abs(balance))} (${balance >= 0 ? "مدين" : "دائن"})`;
}
