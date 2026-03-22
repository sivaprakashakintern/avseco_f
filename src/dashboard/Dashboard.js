import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from '../context/AppContext.js';
import { useAuth } from '../context/AuthContext.js';
import logo from '../assets/logo.png';
import { formatCurrency, getDynamicFontSize } from '../utils/formatUtils.js';
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, hasAccess } = useAuth();
  const {
    totalExpenseAmount,
    expenseByCategory,
    todayStats,
    last7DaysTrend,
    totalStockValue,
    stockData,
    productionStats
  } = useAppContext();

  const [timeFilter, setTimeFilter] = useState("Monthly");
  const [showStockPopup, setShowStockPopup] = useState(false);
  const [showProductionPopup, setShowProductionPopup] = useState(false);
  const [showExpensesPopup, setShowExpensesPopup] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [stockPopupPosition, setStockPopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const [productionPopupPosition, setProductionPopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const [expensesPopupPosition, setExpensesPopupPosition] = useState({ top: 0, left: 0, width: 0 });

  // Helper to get formatted currency with shortening
  const formatStatValue = (val) => formatCurrency(val, true);
  const formatUnits = (val) => val >= 1000 ? `${(val / 1000).toFixed(1)}K Units` : `${val} Units`;

  const getMetrics = (period) => {
    let units = 0;
    if (period === 'Weekly') units = productionStats.week;
    else if (period === 'Monthly') units = productionStats.month;
    else units = productionStats.month || 0; // Use month Total if yearly not available

    const stockStatus = totalStockValue < 0 ? "Understock" : totalStockValue === 0 ? "No Stock" : "Optimal";
    const stockColor = totalStockValue < 0 ? "#ef4444" : totalStockValue === 0 ? "#f97316" : "#10b981";
    const trendDisplay = "Optimal";

    return {
      stockValue: formatStatValue(totalStockValue),
      production: formatUnits(units),
      expenses: formatStatValue(totalExpenseAmount),
      stockGrowth: stockStatus,
      stockColor: stockColor,
      prodGrowth: trendDisplay,
      expStatus: totalExpenseAmount > 500000 ? "Over Budget" : "Optimal",
      expColor: totalExpenseAmount > 500000 ? "#ef4444" : "#10b981"
    };
  };

  const getPlatesData = (periodUnits) => {
    // Group production by size for the period
    const sizes = ["6-inch", "8-inch", "10-inch", "12-inch"];
    return sizes.map(size => {
      const stockItem = stockData.find(s => s.size === size) || { quantity: 0, totalValue: 0 };
      return {
        size,
        stock: stockItem.quantity,
        produced: stockItem.quantity, // Currently same as stock
        sold: 0 // Placeholder
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
  const plateDisplayData = dashboardData[timeFilter].plates.map(p => ({
    ...p,
    sold: p.sold || p.stock || 0 
  }));

  const currentData = dashboardData[timeFilter];
  const maxSold = Math.max(...plateDisplayData.map(p => p.sold), 100);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Navigation handlers
  const handleStockClick = () => navigate("/stock");
  const handleProductionClick = () => navigate("/production/daily");
  const handleExpensesClick = () => navigate("/expenses");
  const handleAttendanceClick = () => navigate("/attendance");

  // Popup handlers with position calculation
  const handleStockHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setStockPopupPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width
    });
    setShowStockPopup(true);
  };

  const handleProductionHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setProductionPopupPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width
    });
    setShowProductionPopup(true);
  };

  const handleExpensesHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setExpensesPopupPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width
    });
    setShowExpensesPopup(true);
  };

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

      {/* KEY METRICS ROW */}
      <div className="metrics-row">
        {hasAccess('stock') && (
          <div className="metric-card clickable" onClick={handleStockClick} onMouseEnter={handleStockHover} onMouseLeave={() => setShowStockPopup(false)}>
            <div className="metric-icon stock-bg"><span className="material-symbols-outlined">inventory</span></div>
            <div className="metric-content">
              <span className="metric-label">STOCK VALUE</span>
              <span className="metric-value" style={getDynamicFontSize(totalStockValue)}>
                {currentData.metrics.stockValue}
              </span>
              <span className="metric-trend" style={{ color: currentData.metrics.stockColor }}>{currentData.metrics.stockGrowth}</span>
            </div>
          </div>
        )}

        {hasAccess('production') && (
          <div className="metric-card clickable" onClick={handleProductionClick} onMouseEnter={handleProductionHover} onMouseLeave={() => setShowProductionPopup(false)}>
            <div className="metric-icon production-bg"><span className="material-symbols-outlined">manufacturing</span></div>
            <div className="metric-content">
              <span className="metric-label">PRODUCTION</span>
              <span className="metric-value">{currentData.metrics.production}</span>
              <span className="metric-trend positive">{currentData.metrics.prodGrowth}</span>
            </div>
          </div>
        )}

        {hasAccess('stock') && (
          <div className="metric-card clickable" onClick={handleExpensesClick} onMouseEnter={handleExpensesHover} onMouseLeave={() => setShowExpensesPopup(false)}>
            <div className="metric-icon expenses-bg"><span className="material-symbols-outlined">payments</span></div>
            <div className="metric-content">
              <span className="metric-label">EXPENSES</span>
              <span className="metric-value" style={getDynamicFontSize(totalExpenseAmount)}>
                {currentData.metrics.expenses}
              </span>
              <span className="metric-status" style={{ color: currentData.metrics.expColor }}>{currentData.metrics.expStatus}</span>
            </div>
          </div>
        )}
      </div>

      {/* POPUPS */}
      {showStockPopup && (
        <div className="fixed-popup stock-popup" style={{ top: stockPopupPosition.top, left: stockPopupPosition.left, width: stockPopupPosition.width }}>
          <div className="popup-header"><h4>CURRENT STOCK - {stockData.length} ITEMS</h4></div>
          <div className="popup-content">
            {stockData.map((item, index) => (
              <div key={index} className="popup-item">
                <span className="popup-size">{item.name} {item.size}</span>
                <span className="popup-value">{item.quantity.toLocaleString()} units</span>
              </div>
            ))}
            <div className="popup-footer"><span>Total Value: {currentData.metrics.stockValue}</span></div>
          </div>
        </div>
      )}

      {showProductionPopup && (
        <div className="fixed-popup production-popup" style={{ top: productionPopupPosition.top, left: productionPopupPosition.left, width: productionPopupPosition.width }}>
          <div className="popup-header"><h4>TODAY'S PRODUCTION</h4></div>
          <div className="popup-content">
            {currentData.productionDetails.map((prod, index) => (
              <div key={index} className="popup-item">
                <span className="popup-size">{prod.size}</span>
                <span className="popup-value">{prod.today.toLocaleString()} units</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showExpensesPopup && (
        <div className="fixed-popup expenses-popup" style={{ top: expensesPopupPosition.top, left: expensesPopupPosition.left, width: expensesPopupPosition.width }}>
          <div className="popup-header"><h4>EXPENSE BREAKDOWN</h4></div>
          <div className="popup-content">
            {currentData.expenses.categories.map((expense, index) => (
              <div key={index} className="popup-item">
                <span className="popup-size">{expense.name}</span>
                <span className="popup-value">{expense.amount}</span>
              </div>
            ))}
            <div className="popup-footer"><span>Total: {currentData.metrics.expenses}</span></div>
          </div>
        </div>
      )}

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
            <div className="enhanced-bar-chart">
              {plateDisplayData.map((plate, index) => (
                <div key={index} className="enhanced-bar-group">
                  <div className="enhanced-bar-label">{plate.size}</div>
                  <div className="enhanced-bars">
                    <div className="bar-container" onMouseEnter={() => setHoveredBar({ type: 'sales', index, value: plate.sold })} onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredBar(null)}>
                      <div className="enhanced-bar sales-bar" style={{ height: `calc(${plate.sold / maxSold} * var(--bar-max-height))` }}></div>
                    </div>
                    <div className="bar-container" onMouseEnter={() => setHoveredBar({ type: 'expenses', index, value: plate.sold * 0.3 })} onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredBar(null)}>
                      <div className="enhanced-bar expenses-bar" style={{ height: `calc(${(plate.sold * 0.3) / maxSold} * var(--bar-max-height))` }}></div>
                    </div>

                    {hoveredBar?.index === index && (
                      <div className="bar-tooltip dynamic-tooltip" style={{ position: 'fixed', left: mousePos.x + 15, top: mousePos.y - 40, pointerEvents: 'none' }}>
                        {hoveredBar.type === 'sales' ? (
                          <>
                            <strong>{plate.size} Sales</strong><br />
                            Volume: {plate.sold.toLocaleString()} units<br />
                            Value: ₹{(plate.sold * 0.1).toFixed(1)}L
                          </>
                        ) : (
                          <>
                            <strong>{plate.size} Expenses</strong><br />
                            Cost: ₹{((plate.sold * 0.3) / 1000).toFixed(1)}K<br />
                            Ratio: {((plate.sold * 0.3) / plate.sold * 100).toFixed(1)}% of sales
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="bar-values">
                    <span className="sales-value">₹{(plate.sold * 0.1).toFixed(1)}L</span>
                    <span className="expenses-value">₹{((plate.sold * 0.3) / 1000).toFixed(1)}K</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="chart-legend-row-bottom">
              <div className="chart-legend-item">
                <span className="legend-dot sales-dot"></span>
                <span className="legend-text">Sales (Units)</span>
              </div>
              <div className="chart-legend-item">
                <span className="legend-dot expenses-dot"></span>
                <span className="legend-text">Expenses (Cost)</span>
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

      {/* STOCK OVERVIEW */}
      {hasAccess('stock') && (
        <div className="stock-overview-section">
          <h3>ALL STOCK ITEMS ({stockData.length})</h3>
          <div className="stock-grid">
            {stockData.map((item, index) => (
              <div
                key={index}
                className="stock-item-card"
                onClick={handleStockClick}
                style={{
                  cursor: 'pointer'
                }}
              >
                <div className="stock-item-header">
                  <div>
                    <span className="stock-name" style={{ fontSize: '13px', fontWeight: '800', display: 'block', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{item.name}</span>
                    <span className="stock-size" style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{item.size}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className="stock-value" style={{ fontSize: '15px', fontWeight: '800', color: '#2563eb' }}>{item.quantity.toLocaleString()} pcs</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Value: ₹{item.totalValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXPENSES BREAKDOWN */}
      {hasAccess('stock') && (
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
