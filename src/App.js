import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar.js";
import Topbar from "./components/layout/Topbar.js";
import Dashboard from "./dashboard/Dashboard.js";
import ProductList from "./pages/ProductList.js";
import Employees from "./pages/Employees.js"; 
import AttendanceLog from "./pages/AttendanceLog.js";


const Stock = () => <div className="content-area p-8">Stock Page</div>;
const StockPurchased = () => <div className="content-area p-8">Stock Purchased Page</div>;
const Clients = () => <div className="content-area p-8">Clients Page</div>;
const Attendance = () => <div className="content-area p-8">Attendance Page</div>;
const Reports = () => <div className="content-area p-8">Reports Page</div>;

const AppLayout = ({ children }) => {
  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="right-area">
        <Topbar />
        {children}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/stock" element={<AppLayout><Stock /></AppLayout>} />
        <Route path="/products" element={<AppLayout><ProductList /></AppLayout>} />
        <Route path="/purchased" element={<AppLayout><StockPurchased /></AppLayout>} />
        <Route path="/employees" element={<AppLayout><Employees /></AppLayout>} />
        <Route path="/clients" element={<AppLayout><Clients /></AppLayout>} />
        <Route path="/attendance" element={<AppLayout><AttendanceLog /></AppLayout>} />
        <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
      </Routes>
    </Router>
  );
};

export default App;