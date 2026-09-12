import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/Card/Card";
import { Table, Td } from "../../components/DataTable/DataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import IconButton from "../../components/IconButton/IconButton";
import { EditIcon, TrashIcon, EyeIcon, FilterIcon, UsersIcon, PhoneIcon, PinIcon, ChevBackIcon, PlusIcon } from "../../components/Icons/Icons";
import SelectWrap from "../../components/SelectWrap/SelectWrap";
import SearchBar from "../../components/SearchBar/SearchBar";
import Modal from "../../components/Modal/Modal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import { printVoucher } from "../../utils/printDocument";
import { useSettings } from "../../context/SettingsContext";
import { slaughterhousesApi, salesInvoicesApi, accountsSummaryApi } from "../../api/resources";
import "./SlaughterhouseDetail.css";

function statusForInvoice(total, paid) {
  if (paid >= total && total > 0) return "مدفوع";
  if (paid > 0) return "جزئي";
  return "غير مدفوع";
}

function InvoiceForm({ initial, isEdit, nextRef, onClose, onSubmit }) {
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
      await onSubmit({ date: form.date, cages, weightKg, kgPrice, total, paid });
      onClose();
    } catch (err) {
      setError(err.payload?.conflict ? "تم تعديل هذه الفاتورة من مكان آخر، أعد المحاولة" : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>رقم المرجع</label>
        <input value={initial.invoiceNumber || nextRef} disabled />
      </div>
      <div className="modal-field">
        <label>التاريخ</label>
        <input type="date" value={form.date} onChange={set("date")} required disabled={isEdit} />
        {isEdit && <p className="supplier-detail-field-note">التاريخ لا يمكن تعديله</p>}
      </div>
      <div className="modal-field">
        <label>عدد الأقفاص</label>
        <input type="number" value={form.cages} onChange={set("cages")} required />
      </div>
      <div className="modal-field">
        <label>الكمية ({settings.weightUnit})</label>
        <input type="number" value={form.weightKg} onChange={set("weightKg")} required />
      </div>
      <div className="modal-field">
        <label>أجرة الكيلو ({settings.currency})</label>
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
        <button type="submit" className="btn-primary" disabled={saving || !weightKg || !kgPrice}>
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>
    </form>
  );
}

