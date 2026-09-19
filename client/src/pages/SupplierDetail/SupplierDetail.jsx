import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/Card/Card";
import { Table, Td } from "../../components/DataTable/DataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import IconButton from "../../components/IconButton/IconButton";
import { EditIcon, TrashIcon, EyeIcon, FilterIcon, CalendarIcon, UsersIcon, PhoneIcon, PinIcon, ChevBackIcon, PlusIcon } from "../../components/Icons/Icons";
import SelectWrap from "../../components/SelectWrap/SelectWrap";
import SearchBar from "../../components/SearchBar/SearchBar";
import Modal from "../../components/Modal/Modal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import { printPurchaseOrder } from "../../utils/printDocument";
import { useSettings } from "../../context/SettingsContext";
import { suppliersApi, purchaseOrdersApi, accountsSummaryApi, loansApi, paymentsApi } from "../../api/resources";
import "./SupplierDetail.css";

function statusForOrder(total, paid) {
  if (paid >= total && total > 0) return "مدفوع";
  if (paid > 0) return "جزئي";
  return "غير مدفوع";
}

function DebtForm({ party, initial, onClose, onSubmit, currency }) {
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(initial?.note || "");
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
    } catch (err) {
      setError(err.payload?.conflict ? "تم تعديل هذا الدين من مكان آخر، أعد فتح الصفحة" : "تعذر حفظ الدين");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field"><label>المورد</label><input value={party.name} disabled /></div>
      <div className="modal-field"><label>مبلغ الدين ({currency})</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
      <div className="modal-field"><label>التاريخ</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
      <div className="modal-field"><label>ملاحظة</label><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="سبب الدين (اختياري)" /></div>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-outline" onClick={onClose}>إلغاء</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ الدين"}</button>
      </div>
    </form>
  );
}

