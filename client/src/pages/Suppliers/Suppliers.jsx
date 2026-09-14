import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import StatCard from "../../components/StatCard/StatCard";
import SearchBar from "../../components/SearchBar/SearchBar";
import { Table, Td } from "../../components/DataTable/DataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import IconButton from "../../components/IconButton/IconButton";
import { EditIcon, EyeIcon, PlusIcon, TrashIcon, WalletIcon } from "../../components/Icons/Icons";
import Modal from "../../components/Modal/Modal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import { printReport } from "../../utils/printDocument";
import { useCollection } from "../../api/useCollection";
import { suppliersApi, accountsSummaryApi, loansApi } from "../../api/resources";
import { useSettings } from "../../context/SettingsContext";
import PhotoUpload from "../../components/PhotoUpload/PhotoUpload";
import "./Suppliers.css";

function LoanForm({ party, currency, onClose, onSubmit }) {
  const [amount, setAmount] = useState("");
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
      await onSubmit({ amount: value, date, note: note || null });
      onClose();
    } catch {
      setError("تعذر تسجيل الدين");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>المورد</label>
        <input value={party.name} disabled />
      </div>
      <div className="modal-field">
        <label>مبلغ الدين ({currency})</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <div className="modal-field">
        <label>التاريخ</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="modal-field">
        <label>ملاحظة</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="سبب الدين (اختياري)" />
      </div>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-outline" onClick={onClose}>
          إلغاء
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "إضافة الدين"}
        </button>
      </div>
    </form>
  );
}

