import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext.js";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import Sidebar from "./components/layout/Sidebar.js";
import Topbar from "./components/layout/Topbar.js";
import ScrollToTop from "./components/layout/ScrollToTop.js";
import Dashboard from "./dashboard/Dashboard.js";
import ProductList from "./pages/products/ProductList.js";
import Employees from "./pages/employee/Employees.js";
import AttendanceLog from "./pages/attendance/AttendanceLog.js";
import AttendanceReport from "./pages/attendance/AttendanceReport.js";
import ProfilePage from "./pages/profile/ProfilePage.js";

// Stock Pages
import StockOverview from "./pages/stock/StockOverview.js";
import Expenses from "./pages/expenses/Expenses.js";
import ExpenseReport from "./pages/expenses/ExpenseReport.js";
import StockTransfer from "./pages/stock/StockTransfer.js";
import LowStockAlert from "./pages/stock/LowStockAlert.js";

// Production Pages
import ProductionPlan from "./pages/production/ProductionPlan.js";
import DailyProduction from "./pages/production/Daily.js";

// Auth Pages
import Login from "./pages/login/Login.js";

// Report Pages
import StockReport from "./pages/reports/StockReport.js";
import ProductionReportPage from "./pages/reports/ProductionReport.js";
import SalesReport from "./pages/reports/SalesReport.js";
import EmployeeReport from "./pages/reports/EmployeeReport.js";
import FinancialReport from "./pages/reports/FinancialReport.js";
import CheckPage from "./pages/CheckPage.js";

// Client Pages
import Clients from "./pages/clients/Clients.js";

import Sales from "./pages/sales/Sales.js";
import Help from "./pages/Help.js";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

// Public Route Component (Redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppLayout = ({ children }) => {
  const { loading } = useAppContext();
  
  return (
    <div className="dashboard-wrapper">
      {loading && (
        <div className="glass-loading-overlay">
          <div className="premium-spinner"></div>
          <span>Syncing records...</span>
        </div>
      )}
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
    <AuthProvider>
      <AppProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Auth */}
            <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />

            {/* Stock Management */}
            <Route path="/stock" element={<ProtectedRoute><AppLayout><StockOverview /></AppLayout></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><AppLayout><Expenses /></AppLayout></ProtectedRoute>} />
            <Route path="/expenses/report" element={<ProtectedRoute><AppLayout><ExpenseReport /></AppLayout></ProtectedRoute>} />
            <Route path="/stock/transfer" element={<ProtectedRoute><AppLayout><StockTransfer /></AppLayout></ProtectedRoute>} />
            <Route path="/stock/low-stock" element={<ProtectedRoute><AppLayout><LowStockAlert /></AppLayout></ProtectedRoute>} />

            {/* Products */}
            <Route path="/products" element={<ProtectedRoute><AppLayout><ProductList /></AppLayout></ProtectedRoute>} />

            {/* Production */}
            <Route path="/production/plan" element={<ProtectedRoute><AppLayout><ProductionPlan /></AppLayout></ProtectedRoute>} />
            <Route path="/production/daily" element={<ProtectedRoute><AppLayout><DailyProduction /></AppLayout></ProtectedRoute>} />

            {/* Employees */}
            <Route path="/employees" element={<ProtectedRoute><AppLayout><Employees /></AppLayout></ProtectedRoute>} />
            <Route path="/employees/:id" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />

            {/* Profile */}
            <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />

            <Route path="/clients" element={<ProtectedRoute><AppLayout><Clients /></AppLayout></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><AppLayout><Sales /></AppLayout></ProtectedRoute>} />

            {/* Attendance */}
            <Route path="/attendance" element={<ProtectedRoute><AppLayout><AttendanceLog /></AppLayout></ProtectedRoute>} />
            <Route path="/attendance-report" element={<ProtectedRoute><AppLayout><AttendanceReport /></AppLayout></ProtectedRoute>} />

            {/* Reports */}
            <Route path="/reports/stock" element={<ProtectedRoute><AppLayout><StockReport /></AppLayout></ProtectedRoute>} />
            <Route path="/reports/production" element={<ProtectedRoute><AppLayout><ProductionReportPage /></AppLayout></ProtectedRoute>} />
            <Route path="/reports/sales" element={<ProtectedRoute><AppLayout><SalesReport /></AppLayout></ProtectedRoute>} />
            <Route path="/reports/employees" element={<ProtectedRoute><AppLayout><EmployeeReport /></AppLayout></ProtectedRoute>} />
            <Route path="/reports/financial" element={<ProtectedRoute><AppLayout><FinancialReport /></AppLayout></ProtectedRoute>} />

            {/* Check System Status */}
            <Route path="/check" element={<ProtectedRoute><AppLayout><CheckPage /></AppLayout></ProtectedRoute>} />

            {/* Help */}
            <Route path="/help" element={<ProtectedRoute><AppLayout><Help /></AppLayout></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<ProtectedRoute><AppLayout><div>404 - Page Not Found</div></AppLayout></ProtectedRoute>} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;