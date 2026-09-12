import "./IconButton.css";

export default function IconButton({ children, tone = "default", label, onClick }) {
  return (
    <button type="button" className={`icon-btn icon-btn-${tone}`} aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}
