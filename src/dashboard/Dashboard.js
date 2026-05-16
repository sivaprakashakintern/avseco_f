import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from '../context/AppContext.js';
import { useAuth } from '../context/AuthContext.js';
import { formatCurrency } from '../utils/formatUtils.js';
import { authApi } from '../utils/api.js';
import dayjs from 'dayjs';
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { hasAccess, user, isAdmin } = useAuth();
  const {
    employees = [],
    expenses = [],
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
  const [mySalaryData, setMySalaryData] = useState(null);

  // Fetch employee's own salary data (only for non-admin)
  useEffect(() => {
    if (!isAdmin) {
      authApi.getMySalary().then(data => setMySalaryData(data)).catch(() => {});
    }
  }, [isAdmin]);

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
    const lastMonthYear = dayjs().subtract(1, 'month').format('YYYY-MM');
    const lastMonthName = dayjs().subtract(1, 'month').format('MMMM YYYY');
    const currentMonthName = dayjs().format('MMMM YYYY');

    // ── Attendance: filter by logged-in employee's ID ──────────────────────
    const allYearAttendance = attendanceRecords.year || [];
    const myId = user?._id || user?.id || '';

    const myCurrentMonthAtt = allYearAttendance.filter(r => {
      const empId = r.empId || (r.employee?._id ? String(r.employee._id) : String(r.employee || ''));
      return empId === myId && dayjs(r.date).format('YYYY-MM') === currentMonthYear;
    });

    const presentCount = myCurrentMonthAtt.filter(r => r.status === 'present').length;
    const absentCount = myCurrentMonthAtt.filter(r => r.status === 'absent').length;
    const halfDayCount = myCurrentMonthAtt.filter(r => r.status === 'half').length;
    const onLeaveCount = myCurrentMonthAtt.filter(r => r.status === 'leave').length;
    const attendancePercentage = myCurrentMonthAtt.length > 0
      ? ((presentCount / myCurrentMonthAtt.length) * 100).toFixed(1)
      : 0;

    // Last 7 days attendance for mini-heatmap
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = dayjs().subtract(6 - i, 'day');
      const dateStr = d.format('YYYY-MM-DD');
      const rec = allYearAttendance.find(r => {
        const empId = r.empId || (r.employee?._id ? String(r.employee._id) : String(r.employee || ''));
        return empId === myId && r.date === dateStr;
      });
      return { label: d.format('dd'), dateStr, status: rec?.status || 'none' };
    });

    // ── Salary: from dedicated /auth/my-salary API ────────────────────────
    const myEmployeeObj = employees?.find(e => (e._id || e.id) === myId);
    const mySalary = mySalaryData?.salary ? Number(mySalaryData.salary) : (myEmployeeObj?.salary ? Number(myEmployeeObj.salary) : 0);

    // Find last month's salary entry from API response
    const lastMonthSalaryEntry = (mySalaryData?.salaryExpenses || []).find(ex => {
      if (!ex.date) return false;
      const parts = ex.date.split('-');
      const exDate = parts[0].length === 4 ? dayjs(ex.date) : dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`);
      return exDate.isValid() && exDate.format('YYYY-MM') === lastMonthYear;
    });
    const lastMonthSalary = lastMonthSalaryEntry ? Number(lastMonthSalaryEntry.amount || 0) : mySalary;

    // ── Activity: sales or production ──────────────────────────────────────
    const isSalesDept = (user?.department || "").toLowerCase().includes("sales") || hasAccess("sales");

    const mySales = (salesHistory || []).filter(sale =>
      (sale.soldBy === user?.name || sale.recordedBy === user?.name) &&
      dayjs(sale.date).format('YYYY-MM') === currentMonthYear
    );
    const totalMySalesValue = mySales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

    const myProduction = (productionHistory || []).filter(prod =>
      (prod.operator === user?.name || prod.recordedBy === user?.name) &&
      dayjs(prod.date).format('YYYY-MM') === currentMonthYear
    );
    const totalMyProduced = myProduction.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

    const statusColor = { present: '#10b981', absent: '#ef4444', half: '#f59e0b', leave: '#8b5cf6', none: '#e2e8f0' };

    return (
      <div className="dashboard-container emp-self-dashboard">

        {/* ── HERO WELCOME BANNER ──────────────────────────────── */}
        <div className="emp-hero-banner">
          <div className="emp-hero-left">
            <div className="emp-avatar-ring">
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" className="emp-avatar-img" />
                : <span className="emp-avatar-initials">{(user?.name || 'E')[0].toUpperCase()}</span>
              }
            </div>
            <div className="emp-hero-info">
              <span className="emp-greet-line">{getGreeting()} 👋</span>
              <h2 className="emp-hero-name">{user?.name}</h2>
              <div className="emp-hero-tags">
                <span className="emp-tag role">{user?.role?.toUpperCase()}</span>
                <span className="emp-tag dept">{user?.department}</span>
                {myEmployeeObj?.empId && <span className="emp-tag empid">{myEmployeeObj.empId}</span>}
              </div>
            </div>
          </div>
          <div className="emp-hero-right">
            <div className="emp-hero-date">
              <span className="emp-date-label">TODAY</span>
              <span className="emp-date-value">{dayjs().format('DD MMM YYYY')}</span>
              <span className="emp-date-day">{dayjs().format('dddd')}</span>
            </div>
          </div>
        </div>

        {/* ── TOP STATS GRID: Attendance + Salary ─────────────── */}
        <div className="emp-stats-grid">

          {/* Attendance Card */}
          <div className="emp-stat-card emp-attendance-card">
            <div className="emp-card-header">
              <span className="emp-card-icon att-icon">
                <span className="material-symbols-outlined">calendar_month</span>
              </span>
              <div>
                <span className="emp-card-title">This Month Attendance</span>
                <span className="emp-card-sub">{currentMonthName}</span>
              </div>
            </div>

            <div className="emp-att-numbers">
              <div className="emp-att-num present">
                <span className="num-val">{presentCount}</span>
                <span className="num-lbl">Present</span>
              </div>
              <div className="emp-att-num absent">
                <span className="num-val">{absentCount}</span>
                <span className="num-lbl">Absent</span>
              </div>
              <div className="emp-att-num half">
                <span className="num-val">{halfDayCount}</span>
                <span className="num-lbl">Half Day</span>
              </div>
              <div className="emp-att-num leave">
                <span className="num-val">{onLeaveCount}</span>
                <span className="num-lbl">Leave</span>
              </div>
            </div>

            <div className="emp-att-bar-wrap">
              <div className="emp-att-bar-bg">
                <div className="emp-att-bar-fill" style={{ width: `${attendancePercentage}%` }}></div>
              </div>
              <span className="emp-att-pct">{attendancePercentage}% Attendance Rate</span>
            </div>

            {/* Last 7-day mini heatmap */}
            <div className="emp-week-heatmap">
              {last7Days.map((d, i) => (
                <div key={i} className="emp-heat-day" title={`${d.dateStr}: ${d.status}`}>
                  <div className="emp-heat-dot" style={{ background: statusColor[d.status] || '#e2e8f0' }}></div>
                  <span className="emp-heat-lbl">{d.label}</span>
                </div>
              ))}
            </div>
            <div className="emp-heat-legend">
              <span><i style={{ background: '#10b981' }}></i> Present</span>
              <span><i style={{ background: '#ef4444' }}></i> Absent</span>
              <span><i style={{ background: '#f59e0b' }}></i> Half</span>
              <span><i style={{ background: '#8b5cf6' }}></i> Leave</span>
            </div>
          </div>

          {/* Last Month Salary Card */}
          <div className="emp-stat-card emp-salary-card">
            <div className="emp-card-header">
              <span className="emp-card-icon sal-icon">
                <span className="material-symbols-outlined">payments</span>
              </span>
              <div>
                <span className="emp-card-title">Last Month Salary</span>
                <span className="emp-card-sub">{lastMonthName}</span>
              </div>
            </div>

            <div className="emp-salary-amount">
              ₹{lastMonthSalary > 0 ? lastMonthSalary.toLocaleString() : '—'}
            </div>

            {mySalary > 0 && (
              <div className="emp-salary-meta">
                <div className="emp-salary-meta-row">
                  <span>Monthly CTC</span>
                  <strong>₹{mySalary.toLocaleString()}</strong>
                </div>
                {lastMonthSalaryEntry && (
                  <div className="emp-salary-meta-row">
                    <span>Credited On</span>
                    <strong>{lastMonthSalaryEntry.date}</strong>
                  </div>
                )}
                <div className="emp-salary-status">
                  <span className="emp-salary-badge credited">✓ Credited</span>
                </div>
              </div>
            )}
            {mySalary === 0 && (
              <p className="emp-salary-empty">Salary details not available. Contact admin.</p>
            )}
          </div>

          {/* Activity Summary Card */}
          <div className="emp-stat-card emp-activity-card">
            <div className="emp-card-header">
              <span className="emp-card-icon act-icon">
                <span className="material-symbols-outlined">{isSalesDept ? 'point_of_sale' : 'precision_manufacturing'}</span>
              </span>
              <div>
                <span className="emp-card-title">{isSalesDept ? 'My Sales' : 'My Production'}</span>
                <span className="emp-card-sub">{currentMonthName}</span>
              </div>
            </div>

            {isSalesDept ? (
              <>
                <div className="emp-activity-big-num">₹{totalMySalesValue.toLocaleString()}</div>
                <div className="emp-activity-sub">{mySales.length} Sale{mySales.length !== 1 ? 's' : ''} logged this month</div>
              </>
            ) : (
              <>
                <div className="emp-activity-big-num">{totalMyProduced.toLocaleString()} <small>PCS</small></div>
                <div className="emp-activity-sub">{myProduction.length} Entr{myProduction.length !== 1 ? 'ies' : 'y'} this month</div>
              </>
            )}
          </div>
        </div>

        {/* ── ACTIVITY LOG TABLE ───────────────────────────────── */}
        <div className="emp-activity-section">
          <div className="emp-section-header">
            <h3 className="emp-section-title">
              <span className="material-symbols-outlined">history</span>
              {isSalesDept ? 'Recent Sales Activity' : 'Recent Production Activity'}
            </h3>
            <span className="emp-section-sub">{currentMonthName}</span>
          </div>

          <div className="emp-table-wrap">
            {isSalesDept ? (
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mySales.length === 0 ? (
                    <tr><td colSpan="6" className="emp-empty-row">No sales logged this month</td></tr>
                  ) : mySales.slice(0, 10).map((sale, idx) => (
                    <tr key={sale.id || sale._id || idx}>
                      <td className="emp-row-num">{idx + 1}</td>
                      <td><strong>{sale.invoiceNo || '—'}</strong></td>
                      <td>{sale.date}</td>
                      <td>{sale.customer}</td>
                      <td className="emp-money">₹{Number(sale.totalAmount || 0).toLocaleString()}</td>
                      <td>
                        <span className={`emp-status-pill ${(sale.paidStatus || '').toLowerCase()}`}>
                          {sale.paidStatus || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Size</th>
                    <th>Quantity</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {myProduction.length === 0 ? (
                    <tr><td colSpan="6" className="emp-empty-row">No production logged this month</td></tr>
                  ) : myProduction.slice(0, 10).map((prod, idx) => (
                    <tr key={prod.id || prod._id || idx}>
                      <td className="emp-row-num">{idx + 1}</td>
                      <td>{prod.date}</td>
                      <td><strong>{prod.product}</strong></td>
                      <td>{prod.size}</td>
                      <td className="emp-money">{(prod.quantity || 0).toLocaleString()} pcs</td>
                      <td>
                        <span className={`emp-status-pill grade-${(prod.grade || 'a').toLowerCase()}`}>
                          {prod.grade || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── MONTH ATTENDANCE CALENDAR STRIP ─────────────────── */}
        <div className="emp-cal-section">
          <div className="emp-section-header">
            <h3 className="emp-section-title">
              <span className="material-symbols-outlined">event_available</span>
              Attendance Log — {currentMonthName}
            </h3>
          </div>
          <div className="emp-cal-grid">
            {myCurrentMonthAtt.length === 0 ? (
              <p className="emp-cal-empty">No attendance records found for this month.</p>
            ) : myCurrentMonthAtt.sort((a, b) => a.date.localeCompare(b.date)).map((rec, i) => {
              const dayNum = dayjs(rec.date).format('D');
              const dayName = dayjs(rec.date).format('ddd');
              const sc = { present: 'emp-cal-p', absent: 'emp-cal-a', half: 'emp-cal-h', leave: 'emp-cal-l' };
              return (
                <div key={i} className={`emp-cal-day ${sc[rec.status] || ''}`} title={`${rec.date}: ${rec.status}`}>
                  <span className="emp-cal-daynum">{dayNum}</span>
                  <span className="emp-cal-dayname">{dayName}</span>
                  <span className="emp-cal-status-dot"></span>
                </div>
              );
            })}
          </div>
          <div className="emp-cal-legend">
            <span className="emp-cal-leg-item emp-cal-p"><span></span> Present</span>
            <span className="emp-cal-leg-item emp-cal-a"><span></span> Absent</span>
            <span className="emp-cal-leg-item emp-cal-h"><span></span> Half Day</span>
            <span className="emp-cal-leg-item emp-cal-l"><span></span> Leave</span>
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
