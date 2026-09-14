import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import { Table, Td } from "../../components/DataTable/DataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import ActionLink from "../../components/ActionLink/ActionLink";
import Modal from "../../components/Modal/Modal";
import Tabs from "../../components/Tabs/Tabs";
import { printReport, printAccountStatement } from "../../utils/printDocument";
import { accountsSummaryApi, paymentsApi, purchaseOrdersApi, salesInvoicesApi } from "../../api/resources";
import { useSettings } from "../../context/SettingsContext";
import "./Accounts.css";

const PAYMENT_METHODS = ["نقدي", "تحويل بنكي", "شيك"];
const ARABIC_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function statusFor(paid, remaining) {
  if (remaining <= 0) return "مدفوع";
  return paid > 0 ? "جزئي" : "غير مدفوع";
}

function monthYearLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return `${ARABIC_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function PaymentForm({ row, currency, fmtMoney, onClose, onSubmit }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("نقدي");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("أدخل مبلغاً صحيحاً");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({ amount: value, method, date, note: note || null });
      onClose();
    } catch {
      setError("تعذر تسجيل الدفعة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="payment-form-party">
        <p className="payment-form-party-name">{row.name}</p>
      </div>
      <div className="modal-field">
        <label>المبلغ المتبقي الحالي ({currency})</label>
        <input value={fmtMoney(row.remaining)} disabled />
      </div>
      <div className="modal-field">
        <label>مبلغ الدفعة ({currency})</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <div className="modal-field">
        <label>طريقة الدفع</label>
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-field">
        <label>التاريخ</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="modal-field">
        <label>ملاحظة</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="دفعة جزئية / تسوية أسبوعية..." />
      </div>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-outline" onClick={onClose}>
          إلغاء
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "✓ تأكيد الدفعة"}
        </button>
      </div>
    </form>
  );
}

function DeductionForm({ row, currency, fmtMoney, onClose, onSubmit }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("أدخل مبلغاً صحيحاً");
      return;
    }
    if (value > row.remaining) {
      setError("لا يمكن أن يتجاوز الخصم المبلغ المتبقي");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({ amount: value, date, note: reason || null, type: "خصم" });
      onClose();
    } catch {
      setError("تعذر تسجيل الخصم");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="payment-form-party">
        <p className="payment-form-party-name">{row.name}</p>
      </div>
      <div className="modal-field">
        <label>المبلغ المتبقي الحالي ({currency})</label>
        <input value={fmtMoney(row.remaining)} disabled />
      </div>
      <div className="modal-field">
        <label>مبلغ الخصم ({currency})</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <div className="modal-field">
        <label>التاريخ</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="modal-field">
        <label>سبب الخصم</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="خصم تسوية / تعويض بضاعة تالفة..." required />
      </div>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-outline" onClick={onClose}>
          إلغاء
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "✓ تأكيد الخصم"}
        </button>
      </div>
    </form>
  );
}

function AccountLedgerModal({ row, isSuppliers, settings, fmtMoney, onClose, onPay }) {
  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const debitsApi = isSuppliers ? purchaseOrdersApi : salesInvoicesApi;
    Promise.all([debitsApi.list(), paymentsApi.list()]).then(([debitRecords, allPayments]) => {
      const debits = debitRecords
        .filter((r) => (isSuppliers ? r.supplierId === row.id : r.slaughterhouse === row.name))
        .map((r) => ({
          date: r.date,
          label: isSuppliers ? `فاتورة شراء ${r.code}` : `فاتورة بيع ${r.invoiceNumber}`,
          debit: r.total,
          credit: 0,
          createdAt: r.createdAt,
        }));
      const paidAtPurchase = isSuppliers
        ? debitRecords
            .filter((r) => r.supplierId === row.id && r.paid > 0)
            .map((r) => ({
              date: r.date,
              label: `دفعة عند الشراء — ${r.code}`,
              debit: 0,
              credit: r.paid,
              createdAt: r.createdAt,
            }))
        : debitRecords
            .filter((r) => r.slaughterhouse === row.name && r.paid > 0)
            .map((r) => ({
              date: r.date,
              label: `دفعة عند البيع — ${r.invoiceNumber}`,
              debit: 0,
              credit: r.paid,
              createdAt: r.createdAt,
            }));
      const credits = allPayments
        .filter((p) => p.partyType === (isSuppliers ? "supplier" : "slaughterhouse") && p.partyId === row.id)
        .map((p) => ({
          date: p.date,
          label: p.note ? `دفعة نقدية — ${p.note}` : "دفعة نقدية",
          debit: 0,
          credit: p.amount,
          createdAt: p.createdAt,
        }));
      const chronological = [...debits, ...paidAtPurchase, ...credits].sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return (a.createdAt || "") < (b.createdAt || "") ? -1 : 1;
      });
      let running = 0;
      const withBalance = chronological.map((entry) => {
        running += entry.debit - entry.credit;
        return { ...entry, balance: running };
      });
      setEntries(withBalance.reverse());
      setLoading(false);
    });
  }, [row.id, isSuppliers]);

  const paidPercent = row.total > 0 ? Math.round((row.paid / row.total) * 100) : 0;
  const earliestDate = entries && entries.length > 0 ? entries[entries.length - 1].date : null;

  return (
    <Modal title={`كشف حساب — ${row.name}`} onClose={onClose}>
      <div className="ledger">
        <p className="ledger-subtitle">
          {isSuppliers ? "مورد" : "مسلخ"} — منذ {earliestDate ? monthYearLabel(earliestDate) : "—"}
        </p>

        <div className="ledger-stats">
          <div className="ledger-stat ledger-stat-red">
            <p className="ledger-stat-label">المتبقي</p>
            <p className="ledger-stat-value">{fmtMoney(row.remaining)}</p>
          </div>
          <div className="ledger-stat ledger-stat-green">
            <p className="ledger-stat-label">المدفوع</p>
            <p className="ledger-stat-value">{fmtMoney(row.paid)}</p>
          </div>
          <div className="ledger-stat ledger-stat-gray">
            <p className="ledger-stat-label">{isSuppliers ? "إجمالي المشتريات" : "إجمالي المبيعات"}</p>
            <p className="ledger-stat-value">{fmtMoney(row.total)}</p>
          </div>
        </div>

        <div className="ledger-progress">
          <div className="ledger-progress-header">
            <span>{paidPercent}%</span>
            <span>نسبة السداد</span>
          </div>
          <div className="ledger-progress-track">
            <div className={`ledger-progress-fill ${paidPercent >= 100 ? "ledger-progress-fill-full" : ""}`} style={{ width: `${Math.min(100, paidPercent)}%` }} />
          </div>
        </div>

        <p className="ledger-movements-title">حركات الحساب</p>
        {loading && <p className="state-message">جارٍ التحميل...</p>}
        {!loading && entries.length === 0 && <p className="state-message">لا توجد حركات مسجلة</p>}
        {!loading && entries.length > 0 && (
          <div className="ledger-table-scroll">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>البيان</th>
                  <th>مدين</th>
                  <th>دائن</th>
                  <th>الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr key={idx}>
                    <td className="ledger-td-muted">{entry.date}</td>
                    <td>{entry.label}</td>
                    <td className="ledger-td-debit">{entry.debit ? fmtMoney(entry.debit) : "—"}</td>
                    <td className="ledger-td-credit">{entry.credit ? fmtMoney(entry.credit) : "—"}</td>
                    <td className={entry.balance >= 0 ? "ledger-td-debit" : "ledger-td-credit"}>
                      {fmtMoney(Math.abs(entry.balance))} ({entry.balance >= 0 ? "مدين" : "دائن"})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-actions ledger-actions">
          <button type="button" className="btn-primary" onClick={onPay}>
            💳 تسجيل دفعة
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => printAccountStatement({ settings, row, isSuppliers, entries: entries || [], fmtMoney })}
          >
            🖨 طباعة
          </button>
          <button type="button" className="btn-outline" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Accounts() {
  const [tab, setTab] = useState("حسابات الموردين");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { settings, fmtMoney } = useSettings();
  const [payingRow, setPayingRow] = useState(null);
  const [deductingRow, setDeductingRow] = useState(null);
  const [viewingRow, setViewingRow] = useState(null);

  function reload() {
    setLoading(true);
    accountsSummaryApi
      .get()
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  useEffect(() => {
    const interval = setInterval(reload, 30000);
    window.addEventListener("focus", reload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", reload);
    };
  }, []);

  const isSuppliers = tab === "حسابات الموردين";
  const items = summary ? (isSuppliers ? summary.suppliers : summary.slaughterhouses) : [];

  const rows = items.map((item) => ({
    id: item.id,
    partyType: isSuppliers ? "supplier" : "slaughterhouse",
    name: item.name,
    total: isSuppliers ? item.totalPurchases : item.totalSales,
    paid: item.paid,
    remaining: item.remaining,
  }));

  const totalLabel = isSuppliers ? "إجمالي المشتريات" : "إجمالي المبيعات";
  const nameLabel = isSuppliers ? "المورد" : "المسلخ";

  const overThresholdSlaughterhouses =
    !isSuppliers && settings.alertSlaughterhouseDebtEnabled
      ? rows.filter((r) => r.remaining > (settings.alertSlaughterhouseDebtThreshold || Infinity))
      : [];

  function handleExport() {
    printReport({
      settings,
      title: isSuppliers ? "كشف حسابات الموردين" : "كشف حسابات المسالخ",
      subtitle: `${rows.length} سجل`,
      columns: [nameLabel, totalLabel, "المدفوع", "المتبقي", "الحالة"],
      rows: rows.map((r) => [r.name, fmtMoney(r.total), fmtMoney(r.paid), r.remaining > 0 ? fmtMoney(r.remaining) : "—", statusFor(r.paid, r.remaining)]),
    });
  }

  async function handlePayment({ amount, method, date, note }) {
    await paymentsApi.create({
      partyType: payingRow.partyType,
      partyId: payingRow.id,
      partyName: payingRow.name,
      amount,
      method,
      date,
      note,
    });
    reload();
    setViewingRow(null);
  }

  async function handleDeduction({ amount, date, note, type }) {
    await paymentsApi.create({
      partyType: deductingRow.partyType,
      partyId: deductingRow.id,
      partyName: deductingRow.name,
      amount,
      method: "—",
      date,
      note,
      type,
    });
    reload();
    setViewingRow(null);
  }

  return (
    <div>
      <PageHeader title="الحسابات" subtitle="كشف الحسابات و الديون" />

      <div className="accounts-tabs">
        <Tabs tabs={["حسابات الموردين", "حسابات المسالخ"]} active={tab} onChange={setTab} />
      </div>

      {loading && <p className="state-message">جارٍ التحميل...</p>}
      {error && <p className="state-message state-message-error">{error}</p>}

      {overThresholdSlaughterhouses.length > 0 && (
        <div className="debt-alert-banner">
          <span>⚠️</span>
          <span>
            {overThresholdSlaughterhouses.length} مسلخ تجاوزت ديونه {fmtMoney(settings.alertSlaughterhouseDebtThreshold)}:{" "}
            {overThresholdSlaughterhouses.map((r) => r.name).join("، ")}
          </span>
        </div>
      )}

      {!loading && !error && (
        <>
          <h2 className="section-title">كشف حساب تفصيلي</h2>
          <Card>
          <Table
            columns={[nameLabel, totalLabel, "المدفوع", "المتبقي", "نسبة السداد", "الإجراءات"]}
            rows={rows}
            renderRow={(r) => {
              const percent = r.total > 0 ? Math.round((r.paid / r.total) * 100) : 0;
              return (
                <>
                  <Td className="td-brand">{r.name}</Td>
                  <Td>{fmtMoney(r.total)}</Td>
                  <Td>{fmtMoney(r.paid)}</Td>
                  <Td className={r.remaining > 0 ? "td-negative" : "td-faint"}>{r.remaining > 0 ? fmtMoney(r.remaining) : "—"}</Td>
                  <Td>
                    <div className="mini-progress">
                      <div className="mini-progress-track">
                        <div className="mini-progress-fill" style={{ width: `${Math.min(100, percent)}%` }} />
                      </div>
                      <span>{percent}%</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="row-actions">
                      <ActionLink onClick={() => setViewingRow(r)}>كشف</ActionLink>
                      {r.remaining > 0 && <ActionLink onClick={() => setPayingRow(r)}>دفع</ActionLink>}
                      {r.remaining > 0 && <ActionLink onClick={() => setDeductingRow(r)}>خصم</ActionLink>}
                    </div>
                  </Td>
                </>
              );
            }}
          />
        </Card>
        </>
      )}

      {viewingRow && (
        <AccountLedgerModal
          row={viewingRow}
          isSuppliers={isSuppliers}
          settings={settings}
          fmtMoney={fmtMoney}
          onClose={() => setViewingRow(null)}
          onPay={() => setPayingRow(viewingRow)}
        />
      )}

      {payingRow && (
        <Modal title="تسجيل دفعة" onClose={() => setPayingRow(null)}>
          <PaymentForm row={payingRow} currency={settings.currency} fmtMoney={fmtMoney} onClose={() => setPayingRow(null)} onSubmit={handlePayment} />
        </Modal>
      )}

      {deductingRow && (
        <Modal title="خصم من الحساب" subtitle="يُخصم مباشرة من المبلغ الإجمالي المستحق" onClose={() => setDeductingRow(null)}>
          <DeductionForm row={deductingRow} currency={settings.currency} fmtMoney={fmtMoney} onClose={() => setDeductingRow(null)} onSubmit={handleDeduction} />
        </Modal>
      )}
    </div>
  );
}
