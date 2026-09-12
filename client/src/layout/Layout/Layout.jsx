import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import TopBar from "../TopBar/TopBar";
import BrandCredit from "../../components/BrandCredit/BrandCredit";
import "./Layout.css";

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="layout-main">
        <header className="layout-topbar">
          <button className="layout-menu-btn" onClick={() => setOpen(true)} aria-label="القائمة">
            ☰
          </button>
          <div className="layout-topbar-brand">
            <span>🐓</span>
            <span>الشيخ تشيكن</span>
          </div>
        </header>
        <TopBar />
        <main className="layout-content">
          <BrandCredit />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
