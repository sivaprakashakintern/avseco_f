import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext.js";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import ProtectedRoute from "./components/ProtectedRoute.js";
import UnauthorizedPage from "./pages/UnauthorizedPage.js";
import ManageAccess from "./pages/ManageAccess.jsx";
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
import ChangePasswordModal from "./components/ChangePasswordModal.jsx";

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
  const { loading: appLoading, isUpdating } = useAppContext();
  const { user } = useAuth();
  
    return (
    <div className="dashboard-wrapper">
      {!appLoading && isUpdating && (
        <div className="update-loading-overlay">
          <div className="mini-spinner"></div>
          <span>Updating...</span>
        </div>
      )}
      
      {/* Force password change for new credentials */}
      <ChangePasswordModal 
        isOpen={user?.isFirstLogin} 
        onClose={() => {}} // User cannot close without changing
      />

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
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute module="dashboard">
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Stock Management */}
            <Route path="/stock" element={
              <ProtectedRoute module="stock">
                <AppLayout><StockOverview /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute module="stock">
                <AppLayout><Expenses /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/expenses/report" element={
              <ProtectedRoute module="stock">
                <AppLayout><ExpenseReport /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/stock/transfer" element={
              <ProtectedRoute module="stock">
                <AppLayout><StockTransfer /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/stock/low-stock" element={
              <ProtectedRoute module="stock">
                <AppLayout><LowStockAlert /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Products */}
            <Route path="/products" element={
              <ProtectedRoute module="products">
                <AppLayout><ProductList /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Production */}
            <Route path="/production/plan" element={
              <ProtectedRoute module="production">
                <AppLayout><ProductionPlan /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/production/daily" element={
              <ProtectedRoute module="production">
                <AppLayout><DailyProduction /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Employees */}
            <Route path="/employees" element={
              <ProtectedRoute module="employees">
                <AppLayout><Employees /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Admin Management */}
            <Route path="/admin/manage-access" element={
              <ProtectedRoute adminOnly={true}>
                <AppLayout><ManageAccess /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Clients */}
            <Route path="/clients" element={
              <ProtectedRoute module="clients">
                <AppLayout><Clients /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Sales */}
            <Route path="/sales" element={
              <ProtectedRoute module="sales">
                <AppLayout><Sales /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Attendance */}
            <Route path="/attendance" element={
              <ProtectedRoute module="attendance">
                <AppLayout><AttendanceLog /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/attendance-report" element={
              <ProtectedRoute module="attendance">
                <AppLayout><AttendanceReport /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Reports */}
            <Route path="/reports/stock" element={<ProtectedRoute module="reports"><AppLayout><StockReport /></AppLayout></ProtectedRoute>} />
            <Route path="/reports/production" element={<ProtectedRoute module="reports"><AppLayout><ProductionReportPage /></AppLayout></ProtectedRoute>} />
            <Route path="/reports/sales" element={<ProtectedRoute module="reports"><AppLayout><SalesReport /></AppLayout></ProtectedRoute>} />
            <Route path="/reports/employees" element={<ProtectedRoute module="reports"><AppLayout><EmployeeReport /></AppLayout></ProtectedRoute>} />
            <Route path="/reports/financial" element={<ProtectedRoute module="reports"><AppLayout><FinancialReport /></AppLayout></ProtectedRoute>} />

            {/* Profile (Self-access usually allowed) */}
            <Route path="/profile" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />
            <Route path="/employees/:id" element={<ProtectedRoute module="employees"><AppLayout><ProfilePage /></AppLayout></ProtectedRoute>} />

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