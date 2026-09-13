import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import StatCard from "../../components/StatCard/StatCard";
import { Table, Td } from "../../components/DataTable/DataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import IconButton from "../../components/IconButton/IconButton";
import { EyeIcon, TrashIcon, PlusIcon } from "../../components/Icons/Icons";
import SearchBar from "../../components/SearchBar/SearchBar";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import { printVoucher } from "../../utils/printDocument";
import { useSettings } from "../../context/SettingsContext";
import { useCollection } from "../../api/useCollection";
import { salesInvoicesApi, slaughterhousesApi, dailyPricingApi } from "../../api/resources";
import "./SalesInvoices.css";

function latestKgPrice(prices) {
  const sorted = [...prices].sort((a, b) => (a.date < b.date ? 1 : -1));
  return sorted[0]?.sellPrice || sorted[0]?.kgPrice || 0;
}

function statusForInvoice(total, paid) {
  if (paid >= total && total > 0) return "مدفوع";
  if (paid > 0) return "جزئي";
  return "غير مدفوع";
}

function AddInvoiceView({ slaughterhouses, kgPrice, settings, fmtMoney, onCreate, onCreated, onBackToList }) {
  const [slaughterhouse, setSlaughterhouse] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cages, setCages] = useState([]);
  const [cageInput, setCageInput] = useState("");
  const [emptyCageWeight, setEmptyCageWeight] = useState("8");
  const [priceInput, setPriceInput] = useState(kgPrice ? kgPrice.toFixed(2) : "5");
  const [discount, setDiscount] = useState("0");
  const [payStatus, setPayStatus] = useState("مدفوع");
  const [partialPaid, setPartialPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const totalWeight = cages.reduce((sum, c) => sum + c, 0);
  const cageCount = cages.length;
  const netWeight = Math.max(0, totalWeight - cageCount * (Number(emptyCageWeight) || 0));
  const discountPercent = Number(discount) || 0;
  const rawTotal = Math.round(netWeight * (Number(priceInput) || 0));
  const total = discountPercent ? Math.round(rawTotal * (1 - discountPercent / 100)) : rawTotal;

  let paid = 0;
  if (payStatus === "مدفوع") paid = total;
  else if (payStatus === "جزئي") paid = Number(partialPaid) || 0;

  function addCage() {
    const w = Number(cageInput);
    if (!w || w <= 0) return;
    setCages((prev) => [...prev, w]);
    setCageInput("");
  }

  function removeCage(index) {
    setCages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (cageCount === 0) {
      setError("أضف قفص واحد على الأقل");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onCreate({
        slaughterhouse,
        date,
        weightKg: netWeight,
        cages: cageCount,
        cageWeight: Number(emptyCageWeight) || 0,
        kgPrice: Number(priceInput) || 0,
        discount: discountPercent ? `${discountPercent}%` : null,
        total,
        paid,
        notes: notes || null,
      });
      onCreated();
    } catch {
      setError("تعذر إنشاء الفاتورة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="section-heading">
        <h2>بيانات الفاتورة</h2>
      </div>
      <div className="page-head-actions invoice-toggle-actions">
        <button className="btn-outline" onClick={onBackToList}>
          سجل الفواتير
        </button>
        <button className="btn-primary">
          <PlusIcon /> فاتورة بيع جديدة
        </button>
      </div>

      <div className="invoice-create-layout">
        <Card className="invoice-form-panel">
          <form onSubmit={handleSubmit}>
            <div className="modal-field">
              <label>التاريخ</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="modal-field">
              <label>اختيار مسلخ</label>
              <select value={slaughterhouse} onChange={(e) => setSlaughterhouse(e.target.value)} required>
                <option value="">— اختر —</option>
                {slaughterhouses.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label>الأقفاص (كغ)</label>
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
                  placeholder="وزن القفص"
                />
                <button type="button" className="btn-outline" onClick={addCage}>
                  + إضافة قفص
                </button>
              </div>
              {cages.length > 0 && (
                <div className="package-list">
                  {cages.map((w, i) => (
                    <div key={i} className="package-list-item">
                      <span>قفص {i + 1}: {w} {settings.weightUnit}</span>
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
                <input value={cageCount} disabled />
              </div>
            </div>

            <div className="field-row">
              <div className="modal-field">
                <label>سعر الكيلو ({settings.currency})</label>
                <input type="number" step="0.01" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} required />
              </div>
              <div className="modal-field">
                <label>وزن القفص الفارغ ({settings.weightUnit})</label>
                <input type="number" step="0.1" value={emptyCageWeight} onChange={(e) => setEmptyCageWeight(e.target.value)} required />
              </div>
            </div>

            <div className="modal-field">
              <label>الخصم (%)</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>

            <div className="modal-field">
              <label>الوزن الصافي ({settings.weightUnit})</label>
              <input value={netWeight} disabled />
            </div>

            <div className="modal-field">
              <label>حالة الدفع</label>
              <div className="pay-status-toggle">
                <button
                  type="button"
                  className={payStatus === "غير مدفوع" ? "active-unpaid" : ""}
                  onClick={() => setPayStatus("غير مدفوع")}
                >
                  غير مدفوع
                </button>
                <button
                  type="button"
                  className={payStatus === "جزئي" ? "active-partial" : ""}
                  onClick={() => setPayStatus("جزئي")}
                >
                  جزئي
                </button>
                <button
                  type="button"
                  className={payStatus === "مدفوع" ? "active-paid" : ""}
                  onClick={() => setPayStatus("مدفوع")}
                >
                  مدفوع
                </button>
              </div>
            </div>

            {payStatus === "جزئي" && (
              <div className="modal-field">
                <label>المبلغ المدفوع ({settings.currency})</label>
                <input type="number" value={partialPaid} onChange={(e) => setPartialPaid(e.target.value)} required />
              </div>
            )}

            <div className="modal-field">
              <label>ملاحظات</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions">
              <button type="submit" className="btn-primary" disabled={saving || !slaughterhouse || cageCount === 0}>
                {saving ? "جارٍ الحفظ..." : "حفظ"}
              </button>
              <button type="button" className="btn-outline" onClick={onBackToList}>
                إلغاء
              </button>
            </div>
          </form>
        </Card>

        <Card className="invoice-summary-panel">
          <div className="invoice-preview-head">
            <span>SL-NEW</span>
            <div className="invoice-preview-brand">
              <b>{slaughterhouse || "—"}</b>
            </div>
          </div>
          <div className="invoice-rows">
            <div className="detail-row">
              <span>المسلخ</span>
              <span>{slaughterhouse || "—"}</span>
            </div>
            <div className="detail-row">
              <span>الوزن الاجمالي</span>
              <span>{totalWeight} {settings.weightUnit}</span>
            </div>
            <div className="detail-row">
              <span>عدد الأقفاص</span>
              <span>{cageCount}</span>
            </div>
            <div className="detail-row">
              <span>الوزن الصافي</span>
              <span>{netWeight} {settings.weightUnit}</span>
            </div>
            <div className="detail-row">
              <span>سعر الكيلو</span>
              <span>{Number(priceInput || 0).toFixed(2)}{settings.currency}</span>
            </div>
            <div className="detail-row">
              <span>الخصومات</span>
              <span>{discountPercent ? `${discountPercent}%` : "—"}</span>
            </div>
            <div className="detail-row">
              <span>حالة الدفع</span>
              <span>
                <StatusBadge status={payStatus} />
              </span>
            </div>
          </div>
          <div className="invoice-summary-total">
            <span>المبلغ الاجمالي</span>
            <span>{fmtMoney(total)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ViewInvoiceView({ invoice, settings, fmtMoney, fmtWeight, onBack, onDelete }) {
  return (
    <div>
      <div className="section-heading">
        <h2>عرض الفاتورة</h2>
      </div>
      <Card className="invoice-view-card">
        <div className="invoice-preview-head">
          <div>
            <span className="invoice-preview-ref">{invoice.invoiceNumber}</span>
            <span className="invoice-preview-date">{invoice.date}</span>
          </div>
          <div className="invoice-preview-brand">
            <b>{invoice.slaughterhouse}</b>
          </div>
        </div>
        <div className="invoice-rows">
          <div className="detail-row">
            <span>المسلخ</span>
            <span>{invoice.slaughterhouse}</span>
          </div>
          <div className="detail-row">
            <span>الوزن الاجمالي</span>
            <span>{fmtWeight((invoice.weightKg || 0) + (invoice.cages || 0) * (invoice.cageWeight ?? 8))}</span>
          </div>
          <div className="detail-row">
            <span>عدد الأقفاص</span>
            <span>{invoice.cages}</span>
          </div>
          <div className="detail-row">
            <span>الوزن الصافي</span>
            <span>{fmtWeight(invoice.weightKg)}</span>
          </div>
          <div className="detail-row">
            <span>سعر الكيلو</span>
            <span>{Number(invoice.kgPrice).toFixed(2)}{settings.currency}</span>
          </div>
          <div className="detail-row">
            <span>الخصومات</span>
            <span>{invoice.discount || "—"}</span>
          </div>
          <div className="detail-row">
            <span>حالة الدفع</span>
            <span>
              <StatusBadge status={statusForInvoice(invoice.total, invoice.paid || 0)} />
            </span>
          </div>
        </div>
        <div className="invoice-summary-total">
          <span>المبلغ الاجمالي</span>
          <span>{fmtMoney(invoice.total)}</span>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={() => printVoucher({ settings, invoice })}>
            🖨️ طباعة
          </button>
          <button className="btn-outline" onClick={onBack}>
            إغلاق
          </button>
          <button className="btn-outline invoice-delete-link" onClick={() => onDelete(invoice)}>
            حذف الفاتورة
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function SalesInvoices() {
  const location = useLocation();
  const { items: invoices, loading, error, create, remove } = useCollection(salesInvoicesApi);
  const { items: slaughterhouses } = useCollection(slaughterhousesApi);
  const { items: prices } = useCollection(dailyPricingApi);
  const { settings, fmtMoney, fmtWeight } = useSettings();
  const [tab, setTab] = useState("سجل الفواتير");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [invoiceQuery, setInvoiceQuery] = useState("");

  useEffect(() => {
    if (location.state?.viewInvoiceId) {
      setSelectedInvoiceId(location.state.viewInvoiceId);
      setTab("عرض الفاتورة");
    }
  }, [location.state]);

  const kgPrice = latestKgPrice(prices);
  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId) || null;
  const filteredInvoiceList = invoices.filter(
    (i) => !invoiceQuery || i.invoiceNumber?.toLowerCase().includes(invoiceQuery.toLowerCase()) || i.slaughterhouse?.includes(invoiceQuery),
  );

  async function handleDeleteInvoice() {
    await remove(deletingInvoice.id);
    setDeletingInvoice(null);
    setSelectedInvoiceId(null);
    setTab("سجل الفواتير");
  }

  return (
    <div>
      <PageHeader title="فواتير البيع" subtitle={`${invoices.length} فواتير مسجلة`} />

      {loading && <p className="state-message">جارٍ التحميل...</p>}
      {error && <p className="state-message state-message-error">{error}</p>}

      {tab === "سجل الفواتير" && !loading && !error && (
        <>
          <div className="page-head-actions invoice-toggle-actions">
            <button className="btn-primary" onClick={() => setTab("فاتورة بيع جديدة")}>
              <PlusIcon /> فاتورة بيع جديدة
            </button>
            <span className="btn-outline invoice-toggle-current">سجل الفواتير</span>
          </div>
          <Card>
            <div className="card-head">
              <div className="card-title">فواتير</div>
              <SearchBar placeholder="بحث باسم المسلخ" value={invoiceQuery} onChange={setInvoiceQuery} />
            </div>
            <Table
              columns={["رقم الفاتورة", "اسم المسلخ", "التاريخ", "الوزن", "الخصم", "الاجمالي", "الحالة", "الإجراءات"]}
              rows={filteredInvoiceList}
              renderRow={(inv) => (
                <>
                  <Td className="td-brand" dir="ltr">{inv.invoiceNumber}</Td>
                  <Td>{inv.slaughterhouse}</Td>
                  <Td className="td-muted" dir="ltr">{inv.date}</Td>
                  <Td dir="ltr">{fmtWeight(inv.weightKg)}</Td>
                  <Td>{inv.discount || "—"}</Td>
                  <Td className="td-strong">{fmtMoney(inv.total)}</Td>
                  <Td>
                    <StatusBadge status={statusForInvoice(inv.total, inv.paid || 0)} />
                  </Td>
                  <Td>
                    <div className="row-actions">
                      <IconButton label="حذف" tone="danger" onClick={() => setDeletingInvoice(inv)}>
                        <TrashIcon />
                      </IconButton>
                      <IconButton
                        label="عرض"
                        onClick={() => {
                          setSelectedInvoiceId(inv.id);
                          setTab("عرض الفاتورة");
                        }}
                      >
                        <EyeIcon />
                      </IconButton>
                    </div>
                  </Td>
                </>
              )}
            />
          </Card>
        </>
      )}

      {tab === "فاتورة بيع جديدة" && !loading && (
        <AddInvoiceView
          slaughterhouses={slaughterhouses}
          kgPrice={kgPrice}
          settings={settings}
          fmtMoney={fmtMoney}
          onCreate={create}
          onCreated={() => setTab("سجل الفواتير")}
          onBackToList={() => setTab("سجل الفواتير")}
        />
      )}

      {tab === "عرض الفاتورة" && selectedInvoice && (
        <ViewInvoiceView
          invoice={selectedInvoice}
          settings={settings}
          fmtMoney={fmtMoney}
          fmtWeight={fmtWeight}
          onBack={() => {
            setSelectedInvoiceId(null);
            setTab("سجل الفواتير");
          }}
          onDelete={setDeletingInvoice}
        />
      )}

      {deletingInvoice && (
        <ConfirmDeleteModal
          message={`سيتم حذف الفاتورة ${deletingInvoice.invoiceNumber} بقيمة ${fmtMoney(deletingInvoice.total)} نهائياً.`}
          onConfirm={handleDeleteInvoice}
          onCancel={() => setDeletingInvoice(null)}
        />
      )}
    </div>
  );
}
