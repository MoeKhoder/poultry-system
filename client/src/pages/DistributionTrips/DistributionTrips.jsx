import { useState } from "react";
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
import { useSettings } from "../../context/SettingsContext";
import { useCollection } from "../../api/useCollection";
import { distributionTripsApi } from "../../api/resources";
import "./DistributionTrips.css";

function TripViewModal({ trip, onClose, onComplete, completing }) {
  const { fmtMoney } = useSettings();
  const collectedCount = trip.stops.filter((s) => s.collected).length;
  return (
    <Modal title="تفاصيل الرحلة" subtitle={`${trip.tripNumber} — ${trip.date}`} onClose={onClose}>
      <div className="trip-detail-grid">
        <div className="trip-detail-cell">
          <p className="trip-detail-cell-label">السائق</p>
          <p className="trip-detail-cell-value">{trip.driver}</p>
        </div>
        <div className="trip-detail-cell">
          <p className="trip-detail-cell-label">المركبة</p>
          <p className="trip-detail-cell-value" dir="ltr">{trip.vehicle}</p>
        </div>
        <div className="trip-detail-cell">
          <p className="trip-detail-cell-label">عدد التوقفات</p>
          <p className="trip-detail-cell-value">{trip.stops.length} ({collectedCount} محصّل)</p>
        </div>
        <div className="trip-detail-cell">
          <p className="trip-detail-cell-label">المبلغ الإجمالي</p>
          <p className="trip-detail-cell-value">{fmtMoney(trip.totalAmount)}</p>
        </div>
      </div>

      <p className="trip-stops-title">توقفات الرحلة</p>
      <div className="trip-stops-list">
        {trip.stops.map((s) => (
          <div key={s.id} className="trip-stop-row">
            <span>{s.customerName}</span>
            <span>{fmtMoney(s.amountDue)}</span>
            <StatusBadge status={s.collected ? "مدفوع" : "غير مدفوع"} />
          </div>
        ))}
      </div>

      <div className="trip-cost-box">
        <div className="detail-row">
          <span>تكلفة الديزل</span>
          <span>{fmtMoney(trip.dieselCost)}</span>
        </div>
        <div className="detail-row">
          <span>تكلفة البيك أب</span>
          <span>{fmtMoney(trip.pickupCost)}</span>
        </div>
        <div className="detail-row trip-cost-total">
          <span>إجمالي تكاليف النقل</span>
          <span>{fmtMoney(trip.transportCost)}</span>
        </div>
      </div>

      <div className="modal-actions trip-detail-actions">
        {trip.status !== "مكتملة" && (
          <button type="button" className="btn-primary" disabled={completing} onClick={onComplete}>
            {completing ? "جارٍ الحفظ..." : "✓ تعيين كمكتملة"}
          </button>
        )}
        <button type="button" className="btn-outline" onClick={onClose}>
          إغلاق
        </button>
      </div>
    </Modal>
  );
}

export default function DistributionTrips() {
  const navigate = useNavigate();
  const { items: trips, loading, error, update, remove } = useCollection(distributionTripsApi);
  const { fmtMoney } = useSettings();
  const [viewingTrip, setViewingTrip] = useState(null);
  const [deletingTrip, setDeletingTrip] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [query, setQuery] = useState("");

  const filteredTrips = trips.filter(
    (t) => !query || t.driver?.includes(query) || t.vehicle?.includes(query),
  );
  const today = new Date().toISOString().slice(0, 10);
  const tripsToday = trips.filter((t) => t.date === today);

  async function handleComplete() {
    setCompleting(true);
    try {
      await update(viewingTrip.id, { status: "مكتملة", _expectedVersion: viewingTrip._version });
      setViewingTrip((prev) => (prev ? { ...prev, status: "مكتملة" } : prev));
    } finally {
      setCompleting(false);
    }
  }

  async function handleDeleteTrip() {
    await remove(deletingTrip.id);
    setDeletingTrip(null);
  }

  return (
    <div>
      <PageHeader
        title="رحلات التوزيع"
        actions={
          <button className="btn-primary" onClick={() => navigate("/trips/new")}>
            <PlusIcon /> إضافة رحلة توزيع
          </button>
        }
      />

      <div className="page-grid page-grid-3 suppliers-stats">
        <StatCard label="رحلات اليوم" value={tripsToday.length} />
        <StatCard label="رحلات مكتملة" value={trips.filter((t) => t.status === "مكتملة").length} />
        <StatCard label="إجمالي تكاليف النقل" value={fmtMoney(trips.reduce((s, t) => s + (t.transportCost || 0), 0))} />
      </div>

      {loading && <p className="state-message">جارٍ التحميل...</p>}
      {error && <p className="state-message state-message-error">{error}</p>}

      {!loading && !error && (
        <Card>
          <div className="card-head">
            <div>
              <div className="card-title">قائمة الرحلات</div>
              <div className="card-sub">رحلات توزيع الدجاج على العملاء</div>
            </div>
            <SearchBar placeholder="بحث بإسم السائق أو رقم اللوحة" value={query} onChange={setQuery} />
          </div>
          <Table
            columns={["رقم الرحلة", "التاريخ", "السائق", "المركبة", "عدد التوقفات", "المبلغ الإجمالي", "الحالة", "الإجراءات"]}
            rows={filteredTrips}
            renderRow={(t) => (
              <>
                <Td className="td-brand" dir="ltr">{t.tripNumber}</Td>
                <Td className="td-muted" dir="ltr">{t.date}</Td>
                <Td>{t.driver}</Td>
                <Td className="td-muted" dir="ltr">{t.vehicle}</Td>
                <Td>{t.stops?.length || 0}</Td>
                <Td className="td-strong">{fmtMoney(t.totalAmount)}</Td>
                <Td>
                  <StatusBadge status={t.status} />
                </Td>
                <Td>
                  <div className="row-actions">
                    <IconButton label="تعديل" onClick={() => navigate(`/trips/${t.id}`)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton label="حذف" tone="danger" onClick={() => setDeletingTrip(t)}>
                      <TrashIcon />
                    </IconButton>
                    <IconButton label="عرض" onClick={() => setViewingTrip(t)}>
                      <EyeIcon />
                    </IconButton>
                  </div>
                </Td>
              </>
            )}
          />
        </Card>
      )}

      {viewingTrip && (
        <TripViewModal
          trip={viewingTrip}
          onClose={() => setViewingTrip(null)}
          onComplete={handleComplete}
          completing={completing}
        />
      )}

      {deletingTrip && (
        <ConfirmDeleteModal
          message={`سيتم حذف الرحلة ${deletingTrip.tripNumber} نهائياً.`}
          onConfirm={handleDeleteTrip}
          onCancel={() => setDeletingTrip(null)}
        />
      )}
    </div>
  );
}
