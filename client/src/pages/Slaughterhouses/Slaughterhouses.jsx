import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import StatCard from "../../components/StatCard/StatCard";
import { Table, Td } from "../../components/DataTable/DataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import IconButton from "../../components/IconButton/IconButton";
import { EditIcon, EyeIcon, PlusIcon, TrashIcon } from "../../components/Icons/Icons";
import SearchBar from "../../components/SearchBar/SearchBar";
import Modal from "../../components/Modal/Modal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import { printReport } from "../../utils/printDocument";
import { useSettings } from "../../context/SettingsContext";
import { useCollection } from "../../api/useCollection";
import { slaughterhousesApi, accountsSummaryApi } from "../../api/resources";
import { useDropdownList } from "../../api/useDropdownList";
import PhotoUpload from "../../components/PhotoUpload/PhotoUpload";
import "./Slaughterhouses.css";

function SlaughterhouseForm({ initial, onClose, onSubmit }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { values: regionOptions } = useDropdownList("المناطق");

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({ ...form, capacityPerDay: Number(form.capacityPerDay) || 0 });
      onClose();
    } catch (err) {
      if (err.payload?.error === "duplicate_field") setError("رقم الهاتف مستخدم بالفعل");
      else if (err.payload?.conflict) setError("تم تعديل هذا السجل من مكان آخر، أعد فتح الصفحة وحاول مجدداً");
      else setError("تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>اسم المسلخ</label>
        <input value={form.name} onChange={set("name")} placeholder="مسلخ الشمال" required />
      </div>
      <div className="modal-field">
        <label>المنطقة / المدينة</label>
        {regionOptions.length > 0 ? (
          <select value={form.region} onChange={set("region")} required>
            <option value="">— اختر —</option>
            {regionOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <input value={form.region} onChange={set("region")} required />
        )}
      </div>
      <div className="modal-field">
        <label>صورة البروفايل</label>
        <PhotoUpload value={form.photo} onChange={(photo) => setForm((prev) => ({ ...prev, photo }))} />
      </div>
      <div className="field-row">
        <div className="modal-field">
          <label>اسم الشخص المسؤول</label>
          <input value={form.contact} onChange={set("contact")} placeholder="سامر خليل" required />
        </div>
        <div className="modal-field">
          <label>رقم التلفون</label>
          <input value={form.phone} onChange={set("phone")} dir="ltr" placeholder="03998877" required />
        </div>
      </div>
      <div className="modal-field">
        <label>الطاقة الاستيعابية (قفص/يوم)</label>
        <input type="number" value={form.capacityPerDay} onChange={set("capacityPerDay")} />
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

export default function Slaughterhouses() {
  const navigate = useNavigate();
  const { items: slaughterhouses, loading, error, create, update, remove } = useCollection(slaughterhousesApi);
  const { settings, fmtMoney } = useSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingSlaughterhouse, setDeletingSlaughterhouse] = useState(null);
  const [summary, setSummary] = useState({ slaughterhouses: [] });
  const [query, setQuery] = useState("");

  useEffect(() => {
    accountsSummaryApi.get().then(setSummary);
  }, [slaughterhouses]);

  const computedById = useMemo(() => Object.fromEntries(summary.slaughterhouses.map((s) => [s.id, s])), [summary]);
  const totalWages = summary.slaughterhouses.reduce((sum, s) => sum + (s.totalSales || 0), 0);
  const totalDues = summary.slaughterhouses.reduce((sum, s) => sum + (s.remaining || 0), 0);

  const filtered = slaughterhouses.filter(
    (s) => !query || s.name.includes(query) || s.region.includes(query),
  );

  function handleExport() {
    printReport({
      settings,
      title: "تقرير المسالخ",
      subtitle: `${slaughterhouses.length} مسلخ`,
      columns: ["الكود", "اسم المسلخ", "المنطقة", "اسم الشخص", "رقم تلفون", "إجمالي الأجور"],
      rows: slaughterhouses.map((s) => {
        const c = computedById[s.id];
        return [s.code, s.name, s.region, s.contact, s.phone, fmtMoney(c?.totalSales || 0)];
      }),
    });
  }

  async function handleEditSubmit(form) {
    await update(editing.id, {
      name: form.name,
      region: form.region,
      contact: form.contact,
      phone: form.phone,
      capacityPerDay: Number(form.capacityPerDay) || 0,
      photo: form.photo ?? null,
      _expectedVersion: editing._version,
    });
  }

  async function handleDeleteSlaughterhouse() {
    await remove(deletingSlaughterhouse.id);
    setDeletingSlaughterhouse(null);
  }

  return (
    <div>
      <PageHeader
        title="المسالخ"
        actions={
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <PlusIcon /> إضافة مسلخ
          </button>
        }
      />

      <div className="page-grid page-grid-3 suppliers-stats">
        <StatCard label="إجمالي المسالخ" value={`${slaughterhouses.length} مسالخ`} />
        <StatCard label="إجمالي أجور الذبح" value={fmtMoney(totalWages)} />
        <StatCard valueTone="red" label="إجمالي المستحقات" value={fmtMoney(totalDues)} />
      </div>

      {loading && <p className="state-message">جارٍ التحميل...</p>}
      {error && <p className="state-message state-message-error">{error}</p>}

      {!loading && !error && (
        <Card>
          <div className="card-head">
            <div>
              <div className="card-title">قائمة المسالخ</div>
              <div className="card-sub">إدارة مسالخ الدواجن المتعاقدة</div>
            </div>
            <SearchBar placeholder="بحث بإسم المسلخ أو المنطقة" value={query} onChange={setQuery} />
          </div>
          <Table
            columns={["الكود", "اسم المسلخ", "المنطقة", "اسم الشخص", "رقم الهاتف", "إجمالي الأجور", "الحالة", "الإجراءات"]}
            rows={filtered}
            renderRow={(s) => {
              const c = computedById[s.id];
              const status = !c || c.remaining <= 0 ? "مدفوع" : c.paid > 0 ? "جزئي" : "غير مدفوع";
              return (
                <>
                  <Td className="td-muted" dir="ltr">{s.code}</Td>
                  <Td>
                    <button type="button" className="link-cell" onClick={() => navigate(`/slaughterhouses/${s.id}`)}>
                      {s.name}
                    </button>
                  </Td>
                  <Td className="td-muted">{s.region}</Td>
                  <Td className="td-muted">{s.contact}</Td>
                  <Td className="td-muted" dir="ltr">{s.phone}</Td>
                  <Td>{fmtMoney(c?.totalSales || 0)}</Td>
                  <Td>
                    <StatusBadge status={status} />
                  </Td>
                  <Td>
                    <div className="row-actions">
                      <IconButton label="تعديل" onClick={() => setEditing(s)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton label="حذف" tone="danger" onClick={() => setDeletingSlaughterhouse(s)}>
                        <TrashIcon />
                      </IconButton>
                      <IconButton label="عرض" onClick={() => navigate(`/slaughterhouses/${s.id}`)}>
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
        <Modal title="إضافة مسلخ" onClose={() => setShowAdd(false)}>
          <SlaughterhouseForm
            initial={{ name: "", region: "", contact: "", phone: "", capacityPerDay: "", photo: null }}
            onClose={() => setShowAdd(false)}
            onSubmit={create}
          />
        </Modal>
      )}

      {editing && (
        <Modal title={`تعديل ${editing.name}`} onClose={() => setEditing(null)}>
          <SlaughterhouseForm initial={editing} onClose={() => setEditing(null)} onSubmit={handleEditSubmit} />
        </Modal>
      )}

      {deletingSlaughterhouse && (
        <ConfirmDeleteModal
          message={`سيتم حذف المسلخ "${deletingSlaughterhouse.name}" وكافة بياناته نهائياً. هذا لا يحذف فواتير البيع المرتبطة به.`}
          onConfirm={handleDeleteSlaughterhouse}
          onCancel={() => setDeletingSlaughterhouse(null)}
        />
      )}
    </div>
  );
}
