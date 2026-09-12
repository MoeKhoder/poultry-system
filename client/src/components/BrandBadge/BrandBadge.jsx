import bmtechLogo from "../../assets/bmtech-logo.jpeg";
import "./BrandBadge.css";

export default function BrandBadge() {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="brand-badge"
      title="تطوير BM Tech"
    >
      <img src={bmtechLogo} alt="BM Tech" className="brand-badge-logo" />
      <span className="brand-badge-text">BM Tech</span>
    </a>
  );
}
