import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  suppliersApi,
  slaughterhousesApi,
  purchaseOrdersApi,
  salesInvoicesApi,
  dailyPricingApi,
  expensesApi,
} from "../../api/resources";
import { SearchIcon } from "../../components/Icons/Icons";
import "./TopBar.css";

const ROUTE_LABELS = [
  { pattern: /^\/$/, title: "لوحة التحكم", parent: "الصفحة الرئيسية" },
  { pattern: /^\/suppliers$/, title: "الموردين", parent: "الصفحة الرئيسية" },
  { pattern: /^\/suppliers\/[^/]+$/, title: "كشف حساب المورد", parent: "الموردين" },
  { pattern: /^\/slaughterhouses$/, title: "المسالخ", parent: "الصفحة الرئيسية" },
  { pattern: /^\/slaughterhouses\/[^/]+$/, title: "كشف حساب المسلخ", parent: "المسالخ" },
  { pattern: /^\/pricing$/, title: "سجل عمليات الشراء والبيع", parent: "الصفحة الرئيسية" },
  { pattern: /^\/pricing\/[^/]+$/, title: "تفاصيل اليوم", parent: "سجل عمليات الشراء والبيع" },
  { pattern: /^\/invoices$/, title: "فواتير البيع", parent: "الصفحة الرئيسية" },
  { pattern: /^\/expenses$/, title: "المصاريف", parent: "الصفحة الرئيسية" },
  { pattern: /^\/accounts$/, title: "الحسابات", parent: "الصفحة الرئيسية" },
  { pattern: /^\/reports$/, title: "التقارير", parent: "الصفحة الرئيسية" },
  { pattern: /^\/settings$/, title: "الإعدادات", parent: "الصفحة الرئيسية" },
];

function breadcrumbFor(pathname) {
  const match = ROUTE_LABELS.find((r) => r.pattern.test(pathname));
  if (!match) return { title: "لوحة التحكم", parent: "الصفحة الرئيسية" };
  return match;
}

const EMPTY = { suppliers: [], slaughterhouses: [], purchaseOrders: [], salesInvoices: [], dailyPrices: [], expenses: [] };

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [data, setData] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  function fetchAll() {
    Promise.all([
      suppliersApi.list(),
      slaughterhousesApi.list(),
      purchaseOrdersApi.list(),
      salesInvoicesApi.list(),
      dailyPricingApi.list(),
      expensesApi.list(),
    ])
      .then(([suppliers, slaughterhouses, purchaseOrders, salesInvoices, dailyPrices, expenses]) => {
        setData({ suppliers, slaughterhouses, purchaseOrders, salesInvoices, dailyPrices, expenses });
      })
      .catch(() => {});
  }

  useEffect(() => {
    fetchAll();
    window.addEventListener("focus", fetchAll);
    return () => window.removeEventListener("focus", fetchAll);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = query.trim();

  function goTo(path, state) {
    navigate(path, state ? { state } : undefined);
    setQuery("");
    setOpen(false);
  }

  const groups = q
    ? [
        {
          icon: "🏭",
          items: data.suppliers.filter((s) => s.name.includes(q)).slice(0, 3),
          label: (s) => s.name,
          onSelect: (s) => goTo(`/suppliers/${s.id}`),
        },
        {
          icon: "🔪",
          items: data.slaughterhouses.filter((s) => s.name.includes(q)).slice(0, 3),
          label: (s) => s.name,
          onSelect: (s) => goTo(`/slaughterhouses/${s.id}`),
        },
        {
          icon: "📥",
          items: data.purchaseOrders.filter((o) => o.code?.includes(q) || o.supplierName?.includes(q)).slice(0, 3),
          label: (o) => `${o.code} — ${o.supplierName}`,
          onSelect: (o) => goTo(`/suppliers/${o.supplierId}`),
        },
        {
          icon: "📤",
          items: data.salesInvoices.filter((i) => i.invoiceNumber?.includes(q) || i.slaughterhouse?.includes(q)).slice(0, 3),
          label: (i) => `${i.invoiceNumber} — ${i.slaughterhouse}`,
          onSelect: (i) => goTo("/invoices", { viewInvoiceId: i.id }),
        },
        {
          icon: "💲",
          items: data.dailyPrices.filter((p) => p.date?.includes(q)).slice(0, 3),
          label: (p) => `سعر يوم ${p.date}`,
          onSelect: (p) => goTo(`/pricing/${p.id}`),
        },
        {
          icon: "💸",
          items: data.expenses.filter((e) => e.description?.includes(q) || e.category?.includes(q) || e.driver?.includes(q)).slice(0, 3),
          label: (e) => `${e.description} — ${e.category}`,
          onSelect: () => goTo("/expenses"),
        },
      ]
    : [];

  const hasResults = groups.some((g) => g.items.length > 0);
  const crumb = breadcrumbFor(location.pathname);

  const initials = (user?.username || "؟؟").slice(0, 2).toUpperCase();

  return (
    <div className="topbar">
      <div className="breadcrumb">
        <b>{crumb.title}</b>
        <span> / {crumb.parent}</span>
      </div>

      <div className="topbar-right">
        <div className="topbar-search-box" ref={boxRef}>
          <div className="topbar-search">
            <input
              placeholder="بحث..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => {
                setOpen(true);
                fetchAll();
              }}
            />
            <span className="topbar-search-icon">
              <SearchIcon />
            </span>
            {open && q && (
              <div className="topbar-search-results">
                {!hasResults && <p className="topbar-search-empty">لا توجد نتائج</p>}
                {groups.map((g, gi) =>
                  g.items.map((item, ii) => (
                    <button key={`${gi}-${ii}`} className="topbar-search-result" onClick={() => g.onSelect(item)}>
                      <span>{g.icon}</span> {g.label(item)}
                    </button>
                  )),
                )}
              </div>
            )}
          </div>
        </div>
        <button type="button" className="topbar-logout" onClick={logout} title="تسجيل الخروج">
          ⏻
        </button>
        <div className="avatar">{initials}</div>
      </div>
    </div>
  );
}
