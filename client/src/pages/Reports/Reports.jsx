import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import { DownloadIcon } from "../../components/Icons/Icons";

function statusForInvoice(total, paid) {
  if (paid >= total && total > 0) return "مدفوع";
  if (paid > 0) return "جزئي";
  return "غير مدفوع";
}
import { printReport } from "../../utils/printDocument";
import { useCollection } from "../../api/useCollection";
import { salesInvoicesApi, distributionTripsApi, expensesApi, purchaseOrdersApi } from "../../api/resources";
import { useSettings } from "../../context/SettingsContext";
import { purchaseCostForOrders } from "../../utils/purchaseCalc";
import "./Reports.css";

const reportTabs = [
  { key: "daily", icon: "📅", title: "التقرير اليومي", desc: "ملخص عمليات اليوم" },
  { key: "weekly", icon: "⚖️", title: "تقرير التسوية الأسبوعية", desc: "حسابات الأسبوع الكاملة" },
  { key: "pl", icon: "📈", title: "الأرباح والخسائر", desc: "تحليل مالي شامل" },
];

const WEEKDAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoString(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function weekdayName(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return WEEKDAY_NAMES[d.getUTCDay()];
}


function findRouteSupplier(invoice, trips) {
  const match = trips.find((t) => t.date === invoice.date && t.slaughterhouse === invoice.slaughterhouse);
  return match?.supplier || null;
}

function buildWeeks() {
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let d = 6; d >= 0; d--) {
      days.push(daysAgoString(w * 7 + d));
    }
    weeks.push({ key: w, label: `من ${days[0]} إلى ${days[6]}`, days });
  }
  return weeks;
}

function monthsFromData(invoices, trips, expenses) {
  const set = new Set();
  [...invoices, ...trips, ...expenses].forEach((r) => set.add(r.date.slice(0, 7)));
  return Array.from(set).sort();
}

function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString("ar", { month: "long", year: "numeric" });
}

