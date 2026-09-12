import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { SettingsProvider } from "../context/SettingsContext";
import Layout from "../layout/Layout/Layout";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Suppliers from "../pages/Suppliers/Suppliers";
import SupplierDetail from "../pages/SupplierDetail/SupplierDetail";
import Slaughterhouses from "../pages/Slaughterhouses/Slaughterhouses";
import SlaughterhouseDetail from "../pages/SlaughterhouseDetail/SlaughterhouseDetail";
import DailyPricing from "../pages/DailyPricing/DailyPricing";
import PriceDetail from "../pages/PriceDetail/PriceDetail";
import SalesInvoices from "../pages/SalesInvoices/SalesInvoices";
import DistributionTrips from "../pages/DistributionTrips/DistributionTrips";
import TripDetail from "../pages/TripDetail/TripDetail";
import FleetManagement from "../pages/FleetManagement/FleetManagement";
import Expenses from "../pages/Expenses/Expenses";
import Accounts from "../pages/Accounts/Accounts";
import Reports from "../pages/Reports/Reports";
import Settings from "../pages/Settings/Settings";

function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return null;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function RequireIT({ children }) {
  const { user } = useAuth();
  if (user?.role !== "IT") return <Navigate to="/" replace />;
  return children;
}

function RoutesInner() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/suppliers/:id" element={<SupplierDetail />} />
        <Route path="/slaughterhouses" element={<Slaughterhouses />} />
        <Route path="/slaughterhouses/:id" element={<SlaughterhouseDetail />} />
        <Route path="/pricing" element={<DailyPricing />} />
        <Route path="/pricing/:id" element={<PriceDetail />} />
        <Route path="/invoices" element={<SalesInvoices />} />
        <Route path="/trips" element={<DistributionTrips />} />
        <Route path="/trips/:id" element={<TripDetail />} />
        <Route path="/fleet" element={<FleetManagement />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/reports" element={<Reports />} />
        <Route
          path="/settings"
          element={
            <RequireIT>
              <Settings />
            </RequireIT>
          }
        />
      </Route>
    </Routes>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <RoutesInner />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
