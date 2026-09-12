import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import StatCard from "../../components/StatCard/StatCard";
import { Table, Td } from "../../components/DataTable/DataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import ActionLink from "../../components/ActionLink/ActionLink";
import IconButton from "../../components/IconButton/IconButton";
import { EyeIcon, TrashIcon, PlusIcon } from "../../components/Icons/Icons";
import SearchBar from "../../components/SearchBar/SearchBar";
import Modal from "../../components/Modal/Modal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import { printVoucher } from "../../utils/printDocument";
import { useSettings } from "../../context/SettingsContext";
import { useCollection } from "../../api/useCollection";
import { salesInvoicesApi, dailyPricingApi } from "../../api/resources";

function latestKgPrice(prices) {
  const sorted = [...prices].sort((a, b) => (a.date < b.date ? 1 : -1));
  return sorted[0]?.sellPrice || sorted[0]?.kgPrice || 0;
}

function statusForInvoice(total, paid) {
  if (paid >= total && total > 0) return "مدفوع";
  if (paid > 0) return "جزئي";
  return "غير مدفوع";
}

function AddInvoiceForm({ nextRef, kgPrice, settings, onClose, onCreate }) {
  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [packages, setPackages] = useState([]);
  const [packageInput, setPackageInput] = useState("");
  const [priceInput, setPriceInput] = useState(kgPrice ? kgPrice.toFixed(2) : "3");
  const [paid, setPaid] = useState("0");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const totalWeight = packages.reduce((sum, p) => sum + p, 0);
  const packageCount = packages.length;
  const netWeight = Math.max(0, totalWeight - packageCount * 8);
  const total = Math.round(netWeight * (Number(priceInput) || 0));

  function addPackage() {
    const w = Number(packageInput);
    if (!w || w <= 0) return;
    setPackages((prev) => [...prev, w]);
    setPackageInput("");
  }

  function removePackage(index) {
    setPackages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (packageCount === 0) {
      setError("أضف عبوة واحدة على الأقل");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onCreate({
        slaughterhouse: customer,
        date,
        weightKg: netWeight,
        cages: packageCount,
        kgPrice: Number(priceInput) || 0,
        total,
        paid: Number(paid) || 0,
      });
      onClose();
    } catch {
      setError("تعذر إنشاء الفاتورة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>رقم الفاتورة</label>
        <input value={nextRef} disabled />
      </div>
      <div className="modal-field">
        <label>اسم العميل / المحل</label>
        <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="سوبرماركت الأمل" required />
      </div>
      <div className="modal-field">
        <label>التاريخ</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="modal-field">
        <label>وزن الاجمالي (كغ)</label>
        <div className="package-add-row">
          <input
            type="number"
            value={packageInput}
            onChange={(e) => setPackageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPackage();
              }
            }}
            placeholder="الوزن الاجمالي (كغ)"
          />
          <button type="button" className="btn-outline" onClick={addPackage}>
            + إضافة 
          </button>
        </div>
        {packages.length > 0 && (
          <div className="package-list">
            {packages.map((w, i) => (
              <div key={i} className="package-list-item">
                <span>قفص {i + 1}: {w} {settings.weightUnit}</span>
                <button type="button" onClick={() => removePackage(i)}>×</button>
              </div>
            ))}
          </div>
        )}
        <p className="section-hint">
          الوزن الإجمالي: {packageCount} — الوزن الإجمالي: {totalWeight} {settings.weightUnit} — الوزن الصافي (بعد خصم {packageCount}×8): {netWeight} {settings.weightUnit}
        </p>
      </div>

      <div className="modal-field">
        <label>سعر الكيلو ({settings.currency})</label>
        <input type="number" step="0.1" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} required />
      </div>
      <div className="field-row">
        <div className="modal-field">
          <label>المبلغ الإجمالي ({settings.currency})</label>
          <input value={total} disabled />
        </div>
        <div className="modal-field">
          <label>المبلغ المدفوع ({settings.currency})</label>
          <input type="number" step="50" value={paid} onChange={(e) => setPaid(e.target.value)} required />
        </div>
      </div>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="submit" className="btn-primary" disabled={saving || !customer || packageCount === 0}>
          {saving ? "جارٍ الحفظ..." : "حفظ الفاتورة"}
        </button>
        <button type="button" className="btn-outline" onClick={onClose}>
          إلغاء
        </button>
      </div>
    </form>
  );
}

