import bmtechLogo from "../../assets/bmtech-logo.jpeg";
import "./BrandCredit.css";

export default function BrandCredit({ onDark = false }) {
  return (
    <div className={`brand-credit ${onDark ? "brand-credit-on-dark" : ""}`}>
      <img src={bmtechLogo} alt="BM Tech" className="brand-credit-logo" />
      <div className="brand-credit-text">
        <span className="brand-credit-name">BM Tech</span>
        <span className="brand-credit-label">تطوير وتشغيل</span>
      </div>
    </div>
  );
}
