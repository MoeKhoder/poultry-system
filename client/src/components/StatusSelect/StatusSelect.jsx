import "./StatusSelect.css";

const toneMap = {
  "مدفوع": "green",
  "نشط": "green",
  "مسدّد": "green",
  "مكتملة": "green",
  "متاح": "green",
  "متبقي": "yellow",
  "جارية": "yellow",
  "في رحلة": "yellow",
  "غير مدفوع": "red",
  "دائن": "red",
  "متأخر": "red",
  "صيانة": "red",
  "إجازة": "red",
  "منتهي": "gray",
};

export default function StatusSelect({ status, options, onChange, disabled }) {
  const tone = toneMap[status] || "gray";
  return (
    <select
      value={status}
      disabled={disabled}
      onChange={(e) => onChange && onChange(e.target.value)}
      className={`status-select status-select-${tone}`}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
