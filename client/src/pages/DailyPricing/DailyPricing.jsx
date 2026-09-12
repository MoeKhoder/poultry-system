import { useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import StatCard from "../../components/StatCard/StatCard";
import { Table, Td } from "../../components/DataTable/DataTable";
import IconButton from "../../components/IconButton/IconButton";
import { EditIcon } from "../../components/Icons/Icons";
import Modal from "../../components/Modal/Modal";
import { useCollection } from "../../api/useCollection";
import { dailyPricingApi } from "../../api/resources";
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
  const { items: dailyPrices, loading, error, create, update } = useCollection(dailyPricingApi);
  const { settings, fmtMoney } = useSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);

  const sorted = useMemo(() => [...dailyPrices].sort((a, b) => (a.date < b.date ? 1 : -1)), [dailyPrices]);
  const active = dailyPrices.find((p) => p.status === "نشط") || null;
  const activeMargin = active && active.sellPrice != null ? (active.sellPrice - active.kgPrice).toFixed(2) : null;

  async function handleEditSubmit(body) {
    await update(editingPrice.id, { ...body, _expectedVersion: editingPrice._version });
  }

  return (
    <div>
      <PageHeader title="إدارة الأسعار اليومية" />

      <div className="page-grid page-grid-3 suppliers-stats">
        <StatCard label="سعر شراء اليوم" value={active ? `${Number(active.kgPrice).toFixed(2)} ${settings.currency}` : "—"} />
        <StatCard label="سعر بيع اليوم" value={active && active.sellPrice != null ? `${Number(active.sellPrice).toFixed(2)} ${settings.currency}` : "—"} />
        <StatCard label="هامش الربح للكيلو" value={activeMargin != null ? `${activeMargin} ${settings.currency}` : "—"} />
      </div>

      {loading && <p className="state-message">جارٍ التحميل...</p>}
      {error && <p className="state-message state-message-error">{error}</p>}

      {!loading && !error && (
        <Card>
          <div className="card-head">
            <div>
              <div className="card-title">سجل الأسعار اليومية</div>
              <div className="card-sub">تسعير الكيلو شراءً وبيعاً حسب اليوم</div>
            </div>
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              تسجيل سعر جديد
            </button>
          </div>
          <Table
            columns={["التاريخ", "سعر شراء الكيلو", "سعر بيع الكيلو", "هامش الربح", "ملاحظات", "الإجراءات"]}
            rows={sorted}
            renderRow={(p) => {
              const margin = p.sellPrice != null ? (p.sellPrice - p.kgPrice).toFixed(2) : null;
              return (
                <>
                  <Td className="td-muted" dir="ltr">{p.date}</Td>
                  <Td dir="ltr">{Number(p.kgPrice).toFixed(2)} {settings.currency}</Td>
                  <Td dir="ltr">{p.sellPrice != null ? `${Number(p.sellPrice).toFixed(2)} ${settings.currency}` : "—"}</Td>
                  <Td className={margin != null && margin > 0 ? "td-strong" : "td-faint"}>{margin != null ? `${margin} ${settings.currency}` : "—"}</Td>
                  <Td className="td-muted">{p.notes || "—"}</Td>
                  <Td>
                    <IconButton label="تعديل" onClick={() => setEditingPrice(p)}>
                      <EditIcon />
                    </IconButton>
                  </Td>
                </>
              );
            }}
          />
        </Card>
      )}

      {showAdd && (
        <Modal title="تسجيل سعر جديد" onClose={() => setShowAdd(false)}>
          <AddPriceForm onClose={() => setShowAdd(false)} onCreate={create} />
        </Modal>
      )}

      {editingPrice && (
        <Modal title="تعديل سعر اليوم" subtitle={editingPrice.date} onClose={() => setEditingPrice(null)}>
          <EditPriceForm price={editingPrice} onClose={() => setEditingPrice(null)} onSubmit={handleEditSubmit} />
        </Modal>
      )}
    </div>
  );
}