export default function SlaughterhouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, fmtMoney, fmtWeight } = useSettings();
  const [slaughterhouse, setSlaughterhouse] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [computed, setComputed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [dateFilter, setDateFilter] = useState("الكل");
  const [refQuery, setRefQuery] = useState("");

  function reload() {
    setLoading(true);
    Promise.all([slaughterhousesApi.getOne(id), salesInvoicesApi.list(), accountsSummaryApi.get()])
      .then(([house, allInvoices, summary]) => {
        setSlaughterhouse(house);
        setInvoices(allInvoices.filter((i) => i.slaughterhouse === house.name));
        setComputed(summary.slaughterhouses.find((s) => s.id === id) || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [id]);

  const filteredInvoices = [...invoices]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .filter((inv) => {
      if (statusFilter !== "الكل" && statusForInvoice(inv.total, inv.paid || 0) !== statusFilter) return false;
      if (refQuery && !inv.invoiceNumber?.toLowerCase().includes(refQuery.toLowerCase())) return false;
      if (dateFilter !== "الكل") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - Number(dateFilter));
        if (new Date(inv.date) < cutoff) return false;
      }
      return true;
    });

  async function handleCreateInvoice(body) {
    await salesInvoicesApi.create({ ...body, slaughterhouse: slaughterhouse.name });
    reload();
  }

  async function handleUpdateInvoice(body) {
    await salesInvoicesApi.update(editingInvoice.id, { ...body, _expectedVersion: editingInvoice._version });
    reload();
  }

  async function handleDeleteInvoice() {
    await salesInvoicesApi.remove(deletingInvoice.id);
    setDeletingInvoice(null);
    reload();
  }

  if (loading) return <p className="state-message">جارٍ التحميل...</p>;
  if (error) return <p className="state-message state-message-error">{error}</p>;
  if (!slaughterhouse) return <p className="state-message">المسلخ غير موجود</p>;

  return (
    <div>
      <button type="button" className="back-link" onClick={() => navigate("/slaughterhouses")}>
        <ChevBackIcon /> العودة الى المسالخ
      </button>

      <div className="profile-card">
        <div className="profile-id">
          {slaughterhouse.photo ? (
            <img className="profile-photo" src={slaughterhouse.photo} alt="" />
          ) : (
            <div className="profile-photo profile-photo-placeholder" />
          )}
          <div>
            <div className="profile-name">{slaughterhouse.name}</div>
            <div className="profile-meta">
              <span>
                <UsersIcon /> <span>{slaughterhouse.contact}</span>
              </span>
              <span>
                <PhoneIcon /> <span dir="ltr">{slaughterhouse.phone}</span>
              </span>
              <span>
                <PinIcon /> <span>{slaughterhouse.region}</span>
              </span>
            </div>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <PlusIcon /> إضافة عملية ذبح
        </button>
      </div>

      <div className="section-heading">
        <h2>سجلات الذبح</h2>
        <p>تتبع جميع عمليات الذبح</p>
      </div>

      <Card>
        <div className="card-head">
          <div className="filters">
            <SelectWrap icon={<FilterIcon />} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="الكل">جميع حالات الدفع</option>
              <option value="مدفوع">مدفوع</option>
              <option value="جزئي">مدفوع جزئي</option>
              <option value="غير مدفوع">غير مدفوع</option>
            </SelectWrap>
          </div>
          <SearchBar placeholder="بحث برقم المرجع" value={refQuery} onChange={setRefQuery} />
        </div>
        {invoices.length === 0 && <p className="state-message">لا توجد فواتير مسجلة لهذا المسلخ</p>}
        {invoices.length > 0 && filteredInvoices.length === 0 && <p className="state-message">لا توجد نتائج مطابقة للفلاتر المحددة</p>}
        {filteredInvoices.length > 0 && (
          <Table
            columns={["التاريخ", "رقم المرجع", "الكمية (كغ)", "أجرة الكيلو", "المبلغ الإجمالي", "المبلغ المتبقي", "الحالة", "الإجراءات"]}
            rows={filteredInvoices}
            renderRow={(inv) => {
              const remaining = Math.max(0, (inv.total || 0) - (inv.paid || 0));
              return (
                <>
                  <Td className="td-muted" dir="ltr">{inv.date}</Td>
                  <Td className="td-brand" dir="ltr">{inv.invoiceNumber}</Td>
                  <Td dir="ltr">{fmtWeight(inv.weightKg)}</Td>
                  <Td className="td-muted" dir="ltr">
                    {inv.weightKg ? (inv.total / inv.weightKg).toFixed(2) : "0.00"} {settings.currency}
                  </Td>
                  <Td className="td-strong">{fmtMoney(inv.total)}</Td>
                  <Td className={remaining > 0 ? "td-negative" : "td-faint"}>{remaining > 0 ? fmtMoney(remaining) : "—"}</Td>
                  <Td>
                    <StatusBadge status={statusForInvoice(inv.total, inv.paid || 0)} />
                  </Td>
                  <Td>
                    <div className="row-actions">
                      <IconButton label="تعديل" onClick={() => setEditingInvoice(inv)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton label="حذف" tone="danger" onClick={() => setDeletingInvoice(inv)}>
                        <TrashIcon />
                      </IconButton>
                      <IconButton label="عرض الفاتورة" onClick={() => setViewingInvoice(inv)}>
                        <EyeIcon />
                      </IconButton>
                    </div>
                  </Td>
                </>
              );
            }}
          />
        )}
      </Card>

      {showAdd && (
        <Modal title="إضافة طلبية جديدة" onClose={() => setShowAdd(false)}>
          <InvoiceForm
            initial={{ date: new Date().toISOString().slice(0, 10), cages: "", weightKg: "", kgPrice: "", total: "", paid: "" }}
            isEdit={false}
            nextRef={`SL-2026-${1100 + invoices.length}`}
            onClose={() => setShowAdd(false)}
            onSubmit={handleCreateInvoice}
          />
        </Modal>
      )}

      {editingInvoice && (
        <Modal title={`تعديل ${editingInvoice.invoiceNumber}`} onClose={() => setEditingInvoice(null)}>
          <InvoiceForm
            initial={{
              invoiceNumber: editingInvoice.invoiceNumber,
              date: editingInvoice.date,
              cages: String(editingInvoice.cages),
              weightKg: String(editingInvoice.weightKg),
              kgPrice: String(editingInvoice.weightKg ? (editingInvoice.total / editingInvoice.weightKg).toFixed(2) : 0),
              total: String(editingInvoice.total),
              paid: String(editingInvoice.paid || 0),
            }}
            isEdit
            onClose={() => setEditingInvoice(null)}
            onSubmit={handleUpdateInvoice}
          />
        </Modal>
      )}

      {deletingInvoice && (
        <ConfirmDeleteModal
          message={`سيتم حذف الفاتورة ${deletingInvoice.invoiceNumber} بقيمة ${fmtMoney(deletingInvoice.total)} نهائياً من ${slaughterhouse.name}.`}
          onConfirm={handleDeleteInvoice}
          onCancel={() => setDeletingInvoice(null)}
        />
      )}

      {viewingInvoice && (
        <Modal title="معاينة الفاتورة" onClose={() => setViewingInvoice(null)}>
          <div className="purchase-voucher">
            <div className="purchase-voucher-banner">
              <div>
                <p className="purchase-voucher-banner-label">رقم الفاتورة</p>
                <p className="purchase-voucher-banner-code">{viewingInvoice.invoiceNumber}</p>
                <p className="purchase-voucher-banner-date">{viewingInvoice.date}</p>
              </div>
              <div className="purchase-voucher-banner-title">
                <p>فاتورة بيع</p>
                <p className="purchase-voucher-banner-sub">الشيخ تشيكن</p>
              </div>
            </div>
            <StatusBadge status={statusForInvoice(viewingInvoice.total, viewingInvoice.paid || 0)} />
            <p className="purchase-voucher-section-label purchase-voucher-section-label-spaced">المسلخ</p>
            <p className="purchase-voucher-supplier-name">{slaughterhouse.name}</p>
            <p className="purchase-voucher-supplier-meta">{slaughterhouse.phone} — {slaughterhouse.region}</p>
            <div className="detail-list purchase-voucher-list">
              <div className="detail-row">
                <span>عدد الأقفاص</span>
                <span>{viewingInvoice.cages} قفص</span>
              </div>
              <div className="detail-row">
                <span>الوزن الإجمالي</span>
                <span>{fmtWeight(viewingInvoice.weightKg)}</span>
              </div>
              <div className="detail-row">
                <span>المدفوع</span>
                <span>{fmtMoney(viewingInvoice.paid || 0)}</span>
              </div>
              <div className="detail-row">
                <span>المتبقي</span>
                <span>{fmtMoney(Math.max(0, viewingInvoice.total - (viewingInvoice.paid || 0)))}</span>
              </div>
            </div>
            <div className="purchase-voucher-total">
              <span>الإجمالي الكلي</span>
              <span>{fmtMoney(viewingInvoice.total)}</span>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={() => printVoucher({ settings, invoice: viewingInvoice })}>
                🖨️ طباعة
              </button>
              <button type="button" className="btn-outline" onClick={() => printVoucher({ settings, invoice: viewingInvoice })}>
                ⬇️ تحميل
              </button>
              <button type="button" className="btn-outline" onClick={() => setViewingInvoice(null)}>
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