function PaymentForm({ party, initial, onClose, onSubmit, currency }) {
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState(initial?.method || "نقدي");
  const [note, setNote] = useState(initial?.note || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return setError("أدخل مبلغاً صحيحاً");
    setSaving(true);
    try {
      await onSubmit({ amount: value, date, method, note: note || null });
      onClose();
    } catch (err) {
      setError(err.payload?.conflict ? "تم تعديل هذه الدفعة من مكان آخر" : "تعذر حفظ الدفعة");
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={handleSubmit}>
    <div className="modal-field"><label>المورد</label><input value={party.name} disabled /></div>
    <div className="modal-field"><label>مبلغ الدفعة ({currency})</label><div className="package-add-row"><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required /><button type="button" className="btn-outline" onClick={() => setAmount(String(initial?.loanAmount || 0))}>سداد قيمة الدين</button></div></div>
    <div className="modal-field"><label>التاريخ</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
    <div className="modal-field"><label>طريقة الدفع</label><input value={method} onChange={(e) => setMethod(e.target.value)} required /></div>
    <div className="modal-field"><label>ملاحظة</label><input value={note} onChange={(e) => setNote(e.target.value)} /></div>
    {error && <p className="modal-error">{error}</p>}
    <div className="modal-actions"><button type="button" className="btn-outline" onClick={onClose}>إلغاء</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ الدفعة"}</button></div>
  </form>;
}

function PurchaseOrderForm({ initial, isEdit, nextRef, onClose, onSubmit }) {
  const { settings } = useSettings();
  const [form, setForm] = useState(initial);
  const [cages, setCages] = useState(
    isEdit && initial.weights?.length > 0
      ? initial.weights.map(Number)
      : isEdit && initial.cages
        ? Array.from(
            { length: Number(initial.cages) },
            () => (Number(initial.weightKg) || 0) / Number(initial.cages) + (Number(initial.cageWeight) || 0),
          )
        : [],
  );
  const [cageInput, setCageInput] = useState("");
  const [cageCountInput, setCageCountInput] = useState(isEdit && initial.cages ? String(initial.cages) : "");
  const [emptyCageWeight, setEmptyCageWeight] = useState(initial.cageWeight ? String(initial.cageWeight) : "8");
  const [discount, setDiscount] = useState(initial.discount ? String(initial.discount) : "0");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function addCage() {
    const w = Number(cageInput);
    if (!w || w <= 0) return;
    setCages((prev) => [...prev, w]);
    setCageInput("");
  }

  function removeCage(index) {
    setCages((prev) => prev.filter((_, i) => i !== index));
  }

  const totalWeight = cages.reduce((sum, c) => sum + c, 0);
  const cageCount = Number(cageCountInput) || 0;
  const netWeight = Math.max(0, totalWeight - cageCount * (Number(emptyCageWeight) || 0));
  const kgPrice = Number(form.kgPrice) || 0;
  const discountAmount = Number(discount) || 0;
  const rawTotal = Math.round(netWeight * kgPrice);
  const suggestedTotal = Math.max(0, rawTotal - discountAmount);
  const total = suggestedTotal;
  const paid = Number(form.paid) || 0;
  const remaining = Math.max(0, total - paid);

  async function handleSubmit(e) {
    e.preventDefault();
    if (cages.length === 0) {
      setError("أضف وزناً واحداً على الأقل");
      return;
    }
    if (cageCount === 0) {
      setError("أدخل عدد الأقفاص");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        date: form.date,
        cages: cageCount,
        weights: cages,
        weightKg: netWeight,
        cageWeight: Number(emptyCageWeight) || 0,
        kgPrice,
        discount: discountAmount || null,
        total,
        paid,
      });
      onClose();
    } catch (err) {
      setError(err.payload?.conflict ? "تم تعديل هذا الطلب من مكان آخر، أعد المحاولة" : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>رقم المرجع</label>
        <input value={initial.code || nextRef} disabled />
      </div>
      <div className="modal-field">
        <label>التاريخ</label>
        <input type="date" value={form.date} onChange={set("date")} required disabled={isEdit} />
        {isEdit && <p className="supplier-detail-field-note">التاريخ لا يمكن تعديله</p>}
      </div>

      <div className="modal-field">
        <label>الأوزان ({settings.weightUnit})</label>
        <div className="package-add-row">
          <input
            type="number"
            value={cageInput}
            onChange={(e) => setCageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCage();
              }
            }}
            placeholder="أدخل وزناً"
          />
          <button type="button" className="btn-outline" onClick={addCage}>
            + إضافة وزن
          </button>
        </div>
        {cages.length > 0 && (
          <div className="package-list">
            {cages.map((w, i) => (
              <div key={i} className="package-list-item">
                <span>وزن {i + 1}: {w} {settings.weightUnit}</span>
                <button type="button" onClick={() => removeCage(i)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="field-row">
        <div className="modal-field">
          <label>الوزن الاجمالي ({settings.weightUnit})</label>
          <input value={totalWeight} disabled />
        </div>
        <div className="modal-field">
          <label>عدد الأقفاص</label>
          <input type="number" value={cageCountInput} onChange={(e) => setCageCountInput(e.target.value)} placeholder="أدخل العدد" required />
        </div>
      </div>

      <div className="field-row">
        <div className="modal-field">
          <label>سعر الكيلو ({settings.currency})</label>
          <input type="number" step="0.01" value={form.kgPrice} onChange={set("kgPrice")} required />
        </div>
        <div className="modal-field">
          <label>وزن القفص الفارغ ({settings.weightUnit})</label>
          <input type="number" step="0.1" value={emptyCageWeight} onChange={(e) => setEmptyCageWeight(e.target.value)} required />
        </div>
      </div>

      <div className="field-row">
        <div className="modal-field">
          <label>الوزن الصافي ({settings.weightUnit})</label>
          <input value={netWeight} disabled />
        </div>
        <div className="modal-field">
          <label>الخصم ({settings.currency})</label>
          <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </div>
      </div>

      <div className="field-row">
        <div className="modal-field">
          <label>المبلغ الاجمالي ({settings.currency})</label>
          <input type="number" value={total} readOnly />
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
        <button type="submit" className="btn-primary" disabled={saving || cageCount === 0 || !kgPrice}>
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>
    </form>
  );
}

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, fmtMoney, fmtWeight } = useSettings();
  const [supplier, setSupplier] = useState(null);
  const [orders, setOrders] = useState([]);
  const [computed, setComputed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [dateFilter, setDateFilter] = useState("الكل");
  const [refQuery, setRefQuery] = useState("");
  const [activeTab, setActiveTab] = useState("invoices");
  const [loans, setLoans] = useState([]);
  const [editingLoan, setEditingLoan] = useState(null);
  const [deletingLoan, setDeletingLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loanHistory, setLoanHistory] = useState([]);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);

  function reload() {
    setLoading(true);
    Promise.all([suppliersApi.getOne(id), purchaseOrdersApi.list(), accountsSummaryApi.get(), loansApi.list(), paymentsApi.list(), loansApi.history("supplier", id)])
      .then(([s, allOrders, summary, allLoans, allPayments, allHistory]) => {
        setSupplier(s);
        setOrders(allOrders.filter((o) => o.supplierId === id));
        setComputed(summary.suppliers.find((x) => x.id === id) || null);
        setLoans(allLoans.filter((loan) => loan.partyType === "supplier" && loan.partyId === id));
        setPayments(allPayments.filter((payment) => payment.partyType === "supplier" && payment.partyId === id));
        setLoanHistory(allHistory);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [id]);

  const totalPurchases = computed?.totalPurchases ?? 0;
  const totalRemaining = computed?.remaining ?? 0;

  const filteredOrders = [...orders]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .filter((o) => {
      if (statusFilter !== "الكل" && statusForOrder(o.total, o.paid || 0) !== statusFilter) return false;
      if (refQuery && !o.code?.toLowerCase().includes(refQuery.toLowerCase())) return false;
      if (dateFilter !== "الكل") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - Number(dateFilter));
        if (new Date(o.date) < cutoff) return false;
      }
      return true;
    });

  async function handleCreateOrder(body) {
    await purchaseOrdersApi.create({ ...body, supplierId: id, supplierName: supplier.name });
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

  async function handleCreateLoan(body) {
    await loansApi.create({ ...body, partyType: "supplier", partyId: supplier.id, partyName: supplier.name });
    reload();
  }

  async function handleUpdateLoan(body) {
    await loansApi.update(editingLoan.id, { ...body, _expectedVersion: editingLoan._version });
    setEditingLoan(null);
    reload();
  }

  async function handleDeleteLoan() {
    await loansApi.remove(deletingLoan.id);
    setDeletingLoan(null);
    reload();
  }

  async function handleCreatePayment(body) {
    await paymentsApi.create({ ...body, partyType: "supplier", partyId: supplier.id, partyName: supplier.name, ...(editingPayment?.loanId ? { loanId: editingPayment.loanId } : {}) });
    reload();
  }

  async function handleUpdatePayment(body) {
    await paymentsApi.update(editingPayment.id, { ...body, _expectedVersion: editingPayment._version });
    setEditingPayment(null);
    reload();
  }

  async function handleDeletePayment() {
    await paymentsApi.remove(deletingPayment.id);
    setDeletingPayment(null);
    reload();
  }

  if (loading) return <p className="state-message">جارٍ التحميل...</p>;
  if (error) return <p className="state-message state-message-error">{error}</p>;
  if (!supplier) return <p className="state-message">المورد غير موجود</p>;

  return (
    <div>
      <button type="button" className="back-link" onClick={() => navigate("/suppliers")}>
        <ChevBackIcon /> العودة الى الموردين
      </button>

      <div className="profile-card">
        <div className="profile-id">
          {supplier.photo ? (
            <img className="profile-photo" src={supplier.photo} alt="" />
          ) : (
            <div className="profile-photo profile-photo-placeholder" />
          )}
          <div>
            <div className="profile-name">{supplier.name}</div>
            <div className="profile-meta">
              <span>
                <UsersIcon /> <span>{supplier.contact}</span>
              </span>
              <span>
                <PhoneIcon /> <span dir="ltr">{supplier.phone}</span>
              </span>
              <span>
                <PinIcon /> <span>{supplier.region}</span>
              </span>
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <PlusIcon /> إضافة عملية شراء
        </button>
      </div>

      <div className="section-heading">
        <h2>سجلات المشتريات اليومية</h2>
        <p>تتبع جميع عمليات شراء الدواجن</p>
      </div>

      <div className="page-head-actions invoice-toggle-actions">
        <button className={activeTab === "invoices" ? "btn-primary" : "btn-outline"} onClick={() => setActiveTab("invoices")}>سجلات الفواتير</button>
        <button className={activeTab === "loans" ? "btn-primary" : "btn-outline"} onClick={() => setActiveTab("loans")}>سجلات الديون</button>
      </div>

      {activeTab === "invoices" && <Card>
        <div className="card-head">
          <div className="filters">
            <SelectWrap icon={<FilterIcon />} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="الكل">جميع حالات الدفع</option>
              <option value="مدفوع">مدفوع</option>
              <option value="جزئي">مدفوع جزئي</option>
              <option value="غير مدفوع">غير مدفوع</option>
            </SelectWrap>
            <SelectWrap icon={<CalendarIcon />} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="الكل">كل التواريخ</option>
              <option value="7">آخر 7 أيام</option>
              <option value="30">آخر 30 يوم</option>
            </SelectWrap>
          </div>
          <SearchBar placeholder="بحث برقم المرجع" value={refQuery} onChange={setRefQuery} />
        </div>
        {orders.length === 0 && <p className="state-message">لا توجد طلبيات مسجلة لهذا المورد</p>}
        {orders.length > 0 && filteredOrders.length === 0 && <p className="state-message">لا توجد نتائج مطابقة للفلاتر المحددة</p>}
        {filteredOrders.length > 0 && (
          <Table
            columns={["التاريخ", "رقم المرجع", "الوزن الصافي", "سعر الكيلو", "المبلغ الإجمالي", "المبلغ المتبقي", "الحالة", "الإجراءات"]}
            rows={filteredOrders}
            renderRow={(o) => {
              const remaining = Math.max(0, (o.total || 0) - (o.paid || 0));
              return (
                <>
                  <Td className="td-muted" dir="ltr">{o.date}</Td>
                  <Td className="td-brand" dir="ltr">{o.code}</Td>
                  <Td dir="ltr">{fmtWeight(o.weightKg)}</Td>
                  <Td className="td-muted" dir="ltr">{Number(o.kgPrice).toLocaleString("ar-SA")} {settings.currency}</Td>
                  <Td className="td-strong">{fmtMoney(o.total)}</Td>
                  <Td className={remaining > 0 ? "td-negative" : "td-faint"}>{remaining > 0 ? fmtMoney(remaining) : "—"}</Td>
                  <Td>
                    <StatusBadge status={statusForOrder(o.total, o.paid || 0)} />
                  </Td>
                  <Td>
                    <div className="row-actions">
                      <IconButton label="تعديل" onClick={() => setEditingOrder(o)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton label="حذف" tone="danger" onClick={() => setDeletingOrder(o)}>
                        <TrashIcon />
                      </IconButton>
                      <IconButton label="عرض الفاتورة" onClick={() => setViewingOrder(o)}>
                        <EyeIcon />
                      </IconButton>
                    </div>
                  </Td>
                </>
              );
            }}
          />
        )}
      </Card>}

      {activeTab === "loans" && (
        <Card>
          <div className="card-head">
            <div><div className="card-title">سجلات الديون</div><div className="card-sub">إدارة الديون المسجلة على المورد</div></div>
            <div className="page-head-actions"><button className="btn-outline" onClick={() => setEditingLoan({ isNew: true })}>إضافة دين</button><button className="btn-primary" onClick={() => setEditingPayment({ isNew: true })}>تسجيل دفعة</button></div>
          </div>
          {loans.length === 0 && <p className="state-message">لا توجد ديون مسجلة لهذا المورد</p>}
          {loans.length > 0 && <Table columns={["التاريخ", "المبلغ", "الملاحظة", "الإجراءات"]} rows={[...loans].sort((a, b) => b.date.localeCompare(a.date))} renderRow={(loan) => (
            <>
              <Td className="td-muted" dir="ltr">{loan.date}</Td>
              <Td className="td-strong">{fmtMoney(loan.amount)}</Td>
              <Td>{loan.note || "—"}</Td>
              <Td><div className="row-actions"><button type="button" className="btn-outline" onClick={() => setEditingPayment({ isNew: true, loanId: loan.id, loanAmount: Math.max(0, loan.amount - payments.filter((payment) => payment.loanId === loan.id).reduce((sum, payment) => sum + payment.amount, 0)) })}>تسديد</button><IconButton label="تعديل" onClick={() => setEditingLoan(loan)}><EditIcon /></IconButton><IconButton label="حذف" tone="danger" onClick={() => setDeletingLoan(loan)}><TrashIcon /></IconButton></div></Td>
            </>
          )} />}
          <p className="ledger-movements-title">سجل الدفعات والتعديلات</p>
          <Table columns={["التاريخ", "العملية", "المبلغ", "التفاصيل", "الإجراءات"]} rows={[
            ...payments.map((payment) => ({ ...payment, kind: "payment" })),
            ...loanHistory.map((log) => ({ ...log, kind: "loan-change", date: log.timestamp?.slice(0, 10) })),
          ].sort((a, b) => (b.createdAt || b.timestamp || b.date || "").localeCompare(a.createdAt || a.timestamp || a.date || ""))} renderRow={(entry) => {
            if (entry.kind === "payment") return <><Td dir="ltr">{entry.date}</Td><Td>{entry.amount >= loans.reduce((sum, loan) => sum + loan.amount, 0) ? "دفعة كاملة" : "دفعة جزئية"}</Td><Td>{fmtMoney(entry.amount)}</Td><Td>{entry.method || entry.note || "—"}</Td><Td><div className="row-actions"><IconButton label="تعديل" onClick={() => setEditingPayment(entry)}><EditIcon /></IconButton><IconButton label="حذف" tone="danger" onClick={() => setDeletingPayment(entry)}><TrashIcon /></IconButton></div></Td></>;
            const oldAmount = entry.oldValue?.amount;
            const newAmount = entry.newValue?.amount;
            return <><Td dir="ltr">{entry.date}</Td><Td>تعديل دين</Td><Td>{fmtMoney(newAmount ?? oldAmount ?? 0)}</Td><Td>{oldAmount !== undefined ? `من ${oldAmount} إلى ${newAmount}` : entry.action === "delete" ? "حذف الدين" : "إضافة الدين"}</Td><Td>—</Td></>;
          }} />
        </Card>
      )}

      {showAdd && (
        <Modal title="إضافة عملية شراء" onClose={() => setShowAdd(false)}>
          <PurchaseOrderForm
            initial={{ date: new Date().toISOString().slice(0, 10), cages: "", weightKg: "", kgPrice: "", total: "", paid: "" }}
            isEdit={false}
            nextRef={`S2026${String(orders.length + 1).padStart(3, "0")}`}
            onClose={() => setShowAdd(false)}
            onSubmit={handleCreateOrder}
          />
        </Modal>
      )}

      {editingOrder && (
        <Modal title={`تعديل ${editingOrder.code}`} onClose={() => setEditingOrder(null)}>
          <PurchaseOrderForm
            initial={{
              code: editingOrder.code,
              date: editingOrder.date,
              cages: String(editingOrder.cages),
              weights: editingOrder.weights || [],
              weightKg: String(editingOrder.weightKg),
              cageWeight: String(editingOrder.cageWeight ?? 8),
              kgPrice: String(editingOrder.kgPrice),
              discount: String(editingOrder.discount || 0),
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
          message={`سيتم حذف الطلب ${deletingOrder.code} بقيمة ${fmtMoney(deletingOrder.total)} نهائياً من ${supplier.name}.`}
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
            <p className="purchase-voucher-supplier-name">{supplier.name}</p>
            <p className="purchase-voucher-supplier-meta">{supplier.phone} — {supplier.region}</p>
            <div className="detail-list purchase-voucher-list">
              <div className="detail-row">
                <span>عدد الأقفاص</span>
                <span>{viewingOrder.cages} قفص</span>
              </div>
              <div className="detail-row">
                <span>الوزن الإجمالي</span>
                <span>{fmtWeight((viewingOrder.weightKg || 0) + (viewingOrder.cages || 0) * (viewingOrder.cageWeight ?? 8))}</span>
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
              <button
                type="button"
                className="btn-primary"
                onClick={() => printPurchaseOrder({ settings, supplier, order: viewingOrder })}
              >
                🖨️ طباعة
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => printPurchaseOrder({ settings, supplier, order: viewingOrder })}
              >
                ⬇️ تحميل
              </button>
              <button type="button" className="btn-outline" onClick={() => setViewingOrder(null)}>
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editingLoan && <Modal title={editingLoan.isNew ? "إضافة دين" : "تعديل الدين"} subtitle={supplier.name} onClose={() => setEditingLoan(null)}>
        <DebtForm party={supplier} initial={editingLoan.isNew ? null : editingLoan} currency={settings.currency} onClose={() => setEditingLoan(null)} onSubmit={editingLoan.isNew ? handleCreateLoan : handleUpdateLoan} />
      </Modal>}
      {deletingLoan && <ConfirmDeleteModal message={`سيتم حذف الدين بقيمة ${fmtMoney(deletingLoan.amount)} نهائياً.`} onConfirm={handleDeleteLoan} onCancel={() => setDeletingLoan(null)} />}
      {editingPayment && <Modal title={editingPayment.loanId ? "تسديد الدين" : editingPayment.isNew ? "تسجيل دفعة" : "تعديل الدفعة"} subtitle={supplier.name} onClose={() => setEditingPayment(null)}><PaymentForm party={supplier} initial={editingPayment} currency={settings.currency} onClose={() => setEditingPayment(null)} onSubmit={editingPayment.isNew ? handleCreatePayment : handleUpdatePayment} /></Modal>}
      {deletingPayment && <ConfirmDeleteModal message={`سيتم حذف الدفعة بقيمة ${fmtMoney(deletingPayment.amount)} نهائياً.`} onConfirm={handleDeletePayment} onCancel={() => setDeletingPayment(null)} />}
    </div>
  );
}
