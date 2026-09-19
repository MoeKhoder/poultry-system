import { useState } from "react";
import "../LoansRecordsCard/LoansRecordsCard.css";

export default function PartyPaymentForm({ partyLabel, partyName, initial, currency, onClose, onSubmit }) {
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState(initial?.method || "نقدي");
  const [note, setNote] = useState(initial?.note || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const settlingLoan = Boolean(initial?.loanId);
  const loanRemaining = Number(initial?.loanAmount) || 0;

  async function handleSubmit(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("أدخل مبلغاً صحيحاً");
      return;
    }
    if (settlingLoan && value > loanRemaining) {
      setError(`المبلغ يتجاوز المتبقي على هذا الدين (${loanRemaining})`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({ amount: value, date, method, note: note || null });
      onClose();
    } catch (err) {
      setError(err.payload?.conflict ? "تم تعديل هذه الدفعة من مكان آخر" : "تعذر حفظ الدفعة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>{partyLabel}</label>
        <input value={partyName} disabled />
      </div>
      {settlingLoan && (
        <p className="loan-settle-hint">
          هذه الدفعة مرتبطة بدين محدد. المتبقي على هذا الدين: <strong>{loanRemaining}</strong> {currency}. لن يُحذف
          سجل الدين — سيُحدَّث المتبقي والحالة فقط.
        </p>
      )}
      {!settlingLoan && (
        <p className="loan-settle-hint loan-settle-hint-muted">
          لسداد دين معيّن، استخدم زر «تسديد» من جدول الديون. الدفعة العامة تُخصم من إجمالي الحساب دون ربط بدين محدد.
        </p>
      )}
      <div className="modal-field">
        <label>مبلغ الدفعة ({currency})</label>
        <div className="package-add-row">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          {settlingLoan && loanRemaining > 0 && (
            <button type="button" className="btn-outline" onClick={() => setAmount(String(loanRemaining))}>
              سداد المتبقي
            </button>
          )}
        </div>
      </div>
      <div className="modal-field">
        <label>التاريخ</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="modal-field">
        <label>طريقة الدفع</label>
        <input value={method} onChange={(e) => setMethod(e.target.value)} required />
      </div>
      <div className="modal-field">
        <label>ملاحظة</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-outline" onClick={onClose}>
          إلغاء
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : settlingLoan ? "تأكيد التسديد" : "حفظ الدفعة"}
        </button>
      </div>
    </form>
  );
}
