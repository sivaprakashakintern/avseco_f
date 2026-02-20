import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from '../assets/logo.png';
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("Monthly");
  const [showStockPopup, setShowStockPopup] = useState(false);
  const [showProductionPopup, setShowProductionPopup] = useState(false);
  const [showExpensesPopup, setShowExpensesPopup] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [stockPopupPosition, setStockPopupPosition] = useState({ top: 0, left: 0 });
  const [productionPopupPosition, setProductionPopupPosition] = useState({ top: 0, left: 0 });
  const [expensesPopupPosition, setExpensesPopupPosition] = useState({ top: 0, left: 0 });

  // DATA REPOSITORY - All data changes based on filter
  const dashboardData = {
    Weekly: {
      metrics: {
        stockValue: "₹18.5 L",
        production: "28,500 Units",
        expenses: "₹4.2 L",
        stockGrowth: "+2.1%",
        prodGrowth: "+5.4%",
        expStatus: "Optimal",
        expColor: "#10b981"
      },
      plates: [
        { size: "6 Inch", stock: 5200, produced: 8500, sold: 7800 },
        { size: "8 Inch", stock: 4100, produced: 6200, sold: 5900 },
        { size: "10 Inch", stock: 3200, produced: 4800, sold: 4500 },
        { size: "12 Inch", stock: 2100, produced: 3500, sold: 3200 },
      ],
      productionDetails: [
        { size: "6 Inch", today: 1250, week: 8500, efficiency: "94%" },
        { size: "8 Inch", today: 980, week: 6200, efficiency: "92%" },
        { size: "10 Inch", today: 720, week: 4800, efficiency: "88%" },
        { size: "12 Inch", today: 550, week: 3500, efficiency: "91%" }
      ],
      attendance: {
        present: 142,
        absent: 14,
        onLeave: 8,
        total: 164,
        trend: [98, 142, 138, 145, 144, 140, 142],
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      expenses: {
        total: "₹4.2 L",
        categories: [
          { name: "Machine Maintenance", amount: "₹0.5 L", percentage: 12, color: "#f97316" },
          { name: "Stock Purchased", amount: "₹2.1 L", percentage: 50, color: "#3b82f6" },
          { name: "Employee Salary", amount: "₹1.3 L", percentage: 31, color: "#10b981" },
          { name: "Others", amount: "₹0.3 L", percentage: 7, color: "#8b5cf6" }
        ]
      }
    },
    Monthly: {
      metrics: {
        stockValue: "₹82.4 L",
        production: "1,25,000 Units",
        expenses: "₹32.4 L",
        stockGrowth: "+12.5%",
        prodGrowth: "+8.2%",
        expStatus: "Over Budget",
        expColor: "#ef4444"
      },
      plates: [
        { size: "6 Inch", stock: 15200, produced: 45000, sold: 42000 },
        { size: "8 Inch", stock: 11800, produced: 38000, sold: 36500 },
        { size: "10 Inch", stock: 9200, produced: 25000, sold: 22000 },
        { size: "12 Inch", stock: 7600, produced: 18000, sold: 16500 },
      ],
      productionDetails: [
        { size: "6 Inch", today: 1450, month: 45000, efficiency: "96%" },
        { size: "8 Inch", today: 1220, month: 38000, efficiency: "94%" },
        { size: "10 Inch", today: 850, month: 25000, efficiency: "89%" },
        { size: "12 Inch", today: 620, month: 18000, efficiency: "92%" }
      ],
      attendance: {
        present: 138,
        absent: 18,
        onLeave: 12,
        total: 168,
        trend: [125, 138, 142, 140, 135, 138, 142],
        days: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7']
      },
      expenses: {
        total: "₹32.4 L",
        categories: [
          { name: "Machine Maintenance", amount: "₹3.9 L", percentage: 12, color: "#f97316" },
          { name: "Stock Purchased", amount: "₹16.2 L", percentage: 50, color: "#3b82f6" },
          { name: "Employee Salary", amount: "₹9.7 L", percentage: 30, color: "#10b981" },
          { name: "Others", amount: "₹2.6 L", percentage: 8, color: "#8b5cf6" }
        ]
      }
    },
    Yearly: {
      metrics: {
        stockValue: "₹95.2 L",
        production: "15.2 L Units",
        expenses: "₹3.8 Cr",
        stockGrowth: "+18%",
        prodGrowth: "+24%",
        expStatus: "Optimal",
        expColor: "#10b981"
      },
      plates: [
        { size: "6 Inch", stock: 45000, produced: 520000, sold: 510000 },
        { size: "8 Inch", stock: 38000, produced: 410000, sold: 395000 },
        { size: "10 Inch", stock: 25000, produced: 320000, sold: 305000 },
        { size: "12 Inch", stock: 18000, produced: 210000, sold: 198000 },
      ],
      productionDetails: [
        { size: "6 Inch", today: 1500, year: 520000, efficiency: "97%" },
        { size: "8 Inch", today: 1250, year: 410000, efficiency: "95%" },
        { size: "10 Inch", today: 920, year: 320000, efficiency: "91%" },
        { size: "12 Inch", today: 680, year: 210000, efficiency: "93%" }
      ],
      attendance: {
        present: 145,
        absent: 11,
        onLeave: 6,
        total: 162,
        trend: [130, 135, 140, 142, 145, 148, 150],
        days: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
      },
      expenses: {
        total: "₹3.8 Cr",
        categories: [
          { name: "Machine Maintenance", amount: "₹0.46 Cr", percentage: 12, color: "#f97316" },
          { name: "Stock Purchased", amount: "₹1.9 Cr", percentage: 50, color: "#3b82f6" },
          { name: "Employee Salary", amount: "₹1.14 Cr", percentage: 30, color: "#10b981" },
          { name: "Others", amount: "₹0.3 Cr", percentage: 8, color: "#8b5cf6" }
        ]
      }
    }
  };

  const currentData = dashboardData[timeFilter];
  const maxPlateStock = Math.max(...currentData.plates.map(p => p.stock));
  const maxSold = Math.max(...currentData.plates.map(p => p.sold));

  // Navigation handlers
  const handleStockClick = () => navigate("/stock");
  const handleProductionClick = () => navigate("/production");
  const handleExpensesClick = () => navigate("/expenses");
  const handleAttendanceClick = () => navigate("/attendance");

  // Popup handlers with position calculation
  const handleStockHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setStockPopupPosition({
      top: rect.bottom + 8,
      left: rect.left
    });
    setShowStockPopup(true);
  };

  const handleProductionHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setProductionPopupPosition({
      top: rect.bottom + 8,
      left: rect.left
    });
    setShowProductionPopup(true);
  };

  const handleExpensesHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setExpensesPopupPosition({
      top: rect.bottom + 8,
      left: rect.left
    });
    setShowExpensesPopup(true);
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="dashboard-container">
      {/* GREETINGS HEADER */}
{/* GREETINGS HEADER */}
<div className="greetings-header" style={{ background: '#d0fbde' }}>
  <div className="greetings-left">
    <div className="greetings-left-content">
      <div>
        <h1>Good Evening, Arun Kumar! 👋</h1>
        <p>Friday, 20 February 2026</p>
      </div>
    </div>
  </div>
  <div className="greetings-right">
    {/* Logo from assets - on right side */}
    <img 
      src={logo} 
      alt="AVS Logo" 
      className="header-logo"
    />
  </div>
