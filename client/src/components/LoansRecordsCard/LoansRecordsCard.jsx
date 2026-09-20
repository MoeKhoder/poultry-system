import { useMemo, useState } from "react";
import Card from "../Card/Card";
import { Table, Td } from "../DataTable/DataTable";
import StatusBadge from "../StatusBadge/StatusBadge";
import IconButton from "../IconButton/IconButton";
import { EditIcon, TrashIcon } from "../Icons/Icons";
import { loanRemaining, loanSettlementStatus, paymentDetailLabel, sumPaidOnLoan } from "../../utils/loanBalances";
import "./LoansRecordsCard.css";

export default function LoansRecordsCard({
  partyLabel,
  loans,
  payments,
  loanHistory,
  fmtMoney,
  onAddLoan,
  onAddPayment,
  onSettleLoan,
  onEditLoan,
  onDeleteLoan,
  onEditPayment,
  onDeletePayment,
}) {
  const [showSettled, setShowSettled] = useState(false);

  const sortedLoans = useMemo(
    () => [...loans].sort((a, b) => b.date.localeCompare(a.date)),
    [loans],
  );

  const visibleLoans = useMemo(
    () => sortedLoans.filter((loan) => showSettled || loanSettlementStatus(loan, payments) !== "مسدّد"),
    [sortedLoans, showSettled, payments],
  );

  const settledCount = sortedLoans.filter((loan) => loanSettlementStatus(loan, payments) === "مسدّد").length;

  return (
    <Card>
      <div className="card-head">
        <div>
          <div className="card-title">سجلات الديون</div>
          <div className="card-sub">
            الدين يبقى في السجل بعد التسديد — استخدم «تسديد» لربط الدفعة بالدين وتحديث المتبقي تلقائياً
          </div>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn-outline" onClick={onAddLoan}>
            إضافة دين
          </button>
          <button type="button" className="btn-primary" onClick={onAddPayment}>
            تسجيل دفعة
          </button>
        </div>
      </div>

      {sortedLoans.length === 0 && <p className="state-message">لا توجد ديون مسجلة لهذا {partyLabel}</p>}

      {sortedLoans.length > 0 && (
        <>
          {settledCount > 0 && (
            <label className="loans-show-settled">
              <input type="checkbox" checked={showSettled} onChange={(e) => setShowSettled(e.target.checked)} />
              إظهار الديون المسدّدة ({settledCount})
            </label>
          )}
          {visibleLoans.length === 0 && (
            <p className="state-message">جميع الديون مسدّدة — فعّل «إظهار الديون المسدّدة» لعرض السجل</p>
          )}
          {visibleLoans.length > 0 && (
            <Table
              columns={["التاريخ", "أصل الدين", "المسدّد", "المتبقي", "الحالة", "الملاحظة", "الإجراءات"]}
              rows={visibleLoans}
              renderRow={(loan) => {
                const paid = sumPaidOnLoan(loan.id, payments);
                const remaining = loanRemaining(loan, payments);
                const status = loanSettlementStatus(loan, payments);
                const hasPayments = paid > 0;
                return (
                  <>
                    <Td className="td-muted" dir="ltr">
                      {loan.date}
                    </Td>
                    <Td className="td-strong">{fmtMoney(loan.amount)}</Td>
                    <Td>{paid > 0 ? fmtMoney(paid) : "—"}</Td>
                    <Td>{remaining > 0 ? fmtMoney(remaining) : "—"}</Td>
                    <Td>
                      <StatusBadge status={status} />
                    </Td>
                    <Td>{loan.note || "—"}</Td>
                    <Td>
                      <div className="row-actions">
                        {remaining > 0 && (
                          <button type="button" className="btn-outline" onClick={() => onSettleLoan(loan, remaining)}>
                            تسديد
                          </button>
                        )}
                        <IconButton label="تعديل" onClick={() => onEditLoan(loan)}>
                          <EditIcon />
                        </IconButton>
                        {!hasPayments && (
                          <IconButton label="حذف" tone="danger" onClick={() => onDeleteLoan(loan)}>
                            <TrashIcon />
                          </IconButton>
                        )}
                      </div>
                    </Td>
                  </>
                );
              }}
            />
          )}
        </>
      )}

      <p className="ledger-movements-title">سجل الدفعات والتعديلات</p>
      <Table
        columns={["التاريخ", "العملية", "المبلغ", "التفاصيل", "الإجراءات"]}
        rows={[
          ...payments.map((payment) => ({ ...payment, kind: "payment" })),
          ...loanHistory.map((log) => ({ ...log, kind: "loan-change", date: log.timestamp?.slice(0, 10) })),
        ].sort((a, b) => (b.createdAt || b.timestamp || b.date || "").localeCompare(a.createdAt || a.timestamp || a.date || ""))}
        renderRow={(entry) => {
          if (entry.kind === "payment") {
            let opLabel = "دفعة على الحساب";
            if (entry.type === "خصم") opLabel = "خصم";
            else if (entry.loanId) {
              const linkedLoan = loans.find((l) => l.id === entry.loanId);
              const remainingBefore = linkedLoan ? loanRemaining(linkedLoan, payments, { excludePaymentId: entry.id }) : 0;
              opLabel = entry.amount >= remainingBefore ? "تسديد دين (كامل)" : "تسديد دين (جزئي)";
            }
            return (
              <>
                <Td dir="ltr">{entry.date}</Td>
                <Td>{opLabel}</Td>
                <Td>{fmtMoney(entry.amount)}</Td>
                <Td>{paymentDetailLabel(entry, loans)}</Td>
                <Td>
                  <div className="row-actions">
                    <IconButton label="تعديل" onClick={() => onEditPayment(entry)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton label="حذف" tone="danger" onClick={() => onDeletePayment(entry)}>
                      <TrashIcon />
                    </IconButton>
                  </div>
                </Td>
              </>
            );
          }
          const oldAmount = entry.oldValue?.amount;
          const newAmount = entry.newValue?.amount;
          return (
            <>
              <Td dir="ltr">{entry.date}</Td>
              <Td>تعديل دين</Td>
              <Td>{fmtMoney(newAmount ?? oldAmount ?? 0)}</Td>
              <Td>
                {oldAmount !== undefined ? `من ${oldAmount} إلى ${newAmount}` : entry.action === "delete" ? "حذف الدين" : "إضافة الدين"}
              </Td>
              <Td>—</Td>
            </>
          );
        }}
      />
    </Card>
  );
}