function DailyReport({ invoices, trips, expenses, orders, today, settings, fmtMoney, fmtWeight, exportRef }) {
  const todayTrips = trips.filter((t) => t.date === today);
  const todayOrders = orders.filter((o) => o.date === today);
  const todayInvoices = invoices.filter((i) => i.date === today);
  const todayExpenses = expenses.filter((e) => e.date === today);

  const cages = todayOrders.reduce((sum, o) => sum + (o.cages || 0), 0);
  const weightKg = todayOrders.reduce((sum, o) => sum + (o.weightKg || 0), 0);
  const sales = todayInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const purchases = purchaseCostForOrders(orders, today, today);
  const transportCost = todayTrips.reduce((sum, t) => sum + (t.transportCost || 0), 0);
  const expensesTotal = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = sales - purchases - transportCost - expensesTotal;
  const profitMargin = sales > 0 ? ((netProfit / sales) * 100).toFixed(1) : "0.0";

  function handleExport() {
    printReport({
      settings,
      title: "التقرير اليومي",
      subtitle: today,
      summaryLines: [
        ["الأقفاص", cages],
        ["الوزن", fmtWeight(weightKg)],
        ["المشتريات", fmtMoney(purchases)],
        ["المبيعات", fmtMoney(sales)],
        ["تكاليف النقل", fmtMoney(transportCost)],
        ["المصاريف", fmtMoney(expensesTotal)],
        ["صافي الربح", fmtMoney(netProfit)],
        ["هامش الربح", `${profitMargin}%`],
      ],
      columns: ["المسلخ", "الأقفاص", "الإجمالي", "حالة الدفع"],
      rows: todayInvoices.map((inv) => [inv.slaughterhouse, inv.cages, fmtMoney(inv.total), statusForInvoice(inv.total, inv.paid || 0)]),
    });
  }

  useEffect(() => {
    if (exportRef) exportRef.current = handleExport;
  });

  return (
    <div>
      <div className="reports-banner">
        <p className="reports-banner-date">التقرير اليومي — {today}</p>
        <div className="reports-banner-grid">
          <div>
            <p className="reports-banner-label">الأقفاص</p>
            <p className="reports-banner-value">{cages}</p>
          </div>
          <div>
            <p className="reports-banner-label">الوزن</p>
            <p className="reports-banner-value">{fmtWeight(weightKg)}</p>
          </div>
          <div>
            <p className="reports-banner-label">المشتريات</p>
            <p className="reports-banner-value">{fmtMoney(purchases)}</p>
          </div>
          <div>
            <p className="reports-banner-label">المبيعات</p>
            <p className="reports-banner-value">{fmtMoney(sales)}</p>
          </div>
        </div>
      </div>

      <div className="page-grid page-grid-2">
        <Card>
          <div className="section-header">
            <h2 className="section-title">الملخص المالي اليومي</h2>
          </div>
          <div className="reports-summary-list">
            <div className="reports-summary-row">
              <span>إجمالي المبيعات</span>
              <span className="reports-summary-positive">{fmtMoney(sales)}</span>
            </div>
            <div className="reports-summary-row">
              <span>إجمالي المشتريات</span>
              <span className="td-negative">{fmtMoney(purchases)}</span>
            </div>
            <div className="reports-summary-row">
              <span>تكاليف النقل</span>
              <span className="td-negative">{fmtMoney(transportCost)}</span>
            </div>
            <div className="reports-summary-row">
              <span>المصاريف</span>
              <span className="td-negative">{fmtMoney(expensesTotal)}</span>
            </div>
            <div className="reports-summary-row reports-summary-divider">
              <span>صافي الربح</span>
              <span className={netProfit >= 0 ? "reports-summary-positive" : "td-negative"}>{fmtMoney(netProfit)}</span>
            </div>
            <div className="reports-summary-row">
              <span>هامش الربح</span>
              <span className="reports-summary-warning">{profitMargin}%</span>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="section-title">توزيع اليوم</h2>
          {todayInvoices.length === 0 && <p className="state-message">لا توجد فواتير اليوم</p>}
          <div className="reports-distribution-list">
            {todayInvoices.slice(0, 6).map((inv) => {
              const supplier = findRouteSupplier(inv, trips);
              return (
                <div key={inv.id} className="reports-distribution-row">
                  <div>
                    <p className="reports-distribution-name">{supplier ? `${supplier} ← ${inv.slaughterhouse}` : inv.slaughterhouse}</p>
                    <p className="reports-distribution-cages">{inv.cages} قفص</p>
                  </div>
                  <div className="reports-distribution-amount">
                    <p>{fmtMoney(inv.total)}</p>
                    <StatusBadge status={statusForInvoice(inv.total, inv.paid || 0)} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function WeeklyReport({ invoices, trips, expenses, orders, settings, fmtMoney, exportRef }) {
  const weeks = useMemo(buildWeeks, []);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const week = weeks[selectedWeek];

  const rows = week.days.map((date) => {
    const dayTrips = trips.filter((t) => t.date === date);
    const dayOrders = orders.filter((o) => o.date === date);
    const dayInvoices = invoices.filter((i) => i.date === date);
    const dayExpenses = expenses.filter((e) => e.date === date);
    const cages = dayOrders.reduce((sum, o) => sum + (o.cages || 0), 0);
    const purchases = purchaseCostForOrders(orders, date, date);
    const sales = dayInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const transportCost = dayTrips.reduce((sum, t) => sum + (t.transportCost || 0), 0);
    const expensesTotal = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    return {
      date,
      dayName: weekdayName(date),
      cages,
      purchases,
      sales,
      transportCost,
      expensesTotal,
      profit: sales - purchases - transportCost - expensesTotal,
      tripsCount: dayTrips.length,
    };
  });

  const weekProfit = rows.reduce((sum, r) => sum + r.profit, 0);
  const weekPurchases = rows.reduce((sum, r) => sum + r.purchases, 0);
  const weekSales = rows.reduce((sum, r) => sum + r.sales, 0);
  const weekTransport = rows.reduce((sum, r) => sum + r.transportCost, 0);
  const weekExpenses = rows.reduce((sum, r) => sum + r.expensesTotal, 0);

  function handleExport() {
    printReport({
      settings,
      title: "تقرير التسوية الأسبوعية",
      subtitle: week.label,
      summaryLines: [
        ["صافي الربح الأسبوعي", fmtMoney(weekProfit)],
        ["إجمالي المشتريات", fmtMoney(weekPurchases)],
        ["إجمالي المبيعات", fmtMoney(weekSales)],
        ["تكاليف النقل", fmtMoney(weekTransport)],
        ["المصاريف", fmtMoney(weekExpenses)],
      ],
      columns: ["اليوم", "الأقفاص", "المشتريات", "تكاليف النقل", "المصاريف", "المبيعات", "الربح", "الرحلات"],
      rows: rows.map((r) => [
        r.dayName,
        r.cages,
        fmtMoney(r.purchases),
        fmtMoney(r.transportCost),
        fmtMoney(r.expensesTotal),
        fmtMoney(r.sales),
        fmtMoney(r.profit),
        `${r.tripsCount} رحلات`,
      ]),
    });
  }

  useEffect(() => {
    if (exportRef) exportRef.current = handleExport;
  });

  return (
    <div>
      <div className="reports-week-toolbar">
        <select value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))} className="reports-week-select">
          {weeks.map((w) => (
            <option key={w.key} value={w.key}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      <div className="page-grid page-grid-3 reports-week-stats">
        <Card>
          <p className="reports-stat-label">صافي الربح الأسبوعي</p>
          <p className="reports-stat-value">{fmtMoney(weekProfit)}</p>
        </Card>
        <Card>
          <p className="reports-stat-label">إجمالي المشتريات</p>
          <p className="reports-stat-value">{fmtMoney(weekPurchases)}</p>
        </Card>
        <Card>
          <p className="reports-stat-label">إجمالي المبيعات</p>
          <p className="reports-stat-value">{fmtMoney(weekSales)}</p>
        </Card>
        <Card>
          <p className="reports-stat-label">تكاليف النقل</p>
          <p className="reports-stat-value reports-stat-value-negative">{fmtMoney(weekTransport)}</p>
        </Card>
        <Card>
          <p className="reports-stat-label">المصاريف</p>
          <p className="reports-stat-value reports-stat-value-negative">{fmtMoney(weekExpenses)}</p>
        </Card>
      </div>

      <Card>
        <h2 className="section-title">{week.label}</h2>
        <div className="reports-week-table-scroll">
          <div className="reports-week-table">
          <div className="reports-week-header">
            <span>اليوم</span>
            <span>الأقفاص</span>
            <span>المشتريات</span>
            <span>تكاليف النقل</span>
            <span>المصاريف</span>
            <span>المبيعات</span>
            <span>الربح</span>
            <span>الرحلات</span>
          </div>
          {rows.map((r) => (
            <div key={r.date} className="reports-week-row">
              <span className="td-muted">{r.dayName}</span>
              <span>{r.cages}</span>
              <span className="td-negative">{fmtMoney(r.purchases)}</span>
              <span className="td-negative">{fmtMoney(r.transportCost)}</span>
              <span className="td-negative">{fmtMoney(r.expensesTotal)}</span>
              <span>{fmtMoney(r.sales)}</span>
              <span className={r.profit >= 0 ? "reports-summary-positive" : "td-negative"}>{fmtMoney(r.profit)}</span>
              <span className="td-brand">{r.tripsCount} رحلات</span>
            </div>
          ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProfitLossReport({ invoices, trips, expenses, orders, settings, fmtMoney, exportRef }) {
  const months = useMemo(() => monthsFromData(invoices, trips, expenses), [invoices, trips, expenses]);
  const defaultMonth = useMemo(() => {
    if (months.length === 0) return null;
    const counts = {};
    invoices.forEach((i) => {
      const ym = i.date.slice(0, 7);
      counts[ym] = (counts[ym] || 0) + 1;
    });
    return months.reduce((best, ym) => ((counts[ym] || 0) > (counts[best] || 0) ? ym : best), months[0]);
  }, [months, invoices]);

  const [selectedMonth, setSelectedMonth] = useState("");
  useEffect(() => {
    if (!selectedMonth && defaultMonth) setSelectedMonth(defaultMonth);
  }, [selectedMonth, defaultMonth]);

  const weeks = useMemo(buildWeeks, []);

  const weeklyProfitSeries = weeks
    .slice()
    .reverse()
    .map((w, idx) => {
      const weekInvoices = invoices.filter((i) => w.days.includes(i.date));
      const sales = weekInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
      const purchases = purchaseCostForOrders(orders, w.days[0], w.days[6]);
      return { week: `الأسبوع ${idx + 1}`, profit: sales - purchases };
    });

  if (!selectedMonth) {
    return (
      <Card>
        <p className="state-message">لا توجد بيانات كافية لعرض تقرير الأرباح والخسائر</p>
      </Card>
    );
  }

  const monthInvoices = invoices.filter((i) => i.date.startsWith(selectedMonth));
  const monthTrips = trips.filter((t) => t.date.startsWith(selectedMonth));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));

  const poultrySales = monthInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const deliveryFees = monthTrips.reduce((sum, t) => sum + (t.transportCost || 0), 0);
  const totalRevenue = poultrySales + deliveryFees;

  const monthEndDate = `${selectedMonth}-31`;
  const purchaseCost = purchaseCostForOrders(orders, `${selectedMonth}-01`, monthEndDate);
  const transportCost = monthTrips.reduce((sum, t) => sum + (t.transportCost || 0), 0);
  const otherExpenses = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpenses = purchaseCost + transportCost + otherExpenses;

  const netProfit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  function handleExport() {
    printReport({
      settings,
      title: `تقرير الأرباح والخسائر — ${monthLabel(selectedMonth)}`,
      summaryLines: [
        ["مبيعات الدواجن", fmtMoney(poultrySales)],
        ["رسوم التوصيل", fmtMoney(deliveryFees)],
        ["إجمالي الإيرادات", fmtMoney(totalRevenue)],
        ["تكلفة الشراء", fmtMoney(purchaseCost)],
        ["تكاليف النقل", fmtMoney(transportCost)],
        ["المصاريف التشغيلية", fmtMoney(otherExpenses)],
        ["إجمالي المصروفات", fmtMoney(totalExpenses)],
        ["صافي الربح", fmtMoney(netProfit)],
        ["هامش الربح", `${margin}%`],
      ],
    });
  }

  useEffect(() => {
    if (exportRef) exportRef.current = handleExport;
  });

  return (
    <div>
      <div className="reports-week-toolbar">
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="reports-week-select">
          {months.map((ym) => (
            <option key={ym} value={ym}>
              {monthLabel(ym)}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <h2 className="section-title">تقرير الأرباح والخسائر — {monthLabel(selectedMonth)}</h2>
        <div className="pl-columns">
          <div className="pl-column">
            <h3 className="pl-column-title">الإيرادات</h3>
            <div className="reports-summary-row">
              <span>مبيعات الدواجن</span>
              <span className="reports-summary-positive">{fmtMoney(poultrySales)}</span>
            </div>
            <div className="reports-summary-row">
              <span>رسوم التوصيل</span>
              <span className="reports-summary-positive">{fmtMoney(deliveryFees)}</span>
            </div>
            <div className="reports-summary-row reports-summary-divider">
              <span>إجمالي الإيرادات</span>
              <span className="reports-summary-positive">{fmtMoney(totalRevenue)}</span>
            </div>
          </div>
          <div className="pl-column">
            <h3 className="pl-column-title">المصروفات</h3>
            <div className="reports-summary-row">
              <span>تكلفة الشراء</span>
              <span className="td-negative">{fmtMoney(purchaseCost)}</span>
            </div>
            <div className="reports-summary-row">
              <span>تكاليف النقل</span>
              <span className="td-negative">{fmtMoney(transportCost)}</span>
            </div>
            <div className="reports-summary-row">
              <span>المصاريف التشغيلية</span>
              <span className="td-negative">{fmtMoney(otherExpenses)}</span>
            </div>
            <div className="reports-summary-row reports-summary-divider">
              <span>إجمالي المصروفات</span>
              <span className="td-negative">{fmtMoney(totalExpenses)}</span>
            </div>
          </div>
        </div>

        <div className="pl-net-banner">
          <div>
            <p className="pl-net-label">صافي الربح لشهر {monthLabel(selectedMonth)}</p>
            <p className="pl-net-value">{fmtMoney(netProfit)}</p>
          </div>
          <p className="pl-net-margin">هامش ربح {margin}%</p>
        </div>
      </Card>

      <Card className="pl-chart-card">
        <h2 className="section-title">تطور الأرباح</h2>
        <div className="pl-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyProfitSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DFC9" />
              <XAxis dataKey="week" tick={{ fill: "#5c584e", fontSize: 12 }} />
              <YAxis tick={{ fill: "#5c584e", fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ borderRadius: 12, border: "1px solid #E8DFC9", fontFamily: "IBM Plex Sans Arabic" }} />
              <Bar dataKey="profit" name="الربح" fill="#16342b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

export default function Reports() {
  const [active, setActive] = useState("daily");
  const { items: invoices, loading: loadingInvoices } = useCollection(salesInvoicesApi);
  const { items: trips, loading: loadingTrips } = useCollection(distributionTripsApi);
  const { items: expenses, loading: loadingExpenses } = useCollection(expensesApi);
  const { items: orders, loading: loadingOrders } = useCollection(purchaseOrdersApi);
  const { settings, fmtMoney, fmtWeight } = useSettings();

  const loading = loadingInvoices || loadingTrips || loadingExpenses || loadingOrders;
  const today = todayString();
  const activeExportRef = useRef(null);

  return (
    <div>
      <PageHeader
        title="التقارير"
        subtitle="تقارير مالية وتشغيلية متكاملة"
        actions={
          <button className="btn-add" onClick={() => activeExportRef.current?.()}>
            <DownloadIcon /> تصدير PDF
          </button>
        }
      />

      <div className="tabs">
        {reportTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`tabs-item ${active === t.key ? "tabs-item-active" : ""}`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {loading && <p className="state-message">جارٍ التحميل...</p>}

      {!loading && (
        <div>
          {active === "daily" && (
            <DailyReport
              invoices={invoices}
              trips={trips}
              expenses={expenses}
              orders={orders}
              today={today}
              settings={settings}
              fmtMoney={fmtMoney}
              fmtWeight={fmtWeight}
              exportRef={activeExportRef}
            />
          )}
          {active === "weekly" && (
            <WeeklyReport invoices={invoices} trips={trips} expenses={expenses} orders={orders} settings={settings} fmtMoney={fmtMoney} exportRef={activeExportRef} />
          )}
          {active === "pl" && (
            <ProfitLossReport invoices={invoices} trips={trips} expenses={expenses} orders={orders} settings={settings} fmtMoney={fmtMoney} exportRef={activeExportRef} />
          )}
        </div>
      )}
    </div>
  );
}