</div>

      {/* KEY METRICS ROW */}
      <div className="metrics-row">
        {/* Stock Card */}
        <div
          className="metric-card clickable"
          onClick={handleStockClick}
          onMouseEnter={handleStockHover}
          onMouseLeave={() => setShowStockPopup(false)}
        >
          <div className="metric-icon stock-bg">
            <span className="material-symbols-outlined">inventory</span>
          </div>
          <div className="metric-content">
            <span className="metric-label">STOCK VALUE</span>
            <span className="metric-value">{currentData.metrics.stockValue}</span>
            <span className="metric-trend positive">{currentData.metrics.stockGrowth}</span>
          </div>
        </div>

        {/* Production Card */}
        <div
          className="metric-card clickable"
          onClick={handleProductionClick}
          onMouseEnter={handleProductionHover}
          onMouseLeave={() => setShowProductionPopup(false)}
        >
          <div className="metric-icon production-bg">
            <span className="material-symbols-outlined">manufacturing</span>
          </div>
          <div className="metric-content">
            <span className="metric-label">PRODUCTION</span>
            <span className="metric-value">{currentData.metrics.production}</span>
            <span className="metric-trend positive">{currentData.metrics.prodGrowth}</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div
          className="metric-card clickable"
          onClick={handleExpensesClick}
          onMouseEnter={handleExpensesHover}
          onMouseLeave={() => setShowExpensesPopup(false)}
        >
          <div className="metric-icon expenses-bg">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div className="metric-content">
            <span className="metric-label">EXPENSES</span>
            <span className="metric-value">{currentData.metrics.expenses}</span>
            <span className="metric-status" style={{ color: currentData.metrics.expColor }}>
              {currentData.metrics.expStatus}
            </span>
          </div>
        </div>
      </div>

      {/* POPUPS - Fixed positioning outside flow */}
      {showStockPopup && (
        <div className="fixed-popup stock-popup" style={{ top: stockPopupPosition.top, left: stockPopupPosition.left }}>
          <div className="popup-header">
            <h4>CURRENT STOCK - 4 SIZES</h4>
          </div>
          <div className="popup-content">
            {currentData.plates.map((plate, index) => (
              <div key={index} className="popup-item">
                <span className="popup-size">{plate.size}</span>
                <span className="popup-value">{plate.stock.toLocaleString()} units</span>
              </div>
            ))}
            <div className="popup-footer">
              <span>Total Value: {currentData.metrics.stockValue}</span>
            </div>
          </div>
        </div>
      )}

      {showProductionPopup && (
        <div className="fixed-popup production-popup" style={{ top: productionPopupPosition.top, left: productionPopupPosition.left }}>
          <div className="popup-header">
            <h4>TODAY'S PRODUCTION</h4>
          </div>
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
        <div className="fixed-popup expenses-popup" style={{ top: expensesPopupPosition.top, left: expensesPopupPosition.left }}>
          <div className="popup-header">
            <h4>EXPENSE BREAKDOWN</h4>
          </div>
          <div className="popup-content">
            {currentData.expenses.categories.map((expense, index) => (
              <div key={index} className="popup-item">
                <span className="popup-size">{expense.name}</span>
                <span className="popup-value">{expense.amount}</span>
              </div>
            ))}
            <div className="popup-footer">
              <span>Total: {currentData.metrics.expenses}</span>
            </div>
          </div>
        </div>
      )}

      {/* CHARTS SECTION */}
      <div className="charts-row">
        {/* Bar Chart */}
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
            {currentData.plates.map((plate, index) => (
              <div key={index} className="enhanced-bar-group">
                <div className="enhanced-bar-label">{plate.size}</div>
                <div className="enhanced-bars">
                  <div
                    className="bar-container"
                    onMouseEnter={() => setHoveredBar({ type: 'sales', index, value: plate.sold })}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div
                      className="enhanced-bar sales-bar"
                      style={{ height: `${(plate.sold / maxSold) * 180}px` }}
                    >
                      {hoveredBar?.type === 'sales' && hoveredBar?.index === index && (
                        <div className="bar-tooltip">
                          Sales: {plate.sold.toLocaleString()} units<br />
                          Value: ₹{(plate.sold * 0.1).toFixed(1)}L
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className="bar-container"
                    onMouseEnter={() => setHoveredBar({ type: 'expenses', index, value: plate.sold * 0.3 })}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div
                      className="enhanced-bar expenses-bar"
                      style={{ height: `${((plate.sold * 0.3) / maxSold) * 180}px` }}
                    >
                      {hoveredBar?.type === 'expenses' && hoveredBar?.index === index && (
                        <div className="bar-tooltip">
                          Expenses: ₹{((plate.sold * 0.3) / 1000).toFixed(1)}K<br />
                          {((plate.sold * 0.3) / plate.sold * 100).toFixed(1)}% of sales
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bar-values">
                  <span className="sales-value">₹{(plate.sold * 0.1).toFixed(1)}L</span>
                  <span className="expenses-value">₹{((plate.sold * 0.3) / 1000).toFixed(1)}K</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ATTENDANCE SECTION */}
        {/* ATTENDANCE SECTION */}
<div className="chart-card attendance-section" onClick={handleAttendanceClick}>
  <div className="attendance-header">
    <h3>ATTENDANCE</h3>
    <span className="view-details">VIEW DETAILS →</span>
  </div>

  <div className="attendance-pie-container">
    {/* Pie Chart */}
    <div className="pie-chart-wrapper">
      <div className="pie-chart">
        {/* Present Segment */}
        <div 
          className="pie-segment present-segment" 
          style={{ 
            transform: `rotate(0deg)`,
            background: `conic-gradient(#10b981 0deg ${(currentData.attendance.present / currentData.attendance.total) * 360}deg, transparent ${(currentData.attendance.present / currentData.attendance.total) * 360}deg 360deg)`
          }}
        >
          <div className="pie-tooltip">Present: {currentData.attendance.present}</div>
        </div>
        
        {/* Absent Segment */}
        <div 
          className="pie-segment absent-segment" 
          style={{ 
            transform: `rotate(${(currentData.attendance.present / currentData.attendance.total) * 360}deg)`,
            background: `conic-gradient(#ef4444 0deg ${(currentData.attendance.absent / currentData.attendance.total) * 360}deg, transparent ${(currentData.attendance.absent / currentData.attendance.total) * 360}deg 360deg)`
          }}
        >
          <div className="pie-tooltip">Absent: {currentData.attendance.absent}</div>
        </div>
        
        {/* Leave Segment */}
        <div 
          className="pie-segment leave-segment" 
          style={{ 
            transform: `rotate(${((currentData.attendance.present + currentData.attendance.absent) / currentData.attendance.total) * 360}deg)`,
            background: `conic-gradient(#f59e0b 0deg ${(currentData.attendance.onLeave / currentData.attendance.total) * 360}deg, transparent ${(currentData.attendance.onLeave / currentData.attendance.total) * 360}deg 360deg)`
          }}
        >
          <div className="pie-tooltip">On Leave: {currentData.attendance.onLeave}</div>
        </div>
        
        {/* Center Circle */}
        <div className="pie-center">
          <span className="pie-total">{currentData.attendance.total}</span>
          <span className="pie-total-label">TOTAL</span>
        </div>
      </div>
    </div>

    {/* Legend */}
    <div className="pie-legend">
      <div className="legend-item">
        <span className="legend-color present-color"></span>
        <div className="legend-details">
          <span className="legend-label">PRESENT</span>
          <span className="legend-value">{currentData.attendance.present}</span>
          <span className="legend-percentage">
            ({Math.round((currentData.attendance.present / currentData.attendance.total) * 100)}%)
          </span>
        </div>
      </div>
      
      <div className="legend-item">
        <span className="legend-color absent-color"></span>
        <div className="legend-details">
          <span className="legend-label">ABSENT</span>
          <span className="legend-value">{currentData.attendance.absent}</span>
          <span className="legend-percentage">
            ({Math.round((currentData.attendance.absent / currentData.attendance.total) * 100)}%)
          </span>
        </div>
      </div>
      
      <div className="legend-item">
        <span className="legend-color leave-color"></span>
        <div className="legend-details">
          <span className="legend-label">ON LEAVE</span>
          <span className="legend-value">{currentData.attendance.onLeave}</span>
          <span className="legend-percentage">
            ({Math.round((currentData.attendance.onLeave / currentData.attendance.total) * 100)}%)
          </span>
        </div>
      </div>
    </div>
  </div>

  {/* Stats Summary */}
  <div className="attendance-stats-summary">
    <div className="summary-item">
      <span className="summary-label">ATTENDANCE RATE</span>
      <span className="summary-value rate-high">
        {Math.round((currentData.attendance.present / currentData.attendance.total) * 100)}%
      </span>
    </div>
    <div className="summary-item">
      <span className="summary-label">ABSENTEE RATE</span>
      <span className="summary-value">
        {Math.round(((currentData.attendance.absent + currentData.attendance.onLeave) / currentData.attendance.total) * 100)}%
      </span>
    </div>
  </div>
</div>
      </div>

      {/* STOCK OVERVIEW */}
      <div className="stock-overview-section">
        <h3>STOCK OVERVIEW - 4 PLATE SIZES</h3>
        <div className="stock-grid">
          {currentData.plates.map((plate, index) => (
            <div key={index} className="stock-item-card">
              <div className="stock-item-header">
                <span className="stock-size">{plate.size.split(' ')[0]}</span>
                <span className="stock-value">{plate.stock.toLocaleString()} units</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EXPENSES BREAKDOWN */}
      <div className="expenses-breakdown-section">
        <div className="section-header">
          <h3>THIS MONTH EXPENSES BREAKDOWN</h3>
          <button className="view-link" onClick={handleExpensesClick}>
            VIEW ALL EXPENSES →
          </button>
        </div>

        <div className="expenses-categories-grid">
          <div className="expense-category-card">
            <div className="category-icon machine-icon">
              <span className="material-symbols-outlined">precision_manufacturing</span>
            </div>
            <div className="category-details">
              <span className="category-name">MACHINE MAINTENANCE</span>
              <span className="category-amount">{currentData.expenses.categories[0].amount}</span>
            </div>
          </div>

          <div className="expense-category-card">
            <div className="category-icon stock-icon">
              <span className="material-symbols-outlined">shopping_cart</span>
            </div>
            <div className="category-details">
              <span className="category-name">STOCK PURCHASED</span>
              <span className="category-amount">{currentData.expenses.categories[1].amount}</span>
            </div>
          </div>

          <div className="expense-category-card">
            <div className="category-icon salary-icon">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div className="category-details">
              <span className="category-name">EMPLOYEE SALARY</span>
              <span className="category-amount">{currentData.expenses.categories[2].amount}</span>
            </div>
          </div>

          <div className="expense-category-card">
            <div className="category-icon others-icon">
              <span className="material-symbols-outlined">category</span>
            </div>
            <div className="category-details">
              <span className="category-name">OTHERS</span>
              <span className="category-amount">{currentData.expenses.categories[3].amount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;