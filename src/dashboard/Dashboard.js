import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState("Monthly");

  // MOCK DATA
  const dashboardData = {
    Weekly: {
      metrics: {
        inventory: "₹18.5 L",
        production: "28,500",
        expenses: "₹4.2 L",
        netProfit: "₹14.3 L"
      },
      sales: [
        { label: "6 Inch", value: 7800, max: 10000, color: "#006A4E" }, // Theme Green
        { label: "8 Inch", value: 5900, max: 10000, color: "#3b82f6" },
        { label: "10 Inch", value: 4500, max: 10000, color: "#8b5cf6" },
        { label: "12 Inch", value: 3200, max: 10000, color: "#f59e0b" },
      ],
      comparison: [
        { day: "Mon", sales: 2.5, expense: 0.8 },
        { day: "Tue", sales: 2.8, expense: 0.9 },
        { day: "Wed", sales: 3.2, expense: 1.1 },
        { day: "Thu", sales: 2.9, expense: 1.0 },
        { day: "Fri", sales: 3.5, expense: 1.2 },
        { day: "Sat", sales: 4.2, expense: 1.5 },
      ],
      attendance: {
        avgPresent: 142,
        avgAbsent: 14,
        trend: [60, 75, 80, 70, 85, 90, 88]
      }
    },
    Monthly: {
      metrics: {
        inventory: "₹82.4 L",
        production: "1,25,000",
        expenses: "₹32.4 L",
        netProfit: "₹50.0 L"
      },
      sales: [
        { label: "6 Inch", value: 42000, max: 50000, color: "#006A4E" }, // Theme Green
        { label: "8 Inch", value: 36500, max: 50000, color: "#3b82f6" },
        { label: "10 Inch", value: 22000, max: 50000, color: "#8b5cf6" },
        { label: "12 Inch", value: 16500, max: 50000, color: "#f59e0b" },
      ],
      comparison: [
        { day: "Wk 1", sales: 12.5, expense: 8.2 },
        { day: "Wk 2", sales: 15.2, expense: 7.5 },
        { day: "Wk 3", sales: 18.8, expense: 9.1 },
        { day: "Wk 4", sales: 22.4, expense: 8.5 },
      ],
      attendance: {
        avgPresent: 138,
        avgAbsent: 18,
        trend: [80, 82, 78, 85]
      }
    },
    Yearly: {
      metrics: {
        inventory: "₹95.2 L",
        production: "15.2 L",
        expenses: "₹3.8 Cr",
        netProfit: "₹1.4 Cr"
      },
      sales: [
        { label: "6 Inch", value: 510000, max: 600000, color: "#006A4E" }, // Theme Green
        { label: "8 Inch", value: 395000, max: 600000, color: "#3b82f6" },
        { label: "10 Inch", value: 305000, max: 600000, color: "#8b5cf6" },
        { label: "12 Inch", value: 198000, max: 600000, color: "#f59e0b" },
      ],
      comparison: [
        { day: "Q1", sales: 45, expense: 12 },
        { day: "Q2", sales: 52, expense: 15 },
        { day: "Q3", sales: 48, expense: 14 },
        { day: "Q4", sales: 65, expense: 18 },
      ],
      attendance: {
        avgPresent: 145,
        avgAbsent: 11,
        trend: [130, 135, 140, 142, 145, 148, 150, 148, 146, 145, 142, 140]
      }
    }
  };

  const currentData = dashboardData[timeFilter];
  const maxComp = Math.max(...currentData.comparison.map(d => Math.max(d.sales, d.expense)));

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Business Overview</h2>
          <p>{timeFilter} Performance Metrics</p>
        </div>

        <div className="filter-group" style={{
          background: '#ffffff',
          padding: '6px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex',
          gap: '8px'
        }}>
          {["Weekly", "Monthly", "Yearly"].map(filter => (
            <button
              key={filter}
              style={{
                padding: '10px 24px',
                border: 'none',
                background: timeFilter === filter ? '#006A4E' : 'transparent',
                color: timeFilter === filter ? '#ffffff' : '#64748b',
                borderRadius: '8px',
                fontWeight: timeFilter === filter ? '700' : '500',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                boxShadow: timeFilter === filter ? '0 4px 6px rgba(0,106,78,0.2)' : 'none'
              }}
              onClick={() => setTimeFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* CLICKABLE METRIC CARDS */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>

        {/* 1. INVENTORY -> STOCK */}
        <div
          className="metric-card hover-card"
          onClick={() => navigate('/stock')}
          style={{ cursor: 'pointer', borderLeft: '4px solid #f59e0b' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stocks</span>
              <h3 style={{ fontSize: '36px', margin: '4px 0 8px', color: '#1e293b', fontWeight: '800', letterSpacing: '-1px' }}>{currentData.metrics.inventory}</h3>
            </div>
            <div className="icon-box" style={{ background: '#fffbeb', color: '#f59e0b' }}>
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Click to view Stock Overview</p>
        </div>

        {/* 2. PRODUCTION -> PRODUCTS (CATEGORY) */}
        <div
          className="metric-card hover-card"
          onClick={() => navigate('/products')}
          style={{ cursor: 'pointer', borderLeft: '4px solid #3b82f6' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Production</span>
              <h3 style={{ fontSize: '36px', margin: '4px 0 8px', color: '#1e293b', fontWeight: '800', letterSpacing: '-1px' }}>{currentData.metrics.production}</h3>
            </div>
            <div className="icon-box" style={{ background: '#eff6ff', color: '#3b82f6' }}>
              <span className="material-symbols-outlined">category</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Click for Plate Categories</p>
        </div>

        {/* 3. EXPENSES -> EXPENSE DETAIL */}
        <div
          className="metric-card hover-card"
          onClick={() => navigate('/expenses')}
          style={{ cursor: 'pointer', borderLeft: '4px solid #ef4444' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Expenses</span>
              <h3 style={{ fontSize: '36px', margin: '4px 0 8px', color: '#1e293b', fontWeight: '800', letterSpacing: '-1px' }}>{currentData.metrics.expenses}</h3>
            </div>
            <div className="icon-box" style={{ background: '#fef2f2', color: '#ef4444' }}>
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Click to view Cost Breakdown</p>
        </div>
      </div>

      {/* CHART ROW */}
      <div className="chart-section" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* LEFT: PLATE SALES PERFORMANCE (BAR CHART) */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Plate Sales Performance</h3>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#006A4E' }}>Units Sold</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '220px', paddingBottom: '10px' }}>
            {currentData.sales.map((item, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>{item.value.toLocaleString()}</div>
                <div style={{
                  width: '40px',
                  height: `${(item.value / item.max) * 100}%`,
                  background: item.color,
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.5s ease',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}></div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: SALES vs EXPENSES COMPARISON */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Sales vs Expenses</h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', background: '#006A4E', borderRadius: '2px' }}></span> Sales</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }}></span> Exp</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '220px', padding: '0 10px' }}>
            {currentData.comparison.map((d, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '100%' }}>

                  {/* Sales Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#006A4E', marginBottom: '4px' }}>{d.sales}</span>
                    <div style={{
                      width: '18px',
                      height: `${(d.sales / maxComp) * 70}%`, // Reduced height to fit text
                      background: '#006A4E',
                      borderRadius: '4px 4px 0 0'
                    }}></div>
                  </div>

                  {/* Expense Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#ef4444', marginBottom: '4px' }}>{d.expense}</span>
                    <div style={{
                      width: '18px',
                      height: `${(d.expense / maxComp) * 70}%`, // Reduced height to fit text
                      background: '#ef4444',
                      borderRadius: '4px 4px 0 0'
                    }}></div>
                  </div>

                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{d.day}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ATTENDANCE SECTION */}
      <div className="chart-card" style={{ marginTop: '24px', cursor: 'pointer' }} onClick={() => navigate('/attendance')}>
        <div className="chart-header">
          <h3 className="chart-title">Employee Attendance Summary</h3>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>

          {/* LEFT: PIE CHART (Donut Style) & STATS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flex: 1 }}>
            {/* Donut Chart */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(
                  #006A4E 0% ${(currentData.attendance.avgPresent / (currentData.attendance.avgPresent + currentData.attendance.avgAbsent)) * 100}%, 
                  #ef4444 0% 100%
                )`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ width: '85px', height: '85px', background: 'white', borderRadius: '50%', position: 'absolute' }}></div>
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#006A4E' }}>
                  {Math.round((currentData.attendance.avgPresent / (currentData.attendance.avgPresent + currentData.attendance.avgAbsent)) * 100)}%
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Rate</div>
              </div>
            </div>

            {/* Legend / Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', background: '#006A4E', borderRadius: '50%' }}></div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Avg Present</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{currentData.attendance.avgPresent}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%' }}></div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Avg Absent</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{currentData.attendance.avgAbsent}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: BAR CHART (Trend) */}
          <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', paddingLeft: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '4px' }}>
                Trend ({timeFilter})
              </span>
            </div>

            <div style={{ height: '100px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
              {currentData.attendance.trend.map((h, i) => {
                let label = "";
                if (timeFilter === "Weekly") {
                  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                  label = days[i];
                } else if (timeFilter === "Monthly") {
                  label = `W${i + 1}`;
                } else {
                  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  label = months[i];
                }

                const percentage = Math.min((h / 160) * 85, 85);

                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '10px', fontWeight: '600', color: '#006A4E', marginBottom: '4px' }}>{h}</span>
                    <div style={{
                      width: '100%',
                      maxWidth: '20px',
                      height: `${percentage}%`,
                      background: '#006A4E',
                      borderRadius: '4px 4px 0 0',
                      opacity: 0.9,
                      transition: 'height 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}></div>
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', fontWeight: '500' }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#006A4E', fontSize: '13px', fontWeight: '600' }}>
            View Detailed Log <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;