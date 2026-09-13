import { useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import { Table, Td } from "../../components/DataTable/DataTable";
import Modal from "../../components/Modal/Modal";
import { useCollection } from "../../api/useCollection";
import { dailyPricingApi, purchaseOrdersApi, salesInvoicesApi } from "../../api/resources";
import { useSettings } from "../../context/SettingsContext";
import "./DailyPricing.css";

function AddPriceForm({ onClose, onCreate }) {
  const { settings } = useSettings();
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), kgPrice: "", sellPrice: "", notes: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onCreate({
        date: form.date,
        kgPrice: Number(form.kgPrice),
        sellPrice: Number(form.sellPrice) || null,
        notes: form.notes || null,
      });
      onClose();
    } catch {
      setError("تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>التاريخ</label>
        <input type="date" value={form.date} onChange={set("date")} required />
      </div>
      <div className="modal-field">
        <label>سعر شراء الكيلو ({settings.currency})</label>
        <input type="number" step="0.01" value={form.kgPrice} onChange={set("kgPrice")} required />
      </div>
      <div className="modal-field">
        <label>سعر بيع الكيلو ({settings.currency})</label>
        <input type="number" step="0.01" value={form.sellPrice} onChange={set("sellPrice")} />
      </div>
      <div className="modal-field">
        <label>ملاحظات</label>
        <textarea value={form.notes} onChange={set("notes")} placeholder="أي ملاحظات على سعر اليوم" />
      </div>
      <p className="section-hint">سيصبح هذا السعر نشطاً فوراً، وسينتهي أي سعر نشط سابق تلقائياً.</p>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-outline" onClick={onClose}>
          إلغاء
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>
    </form>
  );
}

function EditPriceForm({ price, onClose, onSubmit }) {
  const { settings } = useSettings();
  const [kgPrice, setKgPrice] = useState(String(price.kgPrice));
  const [sellPrice, setSellPrice] = useState(price.sellPrice != null ? String(price.sellPrice) : "");
  const [notes, setNotes] = useState(price.notes || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        kgPrice: Number(kgPrice),
        sellPrice: Number(sellPrice) || null,
        notes: notes || null,
      });
      onClose();
    } catch (err) {
      setError(err.payload?.conflict ? "تم تعديل هذا السعر من مكان آخر، أعد المحاولة" : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>سعر شراء الكيلو ({settings.currency})</label>
        <input type="number" step="0.01" value={kgPrice} onChange={(e) => setKgPrice(e.target.value)} required />
      </div>
      <div className="modal-field">
        <label>سعر بيع الكيلو ({settings.currency})</label>
        <input type="number" step="0.01" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
      </div>
      <div className="modal-field">
        <label>ملاحظات</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="أي ملاحظات على سعر اليوم" />
      </div>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-outline" onClick={onClose}>
          إلغاء
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>
    </form>
  );
}

export default function DailyPricing() {
  const { items: dailyPrices, loading, error, create } = useCollection(dailyPricingApi);
  const { items: purchaseOrders } = useCollection(purchaseOrdersApi);
  const { items: salesInvoices } = useCollection(salesInvoicesApi);
  const { settings, fmtMoney, fmtWeight } = useSettings();
  const [showAdd, setShowAdd] = useState(false);

  const transactions = useMemo(() => {
    const buys = purchaseOrders.map((o) => ({
      id: `buy-${o.id}`,
      date: o.date,
      type: "شراء",
      party: o.supplierName,
      kgPrice: o.kgPrice,
      weightKg: o.weightKg,
      total: o.total,
    }));
    const sells = salesInvoices.map((i) => ({
      id: `sell-${i.id}`,
      date: i.date,
      type: "بيع",
      party: i.slaughterhouse,
      kgPrice: i.kgPrice,
      weightKg: i.weightKg,
      total: i.total,
    }));
    return [...buys, ...sells].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [purchaseOrders, salesInvoices]);

  return (
    <div>
      <PageHeader
        title="سجل عمليات الشراء والبيع"
        subtitle="كل عملية شراء أو بيع فعلية، بسعرها وطرفها والإجمالي"
        actions={
          <button className="btn-outline" onClick={() => setShowAdd(true)}>
            تحديث السعر المرجعي لليوم
          </button>
        }
      />

      {loading && <p className="state-message">جارٍ التحميل...</p>}
      {error && <p className="state-message state-message-error">{error}</p>}

      {!loading && !error && (
        <Card>
          {transactions.length === 0 && <p className="state-message">لا توجد عمليات مسجلة</p>}
          {transactions.length > 0 && (
            <Table
              columns={["التاريخ", "النوع", "من / الى", "سعر الكيلو", "الكمية", "الإجمالي"]}
              rows={transactions}
              renderRow={(t) => (
                <>
                  <Td className="td-muted" dir="ltr">{t.date}</Td>
                  <Td>
                    <span className={`badge ${t.type === "شراء" ? "badge-yellow" : "badge-green"}`}>
                      <i className="badge-dot" />
                      {t.type}
                    </span>
                  </Td>
                  <Td>{t.party}</Td>
                  <Td dir="ltr">{Number(t.kgPrice).toFixed(2)} {settings.currency}</Td>
                  <Td dir="ltr">{fmtWeight(t.weightKg)}</Td>
                  <Td className="td-strong">{fmtMoney(t.total)}</Td>
                </>
              )}
            />
          )}
        </Card>
      )}

      {showAdd && (
        <Modal title="تحديث السعر المرجعي لليوم" subtitle="يُستخدم كسعر افتراضي عند تسجيل عمليات جديدة" onClose={() => setShowAdd(false)}>
          <AddPriceForm onClose={() => setShowAdd(false)} onCreate={create} />
        </Modal>
      )}
    </div>
  );
}
