import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar.js";
import Topbar from "./components/layout/Topbar.js";
import Dashboard from "./dashboard/Dashboard.js";
import ProductList from "./pages/ProductList.js";
import Employees from "./pages/Employees.js";
import AttendanceLog from "./pages/AttendanceLog.js";
import AttendanceReport from "./pages/AttendanceReport.js";
import ProfilePage from "./pages/ProfilePage.js";
import SettingsPage from "./pages/SettingsPage.js";

// Stock Pages
import StockOverview from "./pages/stock/StockOverview.js";
import StockPurchased from "./pages/stock/StockPurchased.js";
import Expenses from "./pages/Expenses.js";
import ExpenseReport from "./pages/ExpenseReport.js";
import StockTransfer from "./pages/stock/StockTransfer.js";
import Production from "./pages/stock/Production.js";
import LowStockAlert from "./pages/stock/LowStockAlert.js";

// ✅ IMPORT PRODUCTION PLAN (ONLY THIS ONE)
import ProductionPlan from "./pages/production/ProductionPlan.js";
import DailyProduction from "./pages/production/Daily.js";

// Auth Pages
import Login from "./pages/Login.js";

// Report Pages
import StockReport from "./pages/reports/StockReport.js";
import ProductionReportPage from "./pages/reports/ProductionReport.js";
import SalesReport from "./pages/reports/SalesReport.js";
import EmployeeReport from "./pages/reports/EmployeeReport.js";
import FinancialReport from "./pages/reports/FinancialReport.js";
import CheckPage from "./pages/CheckPage.js";

// Client Pages
import Clients from "./pages/clients/Clients.js";

// Help Page
import Help from "./pages/Help.js";

const AppLayout = ({ children }) => {
  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="right-area">
        <Topbar />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />

        {/* Stock Management */}
        <Route path="/stock" element={<AppLayout><StockOverview /></AppLayout>} />
        <Route path="/expenses" element={<AppLayout><Expenses /></AppLayout>} />
        <Route path="/expenses/report" element={<AppLayout><ExpenseReport /></AppLayout>} />
        <Route path="/stock/transfer" element={<AppLayout><StockTransfer /></AppLayout>} />
        <Route path="/stock/production" element={<AppLayout><Production /></AppLayout>} />
        <Route path="/stock/low-stock" element={<AppLayout><LowStockAlert /></AppLayout>} />

        {/* Products */}
        <Route path="/products" element={<AppLayout><ProductList /></AppLayout>} />

        {/* ===== PRODUCTION PLAN - ONLY ROUTE ===== */}
        <Route path="/production/plan" element={<AppLayout><ProductionPlan /></AppLayout>} />
        <Route path="/production/daily" element={<AppLayout><DailyProduction /></AppLayout>} />

        {/* Employees */}
        <Route path="/employees" element={<AppLayout><Employees /></AppLayout>} />
        <Route path="/employees/:id" element={<AppLayout><ProfilePage /></AppLayout>} />

        {/* Profile */}
        <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
        <Route path="/profile/:id" element={<AppLayout><ProfilePage /></AppLayout>} />

        {/* Clients */}
        <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />

        {/* Attendance */}
        <Route path="/attendance" element={<AppLayout><AttendanceLog /></AppLayout>} />
        <Route path="/attendance-report" element={<AppLayout><AttendanceReport /></AppLayout>} />

        {/* Reports */}
        <Route path="/reports/stock" element={<AppLayout><StockReport /></AppLayout>} />
        <Route path="/reports/production" element={<AppLayout><ProductionReportPage /></AppLayout>} />
        <Route path="/reports/sales" element={<AppLayout><SalesReport /></AppLayout>} />
        <Route path="/reports/employees" element={<AppLayout><EmployeeReport /></AppLayout>} />
        <Route path="/reports/financial" element={<AppLayout><FinancialReport /></AppLayout>} />

        {/* Check System Status */}
        <Route path="/check" element={<AppLayout><CheckPage /></AppLayout>} />

        {/* Settings */}
        <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />

        {/* Help */}
        <Route path="/help" element={<AppLayout><Help /></AppLayout>} />

        {/* 404 */}
        <Route path="*" element={<AppLayout><div>404 - Page Not Found</div></AppLayout>} />
      </Routes>
    </Router>
  );
};

export default App;