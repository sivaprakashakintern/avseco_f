import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from '../context/AppContext.js';
import { useAuth } from '../context/AuthContext.js';
import logo from '../assets/logo.png';
import { formatCurrency } from '../utils/formatUtils.js';
import dayjs from 'dayjs';
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, hasAccess } = useAuth();
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
    productionTargets = []
  } = useAppContext();
  const [timeFilter, setTimeFilter] = useState("Monthly");
  const [hoveredBar, setHoveredBar] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Helper to get formatted currency with shortening
  const formatStatValue = (val) => formatCurrency(val, true);
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
    const sizes = ["6-inch", "8-inch", "10-inch", "12-inch"];
    const now = new Date();
    
    // 1. Determine period dates
    const isYearly = period === 'Yearly';
    const isWeekly = period === 'Weekly';
    
    const safeDate = (dateStr) => {
      if (!dateStr) return new Date(0);
      if (typeof dateStr === 'string' && dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 2) return new Date(parts[2], parts[1] - 1, parts[0]); // DD-MM-YYYY
      }
      return new Date(dateStr);
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
    
    // 3. Get production for the period (already in context stats)
    const productionBySize = period === 'Weekly' ? productionStats.weekBySize : 
                             period === 'Yearly' ? productionStats.monthBySize : // Use monthly if yearly not mapped
                             productionStats.monthBySize;
    
    const totalProduction = Object.values(productionBySize).reduce((sum, val) => sum + val, 0) || 1;
    const expensePerUnit = totalPeriodExpenses / totalProduction;

    // 4. Group data by size
    return sizes.map(size => {
      const sKey = size.toLowerCase().trim().replace(" ", "-");
      
      // Calculate sales value for this size
      const salesValue = filteredSales.reduce((sum, sale) => {
        const item = sale.saleItems?.find(i => (i.size || "").toLowerCase().trim().replace(" ", "-") === sKey);
        return sum + (item ? Number(item.amount || 0) : 0);
      }, 0);

      const production = productionBySize[size] || 0;
      const distributedExpense = production * expensePerUnit;

      return {
        size,
        salesValue,
        expensesValue: distributedExpense || (salesValue * 0.15) // Fallback if no production but have sales
      };
    });
  };

  const getProductionDetails = () => {
    const sizes = ["6-inch", "8-inch", "10-inch", "12-inch"];
    return sizes.map(size => ({
      size,
      today: productionStats.todayBySize[size] || 0
    }));
  };

  const dashboardData = {
    Weekly: {
      metrics: getMetrics('Weekly'),
      plates: getPlatesData(productionStats.weekly),
      productionDetails: getProductionDetails(),
      attendance: {
        present: todayStats.present,
        absent: todayStats.absent,
        onLeave: todayStats.half,
        total: todayStats.total,
        trend: last7DaysTrend.map(t => t.present),
        days: last7DaysTrend.map(t => t.label)
      },
      expenses: {
        total: formatStatValue(totalExpenseAmount),
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
      plates: getPlatesData(productionStats.monthly),
      productionDetails: getProductionDetails(),
      attendance: {
        present: todayStats.present,
        absent: todayStats.absent,
        onLeave: todayStats.half,
        total: todayStats.total,
        trend: last7DaysTrend.map(t => t.present),
        days: last7DaysTrend.map(t => t.label)
      },
      expenses: {
        total: formatStatValue(totalExpenseAmount),
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
      plates: getPlatesData(productionStats.yearly),
      productionDetails: getProductionDetails(),
      attendance: {
        present: todayStats.present,
        absent: todayStats.absent,
        onLeave: todayStats.half,
        total: todayStats.total,
        trend: last7DaysTrend.map(t => t.present),
        days: last7DaysTrend.map(t => t.label)
      },
      expenses: {
        total: formatStatValue(totalExpenseAmount),
        categories: [
          { name: "Maintenance", amount: formatStatValue(expenseByCategory["Machine Maintenance"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Machine Maintenance"] || 0) / totalExpenseAmount) * 100) : 0, color: "#f97316" },
          { name: "Material", amount: formatStatValue(expenseByCategory["Material"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Material"] || 0) / totalExpenseAmount) * 100) : 0, color: "#3b82f6" },
          { name: "Salary", amount: formatStatValue(expenseByCategory["Salary"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Salary"] || 0) / totalExpenseAmount) * 100) : 0, color: "#10b981" },
          { name: "Others", amount: formatStatValue(expenseByCategory["Others"] || 0), percentage: totalExpenseAmount > 0 ? Math.round(((expenseByCategory["Others"] || 0) / totalExpenseAmount) * 100) : 0, color: "#8b5cf6" }
        ]
      }
    }
  };

  // For the bar chart logic, if all sold are 0, use stock to show SOMETHING
  const plateDisplayData = getPlatesData(timeFilter);
  const totalPeriodSales = plateDisplayData.reduce((sum, p) => sum + p.salesValue, 0);


  const totalPeriodExpenses = plateDisplayData.reduce((sum, p) => sum + p.expensesValue, 0);

  const currentData = dashboardData[timeFilter];


  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

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

  return (
    <div className="dashboard-container">
      {/* GREETINGS HEADER */}
      <div className="greetings-header">
        <div className="greetings-left">
          <div className="greetings-content-box">
             <div className="greetings-text">
                <h1>{getGreeting()}, {user?.name || "User"}! 👋</h1>
                <p className="current-date">
                  <span className="material-symbols-outlined">calendar_today</span>
                  {new Date().toLocaleDateString('en-GB', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
             </div>
          </div>
        </div>
        <div className="greetings-right">
          <div className="header-logo-card">
            <img src={logo} alt="AVS Logo" className="dashboard-brand-logo" />
          </div>
        </div>
      </div>

      {/* PREMIUM ANALYTICS GRID (Production Stats) */}
      <div className="premium-stats-grid dashboard-top-stats">
        <div className="premium-stat-card today">
          <div className="p-stat-info">
            <span className="p-stat-label">Today's Production</span>
            <div className="p-stat-value">{(productionStats?.today || 0).toLocaleString()}</div>
            <div className="p-stat-breakdown">
              {["6-inch", "8-inch", "10-inch", "12-inch"].map(size => (
                <span key={size} className="breakdown-tag">
                  {size.split('-')[0]}: {productionStats?.todayBySize?.[size] || 0}
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
              {["6-inch", "8-inch", "10-inch", "12-inch"].map(size => (
                <span key={size} className="breakdown-tag">
                  {size.split('-')[0]}: {productionStats?.weekBySize?.[size] || 0}
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
              {["6-inch", "8-inch", "10-inch", "12-inch"].map(size => (
                <span key={size} className="breakdown-tag">
                  {size.split('-')[0]}: {productionStats?.monthBySize?.[size] || 0}
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
              {["6-inch", "8-inch", "10-inch", "12-inch"].map(size => (
                <span key={size} className="breakdown-tag">
                  {size.split('-')[0]}: {productionStats?.stockBySize?.[size] || 0}
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
            <div className="summary-pie-wrapper">
                <div className="summary-pie-container">
                    <div className="pie-chart-main">
                        <div 
                           className="pie-slice sales-slice" 
                           style={{ 
                              transform: `rotate(0deg)`, 
                              background: `conic-gradient(#2563eb 0deg ${totalPeriodSales > 0 ? (totalPeriodSales / (totalPeriodSales + totalPeriodExpenses)) * 360 : 180}deg, transparent 0deg 360deg)` 
                           }}
                           onMouseEnter={() => setHoveredBar({ type: 'sales', value: totalPeriodSales })}
                           onMouseMove={handleMouseMove}
                           onMouseLeave={() => setHoveredBar(null)}
                        ></div>
                        <div 
                           className="pie-slice expenses-slice" 
                           style={{ 
                              transform: `rotate(${totalPeriodSales > 0 ? (totalPeriodSales / (totalPeriodSales + totalPeriodExpenses)) * 360 : 180}deg)`, 
                              background: `conic-gradient(#ef4444 0deg ${totalPeriodExpenses > 0 ? (totalPeriodExpenses / (totalPeriodSales + totalPeriodExpenses)) * 360 : 180}deg, transparent 0deg 360deg)` 
                           }}
                           onMouseEnter={() => setHoveredBar({ type: 'expenses', value: totalPeriodExpenses })}
                           onMouseMove={handleMouseMove}
                           onMouseLeave={() => setHoveredBar(null)}
                        ></div>
                        <div className="pie-center-hole">
                            <span className="pie-center-label">BALANCE</span>
                        </div>
                    </div>

                    {hoveredBar && (
                        <div className="bar-tooltip dynamic-tooltip" style={{ position: 'fixed', left: mousePos.x + 15, top: mousePos.y - 40, pointerEvents: 'none' }}>
                            <strong>{hoveredBar.type === 'sales' ? 'Total Sales' : 'Total Expenses'}</strong><br />
                            Value: ₹{hoveredBar.value.toLocaleString()}<br />
                            Percentage: {((hoveredBar.value / (totalPeriodSales + totalPeriodExpenses || 1)) * 100).toFixed(1)}%
                        </div>
                    )}
                </div>
                
                <div className="pie-stats-column">
                    <div className="stat-item sales">
                        <span className="stat-dot blue"></span>
                        <div className="stat-details">
                            <span className="stat-val prominent">{formatCurrency(totalPeriodSales, true)}</span>
                        </div>
                    </div>
                    <div className="stat-item expenses">
                        <span className="stat-dot red"></span>
                        <div className="stat-details">
                            <span className="stat-val prominent">{formatCurrency(totalPeriodExpenses, true)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="chart-legend-row-bottom">
              <div className="chart-legend-item">
                <span className="legend-dot sales-dot"></span>
                <span className="legend-text">Revenue</span>
              </div>
              <div className="chart-legend-item">
                <span className="legend-dot expenses-dot"></span>
                <span className="legend-text">Expenses</span>
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
                      <span className="stock-total-val">₹{item.totalValue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="ila-item-details">
                    <div className="ila-detail-row">
                      <span>Rate/pcs</span>
                      <span className="ila-val">₹{item.perPlateRate}</span>
                    </div>
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

      {/* EXPENSES BREAKDOWN */}
      {hasAccess('expenses') && (
        <div className="expenses-breakdown-section">
          <h3>THIS MONTH EXPENSES BREAKDOWN</h3>
          <div className="expenses-categories-grid">
            <div className="expense-category-card">
              <div className="category-icon machine-icon"><span className="material-symbols-outlined">precision_manufacturing</span></div>
              <div className="category-details">
                <span className="category-name">MACHINE MAINTENANCE</span>
                <span className="category-amount">{currentData.expenses.categories[0].amount}</span>
              </div>
            </div>
            <div className="expense-category-card">
              <div className="category-icon stock-icon"><span className="material-symbols-outlined">shopping_cart</span></div>
              <div className="category-details">
                <span className="category-name">STOCK PURCHASED</span>
                <span className="category-amount">{currentData.expenses.categories[1].amount}</span>
              </div>
            </div>
            <div className="expense-category-card">
              <div className="category-icon salary-icon"><span className="material-symbols-outlined">payments</span></div>
              <div className="category-details">
                <span className="category-name">EMPLOYEE SALARY</span>
                <span className="category-amount">{currentData.expenses.categories[2].amount}</span>
              </div>
            </div>
            <div className="expense-category-card">
              <div className="category-icon others-icon"><span className="material-symbols-outlined">category</span></div>
              <div className="category-details">
                <span className="category-name">OTHERS</span>
                <span className="category-amount">{currentData.expenses.categories[3].amount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
