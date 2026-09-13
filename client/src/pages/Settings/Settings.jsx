import { useEffect, useRef, useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import { Table, Td } from "../../components/DataTable/DataTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import ActionLink from "../../components/ActionLink/ActionLink";
import Modal from "../../components/Modal/Modal";
import PhotoUpload from "../../components/PhotoUpload/PhotoUpload";
import { settingsApi, usersApi, dropdownOptionsApi, roleDefaultsApi } from "../../api/resources";
import { api, downloadFile } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { FEATURES, ACCESS_LEVELS } from "../../constants/features";
import Toggle from "../../components/Toggle/Toggle";
import { useDropdownList } from "../../api/useDropdownList";
import "./Settings.css";

const FALLBACK_CURRENCY_OPTIONS = ["ر.س", "$", "د.إ", "ج.م", "د.ك"];

const tabs = [
  { key: "backup", label: "النسخ الاحتياطي", icon: "💾" },
  { key: "users", label: "المستخدمون", icon: "👥" },
  { key: "lists", label: "القوائم المخصصة", icon: "📝" },
  { key: "system", label: "إعدادات النظام", icon: "⚙️" },
  { key: "company", label: "بيانات الشركة", icon: "🏢" },
];

const ROLES = ["IT", "Administrator", "Assistant"];
const CONFIGURABLE_ROLES = ["Administrator", "Assistant"];

function Field({ label, value, onChange }) {
  return (
    <div className="settings-field">
      <label>{label}</label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AccessLevelPicker({ value, onChange }) {
  return (
    <div className="access-picker">
      {ACCESS_LEVELS.map((lvl) => (
        <button
          key={lvl.key}
          type="button"
          className={`access-picker-btn ${value === lvl.key ? "access-picker-btn-active" : ""}`}
          onClick={() => onChange(lvl.key)}
        >
          {value === lvl.key && "✓ "}
          {lvl.label}
        </button>
      ))}
    </div>
  );
}

function AddUserForm({ onClose, onCreate }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "Assistant" });
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
      await onCreate(form);
      onClose();
    } catch (err) {
      setError(err.payload?.error === "username_taken" ? "اسم المستخدم مستخدم بالفعل" : "تعذر إنشاء المستخدم");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>اسم المستخدم</label>
        <input value={form.username} onChange={set("username")} dir="ltr" required />
      </div>
      <div className="modal-field">
        <label>البريد الإلكتروني</label>
        <input type="email" value={form.email} onChange={set("email")} dir="ltr" />
      </div>
      <div className="modal-field">
        <label>الصلاحية</label>
        <select value={form.role} onChange={set("role")}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-field">
        <label>كلمة المرور</label>
        <input type="password" value={form.password} onChange={set("password")} required />
      </div>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-outline" onClick={onClose}>
          إلغاء
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "إنشاء المستخدم"}
        </button>
      </div>
    </form>
  );
}

function ResetPasswordForm({ user, onClose, onSubmit }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      setError("كلمة المرور قصيرة جداً");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(password);
      onClose();
    } catch {
      setError("تعذر تغيير كلمة المرور");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="payment-remaining">تعيين كلمة مرور جديدة للمستخدم {user.username}</p>
      <div className="modal-field">
        <label>كلمة المرور الجديدة</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-outline" onClick={onClose}>
          إلغاء
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "تعيين كلمة المرور"}
        </button>
      </div>
    </form>
  );
}

function PermissionsForm({ user, onClose, onSubmit }) {
  const initial = Object.fromEntries(FEATURES.map((f) => [f.key, user.permissions?.[f.key] || "default"]));
  const [levels, setLevels] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const permissions = {};
      for (const [key, value] of Object.entries(levels)) {
        if (value !== "default") permissions[key] = value;
      }
      await onSubmit(permissions);
      onClose();
    } catch (err) {
      setError(err.payload?.conflict ? "تم تعديل هذا المستخدم من مكان آخر، أعد المحاولة" : "تعذر حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="payment-remaining">
        الصلاحيات الافتراضية حسب دور {user.role} تُطبّق إلا إذا اخترت مستوى مختلفاً لكل ميزة أدناه.
      </p>
      <div className="permissions-list">
        {FEATURES.map((f) => (
          <div key={f.key} className="permissions-row">
            <span className="permissions-row-label">{f.label}</span>
            <AccessLevelPicker value={levels[f.key]} onChange={(v) => setLevels((prev) => ({ ...prev, [f.key]: v }))} />
          </div>
        ))}
      </div>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-outline" onClick={onClose}>
          إلغاء
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ الصلاحيات"}
        </button>
      </div>
    </form>
  );
}

