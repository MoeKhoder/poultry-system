import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import { ChevBackIcon, PlusIcon, TrashIcon, TruckIcon } from "../../components/Icons/Icons";
import IconButton from "../../components/IconButton/IconButton";
import { useSettings } from "../../context/SettingsContext";
import { distributionTripsApi, driversApi, vehiclesApi } from "../../api/resources";
import "./TripDetail.css";

function emptyStop() {
  return { id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, customerName: "", amountDue: "", collected: false };
}

export default function TripDetail() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { fmtMoney } = useSettings();
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    driver: "",
    vehicle: "",
    dieselCost: "",
    pickupCost: "",
    status: "جارية",
    stops: [emptyStop()],
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([driversApi.list(), vehiclesApi.list(), isNew ? Promise.resolve(null) : distributionTripsApi.getOne(id)])
      .then(([d, v, t]) => {
        setDrivers(d);
        setVehicles(v);
        if (t) {
          setVersion(t._version);
          setForm({
            date: t.date,
            driver: t.driver,
            vehicle: t.vehicle,
            dieselCost: String(t.dieselCost || 0),
            pickupCost: String(t.pickupCost || 0),
            status: t.status,
            stops: t.stops && t.stops.length > 0 ? t.stops.map((s) => ({ ...s, amountDue: String(s.amountDue) })) : [emptyStop()],
          });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function setStop(stopId, field, value) {
    setForm((prev) => ({
      ...prev,
      stops: prev.stops.map((s) => (s.id === stopId ? { ...s, [field]: value } : s)),
    }));
  }

  function addStop() {
    setForm((prev) => ({ ...prev, stops: [...prev.stops, emptyStop()] }));
  }

  function removeStop(stopId) {
    setForm((prev) => ({ ...prev, stops: prev.stops.filter((s) => s.id !== stopId) }));
  }

  const totalAmount = form.stops.reduce((sum, s) => sum + (Number(s.amountDue) || 0), 0);
  const totalCost = (Number(form.dieselCost) || 0) + (Number(form.pickupCost) || 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const stops = form.stops
        .filter((s) => s.customerName.trim())
        .map((s) => ({ id: s.id, customerName: s.customerName, amountDue: Number(s.amountDue) || 0, collected: !!s.collected }));
      const payload = {
        date: form.date,
        driver: form.driver,
        vehicle: form.vehicle,
        dieselCost: Number(form.dieselCost) || 0,
        pickupCost: Number(form.pickupCost) || 0,
        stops,
      };
      if (isNew) {
        await distributionTripsApi.create(payload);
      } else {
        await distributionTripsApi.update(id, { ...payload, _expectedVersion: version });
      }
      navigate("/trips");
    } catch (err) {
      setError(err.payload?.conflict ? "تم تعديل هذه الرحلة من مكان آخر، أعد المحاولة" : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="state-message">جارٍ التحميل...</p>;
  if (error && isNew === false && !form.driver) return <p className="state-message state-message-error">{error}</p>;

  return (
    <div>
      <button type="button" className="back-link" onClick={() => navigate("/trips")}>
        <ChevBackIcon /> العودة الى رحلات التوزيع
      </button>

      <PageHeader title={isNew ? "إضافة رحلة توزيع" : `تعديل ${form.driver ? "الرحلة" : ""}`} />

      <form onSubmit={handleSubmit}>
        <Card>
          <div className="trip-form-row">
            <div className="modal-field">
              <label>التاريخ</label>
              <input type="date" value={form.date} onChange={set("date")} required />
            </div>
            <div className="modal-field">
              <label>السائق</label>
              <select value={form.driver} onChange={set("driver")} required>
                <option value="">— اختر —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-field">
              <label>المركبة</label>
              <select value={form.vehicle} onChange={set("vehicle")} required>
                <option value="">— اختر —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.plateNumber}>
                    {v.plateNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="trip-form-row">
            <div className="modal-field">
              <label>تكلفة الوقود</label>
              <input type="number" value={form.dieselCost} onChange={set("dieselCost")} required />
            </div>
            <div className="modal-field">
              <label>تكلفة البيك أب</label>
              <input type="number" value={form.pickupCost} onChange={set("pickupCost")} required />
            </div>
          </div>

          <div className="trip-stops-header">
            <div className="card-title">توقفات الرحلة</div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>العميل / المحل</th>
                  <th>المبلغ المستحق</th>
                  <th>حالة التحصيل</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {form.stops.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <input
                        className="trip-stop-input"
                        value={s.customerName}
                        onChange={(e) => setStop(s.id, "customerName", e.target.value)}
                        placeholder="اسم العميل / المحل"
                      />
                    </td>
                    <td>
                      <input
                        className="trip-stop-input"
                        type="number"
                        value={s.amountDue}
                        onChange={(e) => setStop(s.id, "amountDue", e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <select
                        className="trip-stop-input"
                        value={s.collected ? "collected" : "pending"}
                        onChange={(e) => setStop(s.id, "collected", e.target.value === "collected")}
                      >
                        <option value="pending">لم يتم التحصيل</option>
                        <option value="collected">تم التحصيل</option>
                      </select>
                    </td>
                    <td>
                      <IconButton label="حذف التوقف" tone="danger" onClick={() => removeStop(s.id)}>
                        <TrashIcon />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="stops-foot">
            <button type="button" className="add-row-btn" onClick={addStop}>
              <PlusIcon /> إضافة توقف جديد
            </button>
          </div>

          <p className="trip-form-total">المبلغ الإجمالي: {fmtMoney(totalAmount)} — إجمالي التكاليف: {fmtMoney(totalCost)}</p>
        </Card>

        {error && <p className="modal-error">{error}</p>}

        <div className="trip-form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            <TruckIcon /> {saving ? "جارٍ الحفظ..." : "حفظ الرحلة"}
          </button>
          <button type="button" className="btn-outline" onClick={() => navigate("/trips")}>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
