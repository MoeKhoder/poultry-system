import "./Tabs.css";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`tabs-item ${active === t ? "tabs-item-active" : ""}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
