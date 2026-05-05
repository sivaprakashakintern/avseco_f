import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from '../context/AppContext.js';
import { useAuth } from '../context/AuthContext.js';
import { formatCurrency } from '../utils/formatUtils.js';
import dayjs from 'dayjs';
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { hasAccess, user, isAdmin } = useAuth();
  const {
    expenses,
    totalExpenseAmount,
    expenseByCategory,
    todayStats,
    last7DaysTrend,
    totalSalesAmount,
    salesHistory,
    stockData,
    productionStats,
    productionTargets = [],
    attendanceRecords = {},
    productionHistory = []
  } = useAppContext();
  const [timeFilter, setTimeFilter] = useState("Monthly");

  // Helper to get formatted currency with shortening
  const formatStatValue = (val) => formatCurrency(val, true);
  
  const getAvailableSizes = () => {
    const sizesSet = new Set();
    
    // Get sizes from stock
    (stockData || []).forEach(item => {
      if (item.size && item.size !== 'All Sizes') sizesSet.add(item.size);
    });
    
    // Get sizes from production stats
    if (productionStats.monthBySize) {
      Object.keys(productionStats.monthBySize).forEach(size => {
        if (size !== 'All Sizes' && size !== 'total') sizesSet.add(size);
      });
    }

    // Get sizes from Today's production to be safe
    if (productionStats.todayBySize) {
      Object.keys(productionStats.todayBySize).forEach(size => {
        if (size !== 'All Sizes' && size !== 'total') sizesSet.add(size);
      });
    }
    
    // Basic sorting for "2 inch", "6-inch" etc.
    return Array.from(sizesSet).sort((a, b) => {
      const valA = parseFloat(a) || 0;
      const valB = parseFloat(b) || 0;
      return valA - valB;
    });
  };

  const dynamicSizes = getAvailableSizes();
  const attendanceNotMarked = hasAccess('attendance') && (!todayStats || todayStats.total === 0);
  const formatUnits = (val) => val >= 1000 ? `${(val / 1000).toFixed(1)}K Units` : `${val} Units`;

  const getMetrics = (period) => {
    let units = 0;
    if (period === 'Weekly') units = productionStats.week;
    else if (period === 'Monthly') units = productionStats.month;
    else units = productionStats.month || 0; // Use month Total if yearly not available

    const trendDisplay = "Optimal";

    return {
      salesValue: formatStatValue(totalSalesAmount),
      production: formatUnits(units),
      expenses: formatStatValue(totalExpenseAmount),
      salesGrowth: "Optimal",
      salesColor: "#10b981",
      prodGrowth: trendDisplay,
      expStatus: totalExpenseAmount > 500000 ? "Over Budget" : "Optimal",
      expColor: totalExpenseAmount > 500000 ? "#ef4444" : "#10b981"
    };
  };

  const getPlatesData = (period = 'Monthly') => {
    const sizes = dynamicSizes;
    const now = new Date();
    
    // 1. Determine period dates
    const isYearly = period === 'Yearly';
    const isWeekly = period === 'Weekly';
    
    const safeDate = (info) => {
      if (!info) return new Date(0);
      if (info instanceof Date) return info;
      const dStr = String(info);
      const match = dStr.match(/(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})/);
      if (match) {
        const [, p1, p2, p3] = match;
        if (p1.length === 4) return new Date(Number(p1), Number(p2) - 1, Number(p3));
        if (p3.length === 4) return new Date(Number(p3), Number(p2) - 1, Number(p1));
      }
      const d = new Date(dStr);
      return isNaN(d.getTime()) ? new Date(0) : d;
    };

    // 2. Filter sales and expenses by period
    const filteredSales = (salesHistory || []).filter(s => {
      const d = safeDate(s.date);
      if (isYearly) return d.getFullYear() === now.getFullYear();
      if (isWeekly) return (now - d) / (1000 * 60 * 60 * 24) <= 7;
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const periodExpenses = (expenses || []).filter(e => {
      const d = safeDate(e.date);
      if (isYearly) return d.getFullYear() === now.getFullYear();
      if (isWeekly) return (now - d) / (1000 * 60 * 60 * 24) <= 7;
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalPeriodExpenses = periodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    
    // 3. Get production for the period
    const productionBySize = period === 'Weekly' ? (productionStats?.weekBySize || {}) : 
                             period === 'Yearly' ? (productionStats?.monthBySize || {}) : 
                             (productionStats?.monthBySize || {});
    
    const totalProduction = Object.values(productionBySize).reduce((sum, val) => sum + (Number(val) || 0), 0) || 1;
    const expensePerUnit = totalPeriodExpenses / totalProduction;

    // 4. Calculate total period sales correctly (Turnover)
    // This is the "True" total for the period from all valid sales
    const totalTurnover = filteredSales.reduce((sum, sale) => sum + Number(sale.totalAmount || sale.amount || 0), 0);

    // 5. Group data by size for the chart
    const platesData = sizes.map(size => {
      const sKey = size.toLowerCase().trim().replace(" ", "-");
      
      const salesValue = filteredSales.reduce((sum, sale) => {
        // Fix: Use filter and sum instead of find to capture all items of same size in one sale
        const items = (sale.saleItems || []).filter(i => (i.size || "").toLowerCase().trim().replace(" ", "-") === sKey);
        const itemSum = items.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
        return sum + itemSum;
      }, 0);

      const production = Number(productionBySize[size] || 0);
      const distributedExpense = production * expensePerUnit;

      return {
        size,
        salesValue,
        expensesValue: distributedExpense || (salesValue * 0.15)
      };
    });

    return { platesData, totalTurnover, totalPeriodExpenses };
  };

  const getProductionDetails = () => {
    const sizes = dynamicSizes;
    return sizes.map(size => ({
      size,
      today: productionStats?.todayBySize?.[size] || 0
    }));
  };

  const dashboardData = {
    Weekly: {
      metrics: getMetrics('Weekly'),
      plates: getPlatesData('Weekly'),
      productionDetails: getProductionDetails(),
      attendance: {
        present: todayStats?.present || 0,
        absent: todayStats?.absent || 0,
        onLeave: todayStats?.half || 0,
        total: todayStats?.total || 0,
        trend: (last7DaysTrend || []).map(t => t.present || 0),
        days: (last7DaysTrend || []).map(t => t.label || '')
      },
      expenses: {
        total: formatStatValue(totalExpenseAmount || 0),
        categories: [
          { name: "Maintenance", amount: formatStatValue(expenseByCategory["Machine Maintenance"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Machine Maintenance"] || 0) / totalExpenseAmount) * 100) : 0, color: "#f97316" },
          { name: "Material", amount: formatStatValue(expenseByCategory["Material"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Material"] || 0) / totalExpenseAmount) * 100) : 0, color: "#3b82f6" },
          { name: "Salary", amount: formatStatValue(expenseByCategory["Salary"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Salary"] || 0) / totalExpenseAmount) * 100) : 0, color: "#10b981" },
          { name: "Others", amount: formatStatValue(expenseByCategory["Others"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Others"] || 0) / totalExpenseAmount) * 100) : 0, color: "#8b5cf6" }
        ]
      }
    },
    Monthly: {
      metrics: getMetrics('Monthly'),
      plates: getPlatesData('Monthly'),
      productionDetails: getProductionDetails(),
      attendance: {
        present: todayStats?.present || 0,
        absent: todayStats?.absent || 0,
        onLeave: todayStats?.half || 0,
        total: todayStats?.total || 0,
        trend: (last7DaysTrend || []).map(t => t.present || 0),
        days: (last7DaysTrend || []).map(t => t.label || '')
      },
      expenses: {
        total: formatStatValue(totalExpenseAmount || 0),
        categories: [
          { name: "Maintenance", amount: formatStatValue(expenseByCategory["Machine Maintenance"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Machine Maintenance"] || 0) / totalExpenseAmount) * 100) : 0, color: "#f97316" },
          { name: "Material", amount: formatStatValue(expenseByCategory["Material"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Material"] || 0) / totalExpenseAmount) * 100) : 0, color: "#3b82f6" },
          { name: "Salary", amount: formatStatValue(expenseByCategory["Salary"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Salary"] || 0) / totalExpenseAmount) * 100) : 0, color: "#10b981" },
          { name: "Others", amount: formatStatValue(expenseByCategory["Others"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Others"] || 0) / totalExpenseAmount) * 100) : 0, color: "#8b5cf6" }
        ]
      }
    },
    Yearly: {
      metrics: getMetrics('Yearly'),
      plates: getPlatesData('Yearly'),
      productionDetails: getProductionDetails(),
      attendance: {
        present: todayStats?.present || 0,
        absent: todayStats?.absent || 0,
        onLeave: todayStats?.half || 0,
        total: todayStats?.total || 0,
        trend: (last7DaysTrend || []).map(t => t.present || 0),
        days: (last7DaysTrend || []).map(t => t.label || '')
      },
      expenses: {
        total: formatStatValue(totalExpenseAmount || 0),
        categories: [
          { name: "Maintenance", amount: formatStatValue(expenseByCategory["Machine Maintenance"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Machine Maintenance"] || 0) / totalExpenseAmount) * 100) : 0, color: "#f97316" },
          { name: "Material", amount: formatStatValue(expenseByCategory["Material"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Material"] || 0) / totalExpenseAmount) * 100) : 0, color: "#3b82f6" },
          { name: "Salary", amount: formatStatValue(expenseByCategory["Salary"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Salary"] || 0) / totalExpenseAmount) * 100) : 0, color: "#10b981" },
          { name: "Others", amount: formatStatValue(expenseByCategory["Others"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Others"] || 0) / totalExpenseAmount) * 100) : 0, color: "#8b5cf6" }
        ]
      }
    }
  };

  // Get correctly calculated period data and totals
  const periodData = getPlatesData(timeFilter);
  const totalPeriodSales = periodData.totalTurnover;
  const totalPeriodExpenses = periodData.totalPeriodExpenses;

  const currentData = dashboardData[timeFilter];

  // Navigation handlers
  const handleStockClick = () => navigate("/stock");
  const handleAttendanceClick = () => navigate("/attendance");

  // Popup handlers with position calculation

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (!isAdmin) {
    const currentMonthYear = dayjs().format('YYYY-MM');
    const empYearAttendance = (attendanceRecords.year || []).filter(r => 
      r.empId === user?._id && dayjs(r.date).format('YYYY-MM') === currentMonthYear
    );
    
    const presentCount = empYearAttendance.filter(r => r.status === 'present').length;
    const absentCount = empYearAttendance.filter(r => r.status === 'absent').length;
    const onLeaveCount = empYearAttendance.filter(r => r.status === 'half' || r.status === 'leave').length;
    const attendancePercentage = empYearAttendance.length > 0 ? ((presentCount / empYearAttendance.length) * 100).toFixed(1) : 0;

    const isSalesDept = (user?.department || "").toLowerCase().includes("sales") || hasAccess("sales");
    
    const mySales = (salesHistory || []).filter(sale => 
      (sale.soldBy === user?.name || sale.recordedBy === user?.name) &&
      dayjs(sale.date).format('YYYY-MM') === currentMonthYear
    );
    const totalMySalesValue = mySales.reduce((sum, sale) => sum + (Number(sale.totalAmount) || 0), 0);
    
    const myProduction = (productionHistory || []).filter(prod => 
      (prod.operator === user?.name || prod.recordedBy === user?.name) &&
      dayjs(prod.date).format('YYYY-MM') === currentMonthYear
    );
    const totalMyProduced = myProduction.reduce((sum, prod) => sum + (Number(prod.quantity) || 0), 0);

    return (
      <div className="dashboard-container employee-dashboard">
        <div className="employee-welcome-banner">
          <div className="welcome-text-group">
            <span className="welcome-greeting">{getGreeting()},</span>
            <h2 className="welcome-name">{user?.name}</h2>
            <p className="welcome-role">{user?.role?.toUpperCase()} • {user?.department?.toUpperCase()}</p>
          </div>
        </div>

        <div className="premium-stats-grid">
          <div className="premium-stat-card attendance">
            <div className="p-stat-info">
              <span className="p-stat-label">This Month Attendance</span>
              <div className="p-stat-value">{presentCount} <small>Days Present</small></div>
              <div className="attendance-metric-progress">
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${attendancePercentage}%` }}></div>
                </div>
                <div className="progress-details" style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '13px', opacity: 0.85 }}>
                  <span>Present: {presentCount}</span>
                  <span>Absent: {absentCount}</span>
                  <span>Leave: {onLeaveCount}</span>
                </div>
              </div>
              <div className="attendance-total-status" style={{ marginTop: '10px', fontSize: '13px', opacity: 0.9 }}>
                Overall Rate: <strong>{attendancePercentage}%</strong> (Out of {empYearAttendance.length} records logged)
              </div>
            </div>
          </div>

          {isSalesDept ? (
            <div className="premium-stat-card sales">
              <div className="p-stat-info">
                <span className="p-stat-label">My Monthly Sales</span>
                <div className="p-stat-value">₹{totalMySalesValue.toLocaleString()}</div>
                <div className="sales-breakdown-details" style={{ marginTop: '10px' }}>
                  <span className="breakdown-tag">Sales Logs: {mySales.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="premium-stat-card stock">
              <div className="p-stat-info">
                <span className="p-stat-label">My Monthly Production</span>
                <div className="p-stat-value">{totalMyProduced.toLocaleString()} <small>PCS</small></div>
                <div className="prod-breakdown-details" style={{ marginTop: '10px' }}>
                  <span className="breakdown-tag">Production Entries: {myProduction.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="charts-row employee-charts-row">
          <div className="chart-card large-chart employee-records-card" style={{ width: '100%', minWidth: '100%' }}>
            <div className="chart-header" style={{ marginBottom: '16px' }}>
              <h3>{isSalesDept ? "MY RECENT SALES LOGS" : "MY RECENT PRODUCTION LOGS"}</h3>
            </div>
            {isSalesDept ? (
              <div className="daily-table-wrapper employee-table-wrapper">
                <table className="premium-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left' }}>INVOICE</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>DATE</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>CUSTOMER</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>TOTAL VALUE</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mySales.slice(0, 5).map((sale, idx) => (
                      <tr key={sale.id || sale._id || idx} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '12px' }}>{sale.invoiceNo}</td>
                        <td style={{ padding: '12px' }}>{sale.date}</td>
                        <td style={{ padding: '12px' }}>{sale.customer}</td>
                        <td style={{ padding: '12px' }}>₹{Number(sale.totalAmount).toLocaleString()}</td>
                        <td style={{ padding: '12px' }}><span className={`status-badge ${sale.paidStatus?.toLowerCase()}`}>{sale.paidStatus}</span></td>
                      </tr>
                    ))}
                    {mySales.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#888' }}>No sales logs found for this month.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="daily-table-wrapper employee-table-wrapper">
                <table className="premium-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left' }}>DATE</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>PRODUCT</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>SIZE</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>QUANTITY</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>GRADE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myProduction.slice(0, 5).map((prod, idx) => (
                      <tr key={prod.id || prod._id || idx} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '12px' }}>{prod.date}</td>
                        <td style={{ padding: '12px' }}>{prod.product}</td>
                        <td style={{ padding: '12px' }}>{prod.size}</td>
                        <td style={{ padding: '12px' }}>{prod.quantity?.toLocaleString()} pcs</td>
                        <td style={{ padding: '12px' }}>{prod.grade}</td>
                      </tr>
                    ))}
                    {myProduction.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#888' }}>No production logs found for this month.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* ATTENDANCE ALERT */}
      {attendanceNotMarked && (
        <div className="attendance-warning-banner" onClick={handleAttendanceClick}>
          <div className="warning-icon">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className="warning-text">
            <h4>Attendance Not Marked!</h4>
            <p>Please update today's attendance to see accurate productivity stats.</p>
          </div>
          <button className="mark-now-btn">MARK NOW →</button>
        </div>
      )}


      {/* PREMIUM ANALYTICS GRID (Production Stats) */}
      <div className="premium-stats-grid dashboard-top-stats">
        <div className="premium-stat-card today">
          <div className="p-stat-info">
            <span className="p-stat-label">Today's Production</span>
            <div className="p-stat-value">{(productionStats?.today || 0).toLocaleString()}</div>
            <div className="p-stat-breakdown">
              {dynamicSizes.map(size => (
                <span key={size} className="breakdown-tag">
                  {size.toLowerCase().includes('inch') ? size.split('-')[0].split(' ')[0] : size}: {productionStats?.todayBySize?.[size] || 0}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="premium-stat-card week">
          <div className="p-stat-info">
            <span className="p-stat-label">Last 7 Days</span>
            <div className="p-stat-value">{(productionStats?.week || 0).toLocaleString()}</div>
            <div className="p-stat-breakdown">
              {dynamicSizes.map(size => (
                <span key={size} className="breakdown-tag">
                  {size.toLowerCase().includes('inch') ? size.split('-')[0].split(' ')[0] : size}: {productionStats?.weekBySize?.[size] || 0}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="premium-stat-card month">
          <div className="p-stat-info">
            <span className="p-stat-label">This Month</span>
            <div className="p-stat-value">{(productionStats?.month || 0).toLocaleString()}</div>
            <div className="p-stat-breakdown">
              {dynamicSizes.map(size => (
                <span key={size} className="breakdown-tag">
                  {size.toLowerCase().includes('inch') ? size.split('-')[0].split(' ')[0] : size}: {productionStats?.monthBySize?.[size] || 0}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="premium-stat-card stock">
          <div className="p-stat-info">
            <span className="p-stat-label">Total Produced</span>
            <div className="p-stat-value">{(productionStats?.stock || 0).toLocaleString()}</div>
            <div className="p-stat-breakdown">
              {dynamicSizes.map(size => (
                <span key={size} className="breakdown-tag">
                  {size.toLowerCase().includes('inch') ? size.split('-')[0].split(' ')[0] : size}: {productionStats?.stockBySize?.[size] || 0}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* CHARTS SECTION */}
      <div className="charts-row">
        {/* Bar Chart */}
        {(hasAccess('sales') || hasAccess('stock') || hasAccess('production')) && (
          <div className="chart-card sales-expenses-card large-chart">
            <div className="chart-header">
              <h3>SALES VS EXPENSES</h3>
              <div className="filter-group small">
                {["Weekly", "Monthly", "Yearly"].map(filter => (
                  <button
                    key={filter}
                    className={`filter-chip ${timeFilter === filter ? 'active' : ''}`}
                    onClick={() => setTimeFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="balance-comparison-module">
                <div className="balance-bar-container">
                    <div className="balance-bar-info">
                        <span className="bar-label">TOTAL TURNOVER</span>
                        <span className="bar-value revenue">{formatStatValue(totalPeriodSales)}</span>
                    </div>
                    <div className="balance-progress-bg">
                        <div className="balance-progress-fill revenue" style={{ width: `${totalPeriodSales > 0 ? (totalPeriodSales / Math.max(totalPeriodSales, totalPeriodExpenses || 1)) * 100 : 0}%` }}></div>
                    </div>
                </div>

                <div className="balance-bar-container">
                    <div className="balance-bar-info">
                        <span className="bar-label">TOTAL EXPENSES</span>
                        <span className="bar-value expenses">{formatStatValue(totalPeriodExpenses)}</span>
                    </div>
                    <div className="balance-progress-bg">
                        <div className="balance-progress-fill expenses" style={{ width: `${totalPeriodExpenses > 0 ? (totalPeriodExpenses / Math.max(totalPeriodSales, totalPeriodExpenses || 1)) * 100 : 0}%` }}></div>
                    </div>
                </div>

            </div>

            <div className="chart-legend-row-bottom">
              <div className="chart-legend-item">
                <span className="legend-dot sales-dot"></span>
                <span className="legend-text">Revenue: <strong>{formatStatValue(totalPeriodSales)}</strong></span>
              </div>
              <div className="chart-legend-item">
                <span className="legend-dot expenses-dot"></span>
                <span className="legend-text">Expenses: <strong>{formatStatValue(totalPeriodExpenses)}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Section */}
        {hasAccess('attendance') && (
          <div className="chart-card attendance-section" onClick={handleAttendanceClick}>
            <div className="attendance-header">
              <h3>ATTENDANCE</h3>
              <span className="view-details">VIEW DETAILS →</span>
            </div>

            <div className="attendance-pie-container">
              <div className="pie-chart-wrapper">
                <div className="pie-chart">
                  <div className="pie-segment present-segment" style={{ transform: `rotate(0deg)`, background: `conic-gradient(#10b981 0deg ${(currentData.attendance.present / currentData.attendance.total) * 360}deg, transparent ${(currentData.attendance.present / currentData.attendance.total) * 360}deg 360deg)` }}></div>
                  <div className="pie-segment absent-segment" style={{ transform: `rotate(${(currentData.attendance.present / currentData.attendance.total) * 360}deg)`, background: `conic-gradient(#ef4444 0deg ${(currentData.attendance.absent / currentData.attendance.total) * 360}deg, transparent ${(currentData.attendance.absent / currentData.attendance.total) * 360}deg 360deg)` }}></div>
                  <div className="pie-segment leave-segment" style={{ transform: `rotate(${((currentData.attendance.present + currentData.attendance.absent) / currentData.attendance.total) * 360}deg)`, background: `conic-gradient(#f59e0b 0deg ${(currentData.attendance.onLeave / currentData.attendance.total) * 360}deg, transparent ${(currentData.attendance.onLeave / currentData.attendance.total) * 360}deg 360deg)` }}></div>
                  <div className="pie-center">
                    <span className="pie-total">{currentData.attendance.total}</span>
                    <span className="pie-total-label">TOTAL</span>
                  </div>
                </div>
              </div>

              <div className="pie-legend">
                <div className="legend-item">
                  <span className="legend-color present-color"></span>
                  <div className="legend-details">
                    <span className="legend-label">PRESENT</span>
                    <span className="legend-value">{currentData.attendance.present}</span>
                    <span className="legend-percentage">({currentData.attendance.total > 0 ? ((currentData.attendance.present / currentData.attendance.total) * 100).toFixed(1) : 0}%)</span>
                  </div>
                </div>
                <div className="legend-item">
                  <span className="legend-color absent-color"></span>
                  <div className="legend-details">
                    <span className="legend-label">ABSENT</span>
                    <span className="legend-value">{currentData.attendance.absent}</span>
                    <span className="legend-percentage">({currentData.attendance.total > 0 ? ((currentData.attendance.absent / currentData.attendance.total) * 100).toFixed(1) : 0}%)</span>
                  </div>
                </div>
                <div className="legend-item">
                  <span className="legend-color leave-color"></span>
                  <div className="legend-details">
                    <span className="legend-label">ON LEAVE</span>
                    <span className="legend-value">{currentData.attendance.onLeave}</span>
                    <span className="legend-percentage">({currentData.attendance.total > 0 ? ((currentData.attendance.onLeave / currentData.attendance.total) * 100).toFixed(1) : 0}%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="attendance-stats-summary">
              <div className="summary-item">
                <span className="summary-label">ATTENDANCE RATE</span>
                <span className="summary-value rate-high">{currentData.attendance.total > 0 ? ((currentData.attendance.present / currentData.attendance.total) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">ABSENTEE RATE</span>
                <span className="summary-value">{currentData.attendance.total > 0 ? (((currentData.attendance.absent + currentData.attendance.onLeave) / currentData.attendance.total) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INVENTORY LAYOUT AREA (ILA) */}
      {hasAccess('stock') && (
        <div className="stock-overview-section ila-section">
          <div className="ila-header">
            <div className="ila-title-box">
              <span className="ila-label">INVENTORY LAYOUT AREA</span>
              <h3>TOTAL STOCK OVERVIEW</h3>
            </div>
            <div className="ila-summary-badges">
              <div className="ila-badge">
                <span className="badge-label">TOTAL UNITS</span>
                <span className="badge-value">{(stockData.reduce((s, i) => s + i.quantity, 0)).toLocaleString()}</span>
              </div>
              <div className="ila-badge">
                <span className="badge-label">TOTAL VALUE</span>
                <span className="badge-value">₹{(stockData.reduce((s, i) => s + i.totalValue, 0)).toLocaleString()}</span>
              </div>
              <div className="ila-badge urgent">
                <span className="badge-label">LOW STOCK</span>
                <span className="badge-value">{stockData.filter(i => i.quantity < 2000).length}</span>
              </div>
            </div>
          </div>
          
          <div className="stock-grid ila-grid">
            {stockData.map((item, index) => {
              const currentMonthStr = dayjs().format('YYYY-MM');
              
              // 1. Try specifically for this size or find the "All Sizes" master target
              const monthlyTargets = (productionTargets || []).filter(t => 
                (t.productName === item.name || t.product === item.name) && t.date === currentMonthStr
              );

              const masterTarget = monthlyTargets.find(t => t.productSize === 'All Sizes');
              const specificTarget = monthlyTargets.find(t => t.productSize === item.size || t.size === item.size);
              
              const monthlyTarget = masterTarget || specificTarget;

              // 2. If it's a master target, calculate progress based on TOTAL production of ALL sizes
              const targetQty = monthlyTarget ? Number(monthlyTarget.targetQty) : 0;
              let producedThisMonth = 0;
              
              if (monthlyTarget?.productSize === 'All Sizes') {
                // Sum production of ALL sizes for this product this month
                producedThisMonth = Object.values(productionStats.monthBySize || {}).reduce((a, b) => a + b, 0);
              } else {
                producedThisMonth = productionStats.monthBySize?.[item.size] || 0;
              }
              const progress = targetQty > 0 ? (producedThisMonth / targetQty) * 100 : 0;
              const status = progress >= 100 ? 'optimal' : progress >= 50 ? 'good' : progress > 0 ? 'warning' : 'critical';

              return (
                <div
                  key={index}
                  className={`stock-item-card ila-card ${status}`}
                  onClick={handleStockClick}
                >
                  <div className="ila-card-status-dot"></div>
                  <div className="stock-item-header">
                    <div className="item-main-info">
                      <span className="stock-name-tag">{item.name}</span>
                      <span className="stock-size-val">{item.size}</span>
                    </div>
                    <div className="item-value-info">
                      <span className="stock-value-pcs">{item.quantity.toLocaleString()} <small>PCS</small></span>
                      <span className="stock-total-val" style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>₹{item.perPlateRate}/pcs</span>
                    </div>
                  </div>

                  <div className="ila-item-details" style={{ marginTop: '12px' }}>

                    {targetQty > 0 && (
                      <div className="ila-progress-box">
                        <div className="progress-text">
                          <span>Target Progress</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar-fill" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="progress-counts">
                          {producedThisMonth.toLocaleString()} / {targetQty.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ila-card-footer">
                    <span className="material-symbols-outlined">analytics</span>
                    <span>View Analysis</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
