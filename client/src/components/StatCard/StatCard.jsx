import { DocumentIcon } from "../Icons/Icons";
import "./StatCard.css";

export default function StatCard({ icon, label, value, hint, valueTone }) {
  return (
    <div className="stat-card stat-card-layout">
      <div>
        <p className={`stat-card-value ${valueTone ? `stat-card-value-${valueTone}` : ""}`}>{value}</p>
        <p className="stat-card-label">{label}</p>
      </div>
      <div className="stat-card-icon">{icon || <DocumentIcon />}</div>
    </div>
  );
}
