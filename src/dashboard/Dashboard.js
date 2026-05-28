import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from '../context/AppContext.js';
import { useAuth } from '../context/AuthContext.js';
import { formatCurrency } from '../utils/formatUtils.js';
import dayjs from 'dayjs';
import "./Dashboard.css";

// Centralized Color Map for Product Sizes (Inches)
const SIZE_COLOR_MAP = {
  '6': '#3b82f6', '7': '#10b981', '8': '#8b5cf6', '9': '#f59e0b',
  '10': '#f43f5e', '11': '#06b6d4', '12': '#84cc16', '13': '#4f46e5',
  '14': '#db2777', '15': '#14b8a6'
};


const Dashboard = () => {
  const navigate = useNavigate();
  const { hasAccess, user, isSuperAdmin } = useAuth();
  const {
    employees = [],
    expenses = [],
    totalExpenseAmount = 0,
    expenseByCategory = {},
    todayStats = {},
    last7DaysTrend = [],
    totalSalesAmount = 0,
    salesHistory = [],
    stockData = [],
    productionStats = {},
    productionTargets = [],
    attendanceRecords = {},
    productionHistory = []
  } = useAppContext();
  const [timeFilter, setTimeFilter] = useState("Monthly");


  // Helper to get formatted currency with shortening
  const formatStatValue = (val) => formatCurrency(val, true);

  // Helper to cleanly extract and format numeric sizes (e.g. 6-inch -> 6″, 10 inch -> 10″)
  const formatSizeLabel = (sizeStr) => {
    if (!sizeStr) return '';
    const match = String(sizeStr).match(/^(\d+(?:\.\d+)?)/);
    return match ? `${match[1]}″` : sizeStr;
  };

  // Use the deduplicated, numerically sorted sizes from AppContext (avoids duplicates
  // caused by different string formats: "6-inch" vs "6 inch" vs "6")
  const dynamicSizes = productionStats?.availableSizes || [];
  const canViewAttendance = hasAccess('attendance');
  const canViewPremiumStats = hasAccess('sales') || hasAccess('stock') || hasAccess('production');
  const canViewChartRow = canViewPremiumStats || canViewAttendance;
  const attendanceNotMarked = canViewAttendance && (!todayStats || todayStats.total === 0);

  // ── Raw Material Stock Calculations for Dashboard Alerts ──
  const rawMaterialPurchases = useMemo(() => {
    try {
      const saved = localStorage.getItem("raw_material_purchases");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error reading raw material purchases in Dashboard:", e);
    }
    return [
      {
        id: 1,
        date: "2026-05-18",
        name: "Premium Leaf Material",
        cost: 30000,
        capacity: 23000
      }
    ];
  }, []);

  const totalProducedPlates = useMemo(() => {
    return (productionHistory || []).reduce(
      (sum, item) => sum + (Number(item.quantity) || Number(item.qty) || 0),
      0
    );
  }, [productionHistory]);

  const totalPurchasedCapacity = useMemo(() => {
    return rawMaterialPurchases.reduce((sum, p) => sum + (Number(p.capacity) || 0), 0);
  }, [rawMaterialPurchases]);

  const remainingCapacity = useMemo(() => {
    return Math.max(0, totalPurchasedCapacity - totalProducedPlates);
  }, [totalPurchasedCapacity, totalProducedPlates]);

  const alertThreshold = 10000;
  const isRawMaterialAlertActive = remainingCapacity < alertThreshold;

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

  // Size breakdown charts calculations for Dashboard
  const sizeChartsData = useMemo(() => {
    const now = new Date();
    const isYearly = timeFilter === 'Yearly';
    const isWeekly = timeFilter === 'Weekly';

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

    const filteredSales = (salesHistory || []).filter(s => {
      if (s.status && (s.status.toLowerCase().includes('cancel') || s.status.toLowerCase().includes('reject'))) return false;
      const d = safeDate(s.date || s.createdAt);
      if (isYearly) return d.getFullYear() === now.getFullYear();
      if (isWeekly) return (now - d) / (1000 * 60 * 60 * 24) <= 7;
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const salesSizeMap = {};
    filteredSales.forEach(s => {
      if (s.saleItems && s.saleItems.length > 0) {
        s.saleItems.forEach(item => {
          const sz = (item.size || '').toString().trim() || 'Other';
          salesSizeMap[sz] = (salesSizeMap[sz] || 0) + Number(item.qty || item.quantity || 0);
        });
      } else {
        const sz = (s.size || '').toString().trim() || 'Other';
        salesSizeMap[sz] = (salesSizeMap[sz] || 0) + Number(s.qty || s.quantity || 0);
      }
    });
    const salesSizeChart = Object.keys(salesSizeMap)
      .map(name => ({ name, SalesQty: salesSizeMap[name] }))
      .sort((a, b) => (parseFloat(a.name) || 0) - (parseFloat(b.name) || 0));

    const filteredProduction = (productionHistory || []).filter(p => {
      const d = safeDate(p.date || p.createdAt);
      if (isYearly) return d.getFullYear() === now.getFullYear();
      if (isWeekly) return (now - d) / (1000 * 60 * 60 * 24) <= 7;
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const prodSizeMap = {};
    filteredProduction.forEach(p => {
      const sz = (p.size || p.productSize || '').toString().trim() || 'Other';
      prodSizeMap[sz] = (prodSizeMap[sz] || 0) + Number(p.quantity || 0);
    });
    const prodSizeChart = Object.keys(prodSizeMap)
      .map(name => ({ name, ProdQty: prodSizeMap[name] }))
      .sort((a, b) => (parseFloat(a.name) || 0) - (parseFloat(b.name) || 0));

    return { salesSizeChart, prodSizeChart };
  }, [salesHistory, productionHistory, timeFilter]);

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

  const userRole = user?.role?.toLowerCase() || '';
  const userDept = user?.department?.toLowerCase() || '';
  const isHRorCEO = userRole === 'hr' || userRole === 'ceo' || userDept === 'hr' || userDept === 'ceo';

  // Allow access to standard/premium dashboard widgets if user is Super Admin, HR, CEO.
  const hasAdminWidgets = 
    isSuperAdmin || 
    isHRorCEO;

  if (!hasAdminWidgets) {
    const currentMonthYear = dayjs().format('YYYY-MM');
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
    const baseLeaveCount = myCurrentMonthAtt.filter(r => r.status === 'leave').length;
    const stoppageCount = myCurrentMonthAtt.filter(r => r.status === 'stoppage').length;

    // Sundays are considered Leave and do NOT add to salary
    let passedSundaysCount = 0;
    const todayNum = dayjs().date();
    for (let i = 1; i <= todayNum; i++) {
      if (dayjs().date(i).day() === 0) passedSundaysCount++;
    }

    const onLeaveCount = baseLeaveCount + passedSundaysCount;

    // ── Salary Calculation ────────────────────────
    const myEmployeeObj = employees ? employees.find(e => {
      const isIdMatch = myId && String(e._id || e.id) === String(myId);
      const isEmailMatch = Boolean(e.email && user?.email && String(e.email).toLowerCase() === String(user.email).toLowerCase());
      return isIdMatch || isEmailMatch;
    }) : null;

    // Fallback to user?.salary because non-admins cannot fetch the full employees list
    const baseMonthlySalary = myEmployeeObj && !isNaN(Number(myEmployeeObj.salary))
      ? Number(myEmployeeObj.salary)
      : (user?.salary && !isNaN(Number(user.salary)) ? Number(user.salary) : 0);

    const perDaySalary = baseMonthlySalary > 0 ? (baseMonthlySalary / 26) : 0;
    const casualLeaveAllowed = 1;
    const paidCasualLeaveDays = Math.min(baseLeaveCount, casualLeaveAllowed);
    const unpaidLeaveDays = Math.max(0, baseLeaveCount - casualLeaveAllowed);
    const paidHalfDays = halfDayCount * 0.5;

    const compensatedWorkDays = Math.min(26, presentCount + stoppageCount + paidHalfDays + paidCasualLeaveDays);
    const earnedSalary = Math.round(compensatedWorkDays * perDaySalary) || 0;
    const unpaidLeaveDeduction = Math.round(unpaidLeaveDays * perDaySalary);

    const bonus = (presentCount >= 26 && baseLeaveCount === 0 && compensatedWorkDays >= 26) ? 500 : 0;

    // ── Activity: sales or production (Moved up for commission calc) ──────────────────────
    const isSalesDept = (user?.department || "").toLowerCase().includes("sales") || hasAccess("sales");
    const isProductionDept = ["operator", "machine operator", "production"].some(d => (user?.department || "").toLowerCase().includes(d)) || hasAccess("production");

    const mySales = (salesHistory || []).filter(sale => {
      const soldByName = String(sale.soldBy || sale.recordedBy || "").trim().toLowerCase();
      const currentName = String(user?.name || "").trim().toLowerCase();

      const saleDateClean = String(sale.date || sale.createdAt || "").split(',')[0].trim();
      const dateParts = saleDateClean.split('-');
      let saleMonthYear = "";
      if (dateParts.length === 3) {
        if (dateParts[2].length === 4) {
          saleMonthYear = `${dateParts[2]}-${dateParts[1]}`; // DD-MM-YYYY -> YYYY-MM
        } else if (dateParts[0].length === 4) {
          saleMonthYear = `${dateParts[0]}-${dateParts[1]}`; // YYYY-MM-DD -> YYYY-MM
        }
      }
      if (!saleMonthYear) {
        saleMonthYear = dayjs(sale.date || sale.createdAt).format('YYYY-MM');
      }

      return soldByName === currentName && saleMonthYear === currentMonthYear;
    });
    const totalMySalesValue = mySales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const currentEmployeeId = String(user?._id || user?.id || '');
    const currentEmployeeName = String(user?.name || '').trim().toLowerCase();

    const myProduction = (productionHistory || []).filter(prod => {
      let pDate = new Date(prod.date || prod.createdAt);
      if (isNaN(pDate.getTime()) && prod.date) {
        const dStr = String(prod.date);
        const match = dStr.match(/(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})/);
        if (match) {
          const [, p1, p2, p3] = match;
          if (p1.length === 4) pDate = new Date(Number(p1), Number(p2) - 1, Number(p3));
          else if (p3.length === 4) pDate = new Date(Number(p3), Number(p2) - 1, Number(p1));
        }
      }
      if (isNaN(pDate.getTime())) pDate = new Date();
      
      const pMonthYear = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
      return (
        (prod.employeeId && String(prod.employeeId) === currentEmployeeId) ||
        (prod.employeeName && String(prod.employeeName).trim().toLowerCase() === currentEmployeeName) ||
        (prod.operator && String(prod.operator).trim().toLowerCase() === currentEmployeeName) ||
        (prod.recordedBy && String(prod.recordedBy).trim().toLowerCase() === currentEmployeeName)
      ) &&
      pMonthYear === currentMonthYear;
    });
    const totalMyProduced = myProduction.reduce((sum, p) => sum + (Number(p.quantity) || Number(p.qty) || 0), 0);

    const totalSalaryWithBonus = earnedSalary + bonus;

    const totalDaysConsidered = myCurrentMonthAtt.length + passedSundaysCount;
    const attendancePercentage = totalDaysConsidered > 0
      ? ((presentCount / totalDaysConsidered) * 100).toFixed(1)
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

    // MyProduction and MySales calculation were moved above to include salesCommission in totalSalary

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
              <h2 className="emp-hero-name" style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span className="emp-greet-line" style={{ display: 'inline', marginBottom: 0 }}>{getGreeting()}</span> 
                <span style={{ fontSize: '1.4rem', fontWeight: 600 }}>{user?.name}</span> 👋
              </h2>
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
          <>
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

                {/* Earned Salary Card */}
                <div className="emp-stat-card emp-salary-card">
                  <div className="emp-card-header">
                    <span className="emp-card-icon sal-icon">
                      <span className="material-symbols-outlined">account_balance_wallet</span>
                    </span>
                    <div>
                      <span className="emp-card-title">This Month Salary</span>
                      <span className="emp-card-sub">{currentMonthName}</span>
                    </div>
                  </div>

                  <div className="emp-salary-amount">
                    ₹{totalSalaryWithBonus > 0 ? totalSalaryWithBonus.toLocaleString() : '0'}
                  </div>

                  <div className="emp-salary-meta">
                    <div className="emp-salary-meta-row">
                      <span>Present ({presentCount}d)</span>
                      <strong>₹{Math.round(presentCount * perDaySalary) || 0}</strong>
                    </div>
                    {stoppageCount > 0 && (
                      <div className="emp-salary-meta-row">
                        <span>Maintenance/Stoppage ({stoppageCount}d)</span>
                        <strong>₹{Math.round(stoppageCount * perDaySalary) || 0}</strong>
                      </div>
                    )}
                    {halfDayCount > 0 && (
                      <div className="emp-salary-meta-row">
                        <span>Half Days ({halfDayCount}d)</span>
                        <strong>₹{Math.round(halfDayCount * (perDaySalary / 2)) || 0}</strong>
                      </div>
                    )}
                    <div className="emp-salary-meta-row">
                      <span>Casual Leave Paid ({paidCasualLeaveDays}/{casualLeaveAllowed})</span>
                      <strong>₹{Math.round(paidCasualLeaveDays * perDaySalary)}</strong>
                    </div>
                    {unpaidLeaveDays > 0 && (
                      <div className="emp-salary-meta-row">
                        <span>Unpaid Leave ({unpaidLeaveDays}d)</span>
                        <strong>-₹{unpaidLeaveDeduction.toLocaleString()}</strong>
                      </div>
                    )}
                    {bonus > 0 && (
                      <div className="emp-salary-meta-row">
                        <span>Perfect Attendance Bonus</span>
                        <strong>₹{bonus.toLocaleString()}</strong>
                      </div>
                    )}
                    <div className="emp-salary-status">
                      <span className="emp-salary-badge pending">Current Month Estimate</span>
                    </div>
                    <button className="btn-view-salary-slip" style={{ marginTop: '14px', width: '100%' }} onClick={() => navigate('/salary-slip')}>
                      <span className="material-symbols-outlined">receipt_long</span>
                      <span>View Salary Slip</span>
                    </button>
                  </div>
                </div>
              </>

            {isSalesDept && (
              <div className="emp-stat-card emp-activity-card">
                <div className="emp-card-header">
                  <span className="emp-card-icon act-icon">
                    <span className="material-symbols-outlined">point_of_sale</span>
                  </span>
                  <div>
                    <span className="emp-card-title">My Sales</span>
                    <span className="emp-card-sub">{currentMonthName}</span>
                  </div>
                </div>
                <div className="emp-activity-big-num">₹{totalMySalesValue.toLocaleString()}</div>
                <div className="emp-activity-sub">{mySales.length} Sale{mySales.length !== 1 ? 's' : ''} logged this month</div>
              </div>
            )}

            {isProductionDept && (
              <div className="emp-stat-card emp-activity-card">
                <div className="emp-card-header">
                  <span className="emp-card-icon act-icon">
                    <span className="material-symbols-outlined">precision_manufacturing</span>
                  </span>
                  <div>
                    <span className="emp-card-title">My Production</span>
                    <span className="emp-card-sub">{currentMonthName}</span>
                  </div>
                </div>
                <div className="emp-activity-big-num">{totalMyProduced.toLocaleString()} <small>PCS</small></div>
                <div className="emp-activity-sub">{myProduction.length} Entr{myProduction.length !== 1 ? 'ies' : 'y'} this month</div>
                
                {myProduction.length > 0 && (
                  <div className="emp-prod-breakdown">
                    <h4 className="emp-breakdown-title">Production Breakdown</h4>
                    <ul className="emp-breakdown-list">
                      {Object.entries(
                        myProduction.reduce((acc, prod) => {
                          const sz = (prod.size || prod.productSize || '').trim() || 'Other';
                          acc[sz] = (acc[sz] || 0) + (Number(prod.quantity) || 0);
                          return acc;
                        }, {})
                      ).sort((a, b) => b[1] - a[1]).map(([size, qty]) => (
                        <li key={size} className="emp-breakdown-item">
                          <span className="emp-b-size">{formatSizeLabel(size)}</span>
                          <span className="emp-b-qty">{qty.toLocaleString()} PCS</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

        {/* ── EMPLOYEE INVENTORY & PRODUCTION AREA ─────────────────── */}
        <div className="stock-overview-section ila-section" style={{ marginTop: '24px', marginBottom: '24px' }}>
          <div className="ila-header">
            <div className="ila-title-box">
              <span className="ila-label">PRODUCTION & INVENTORY</span>
              <h3>TOTAL STOCK OVERVIEW</h3>
            </div>
            <div className="ila-summary-badges">
              <div className="ila-badge">
                <span className="badge-label">TODAY'S PROD.</span>
                <span className="badge-value">{(productionStats?.today || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="stock-grid ila-grid">
            {stockData.map((item, index) => {
              const currentMonthStr = dayjs().format('YYYY-MM');
              const monthlyTargets = (productionTargets || []).filter(t =>
                (t.productName === item.name || t.product === item.name) && t.date === currentMonthStr
              );
              const masterTarget = monthlyTargets.find(t => t.productSize === 'All Sizes');
              const specificTarget = monthlyTargets.find(t => t.productSize === item.size || t.size === item.size);
              const monthlyTarget = masterTarget || specificTarget;
              const targetQty = monthlyTarget ? Number(monthlyTarget.targetQty) : 0;
              let producedThisMonth = 0;
              if (monthlyTarget?.productSize === 'All Sizes') {
                producedThisMonth = Object.values(productionStats.monthBySize || {}).reduce((a, b) => a + b, 0);
              } else {
                producedThisMonth = productionStats.monthBySize?.[item.size] || 0;
              }
              const progress = targetQty > 0 ? (producedThisMonth / targetQty) * 100 : 0;
              const status = progress >= 100 ? 'optimal' : progress >= 50 ? 'good' : progress > 0 ? 'warning' : 'critical';

              return (
                <div key={index} className={`stock-item-card ila-card ${status}`}>
                  <div className="ila-card-status-dot"></div>
                  <div className="stock-item-header">
                    <div className="item-main-info">
                      <span className="stock-name-tag">{item.name}</span>
                      <span className="stock-size-val">{item.size}</span>
                    </div>
                    <div className="item-value-info">
                      <span className="stock-value-pcs">{item.quantity.toLocaleString()} <small>PCS</small></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MONTH ATTENDANCE CALENDAR STRIP ─────────────────── */}
        { (
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
        )}

        {isProductionDept && (
          <div className="emp-activity-section">
            <div className="emp-section-header">
              <h3 className="emp-section-title">
                <span className="material-symbols-outlined">history</span>
                Recent Production Activity
              </h3>
              <span className="emp-section-sub">{currentMonthName}</span>
            </div>

            <div className="emp-table-wrap">
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
            </div>
          </div>
        )}

        {isSalesDept && (
          <div className="emp-activity-section" style={{ marginTop: '24px' }}>
            <div className="emp-section-header">
              <h3 className="emp-section-title">
                <span className="material-symbols-outlined">receipt_long</span>
                Recent Sales Activity
              </h3>
              <span className="emp-section-sub">{currentMonthName}</span>
            </div>

            <div className="emp-table-wrap">
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mySales.length === 0 ? (
                    <tr><td colSpan="5" className="emp-empty-row">No sales logged this month</td></tr>
                  ) : mySales.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).slice(0, 10).map((sale, idx) => (
                    <tr key={sale.id || sale._id || idx}>
                      <td className="emp-row-num">{idx + 1}</td>
                      <td>{String(sale.date || '').split(',')[0] || dayjs(sale.createdAt).format('DD-MM-YYYY')}</td>
                      <td><strong>{sale.customer}</strong></td>
                      <td className="emp-money">₹{(sale.totalAmount || sale.amount || 0).toLocaleString()}</td>
                      <td>
                        <span className={`emp-status-pill status-${(sale.paidStatus || 'paid').toLowerCase()}`}>
                          {sale.paidStatus || 'Paid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

      {/* RAW MATERIAL STOCK ALERT */}
      {hasAccess('stock') && isRawMaterialAlertActive && (
        <div className="raw-material-warning-banner" onClick={() => navigate("/stock/raw-materials")}>
          <div className="warning-icon" style={{ background: "#ef4444" }}>
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className="warning-text">
            <h4 style={{ color: "#991b1b", margin: 0, fontSize: "18px", fontWeight: 800 }}>⚠️ RAW MATERIAL STOCK IS LOW!</h4>
            <p style={{ color: "#b91c1c", margin: "6px 0 0 0", fontSize: "14px", fontWeight: 600, lineHeight: "1.4" }}>
              Remaining Leaf Capacity: <strong>{remainingCapacity.toLocaleString()} plates</strong> (Threshold: {alertThreshold.toLocaleString()} plates).
              <br />
              Please purchase raw materials immediately.
            </p>
          </div>
          <button className="mark-now-btn" style={{ background: "#ef4444" }} onClick={(e) => {
            e.stopPropagation();
            navigate("/stock/raw-materials");
          }}>BUY NOW →</button>
        </div>
      )}


      {/* PREMIUM ANALYTICS GRID (Production Stats) */}
      {hasAccess('production') && (
        <div className="premium-stats-grid dashboard-top-stats">
          <div className="premium-stat-card today">
            <div className="p-stat-info">
              <span className="p-stat-label">Today's Production</span>
              <div className="p-stat-value">{(productionStats?.today || 0).toLocaleString()}</div>
              <div className="p-stat-breakdown">
                {dynamicSizes.map(size => {
                  const qty = productionStats?.todayBySize?.[size] || 0;
                  return (
                    <span key={size} className="breakdown-tag">
                      <span className="b-size">{formatSizeLabel(size)}</span>
                      <span className="b-qty">{qty.toLocaleString()}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="premium-stat-card week">
            <div className="p-stat-info">
              <span className="p-stat-label">Last 7 Days</span>
              <div className="p-stat-value">{(productionStats?.week || 0).toLocaleString()}</div>
              <div className="p-stat-breakdown">
                {dynamicSizes.map(size => {
                  const qty = productionStats?.weekBySize?.[size] || 0;
                  return (
                    <span key={size} className="breakdown-tag">
                      <span className="b-size">{formatSizeLabel(size)}</span>
                      <span className="b-qty">{qty.toLocaleString()}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="premium-stat-card month">
            <div className="p-stat-info">
              <span className="p-stat-label">This Month</span>
              <div className="p-stat-value">{(productionStats?.month || 0).toLocaleString()}</div>
              <div className="p-stat-breakdown">
                {dynamicSizes.map(size => {
                  const qty = productionStats?.monthBySize?.[size] || 0;
                  return (
                    <span key={size} className="breakdown-tag">
                      <span className="b-size">{formatSizeLabel(size)}</span>
                      <span className="b-qty">{qty.toLocaleString()}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="premium-stat-card stock">
            <div className="p-stat-info">
              <span className="p-stat-label">Total Produced</span>
              <div className="p-stat-value">{(productionStats?.stock || 0).toLocaleString()}</div>
              <div className="p-stat-breakdown">
                {dynamicSizes.map(size => {
                  const qty = productionStats?.stockBySize?.[size] || 0;
                  return (
                    <span key={size} className="breakdown-tag">
                      <span className="b-size">{formatSizeLabel(size)}</span>
                      <span className="b-qty">{qty.toLocaleString()}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* CHARTS SECTION */}
      {canViewChartRow && (
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
                    <span className="bar-label">TOTAL SALES</span>
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
                  <span className="legend-text">Sales: <strong>{formatStatValue(totalPeriodSales)}</strong></span>
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
              <div className="attendance-header" style={{ display: 'flex', width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>ATTENDANCE</h3>
                <span className="view-details" style={{ margin: 0, whiteSpace: 'nowrap' }}>VIEW DETAILS →</span>
              </div>

              <div className="attendance-pie-container">
                <div className="pie-chart-wrapper">
                  <div className="pie-chart">
                    {currentData.attendance.total > 0 ? (
                      <>
                        <div className="pie-segment present-segment" style={{ transform: `rotate(0deg)`, background: `conic-gradient(#10b981 0deg ${(currentData.attendance.present / currentData.attendance.total) * 360}deg, transparent ${(currentData.attendance.present / currentData.attendance.total) * 360}deg 360deg)` }}></div>
                        <div className="pie-segment absent-segment" style={{ transform: `rotate(${(currentData.attendance.present / currentData.attendance.total) * 360}deg)`, background: `conic-gradient(#ef4444 0deg ${(currentData.attendance.absent / currentData.attendance.total) * 360}deg, transparent ${(currentData.attendance.absent / currentData.attendance.total) * 360}deg 360deg)` }}></div>
                        <div className="pie-segment leave-segment" style={{ transform: `rotate(${((currentData.attendance.present + currentData.attendance.absent) / currentData.attendance.total) * 360}deg)`, background: `conic-gradient(#f59e0b 0deg ${(currentData.attendance.onLeave / currentData.attendance.total) * 360}deg, transparent ${(currentData.attendance.onLeave / currentData.attendance.total) * 360}deg 360deg)` }}></div>
                      </>
                    ) : (
                      <div className="pie-segment empty-segment" style={{ background: '#cbd5e1', width: '100%', height: '100%', borderRadius: '50%' }}></div>
                    )}
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
      )}


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

      {/* SIZE CHART SECTION (SALES BY SIZE & PRODUCTION BY SIZE) */}
      {(hasAccess('sales') || hasAccess('production')) && (
        <div className="charts-row size-charts-row" style={{ marginTop: '24px' }}>
          {hasAccess('sales') && (
            <div className="chart-card size-chart-card">
              <div className="chart-header">
                <div className="title-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="material-symbols-outlined icon-accent" style={{ color: '#3b82f6', fontSize: '24px' }}>shopping_bag</span>
                  <h3 style={{ textTransform: 'uppercase', fontSize: '14px', letterSpacing: '0.5px' }}>Sales Qty by Size</h3>
                </div>
                <span className="time-badge" style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{timeFilter}</span>
              </div>
              <div className="css-size-grid" style={{ marginTop: '16px' }}>
                {sizeChartsData.salesSizeChart.length > 0 ? sizeChartsData.salesSizeChart.map((s, i) => {
                  const barColor = SIZE_COLOR_MAP[s.name] || ['#6366f1', '#a855f7', '#ec4899', '#14b8a6'][i % 4];
                  return (
                    <div key={i} className="size-stat-item">
                      <span className="s-lbl">{s.name} {s.name.includes('"') || isNaN(s.name) ? '' : 'in'}</span>
                      <div className="s-bar-group">
                        <div
                          className="s-bar sales"
                          style={{
                            width: `${(s.SalesQty / Math.max(...sizeChartsData.salesSizeChart.map(x => x.SalesQty), 1)) * 100}%`,
                            backgroundColor: barColor
                          }}
                        ></div>
                        <span className="s-qty">{s.SalesQty}</span>
                      </div>
                    </div>
                  );
                }) : <div className="empty-chart-msg">No sales data for this period</div>}
              </div>
            </div>
          )}

          {hasAccess('production') && (
            <div className="chart-card size-chart-card">
              <div className="chart-header">
                <div className="title-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="material-symbols-outlined icon-accent-purple" style={{ color: '#8b5cf6', fontSize: '24px' }}>precision_manufacturing</span>
                  <h3 style={{ textTransform: 'uppercase', fontSize: '14px', letterSpacing: '0.5px' }}>Production Qty by Size</h3>
                </div>
                <span className="time-badge" style={{ background: '#f5f3ff', color: '#6d28d9', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{timeFilter}</span>
              </div>
              <div className="css-size-grid" style={{ marginTop: '16px' }}>
                {sizeChartsData.prodSizeChart.length > 0 ? sizeChartsData.prodSizeChart.map((s, i) => {
                  const barColor = SIZE_COLOR_MAP[s.name] || ['#6366f1', '#a855f7', '#ec4899', '#14b8a6'][i % 4];
                  return (
                    <div key={i} className="size-stat-item">
                      <span className="s-lbl">{s.name} {s.name.includes('"') || isNaN(s.name) ? '' : 'in'}</span>
                      <div className="s-bar-group">
                        <div
                          className="s-bar prod"
                          style={{
                            width: `${(s.ProdQty / Math.max(...sizeChartsData.prodSizeChart.map(x => x.ProdQty), 1)) * 100}%`,
                            backgroundColor: barColor
                          }}
                        ></div>
                        <span className="s-qty">{s.ProdQty}</span>
                      </div>
                    </div>
                  );
                }) : <div className="empty-chart-msg">No production data for this period</div>}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Dashboard;