function SupplierForm({ initial, onClose, onSubmit }) {
  const [form, setForm] = useState(initial);
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
      await onSubmit(form);
      onClose();
    } catch (err) {
      if (err.payload?.error === "duplicate_field") setError("رقم الجوال مستخدم بالفعل");
      else if (err.payload?.conflict) setError("تم تعديل هذا السجل من مكان آخر، أعد فتح الصفحة وحاول مجدداً");
      else setError("تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>اسم المورد</label>
        <input value={form.name} onChange={set("name")} placeholder="مزرعة الشرق" required />
      </div>
      <div className="modal-field">
        <label>المنطقة / المدينة</label>
        <input value={form.region} onChange={set("region")} placeholder="مثال: طرابلس" required />
      </div>
      <div className="modal-field">
        <label>صورة البروفايل</label>
        <PhotoUpload value={form.photo} onChange={(photo) => setForm((prev) => ({ ...prev, photo }))} />
      </div>
      <div className="field-row">
        <div className="modal-field">
          <label>اسم الشخص المسؤول</label>
          <input value={form.contact} onChange={set("contact")} placeholder="أيمن أحمد" required />
        </div>
        <div className="modal-field">
          <label>رقم التلفون</label>
          <input value={form.phone} onChange={set("phone")} dir="ltr" placeholder="03153334" required />
        </div>
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

export default function Suppliers() {
  const navigate = useNavigate();
  const { items: suppliers, loading, error, create, update, remove } = useCollection(suppliersApi);
  const { settings, fmtMoney } = useSettings();
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [loaningSupplier, setLoaningSupplier] = useState(null);
  const [summary, setSummary] = useState({ suppliers: [] });

  useEffect(() => {
    accountsSummaryApi.get().then(setSummary);
  }, [suppliers]);

  const computedById = useMemo(() => Object.fromEntries(summary.suppliers.map((s) => [s.id, s])), [summary]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return suppliers;
    return suppliers.filter((s) => s.name.includes(q) || s.region.includes(q));
  }, [suppliers, query]);

  const totalDebt = summary.suppliers.reduce((s, x) => s + (x.remaining || 0), 0);
  const totalPurchases = summary.suppliers.reduce((s, x) => s + (x.totalPurchases || 0), 0);

  function handleExport() {
    printReport({
      settings,
      title: "تقرير الموردين",
      subtitle: `${filtered.length} مورد`,
      summaryLines: [
        ["إجمالي الديون", fmtMoney(totalDebt)],
        ["إجمالي المشتريات", fmtMoney(totalPurchases)],
      ],
      columns: ["الكود", "اسم المورد", "المنطقة", "اسم الشخص", "رقم التليفون", "إجمالي المشتريات", "الرصيد المستحق"],
      rows: filtered.map((s) => {
        const c = computedById[s.id];
        return [s.code, s.name, s.region, s.contact, s.phone, fmtMoney(c?.totalPurchases || 0), c?.remaining > 0 ? fmtMoney(c.remaining) : "مسدّد"];
      }),
    });
  }

  async function handleEditSubmit(form) {
    await update(editing.id, {
      name: form.name,
      region: form.region,
      contact: form.contact,
      phone: form.phone,
      photo: form.photo ?? null,
      _expectedVersion: editing._version,
    });
  }

  async function handleDeleteSupplier() {
    await remove(deletingSupplier.id);
    setDeletingSupplier(null);
  }

  async function handleAddLoan(body) {
    await loansApi.create({
      partyType: "supplier",
      partyId: loaningSupplier.id,
      partyName: loaningSupplier.name,
      ...body,
    });
    accountsSummaryApi.get().then(setSummary);
  }

  return (
    <div>
      <PageHeader
        title="الموردين"
        actions={
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <PlusIcon /> إضافة مورد
          </button>
        }
      />

      <div className="page-grid page-grid-3 suppliers-stats">
        <StatCard label="إجمالي الموردين" value={`${suppliers.length} موردين`} />
        <StatCard label="إجمالي المشتريات" value={fmtMoney(totalPurchases)} />
        <StatCard valueTone="red" label="إجمالي الديون" value={fmtMoney(totalDebt)} />
      </div>

      {loading && <p className="state-message">جارٍ التحميل...</p>}
      {error && <p className="state-message state-message-error">{error}</p>}

      {!loading && !error && filtered.length === 0 && <p className="state-message">لا يوجد موردون مطابقون</p>}

      {!loading && !error && filtered.length > 0 && (
        <Card>
          <div className="card-head">
            <div>
              <div className="card-title">قائمة الموردين</div>
              <div className="card-sub">إدارة بيانات موردي الدواجن والشركات المتعاقدة</div>
            </div>
            <SearchBar placeholder="بحث بإسم المورد أو المنطقة" value={query} onChange={setQuery} />
          </div>
          <Table
            columns={["الكود", "اسم المورد", "المنطقة", "اسم الشخص", "رقم التليفون", "إجمالي المشتريات", "الحالة", "إجراءات"]}
            rows={filtered}
            renderRow={(s) => {
              const c = computedById[s.id];
              const status = !c || c.remaining <= 0 ? "مدفوع" : c.paid > 0 ? "جزئي" : "غير مدفوع";
              return (
                <>
                  <Td className="td-muted" dir="ltr">{s.code}</Td>
                  <Td>
                    <button type="button" className="link-cell" onClick={() => navigate(`/suppliers/${s.id}`)}>
                      {s.name}
                    </button>
                  </Td>
                  <Td className="td-muted">{s.region}</Td>
                  <Td className="td-muted">{s.contact}</Td>
                  <Td className="td-muted" dir="ltr">{s.phone}</Td>
                  <Td>{fmtMoney(c?.totalPurchases || 0)}</Td>
                  <Td>
                    <StatusBadge status={status} />
                  </Td>
                  <Td>
                    <div className="row-actions">
                      <IconButton label="تعديل" onClick={() => setEditing(s)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton label="حذف" tone="danger" onClick={() => setDeletingSupplier(s)}>
                        <TrashIcon />
                      </IconButton>
                      <IconButton label="إضافة دين" onClick={() => setLoaningSupplier(s)}>
                        <WalletIcon />
                      </IconButton>
                      <IconButton label="عرض" onClick={() => navigate(`/suppliers/${s.id}`)}>
                        <EyeIcon />
                      </IconButton>
                    </div>
                  </Td>
                </>
              );
            }}
          />
        </Card>
      )}

      {showAdd && (
        <Modal title="إضافة مورد" onClose={() => setShowAdd(false)}>
          <SupplierForm initial={{ name: "", region: "", contact: "", phone: "", photo: null }} onClose={() => setShowAdd(false)} onSubmit={create} />
        </Modal>
      )}

      {editing && (
        <Modal title={`تعديل ${editing.name}`} onClose={() => setEditing(null)}>
          <SupplierForm initial={editing} onClose={() => setEditing(null)} onSubmit={handleEditSubmit} />
        </Modal>
      )}

      {deletingSupplier && (
        <ConfirmDeleteModal
          message={`سيتم حذف المورد "${deletingSupplier.name}" وكافة بياناته نهائياً. هذا لا يحذف طلبيات الشراء المرتبطة به.`}
          onConfirm={handleDeleteSupplier}
          onCancel={() => setDeletingSupplier(null)}
        />
      )}

      {loaningSupplier && (
        <Modal title="إضافة دين" subtitle={loaningSupplier.name} onClose={() => setLoaningSupplier(null)}>
          <LoanForm party={loaningSupplier} currency={settings.currency} onClose={() => setLoaningSupplier(null)} onSubmit={handleAddLoan} />
        </Modal>
      )}
    </div>
  );
}
