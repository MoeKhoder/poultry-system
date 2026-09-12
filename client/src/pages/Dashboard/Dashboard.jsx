import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PageHeader from "../../components/PageHeader/PageHeader";
import Card from "../../components/Card/Card";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import { Table, Td } from "../../components/DataTable/DataTable";
import { UsersIcon, ReceiptIcon, WalletIcon, TruckIcon, TrendUpIcon, TrendDownIcon, CalendarIcon } from "../../components/Icons/Icons";
import { useSettings } from "../../context/SettingsContext";
import { purchaseCostForOrders } from "../../utils/purchaseCalc";
import { useCollection } from "../../api/useCollection";
import { suppliersApi, slaughterhousesApi, salesInvoicesApi, distributionTripsApi, purchaseOrdersApi, expensesApi, accountsSummaryApi } from "../../api/resources";
import "./Dashboard.css";

const ARABIC_WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const ARABIC_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function statusForInvoice(total, paid) {
  if (paid >= total && total > 0) return "مدفوع";
  if (paid > 0) return "جزئي";
  return "غير مدفوع";
}

function statusForOrder(total, paid) {
  if (paid >= total && total > 0) return "مدفوع";
  if (paid > 0) return "جزئي";
  return "غير مدفوع";
}

function todayDisplay() {
  const d = new Date();
  return `${ARABIC_WEEKDAYS[d.getDay()]}، ${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function daysAgoString(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function trendPercent(today, yesterday) {
  if (yesterday <= 0) return null;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

function buildWeeklyChart(invoices, orders) {
  const days = [];
  for (let n = 6; n >= 0; n--) {
    const date = daysAgoString(n);
    const sales = invoices.filter((i) => i.date === date).reduce((sum, i) => sum + (i.total || 0), 0);
    const purchases = purchaseCostForOrders(orders, date, date);
    days.push({ date, sales, purchases });
  }
  return days;
}

export default function Dashboard() {
  const { items: suppliers, loading: loadingSuppliers, reload: reloadSuppliers } = useCollection(suppliersApi);
  const { items: slaughterhouses, loading: loadingSlaughterhouses, reload: reloadSlaughterhouses } = useCollection(slaughterhousesApi);
  const { items: invoices, loading: loadingInvoices, reload: reloadInvoices } = useCollection(salesInvoicesApi);
  const { items: trips, loading: loadingTrips, reload: reloadTrips } = useCollection(distributionTripsApi);
  const { items: purchaseOrders, loading: loadingOrders, reload: reloadOrders } = useCollection(purchaseOrdersApi);
  const { items: expenses, loading: loadingExpenses, reload: reloadExpenses } = useCollection(expensesApi);
  const { settings, fmtMoney, fmtWeight } = useSettings();
  const [summary, setSummary] = useState({ suppliers: [] });

  useEffect(() => {
    accountsSummaryApi.get().then(setSummary);
  }, [suppliers, purchaseOrders]);

  useEffect(() => {
    function reloadAll() {
      reloadSuppliers();
      reloadSlaughterhouses();
      reloadInvoices();
      reloadTrips();
      reloadOrders();
      reloadExpenses();
      accountsSummaryApi.get().then(setSummary);
    }
    const interval = setInterval(reloadAll, 30000);
    window.addEventListener("focus", reloadAll);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", reloadAll);
    };
  }, [reloadSuppliers, reloadSlaughterhouses, reloadInvoices, reloadTrips, reloadOrders, reloadExpenses]);

  const loading = loadingSuppliers || loadingSlaughterhouses || loadingInvoices || loadingTrips || loadingOrders || loadingExpenses;

  const today = daysAgoString(0);
  const yesterday = daysAgoString(1);

  const purchasesToday = purchaseCostForOrders(purchaseOrders, today, today);
  const purchasesYesterday = purchaseCostForOrders(purchaseOrders, yesterday, yesterday);
  const purchasesTrend = trendPercent(purchasesToday, purchasesYesterday);

  const salesToday = invoices.filter((i) => i.date === today).reduce((sum, i) => sum + (i.total || 0), 0);
  const salesYesterday = invoices.filter((i) => i.date === yesterday).reduce((sum, i) => sum + (i.total || 0), 0);
  const salesTrend = trendPercent(salesToday, salesYesterday);

  const supplierDebt = summary.suppliers.reduce((sum, s) => sum + (s.remaining || 0), 0);
  const suppliersWithDebt = summary.suppliers.filter((s) => s.remaining > 0);

  const tripsToday = trips.filter((t) => t.date === today);
  const tripsInProgress = tripsToday.filter((t) => t.status === "جارية").length;

  const uncollectedInvoices = invoices.filter((i) => (i.total || 0) - (i.paid || 0) > 0);

  const chartData = buildWeeklyChart(invoices, purchaseOrders);

  const recentPurchases = [...purchaseOrders].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);
  const recentSales = [...invoices].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);

  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        actions={
          <div className="date-input-display">
            <CalendarIcon />
            <span>{todayDisplay()}</span>
          </div>
        }
      />

      {loading && <p className="state-message">جارٍ التحميل...</p>}

      {!loading && (
        <>
          <div className="page-grid page-grid-4">
            <div className="stat-card stat-card-layout">
              <div>
                <p className="stat-card-label">مشتريات اليوم</p>
                <p className="stat-card-value">{fmtMoney(purchasesToday)}</p>
                {purchasesTrend !== null && (
                  <p className={`kpi-trend ${purchasesTrend >= 0 ? "kpi-trend-up" : "kpi-trend-down"}`}>
                    {purchasesTrend >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                    {Math.abs(purchasesTrend)}% عن أمس
                  </p>
                )}
              </div>
              <div className="stat-card-icon">
                <UsersIcon />
              </div>
            </div>
            <div className="stat-card stat-card-layout">
              <div>
                <p className="stat-card-label">مبيعات اليوم</p>
                <p className="stat-card-value">{fmtMoney(salesToday)}</p>
                {salesTrend !== null && (
                  <p className={`kpi-trend ${salesTrend >= 0 ? "kpi-trend-up" : "kpi-trend-down"}`}>
                    {salesTrend >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                    {Math.abs(salesTrend)}% عن أمس
                  </p>
                )}
              </div>
              <div className="stat-card-icon">
                <ReceiptIcon />
              </div>
            </div>
            <div className="stat-card stat-card-layout">
              <div>
                <p className="stat-card-label">مستحقات الموردين</p>
                <p className="stat-card-value">{fmtMoney(supplierDebt)}</p>
                <p className="kpi-trend">{suppliersWithDebt.length} مورد لديه مستحقات</p>
              </div>
              <div className="stat-card-icon">
                <WalletIcon />
              </div>
            </div>
            <div className="stat-card stat-card-layout">
              <div>
                <p className="stat-card-label">رحلات توزيع اليوم</p>
                <p className="stat-card-value">{tripsToday.length}</p>
                <p className="kpi-trend kpi-trend-up">
                  <TrendUpIcon /> {tripsInProgress} قيد التنفيذ
                </p>
              </div>
              <div className="stat-card-icon">
                <TruckIcon />
              </div>
            </div>
          </div>

          <div className="page-grid page-grid-2">
            <Card className="dashboard-chart-card">
              <div className="dashboard-chart-header">
                <div>
                  <h2 className="section-title dashboard-chart-title">المشتريات مقابل المبيعات</h2>
                  <p className="section-hint">آخر 7 أيام</p>
                </div>
                <div className="dashboard-chart-legend">
                  <span className="dashboard-legend-item">
                    <span className="dashboard-legend-swatch dashboard-legend-swatch-purchases" /> المشتريات
                  </span>
                  <span className="dashboard-legend-item">
                    <span className="dashboard-legend-swatch dashboard-legend-swatch-sales" /> المبيعات
                  </span>
                </div>
              </div>
              <div className="dashboard-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eff4f0" />
                    <XAxis dataKey="date" tick={{ fill: "#69766d", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#69766d", fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ borderRadius: 8, border: "1px solid #e1e8e2", fontFamily: "Cairo" }} />
                    <Line type="monotone" dataKey="purchases" name="المشتريات" stroke="#1e7145" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="sales" name="المبيعات" stroke="#b0740a" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <div className="section-header">
                <h2 className="section-title">تنبيهات وملخصات</h2>
              </div>
              <div className="dashboard-alerts">
                <div className="dashboard-alert-row">
                  <div>
                    <b>موردون بمستحقات متأخرة</b>
                    <span>{suppliersWithDebt.length} مورد</span>
                  </div>
                  <span className="badge badge-red">
                    <i className="badge-dot" />
                    تنبيه
                  </span>
                </div>
                <div className="dashboard-alert-row">
                  <div>
                    <b>فواتير غير محصّلة</b>
                    <span>{uncollectedInvoices.length} فاتورة</span>
                  </div>
                  <span className="badge badge-yellow">
                    <i className="badge-dot" />
                    متابعة
                  </span>
                </div>
                <div className="dashboard-alert-row">
                  <div>
                    <b>رحلات مجدولة اليوم</b>
                    <span>{tripsToday.length} رحلة</span>
                  </div>
                  <span className="badge badge-green">
                    <i className="badge-dot" />
                    جاهز
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="page-grid page-grid-2">
            <Card>
              <div className="section-header">
                <h2 className="section-title">أحدث المشتريات</h2>
                <span className="section-hint">من الموردين</span>
              </div>
              {recentPurchases.length === 0 && <p className="state-message">لا توجد عمليات</p>}
              {recentPurchases.length > 0 && (
                <Table
                  columns={["المورد", "التاريخ", "المبلغ", "الحالة"]}
                  rows={recentPurchases}
                  renderRow={(o) => (
                    <>
                      <Td className="td-strong">{o.supplierName}</Td>
                      <Td className="td-muted" dir="ltr">{o.date}</Td>
                      <Td>{fmtMoney(o.total)}</Td>
                      <Td>
                        <StatusBadge status={statusForOrder(o.total, o.paid || 0)} />
                      </Td>
                    </>
                  )}
                />
              )}
            </Card>
            <Card>
              <div className="section-header">
                <h2 className="section-title">أحدث المبيعات</h2>
                <span className="section-hint">فواتير البيع</span>
              </div>
              {recentSales.length === 0 && <p className="state-message">لا توجد عمليات</p>}
              {recentSales.length > 0 && (
                <Table
                  columns={["العميل", "التاريخ", "المبلغ", "الحالة"]}
                  rows={recentSales}
                  renderRow={(inv) => (
                    <>
                      <Td className="td-strong">{inv.slaughterhouse}</Td>
                      <Td className="td-muted" dir="ltr">{inv.date}</Td>
                      <Td>{fmtMoney(inv.total)}</Td>
                      <Td>
                        <StatusBadge status={statusForInvoice(inv.total, inv.paid || 0)} />
                      </Td>
                    </>
                  )}
                />
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
