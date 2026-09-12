import "./ActionLink.css";

export default function ActionLink({ children, tone = "default", onClick }) {
  return (
    <button onClick={onClick} className={`action-link action-link-${tone}`}>
      {children}
    </button>
  );
}
