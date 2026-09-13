import { useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import StatCard from "../../components/StatCard/StatCard";
import { Table, Td } from "../../components/DataTable/DataTable";
import SearchBar from "../../components/SearchBar/SearchBar";
import IconButton from "../../components/IconButton/IconButton";
import { PlusIcon, TrashIcon } from "../../components/Icons/Icons";
import Modal from "../../components/Modal/Modal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import { printReport } from "../../utils/printDocument";
import { useSettings } from "../../context/SettingsContext";
import { useCollection } from "../../api/useCollection";
import { expensesApi } from "../../api/resources";
import { useAuth } from "../../context/AuthContext";
import { useDropdownList } from "../../api/useDropdownList";
import "./Expenses.css";

const FALLBACK_CATEGORIES = ["وقود", "صيانة مركبات", "رواتب", "إيجار", "كهرباء وماء", "أخرى"];

function AddExpenseForm({ currentUser, onClose, onCreate }) {
  const { settings } = useSettings();
  const { values: categoryOptions } = useDropdownList("فئات المصاريف");
  const categories = categoryOptions.length > 0 ? categoryOptions : FALLBACK_CATEGORIES;
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "",
    description: "",
    amount: "",
    createdBy: currentUser,
  });
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
      await onCreate({ ...form, amount: Number(form.amount) });
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
        <label>الفئة</label>
        <select value={form.category} onChange={set("category")} required>
          <option value="">— اختر —</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-field">
        <label>الوصف</label>
        <input value={form.description} onChange={set("description")} placeholder="تفاصيل المصروف" required />
      </div>
      <div className="modal-field">
        <label>التاريخ</label>
        <input type="date" value={form.date} onChange={set("date")} required />
      </div>
      <div className="modal-field">
        <label>المبلغ ({settings.currency})</label>
        <input type="number" value={form.amount} onChange={set("amount")} required />
      </div>
      <div className="modal-field">
        <label>بواسطة</label>
        <input value={form.createdBy} onChange={set("createdBy")} placeholder="اسم الموظف" required />
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

export default function Expenses() {
  const { items: expenses, loading, error, create, remove } = useCollection(expensesApi);
  const { user } = useAuth();
  const { settings, fmtMoney } = useSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [query, setQuery] = useState("");
  const filteredExpenses = expenses.filter(
    (e) => !query || e.description?.includes(query) || e.category?.includes(query),
  );
  const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTotal = expenses.filter((e) => e.date?.startsWith(thisMonth)).reduce((sum, e) => sum + (e.amount || 0), 0);
  const categoryTotals = {};
  expenses.forEach((e) => {
    if (e.category) categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (e.amount || 0);
  });
  const topCategory = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a])[0] || "—";

  async function handleDeleteExpense() {
    await remove(deletingExpense.id);
    setDeletingExpense(null);
  }

  function handleExport() {
    printReport({
      settings,
      title: "تقرير المصاريف",
      subtitle: `${expenses.length} مصروف`,
      summaryLines: [["الإجمالي", fmtMoney(total)]],
      columns: ["التاريخ", "الفئة", "الوصف", "المبلغ", "بواسطة"],
      rows: expenses.map((e) => [e.date, e.category || "—", e.description, fmtMoney(e.amount), e.createdBy || "—"]),
    });
  }

  return (
    <div>
      <PageHeader
        title="المصاريف"
        actions={
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <PlusIcon /> إضافة مصروف
          </button>
        }
      />

      <div className="page-grid page-grid-3 suppliers-stats">
        <StatCard label="مصاريف الشهر" value={fmtMoney(monthTotal)} />
        <StatCard label="عدد العمليات" value={expenses.length} />
        <StatCard label="أعلى فئة صرف" value={topCategory} />
      </div>

      {loading && <p className="state-message">جارٍ التحميل...</p>}
      {error && <p className="state-message state-message-error">{error}</p>}

      {!loading && !error && (
        <Card>
          <div className="card-head">
            <div>
              <div className="card-title">سجل المصاريف</div>
              <div className="card-sub">مصاريف التشغيل والوقود والصيانة وغيرها</div>
            </div>
            <SearchBar placeholder="بحث بالوصف أو الفئة" value={query} onChange={setQuery} />
          </div>
          <Table
            columns={["التاريخ", "الفئة", "الوصف", "المبلغ", "بواسطة", "الإجراءات"]}
            rows={filteredExpenses}
            renderRow={(e) => (
              <>
                <Td className="td-muted" dir="ltr">{e.date}</Td>
                <Td>{e.category || "—"}</Td>
                <Td>{e.description}</Td>
                <Td className="td-negative">{fmtMoney(e.amount)}</Td>
                <Td className="td-muted">{e.createdBy || "—"}</Td>
                <Td>
                  <IconButton label="حذف" tone="danger" onClick={() => setDeletingExpense(e)}>
                    <TrashIcon />
                  </IconButton>
                </Td>
              </>
            )}
            footer={
              <tr>
                <td colSpan={3}>المبلغ الاجمالي</td>
                <td className="td-negative">{fmtMoney(total)}</td>
                <td colSpan={2}></td>
              </tr>
            }
          />
        </Card>
      )}

      {showAdd && (
        <Modal title="اضافة مصروف جديد" onClose={() => setShowAdd(false)}>
          <AddExpenseForm currentUser={user?.username || ""} onClose={() => setShowAdd(false)} onCreate={create} />
        </Modal>
      )}

      {deletingExpense && (
        <ConfirmDeleteModal
          message={`سيتم حذف المصروف "${deletingExpense.description}" بقيمة ${fmtMoney(deletingExpense.amount)} نهائياً.`}
          onConfirm={handleDeleteExpense}
          onCancel={() => setDeletingExpense(null)}
        />
      )}
    </div>
  );
}
