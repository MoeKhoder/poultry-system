import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  HomeIcon,
  UsersIcon,
  WarehouseIcon,
  ReceiptIcon,
  TruckIcon,
  TagIcon,
  WalletIcon,
  CarIcon,
  CalcIcon,
  ChartIcon,
  SettingsIcon,
  ChickenIcon,
} from "../../components/Icons/Icons";
import "./Sidebar.css";

const navItems = [
  { to: "/", label: "لوحة التحكم", Icon: HomeIcon },
  { to: "/suppliers", label: "الموردين", Icon: UsersIcon },
  { to: "/slaughterhouses", label: "المسالخ", Icon: WarehouseIcon },
  { to: "/invoices", label: "فواتير البيع", Icon: ReceiptIcon },
  { to: "/trips", label: "رحلات التوزيع", Icon: TruckIcon },
  { to: "/pricing", label: "إدارة الأسعار اليومية", Icon: TagIcon },
  { to: "/expenses", label: "المصاريف", Icon: WalletIcon },
  { to: "/fleet", label: "السيارات والسائقين", Icon: CarIcon },
  { to: "/accounts", label: "الحسابات", Icon: CalcIcon },
  { to: "/reports", label: "التقارير", Icon: ChartIcon },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  return (
    <>
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <ChickenIcon />
          </div>
          <div>
            <p className="sidebar-brand-title">الشيخ تشيكن</p>
            <p className="sidebar-brand-subtitle">إدارة التوزيع</p>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="إغلاق">
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
            >
              <span className="sidebar-item-icon">
                <Icon />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
          {user?.role === "IT" && (
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}
            >
              <span className="sidebar-item-icon">
                <SettingsIcon />
              </span>
              <span>الإعدادات</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-foot">النسخة التجريبية · نظام إدارة الدواجن الشامل</div>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
    </>
  );
}
