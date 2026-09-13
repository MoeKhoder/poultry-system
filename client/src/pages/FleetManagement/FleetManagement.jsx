import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import { Table, Td } from "../../components/DataTable/DataTable";
import StatusSelect from "../../components/StatusSelect/StatusSelect";
import IconButton from "../../components/IconButton/IconButton";
import { EditIcon, TrashIcon, PlusIcon } from "../../components/Icons/Icons";
import Modal from "../../components/Modal/Modal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import SearchBar from "../../components/SearchBar/SearchBar";
import Tabs from "../../components/Tabs/Tabs";
import { useCollection } from "../../api/useCollection";
import { useDropdownList } from "../../api/useDropdownList";
import { vehiclesApi, driversApi, distributionTripsApi } from "../../api/resources";
import "./FleetManagement.css";

const FALLBACK_VEHICLE_TYPES = ["شاحنة كبيرة", "شاحنة متوسطة", "بيك أب"];
const VEHICLE_STATUSES = ["متاح", "في رحلة", "صيانة"];
const DRIVER_STATUSES = ["متاح", "في رحلة", "إجازة"];

function VehicleForm({ initial, drivers, onClose, onSubmit }) {
  const { values: typeOptions } = useDropdownList("أنواع المركبات");
  const vehicleTypes = typeOptions.length > 0 ? typeOptions : FALLBACK_VEHICLE_TYPES;
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function setDriver(e) {
    const driver = drivers.find((d) => d.id === e.target.value);
    setForm((prev) => ({ ...prev, assignedDriverId: driver?.id || "", assignedDriverName: driver?.name || "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({ ...form, capacity: Number(form.capacity) || 0 });
      onClose();
    } catch (err) {
      setError(err.payload?.error === "duplicate_field" ? "رقم اللوحة مستخدم بالفعل" : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>رقم اللوحة</label>
        <input value={form.plateNumber} onChange={set("plateNumber")} dir="ltr" required />
      </div>
      <div className="modal-field">
        <label>النوع</label>
        <select value={form.type} onChange={set("type")} required>
          <option value="">— اختر —</option>
          {vehicleTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-field">
        <label>الموديل</label>
        <input value={form.model} onChange={set("model")} placeholder="تويوتا هايلوكس 2023" required />
      </div>
      <div className="modal-field">
        <label>الطاقة (أقفاص)</label>
        <input type="number" value={form.capacity} onChange={set("capacity")} required />
      </div>
      <div className="modal-field">
        <label>السائق المخصص</label>
        <select value={form.assignedDriverId || ""} onChange={setDriver}>
          <option value="">— بدون —</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
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

function DriverForm({ initial, vehicles, onClose, onSubmit }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function setVehicle(e) {
    const vehicle = vehicles.find((v) => v.id === e.target.value);
    setForm((prev) => ({ ...prev, assignedVehicleId: vehicle?.id || "", assignedVehiclePlate: vehicle?.plateNumber || "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.payload?.error === "duplicate_field" ? "رقم الهاتف مستخدم بالفعل" : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>الاسم الكامل</label>
        <input value={form.name} onChange={set("name")} placeholder="اسم السائق" required />
      </div>
      <div className="field-row">
        <div className="modal-field">
          <label>رقم الهاتف</label>
          <input value={form.phone} onChange={set("phone")} dir="ltr" placeholder="05xxxxxxxx" required />
        </div>
        <div className="modal-field">
          <label>رقم رخصة القيادة</label>
          <input value={form.licenseNumber} onChange={set("licenseNumber")} dir="ltr" placeholder="0000000" required />
        </div>
      </div>
      <div className="modal-field">
        <label>تاريخ انتهاء الرخصة</label>
        <input type="date" value={form.licenseExpiry} onChange={set("licenseExpiry")} required />
      </div>
      <div className="modal-field">
        <label>السيارة المخصصة</label>
        <select value={form.assignedVehicleId || ""} onChange={setVehicle}>
          <option value="">— بدون —</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plateNumber}
            </option>
          ))}
        </select>
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

export default function FleetManagement() {
  const [tab, setTab] = useState("السيارات");
  const location = useLocation();

  useEffect(() => {
    if (location.state?.tab) {
      setTab(location.state.tab);
    }
  }, [location.state]);

  const { items: vehicles, loading: loadingVehicles, error: vehiclesError, create: createVehicle, update: updateVehicle, remove: removeVehicle } = useCollection(vehiclesApi);
  const { items: drivers, loading: loadingDrivers, error: driversError, create: createDriver, update: updateDriver, remove: removeDriver } = useCollection(driversApi);
  const { items: trips } = useCollection(distributionTripsApi);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editingDriver, setEditingDriver] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [deletingDriver, setDeletingDriver] = useState(null);

  const isVehicles = tab === "السيارات";
  const loading = isVehicles ? loadingVehicles : loadingDrivers;
  const error = isVehicles ? vehiclesError : driversError;

  const tripsCountByPlate = trips.reduce((acc, t) => {
    acc[t.vehicle] = (acc[t.vehicle] || 0) + 1;
    return acc;
  }, {});

  const filteredVehicles = vehicles.filter(
    (v) => !query || v.plateNumber.includes(query) || (v.assignedDriverName || "").includes(query),
  );
  const filteredDrivers = drivers.filter(
    (d) => !query || d.name.includes(query) || d.phone.includes(query),
  );

  async function handleVehicleStatusChange(vehicle, status) {
    setPendingId(vehicle.id);
    try {
      await updateVehicle(vehicle.id, { status, _expectedVersion: vehicle._version });
    } finally {
      setPendingId(null);
    }
  }

  async function handleDriverStatusChange(driver, status) {
    setPendingId(driver.id);
    try {
      await updateDriver(driver.id, { status, _expectedVersion: driver._version });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="السيارات والسائقين"
        subtitle="إدارة الأسطول وسائقي التوزيع"
        actions={
          <button className="btn-add" onClick={() => setShowAdd(true)}>
            <PlusIcon /> {isVehicles ? "إضافة سيارة" : "إضافة سائق"}
          </button>
        }
      />

      <div className="fleet-tabs">
        <Tabs tabs={["السيارات", "السائقون"]} active={tab} onChange={setTab} />
      </div>

      <SearchBar
        placeholder={isVehicles ? "بحث باسم السائق أو رقم الهاتف..." : "بحث باسم السائق أو رقم الهاتف..."}
        value={query}
        onChange={setQuery}
      />

      {loading && <p className="state-message">جارٍ التحميل...</p>}
      {error && <p className="state-message state-message-error">{error}</p>}

      {!loading && !error && isVehicles && (
        <Card className="fleet-table-card">
          <Table
            columns={["اللوحة", "النوع", "الموديل", "الطاقة", "السائق", "الرحلات", "الحالة", "الاجراءات"]}
            rows={filteredVehicles}
            renderRow={(v) => (
              <>
                <Td className="td-brand" dir="ltr">{v.plateNumber}</Td>
                <Td>{v.type}</Td>
                <Td className="td-muted">{v.model}</Td>
                <Td>{v.capacity} قفص</Td>
                <Td className="td-muted">{v.assignedDriverName || "—"}</Td>
                <Td>{tripsCountByPlate[v.plateNumber] || 0}</Td>
                <Td>
                  <StatusSelect
                    status={v.status}
                    options={VEHICLE_STATUSES}
                    disabled={pendingId === v.id}
                    onChange={(status) => handleVehicleStatusChange(v, status)}
                  />
                </Td>
                <Td>
                  <div className="row-actions">
                    <IconButton label="حذف" tone="danger" onClick={() => setDeletingVehicle(v)}>
                      <TrashIcon />
                    </IconButton>
                    <IconButton label="تعديل" onClick={() => setEditingVehicle(v)}>
                      <EditIcon />
                    </IconButton>
                  </div>
                </Td>
              </>
            )}
          />
        </Card>
      )}

      {!loading && !error && !isVehicles && (
        <Card className="fleet-table-card">
          <Table
            columns={["الاسم", "الهاتف", "رقم الرخصة", "تاريخ الانتهاء", "السيارة المخصصة", "الحالة", "الاجراءات"]}
            rows={filteredDrivers}
            renderRow={(d) => (
              <>
                <Td className="td-brand">{d.name}</Td>
                <Td className="td-muted" dir="ltr">{d.phone}</Td>
                <Td className="td-muted" dir="ltr">{d.licenseNumber}</Td>
                <Td className="td-muted">{d.licenseExpiry}</Td>
                <Td className="td-muted" dir="ltr">{d.assignedVehiclePlate || "—"}</Td>
                <Td>
                  <StatusSelect
                    status={d.status}
                    options={DRIVER_STATUSES}
                    disabled={pendingId === d.id}
                    onChange={(status) => handleDriverStatusChange(d, status)}
                  />
                </Td>
                <Td>
                  <div className="row-actions">
                    <IconButton label="حذف" tone="danger" onClick={() => setDeletingDriver(d)}>
                      <TrashIcon />
                    </IconButton>
                    <IconButton label="تعديل" onClick={() => setEditingDriver(d)}>
                      <EditIcon />
                    </IconButton>
                  </div>
                </Td>
              </>
            )}
          />
        </Card>
      )}

      {showAdd && isVehicles && (
        <Modal title="إضافة سيارة جديدة" onClose={() => setShowAdd(false)}>
          <VehicleForm
            initial={{ plateNumber: "", type: "", model: "", capacity: "", assignedDriverId: "", assignedDriverName: "" }}
            drivers={drivers}
            onClose={() => setShowAdd(false)}
            onSubmit={createVehicle}
          />
        </Modal>
      )}

      {showAdd && !isVehicles && (
        <Modal title="إضافة سائق جديد" onClose={() => setShowAdd(false)}>
          <DriverForm
            initial={{ name: "", phone: "", licenseNumber: "", licenseExpiry: "", assignedVehicleId: "", assignedVehiclePlate: "" }}
            vehicles={vehicles}
            onClose={() => setShowAdd(false)}
            onSubmit={createDriver}
          />
        </Modal>
      )}

      {editingVehicle && (
        <Modal title="تعديل بيانات السيارة" onClose={() => setEditingVehicle(null)}>
          <VehicleForm
            initial={editingVehicle}
            drivers={drivers}
            onClose={() => setEditingVehicle(null)}
            onSubmit={(body) => updateVehicle(editingVehicle.id, { ...body, _expectedVersion: editingVehicle._version })}
          />
        </Modal>
      )}

      {editingDriver && (
        <Modal title="تعديل بيانات السائق" onClose={() => setEditingDriver(null)}>
          <DriverForm
            initial={editingDriver}
            vehicles={vehicles}
            onClose={() => setEditingDriver(null)}
            onSubmit={(body) => updateDriver(editingDriver.id, { ...body, _expectedVersion: editingDriver._version })}
          />
        </Modal>
      )}

      {deletingVehicle && (
        <ConfirmDeleteModal
          message={`سيتم حذف السيارة ${deletingVehicle.plateNumber} نهائياً من الأسطول.`}
          onConfirm={async () => {
            await removeVehicle(deletingVehicle.id);
            setDeletingVehicle(null);
          }}
          onCancel={() => setDeletingVehicle(null)}
        />
      )}

      {deletingDriver && (
        <ConfirmDeleteModal
          message={`سيتم حذف السائق ${deletingDriver.name} نهائياً.`}
          onConfirm={async () => {
            await removeDriver(deletingDriver.id);
            setDeletingDriver(null);
          }}
          onCancel={() => setDeletingDriver(null)}
        />
      )}
    </div>
  );
}
