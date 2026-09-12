import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import { Table, Td } from "../../components/DataTable/DataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import ActionLink from "../../components/ActionLink/ActionLink";
import Modal from "../../components/Modal/Modal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import { printPurchaseOrder } from "../../utils/printDocument";
import { useSettings } from "../../context/SettingsContext";
import { dailyPricingApi, purchaseOrdersApi, suppliersApi } from "../../api/resources";
import "./PriceDetail.css";

const ARABIC_WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function weekdayName(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return ARABIC_WEEKDAYS[d.getUTCDay()];
}

function statusForOrder(total, paid) {
  if (paid >= total && total > 0) return "مدفوع";
  if (paid > 0) return "جزئي";
  return "غير مدفوع";
}

function OrderForDateForm({ suppliers, initial, isEdit, onClose, onSubmit }) {
  const { settings } = useSettings();
  const [form, setForm] = useState(initial);
  const [totalTouched, setTotalTouched] = useState(isEdit);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function setTotal(e) {
    setTotalTouched(true);
    setForm((prev) => ({ ...prev, total: e.target.value }));
  }

  const cages = Number(form.cages) || 0;
  const weightKg = Number(form.weightKg) || 0;
  const kgPrice = Number(form.kgPrice) || 0;
  const suggestedTotal = Math.round(weightKg * kgPrice);
  const total = totalTouched ? Number(form.total) || 0 : suggestedTotal;
  const paid = Number(form.paid) || 0;
  const remaining = Math.max(0, total - paid);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const supplier = suppliers.find((s) => s.id === form.supplierId);
      await onSubmit({
        supplierId: form.supplierId,
        supplierName: supplier?.name || form.supplierName || "",
        cages,
        weightKg,
        kgPrice,
        total,
        paid,
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
        <label>المورد</label>
        <select value={form.supplierId} onChange={set("supplierId")} required disabled={isEdit}>
          <option value="">— اختر —</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-field">
        <label>عدد الأقفاص</label>
        <input type="number" value={form.cages} onChange={set("cages")} required />
      </div>
      <div className="modal-field">
        <label>الوزن الصافي ({settings.weightUnit})</label>
        <input type="number" value={form.weightKg} onChange={set("weightKg")} required />
      </div>
      <div className="modal-field">
        <label>سعر الكيلو ({settings.currency})</label>
        <input type="number" step="0.01" value={form.kgPrice} onChange={set("kgPrice")} required />
      </div>
      <div className="field-row">
        <div className="modal-field">
          <label>المبلغ الاجمالي ({settings.currency})</label>
          <input type="number" value={totalTouched ? form.total : suggestedTotal} onChange={setTotal} required />
        </div>
        <div className="modal-field">
          <label>المبلغ المدفوع ({settings.currency})</label>
          <input type="number" value={form.paid} onChange={set("paid")} required />
        </div>
      </div>
      <p className="supplier-detail-computed-total">المبلغ المتبقي: {remaining.toLocaleString("ar-SA")} {settings.currency}</p>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-outline" onClick={onClose}>
          إلغاء
        </button>
        <button type="submit" className="btn-primary" disabled={saving || !form.supplierId || !weightKg || !kgPrice}>
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
      await onSubmit({ kgPrice: Number(kgPrice), sellPrice: Number(sellPrice) || null, notes: notes || null });
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

export default function PriceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, fmtMoney, fmtWeight } = useSettings();
  const [price, setPrice] = useState(null);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("الكل");

  function reload() {
    setLoading(true);
    Promise.all([dailyPricingApi.getOne(id), purchaseOrdersApi.list(), suppliersApi.list()])
      .then(([p, allOrders, allSuppliers]) => {
        setPrice(p);
        setOrders(allOrders.filter((o) => o.date === p.date));
        setSuppliers(allSuppliers);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [id]);

  const totalWeight = orders.reduce((sum, o) => sum + (o.weightKg || 0), 0);
  const totalValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const filteredOrders =
    statusFilter === "الكل" ? orders : orders.filter((o) => statusForOrder(o.total, o.paid || 0) === statusFilter);

  async function handleEditPrice(body) {
    await dailyPricingApi.update(price.id, { ...body, _expectedVersion: price._version });
    reload();
  }

  async function handleCreateOrder(body) {
    await purchaseOrdersApi.create({ ...body, date: price.date });
    reload();
  }

  async function handleUpdateOrder(body) {
    await purchaseOrdersApi.update(editingOrder.id, { ...body, _expectedVersion: editingOrder._version });
    reload();
  }

  async function handleDeleteOrder() {
    await purchaseOrdersApi.remove(deletingOrder.id);
    setDeletingOrder(null);
    reload();
  }

  if (loading) return <p className="state-message">جارٍ التحميل...</p>;
  if (error) return <p className="state-message state-message-error">{error}</p>;
  if (!price) return <p className="state-message">السعر غير موجود</p>;

  return (
    <div>
      <PageHeader
        title={`كشف يوم ${price.date} — ${weekdayName(price.date)}`}
        subtitle={`سعر القفص: ${price.cagePrice} ${settings.currency} | سعر الكيلو: ${Number(price.kgPrice).toFixed(2)} ${settings.currency}`}
        actions={
          <>
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              ➕ إضافة فاتورة جديدة
            </button>
            <button className="btn-outline" onClick={() => setEditingPrice(true)}>
              ✏️ تعديل السعر
            </button>
            <button className="btn-outline" onClick={() => navigate("/pricing")}>
              رجوع ←
            </button>
          </>
        }
      />

      <div className="price-detail-banner">
        <div className="price-detail-banner-badge">
          <StatusBadge status={price.status} />
        </div>
        <div className="price-detail-banner-stats">
          <div>
            <p className="price-detail-banner-label">سعر القفص</p>
            <p className="price-detail-banner-value">{price.cagePrice} {settings.currency}</p>
          </div>
          <div>
            <p className="price-detail-banner-label">سعر الكيلو (شراء)</p>
            <p className="price-detail-banner-value">{Number(price.kgPrice).toFixed(2)} {settings.currency}</p>
          </div>
          {price.sellPrice != null && (
            <div>
              <p className="price-detail-banner-label">سعر الكيلو (بيع)</p>
              <p className="price-detail-banner-value">{Number(price.sellPrice).toFixed(2)} {settings.currency}</p>
            </div>
          )}
          <div>
            <p className="price-detail-banner-label">إجمالي الوزن المشترى</p>
            <p className="price-detail-banner-value">{fmtWeight(totalWeight)}</p>
          </div>
          <div>
            <p className="price-detail-banner-label">إجمالي قيمة المشتريات</p>
            <p className="price-detail-banner-value">{fmtMoney(totalValue)}</p>
          </div>
        </div>
      </div>

      <Card>
        <div className="section-header">
          <h2 className="section-title">فواتير الشراء في هذا اليوم</h2>
          <span className="section-hint">{orders.length} فاتورة</span>
        </div>
        <div className="detail-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="detail-filter-select">
            <option value="الكل">جميع حالات الدفع</option>
            <option value="مدفوع">مدفوع</option>
            <option value="جزئي">جزئي</option>
            <option value="غير مدفوع">غير مدفوع</option>
          </select>
        </div>
        {orders.length === 0 && <p className="state-message">لا توجد فواتير شراء لهذا اليوم</p>}
        {orders.length > 0 && filteredOrders.length === 0 && <p className="state-message">لا توجد نتائج مطابقة للفلتر المحدد</p>}
        {filteredOrders.length > 0 && (
          <>
            <Table
              columns={["الكود", "اسم المورد", "الوزن", "سعر الكيلو", "الإجمالي", "المدفوع", "المتبقي", "الحالة", "إجراءات"]}
              rows={filteredOrders}
              renderRow={(o) => {
                const remaining = Math.max(0, (o.total || 0) - (o.paid || 0));
                return (
                  <>
                    <Td className="td-brand" dir="ltr">{o.code}</Td>
                    <Td className="td-strong">{o.supplierName}</Td>
                    <Td>{fmtWeight(o.weightKg)}</Td>
                    <Td>{Number(o.kgPrice).toFixed(2)} {settings.currency}</Td>
                    <Td className="td-strong">{fmtMoney(o.total)}</Td>
                    <Td>{fmtMoney(o.paid || 0)}</Td>
                    <Td className={remaining > 0 ? "td-negative" : "td-faint"}>{remaining > 0 ? fmtMoney(remaining) : "—"}</Td>
                    <Td>
                      <StatusBadge status={statusForOrder(o.total, o.paid || 0)} />
                    </Td>
                    <Td>
                      <div className="row-actions">
                        <ActionLink onClick={() => setEditingOrder(o)}>تعديل</ActionLink>
                        <ActionLink tone="danger" onClick={() => setDeletingOrder(o)}>حذف</ActionLink>
                        <ActionLink onClick={() => setViewingOrder(o)}>كشف الفاتورة</ActionLink>
                      </div>
                    </Td>
                  </>
                );
              }}
            />
            <div className="price-detail-total-row">
              <span>{orders.length} فاتورة — {fmtWeight(totalWeight)}</span>
              <span>المجموع الكلي — {fmtMoney(totalValue)}</span>
            </div>
          </>
        )}
      </Card>

      {showAdd && (
        <Modal title="إضافة فاتورة شراء جديدة" onClose={() => setShowAdd(false)}>
          <OrderForDateForm
            suppliers={suppliers}
            initial={{ supplierId: "", cages: "", weightKg: "", kgPrice: String(price.kgPrice), total: "", paid: "" }}
            isEdit={false}
            onClose={() => setShowAdd(false)}
            onSubmit={handleCreateOrder}
          />
        </Modal>
      )}

      {editingPrice && (
        <Modal title={`تعديل سعر ${price.date}`} onClose={() => setEditingPrice(false)}>
          <EditPriceForm price={price} onClose={() => setEditingPrice(false)} onSubmit={handleEditPrice} />
        </Modal>
      )}

      {editingOrder && (
        <Modal title={`تعديل ${editingOrder.code}`} onClose={() => setEditingOrder(null)}>
          <OrderForDateForm
            suppliers={suppliers}
            initial={{
              supplierId: editingOrder.supplierId,
              supplierName: editingOrder.supplierName,
              cages: String(editingOrder.cages),
              weightKg: String(editingOrder.weightKg),
              kgPrice: String(editingOrder.kgPrice),
              total: String(editingOrder.total),
              paid: String(editingOrder.paid || 0),
            }}
            isEdit
            onClose={() => setEditingOrder(null)}
            onSubmit={handleUpdateOrder}
          />
        </Modal>
      )}

      {deletingOrder && (
        <ConfirmDeleteModal
          message={`سيتم حذف الطلب ${deletingOrder.code} بقيمة ${fmtMoney(deletingOrder.total)} نهائياً من ${deletingOrder.supplierName}.`}
          onConfirm={handleDeleteOrder}
          onCancel={() => setDeletingOrder(null)}
        />
      )}

      {viewingOrder && (
        <Modal title="معاينة الفاتورة" onClose={() => setViewingOrder(null)}>
          <div className="purchase-voucher">
            <div className="purchase-voucher-banner">
              <div>
                <p className="purchase-voucher-banner-label">رقم الفاتورة</p>
                <p className="purchase-voucher-banner-code">{viewingOrder.code}</p>
                <p className="purchase-voucher-banner-date">{viewingOrder.date}</p>
              </div>
              <div className="purchase-voucher-banner-title">
                <p>فاتورة شراء</p>
                <p className="purchase-voucher-banner-sub">الشيخ تشيكن</p>
              </div>
            </div>
            <StatusBadge status={statusForOrder(viewingOrder.total, viewingOrder.paid || 0)} />
            <p className="purchase-voucher-section-label purchase-voucher-section-label-spaced">المورد</p>
            <p className="purchase-voucher-supplier-name">{viewingOrder.supplierName}</p>
            <div className="detail-list purchase-voucher-list">
              <div className="detail-row">
                <span>عدد الأقفاص</span>
                <span>{viewingOrder.cages} قفص</span>
              </div>
              <div className="detail-row">
                <span>الوزن الإجمالي</span>
                <span>{fmtWeight(viewingOrder.weightKg)}</span>
              </div>
              <div className="detail-row">
                <span>سعر الكيلو</span>
                <span>{Number(viewingOrder.kgPrice).toLocaleString("ar-SA")} {settings.currency}</span>
              </div>
              <div className="detail-row">
                <span>المدفوع</span>
                <span>{fmtMoney(viewingOrder.paid || 0)}</span>
              </div>
              <div className="detail-row">
                <span>المتبقي</span>
                <span>{fmtMoney(Math.max(0, viewingOrder.total - (viewingOrder.paid || 0)))}</span>
              </div>
            </div>
            <div className="purchase-voucher-total">
              <span>الإجمالي الكلي</span>
              <span>{fmtMoney(viewingOrder.total)}</span>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-outline" onClick={() => setViewingOrder(null)}>
                إغلاق
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  printPurchaseOrder({
                    settings,
                    supplier: { name: viewingOrder.supplierName, phone: "", region: "" },
                    order: viewingOrder,
                  })
                }
              >
                🖨️ طباعة
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