function InvoiceViewModal({ invoice, settings, fmtMoney, fmtWeight, onClose, onDelete }) {
  const remaining = Math.max(0, invoice.total - (invoice.paid || 0));
  return (
    <Modal title="عرض الفاتورة" subtitle={invoice.invoiceNumber} onClose={onClose}>
      <div className="invoice-rows">
        <div className="detail-row">
          <span>العميل</span>
          <span>{invoice.slaughterhouse}</span>
        </div>
        <div className="detail-row">
          <span>التاريخ</span>
          <span dir="ltr">{invoice.date}</span>
        </div>
        <div className="detail-row">
          <span>الكمية</span>
          <span>{fmtWeight(invoice.weightKg)}</span>
        </div>
        <div className="detail-row">
          <span>سعر الكيلو</span>
          <span>{Number(invoice.kgPrice).toFixed(2)} {settings.currency}</span>
        </div>
        <div className="detail-row">
          <span>المبلغ المدفوع</span>
          <span>{fmtMoney(invoice.paid || 0)}</span>
        </div>
        <div className="detail-row">
          <span>المبلغ المتبقي</span>
          <span>{fmtMoney(remaining)}</span>
        </div>
        <div className="detail-row detail-row-strong">
          <span>المبلغ الإجمالي</span>
          <span>{fmtMoney(invoice.total)}</span>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-primary" onClick={() => printVoucher({ settings, invoice })}>
          🖨️ طباعة
        </button>
        <ActionLink tone="danger" onClick={() => onDelete(invoice)}>حذف الفاتورة</ActionLink>
      </div>
    </Modal>
  );
}

export default function SalesInvoices() {
  const location = useLocation();
  const { items: invoices, loading, error, create, remove } = useCollection(salesInvoicesApi);
  const { items: prices } = useCollection(dailyPricingApi);
  const { settings, fmtMoney, fmtWeight } = useSettings();
  const [showAdd, setShowAdd] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [invoiceQuery, setInvoiceQuery] = useState("");

  useEffect(() => {
    if (location.state?.viewInvoiceId) {
      const inv = invoices.find((i) => i.id === location.state.viewInvoiceId);
      if (inv) setViewingInvoice(inv);
    }
  }, [location.state, invoices]);

  const kgPrice = latestKgPrice(prices);
  const uncollected = invoices.reduce((sum, i) => sum + Math.max(0, (i.total || 0) - (i.paid || 0)), 0);
  const filteredInvoiceList = invoices.filter(
    (i) => !invoiceQuery || i.invoiceNumber?.toLowerCase().includes(invoiceQuery.toLowerCase()) || i.slaughterhouse?.includes(invoiceQuery),
  );
  const nextRef = `SI-2026-${1100 + invoices.length}`;

  async function handleDeleteInvoice() {
    await remove(deletingInvoice.id);
    setDeletingInvoice(null);
    setViewingInvoice(null);
  }

  return (
    <div>
      <PageHeader
        title="فواتير البيع"
        actions={
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <PlusIcon /> إضافة فاتورة بيع
          </button>
        }
      />

      <div className="page-grid page-grid-3 suppliers-stats">
        <StatCard label="عدد الفواتير" value={`${invoices.length} فاتورة`} />
        <StatCard label="إجمالي المبيعات" value={fmtMoney(invoices.reduce((s, i) => s + (i.total || 0), 0))} />
        <StatCard valueTone="red" label="مبالغ غير محصّلة" value={fmtMoney(uncollected)} />
      </div>

      {loading && <p className="state-message">جارٍ التحميل...</p>}
      {error && <p className="state-message state-message-error">{error}</p>}

      {!loading && !error && (
        <Card>
          <div className="card-head">
            <div>
              <div className="card-title">قائمة فواتير البيع</div>
              <div className="card-sub">فواتير بيع الدجاج للعملاء والمحلات</div>
            </div>
            <SearchBar placeholder="بحث برقم الفاتورة أو اسم العميل" value={invoiceQuery} onChange={setInvoiceQuery} />
          </div>
          <Table
            columns={["رقم الفاتورة", "العميل", "التاريخ", "الكمية", "المبلغ الإجمالي", "المبلغ المتبقي", "الحالة", "الإجراءات"]}
            rows={filteredInvoiceList}
            renderRow={(inv) => {
              const remaining = Math.max(0, (inv.total || 0) - (inv.paid || 0));
              return (
                <>
                  <Td className="td-brand" dir="ltr">{inv.invoiceNumber}</Td>
                  <Td>{inv.slaughterhouse}</Td>
                  <Td className="td-muted" dir="ltr">{inv.date}</Td>
                  <Td dir="ltr">{fmtWeight(inv.weightKg)}</Td>
                  <Td className="td-strong">{fmtMoney(inv.total)}</Td>
                  <Td className={remaining > 0 ? "td-negative" : "td-faint"}>{remaining > 0 ? fmtMoney(remaining) : "—"}</Td>
                  <Td>
                    <StatusBadge status={statusForInvoice(inv.total, inv.paid || 0)} />
                  </Td>
                  <Td>
                    <div className="row-actions">
                      <IconButton label="حذف" tone="danger" onClick={() => setDeletingInvoice(inv)}>
                        <TrashIcon />
                      </IconButton>
                      <IconButton label="عرض" onClick={() => setViewingInvoice(inv)}>
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
        <Modal title="إضافة فاتورة بيع" onClose={() => setShowAdd(false)}>
          <AddInvoiceForm nextRef={nextRef} kgPrice={kgPrice} settings={settings} onClose={() => setShowAdd(false)} onCreate={create} />
        </Modal>
      )}

      {viewingInvoice && (
        <InvoiceViewModal
          invoice={viewingInvoice}
          settings={settings}
          fmtMoney={fmtMoney}
          fmtWeight={fmtWeight}
          onClose={() => setViewingInvoice(null)}
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
