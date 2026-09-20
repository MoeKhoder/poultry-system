const toneMap = {
  "مدفوع": "green",
  "نشط": "green",
  "مسدّد": "green",
  "مكتملة": "green",
  "متبقي": "yellow",
  "جزئي": "yellow",
  "جارية": "yellow",
  "منتهي": "yellow",
  "غير مدفوع": "red",
  "غير مسدد": "red",
  "دائن": "red",
  "متأخر": "red",
};

export default function StatusBadge({ status }) {
  const tone = toneMap[status] || "gray";
  return (
    <span className={`badge badge-${tone}`}>
      <i className="badge-dot" />
      {status}
    </span>
  );
}