function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [resettingUser, setResettingUser] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState(null);

  function reload() {
    setLoading(true);
    usersApi
      .list()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleCreate(form) {
    const created = await usersApi.create(form);
    setUsers((prev) => [...prev, created]);
  }

  async function handleToggleActive(u) {
    const updated = await usersApi.update(u.id, { active: !u.active, _expectedVersion: u._version });
    setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
  }

  async function handleRoleChange(u, role) {
    const updated = await usersApi.update(u.id, { role, _expectedVersion: u._version });
    setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
  }

  async function handleResetPassword(password) {
    await usersApi.resetPassword(resettingUser.id, password);
  }

  async function handlePermissionsSave(permissions) {
    const updated = await usersApi.update(editingPermissions.id, { permissions, _expectedVersion: editingPermissions._version });
    setUsers((prev) => prev.map((x) => (x.id === editingPermissions.id ? updated : x)));
  }

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">المستخدمون</h2>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          ➕ إضافة مستخدم
        </button>
      </div>

      {loading && <p className="state-message">جارٍ التحميل...</p>}
      {error && <p className="state-message state-message-error">{error}</p>}

      {!loading && !error && (
        <Table
          columns={["اسم المستخدم", "البريد الإلكتروني", "الصلاحية", "الحالة", "إجراءات"]}
          rows={users}
          renderRow={(u) => (
            <>
              <Td className="td-brand" dir="ltr">{u.username}</Td>
              <Td className="td-muted" dir="ltr">{u.email || "—"}</Td>
              <Td>
                <select
                  value={u.role}
                  disabled={u.id === currentUser.id}
                  onChange={(e) => handleRoleChange(u, e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Td>
              <Td>
                <StatusBadge status={u.active ? "مدفوع" : "متأخر"} />
              </Td>
              <Td>
                <div className="row-actions">
                  <ActionLink onClick={() => setEditingPermissions(u)}>الصلاحيات</ActionLink>
                  <ActionLink onClick={() => setResettingUser(u)}>إعادة تعيين كلمة المرور</ActionLink>
                  {u.id !== currentUser.id && (
                    <ActionLink tone={u.active ? "danger" : "default"} onClick={() => handleToggleActive(u)}>
                      {u.active ? "تعطيل" : "تفعيل"}
                    </ActionLink>
                  )}
                </div>
              </Td>
            </>
          )}
        />
      )}

      {showAdd && (
        <Modal title="إضافة مستخدم" onClose={() => setShowAdd(false)}>
          <AddUserForm onClose={() => setShowAdd(false)} onCreate={handleCreate} />
        </Modal>
      )}

      {resettingUser && (
        <Modal title="إعادة تعيين كلمة المرور" onClose={() => setResettingUser(null)}>
          <ResetPasswordForm user={resettingUser} onClose={() => setResettingUser(null)} onSubmit={handleResetPassword} />
        </Modal>
      )}

      {editingPermissions && (
        <Modal title={`صلاحيات ${editingPermissions.username}`} onClose={() => setEditingPermissions(null)}>
          <PermissionsForm user={editingPermissions} onClose={() => setEditingPermissions(null)} onSubmit={handlePermissionsSave} />
        </Modal>
      )}
    </>
  );
}

function RoleDefaultsTab() {
  const [defaults, setDefaults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    roleDefaultsApi
      .get()
      .then(setDefaults)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function setLevel(role, featureKey, value) {
    setSaved(false);
    setDefaults((prev) => ({ ...prev, [role]: { ...prev[role], [featureKey]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const body = Object.fromEntries(CONFIGURABLE_ROLES.map((r) => [r, defaults[r]]));
      const updated = await roleDefaultsApi.update(body);
      setDefaults(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !defaults) return <p className="state-message">جارٍ التحميل...</p>;
  if (error) return <p className="state-message state-message-error">{error}</p>;

  return (
    <>
      <h2 className="section-title">صلاحيات الأدوار الافتراضية</h2>
      <p className="settings-note">
        هذه هي الصلاحيات التي يحصل عليها أي مستخدم جديد بحسب دوره تلقائياً. دور IT دائماً بصلاحية كاملة ولا يمكن
        تقييده. يمكن تخصيص صلاحيات مستخدم بعينه من تبويب المستخدمون لتجاوز هذه الإعدادات.
      </p>
      {CONFIGURABLE_ROLES.map((role) => (
        <div key={role} className="role-defaults-block">
          <h3 className="role-defaults-title">{role}</h3>
          <div className="permissions-list">
            {FEATURES.map((f) => (
              <div key={f.key} className="permissions-row">
                <span className="permissions-row-label">{f.label}</span>
                <div className="access-picker">
                  {ACCESS_LEVELS.filter((lvl) => lvl.key !== "default").map((lvl) => (
                    <button
                      key={lvl.key}
                      type="button"
                      className={`access-picker-btn ${defaults[role][f.key] === lvl.key ? "access-picker-btn-active" : ""}`}
                      onClick={() => setLevel(role, f.key, lvl.key)}
                    >
                      {defaults[role][f.key] === lvl.key && "✓ "}
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="settings-save-row">
        <button className="btn-primary settings-save" onClick={handleSave} disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ صلاحيات الأدوار"}
        </button>
        {saved && <span className="settings-saved">تم الحفظ — يُطبّق فوراً على كل مستخدمي هذا الدور</span>}
      </div>
    </>
  );
}

function CustomListForm({ initial, onClose, onSubmit }) {
  const [label, setLabel] = useState(initial?.label || "");
  const [values, setValues] = useState(initial?.values || []);
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function addValue() {
    const trimmed = newValue.trim();
    if (!trimmed || values.includes(trimmed)) return;
    setValues((prev) => [...prev, trimmed]);
    setNewValue("");
  }

  function removeValue(v) {
    setValues((prev) => prev.filter((x) => x !== v));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!label.trim()) {
      setError("اسم القائمة مطلوب");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({ label: label.trim(), values });
      onClose();
    } catch (err) {
      setError(err.payload?.conflict ? "تم تعديل هذه القائمة من مكان آخر" : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-field">
        <label>اسم القائمة</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} required />
      </div>
      <div className="modal-field">
        <label>القيم</label>
        <div className="list-chip-input">
          <input value={newValue} onChange={(e) => setNewValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValue(); } }} placeholder="اكتب قيمة ثم Enter" />
          <button type="button" className="btn-outline" onClick={addValue}>
            إضافة
          </button>
        </div>
        <div className="list-chips">
          {values.map((v) => (
            <span key={v} className="list-chip">
              {v}
              <button type="button" onClick={() => removeValue(v)}>
                ✕
              </button>
            </span>
          ))}
          {values.length === 0 && <span className="section-hint">لا توجد قيم بعد</span>}
        </div>
      </div>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn-outline" onClick={onClose}>
          إلغاء
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ القائمة"}
        </button>
      </div>
    </form>
  );
}

function CustomListsTab() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  function reload() {
    setLoading(true);
    dropdownOptionsApi
      .list()
      .then(setLists)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleCreate(body) {
    const created = await dropdownOptionsApi.create(body);
    setLists((prev) => [...prev, created]);
  }

  async function handleUpdate(body) {
    const updated = await dropdownOptionsApi.update(editing.id, { ...body, _expectedVersion: editing._version });
    setLists((prev) => prev.map((l) => (l.id === editing.id ? updated : l)));
  }

  async function handleDelete(list) {
    await dropdownOptionsApi.remove(list.id);
    setLists((prev) => prev.filter((l) => l.id !== list.id));
  }

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">القوائم المخصصة</h2>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          ➕ إضافة قائمة جديدة
        </button>
      </div>
      <p className="settings-note">
        هذه القوائم تُستخدم كخيارات جاهزة في نماذج الإدخال عبر النظام (مثل المناطق وفئات المصاريف). أضف أو عدّل
        القيم هنا وستظهر فوراً في كل مكان تُستخدم فيه.
      </p>

      {loading && <p className="state-message">جارٍ التحميل...</p>}
      {error && <p className="state-message state-message-error">{error}</p>}

      {!loading && !error && lists.length === 0 && <p className="state-message">لا توجد قوائم مخصصة بعد</p>}

      <div className="custom-lists-grid">
        {lists.map((list) => (
          <Card key={list.id}>
            <div className="section-header">
              <h3 className="role-defaults-title">{list.label}</h3>
              <div className="row-actions">
                <ActionLink onClick={() => setEditing(list)}>تعديل</ActionLink>
                <ActionLink tone="danger" onClick={() => handleDelete(list)}>حذف</ActionLink>
              </div>
            </div>
            <div className="list-chips">
              {list.values.map((v) => (
                <span key={v} className="list-chip list-chip-static">
                  {v}
                </span>
              ))}
              {list.values.length === 0 && <span className="section-hint">لا توجد قيم</span>}
            </div>
          </Card>
        ))}
      </div>

      {showAdd && (
        <Modal title="إضافة قائمة جديدة" onClose={() => setShowAdd(false)}>
          <CustomListForm onClose={() => setShowAdd(false)} onSubmit={handleCreate} />
        </Modal>
      )}

      {editing && (
        <Modal title={`تعديل ${editing.label}`} onClose={() => setEditing(null)}>
          <CustomListForm initial={editing} onClose={() => setEditing(null)} onSubmit={handleUpdate} />
        </Modal>
      )}
    </>
  );
}

function RestoreConfirmModal({ summary, onClose, onConfirm, confirming }) {
  return (
    <Modal title="تأكيد الاستعادة من نسخة احتياطية" onClose={onClose}>
      <p className="modal-error restore-warning">
        سيؤدي هذا إلى استبدال البيانات الحالية بالكامل بالبيانات الموجودة في الملف المحدد. هذا الإجراء لا يمكن
        التراجع عنه. حسابات المستخدمين لن تتأثر.
      </p>
      <div className="detail-list restore-summary">
        {summary.map(([label, count]) => (
          <div key={label} className="detail-row">
            <span>{label}</span>
            <span>{count} سجل</span>
          </div>
        ))}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn-outline" onClick={onClose}>
          إلغاء
        </button>
        <button type="button" className="btn-primary" onClick={onConfirm} disabled={confirming}>
          {confirming ? "جارٍ الاستعادة..." : "تأكيد الاستعادة"}
        </button>
      </div>
    </Modal>
  );
}

function BackupTab() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [pendingRestore, setPendingRestore] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef(null);

  async function handleDownload() {
    setDownloading(true);
    setError("");
    try {
      const filename = `poultry-backup-${new Date().toISOString().slice(0, 10)}.json`;
      await downloadFile("/backup", filename);
    } catch {
      setError("تعذر تنزيل النسخة الاحتياطية");
    } finally {
      setDownloading(false);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreError("");
    setRestoreSuccess(false);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const knownKeys = ["suppliers", "slaughterhouses", "dailyPrices", "salesInvoices", "distributionTrips", "expenses", "settings"];
        const summary = knownKeys.filter((k) => Array.isArray(parsed[k])).map((k) => [k, parsed[k].length]);
        if (summary.length === 0) {
          setRestoreError("الملف لا يحتوي على بيانات نظام صالحة");
          return;
        }
        setPendingRestore({ data: parsed, summary });
      } catch {
        setRestoreError("تعذر قراءة الملف — تأكد أنه ملف نسخة احتياطية صالح بصيغة JSON");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleConfirmRestore() {
    setConfirming(true);
    try {
      await api.post("/backup/restore", pendingRestore.data);
      setPendingRestore(null);
      setRestoreSuccess(true);
    } catch {
      setRestoreError("تعذرت الاستعادة");
      setPendingRestore(null);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <h2 className="section-title">النسخ الاحتياطي</h2>
      <p className="settings-note">
        يقوم هذا الخيار بتنزيل نسخة كاملة من بيانات النظام (الموردين، المسالخ، الفواتير، الرحلات، المصاريف،
        الإعدادات) بصيغة JSON يمكن أرشفتها أو استخدامها لاحقاً لاستعادة البيانات. حسابات المستخدمين لا تُضمّن في
        الاستعادة لأسباب أمنية.
      </p>
      {error && <p className="modal-error">{error}</p>}
      <button className="btn-primary settings-save" onClick={handleDownload} disabled={downloading}>
        💾 {downloading ? "جارٍ التنزيل..." : "تنزيل نسخة احتياطية الآن"}
      </button>

      <div className="backup-restore-block">
        <h3 className="role-defaults-title">استعادة من نسخة احتياطية</h3>
        <p className="settings-note">اختر ملف JSON تم تنزيله سابقاً من هذا النظام لاستعادة بياناته.</p>
        {restoreError && <p className="modal-error">{restoreError}</p>}
        {restoreSuccess && <p className="settings-saved">تمت الاستعادة بنجاح — يُنصح بإعادة تحميل الصفحة</p>}
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileSelect} hidden />
        <button className="btn-outline" onClick={() => fileInputRef.current?.click()}>
          📂 اختيار ملف نسخة احتياطية
        </button>
      </div>

      {pendingRestore && (
        <RestoreConfirmModal
          summary={pendingRestore.summary}
          confirming={confirming}
          onClose={() => setPendingRestore(null)}
          onConfirm={handleConfirmRestore}
        />
      )}
    </>
  );
}

export default function Settings() {
  const { settings: globalSettings, loading: globalLoading, reload: reloadGlobalSettings } = useSettings();
  const [tab, setTab] = useState("backup");
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { values: currencyList } = useDropdownList("العملات");
  const currencyOptions = currencyList.length > 0 ? currencyList : FALLBACK_CURRENCY_OPTIONS;

  useEffect(() => {
    if (!globalLoading && globalSettings) {
      setSettings((prev) => prev ?? globalSettings);
    }
  }, [globalLoading, globalSettings]);

  function setField(field) {
    return (value) => {
      setSaved(false);
      setSettings((prev) => ({ ...prev, [field]: value }));
    };
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await settingsApi.update(settings);
      setSettings(updated);
      await reloadGlobalSettings();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (globalLoading || !settings) {
    return (
      <div>
        <PageHeader title="الإعدادات" subtitle="إعدادات النظام والحساب" />
        <p className="state-message">جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="الإعدادات" subtitle="إعدادات النظام والحساب" />

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`tabs-item ${tab === t.key ? "tabs-item-active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

        <Card>
          {tab === "company" && (
            <>
              <h2 className="section-title">بيانات الشركة</h2>
              <div className="settings-grid">
                <div className="settings-span-2">
                  <Field label="اسم الشركة / المؤسسة" value={settings.companyName} onChange={setField("companyName")} />
                </div>
                <Field label="رقم الضريبة (VAT)" value={settings.vatNumber} onChange={setField("vatNumber")} />
                <Field label="رقم السجل التجاري" value={settings.commercialRegister} onChange={setField("commercialRegister")} />
                <Field label="رقم الهاتف" value={settings.phone} onChange={setField("phone")} />
                <Field label="المدينة" value={settings.city} onChange={setField("city")} />
                <div className="settings-span-2">
                  <Field label="العنوان" value={settings.address} onChange={setField("address")} />
                </div>
                <div className="settings-span-2">
                  <Field label="البريد الإلكتروني" value={settings.email} onChange={setField("email")} />
                </div>
                <div className="settings-span-2">
                  <label className="settings-field-label">شعار الشركة</label>
                  <PhotoUpload value={settings.logo} onChange={setField("logo")} />
                </div>
              </div>
              <div className="settings-save-row">
                <button className="btn-primary settings-save" onClick={handleSave} disabled={saving}>
                  {saving ? "جارٍ الحفظ..." : "حفظ البيانات"}
                </button>
                {saved && <span className="settings-saved">تم الحفظ — سيظهر هذا في جميع التقارير المطبوعة</span>}
              </div>
            </>
          )}

          {tab === "system" && (
            <>
              <div className="settings-section">
                <h2 className="section-title">إعدادات الأسعار</h2>
                <div className="settings-grid">
                  <div className="settings-field">
                    <label>عملة النظام</label>
                    <select value={settings.currency} onChange={(e) => setField("currency")(e.target.value)}>
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Field label="الوزن الثابت للقفص (كغ)" value={settings.fixedCageWeight} onChange={setField("fixedCageWeight")} />
                  <Field label="هامش الشراء (%)" value={settings.purchaseMarginPercent} onChange={setField("purchaseMarginPercent")} />
                  <Field label="وحدة الوزن" value={settings.weightUnit} onChange={setField("weightUnit")} />
                </div>
                <p className="settings-note">
                  هامش الشراء يحدد سعر شراء القفص من الموردين كنسبة أقل من سعر الكيلو المُعلن — مثلاً هامش 20%
                  يعني أن سعر الشراء يعادل 80% من القيمة المكافئة لسعر الكيلو الحالي.
                </p>
                <p className="settings-note">
                  لإضافة أو تعديل خيارات العملة المتاحة، انتقل إلى تبويب "القوائم المخصصة" وعدّل قائمة "العملات".
                </p>
              </div>

              <div className="settings-section">
                <h2 className="section-title">إعدادات الفواتير</h2>
                <div className="settings-grid">
                  <Field label="بادئة رقم الفاتورة" value={settings.invoicePrefix} onChange={setField("invoicePrefix")} />
                  <Field label="تذكير الديون بعد (أيام)" value={settings.debtReminderDays} onChange={setField("debtReminderDays")} />
                  <div className="settings-span-2">
                    <label className="settings-textarea-label">ملاحظة تظهر أسفل الفاتورة</label>
                    <textarea
                      className="settings-textarea"
                      value={settings.invoiceFooterNote ?? ""}
                      onChange={(e) => setField("invoiceFooterNote")(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h2 className="section-title">التنبيهات</h2>
                <div className="alert-row-with-input">
                  <Toggle
                    checked={!!settings.alertSlaughterhouseDebtEnabled}
                    onChange={(v) => setField("alertSlaughterhouseDebtEnabled")(v)}
                    label={`تنبيه عند تجاوز ديون المسالخ`}
                  />
                  <input
                    type="number"
                    className="alert-inline-input"
                    value={settings.alertSlaughterhouseDebtThreshold}
                    onChange={(e) => setField("alertSlaughterhouseDebtThreshold")(Number(e.target.value))}
                  />
                  <span className="alert-inline-unit">{settings.currency}</span>
                </div>
                <div className="alert-row-with-input">
                  <Toggle
                    checked={!!settings.alertDriverLicenseEnabled}
                    onChange={(v) => setField("alertDriverLicenseEnabled")(v)}
                    label="تنبيه عند انتهاء رخصة سائق خلال"
                  />
                  <input
                    type="number"
                    className="alert-inline-input"
                    value={settings.alertDriverLicenseDays}
                    onChange={(e) => setField("alertDriverLicenseDays")(Number(e.target.value))}
                  />
                  <span className="alert-inline-unit">يوم</span>
                </div>
                <Toggle
                  checked={!!settings.dailyEmailReportEnabled}
                  onChange={(v) => setField("dailyEmailReportEnabled")(v)}
                  label="إرسال تقرير يومي بالبريد الإلكتروني"
                />
                <Toggle
                  checked={!!settings.alertMissingDailyPriceEnabled}
                  onChange={(v) => setField("alertMissingDailyPriceEnabled")(v)}
                  label="تنبيه عند عدم تسجيل سعر يومي"
                />
              </div>

              <div className="settings-save-row">
                <button className="btn-primary settings-save" onClick={handleSave} disabled={saving}>
                  {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
                </button>
                {saved && <span className="settings-saved">تم الحفظ — يُستخدم فوراً في جميع الصفحات والتقارير</span>}
              </div>
            </>
          )}

          {tab === "lists" && <CustomListsTab />}
          {tab === "users" && <UsersTab />}
          {tab === "roles" && <RoleDefaultsTab />}
          {tab === "backup" && <BackupTab />}
        </Card>
    </div>
  );
}
