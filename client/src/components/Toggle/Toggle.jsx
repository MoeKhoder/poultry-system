import "./Toggle.css";

export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle-row">
      <span className="toggle-label">{label}</span>
      <span className={`toggle-switch ${checked ? "toggle-switch-on" : ""}`} onClick={() => onChange(!checked)}>
        <span className="toggle-knob" />
      </span>
    </label>
  );
}
