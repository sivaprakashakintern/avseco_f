import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from '../context/AppContext.js';
import { useAuth } from '../context/AuthContext.js';
import logo from '../assets/logo.png';
import dayjs from 'dayjs';
import axios from '../utils/axiosConfig.js';
import "./Dashboard.css";

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, hasAccess } = useAuth();
    const { 
        stockData = [], 
        productionStats = { todayBySize: {}, weekBySize: {}, monthBySize: {}, stockBySize: {} },
        productionTargets = []
    } = useAppContext();

    const [timeFilter, setTimeFilter] = useState("Monthly");
    const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/turnover/analytics', {
                params: {
                    filter: timeFilter === "All Time" ? "all" : timeFilter.toLowerCase(),
                    month: selectedMonth
                }
            });
            setAnalyticsData(data);
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, [timeFilter, selectedMonth]);

    useEffect(() => {
        if (hasAccess('dashboard')) {
            fetchAnalytics();
        }
    }, [fetchAnalytics, hasAccess]);

    const stats = analyticsData?.summary || {};
    const income = stats.totalIncome || 0;
    const expense = stats.totalExpenses || 0;
    const profit = income - expense;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const handleStockClick = () => navigate("/stock");
    const handleAttendanceClick = () => navigate("/attendance");

    return (
        <div className="dashboard-container">
            {/* GREETINGS HEADER */}
            <div className="greetings-header">
                <div className="greetings-left">
                    <div className="greetings-text">
                        <h1>{getGreeting()}, {user?.name || "User"}! 👋</h1>
                        <p className="current-date">
                            <span className="material-symbols-outlined">calendar_today</span>
                            {dayjs().format('dddd, D MMMM YYYY')}
                        </p>
                    </div>
                    <div className="month-picker" style={{ marginTop: '16px' }}>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="dashboard-month-input"
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: '50px',
                                fontSize: '14px',
                                fontWeight: '700',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        />
                    </div>
                </div>
                <div className="greetings-right">
                    <div className="header-logo-card">
                        <img src={logo} alt="AVS Logo" className="dashboard-brand-logo" />
                    </div>
                </div>
            </div>

            {/* TOP SUMMARY CARDS */}
            <div className="metrics-row" style={{ marginTop: '-40px', position: 'relative', zIndex: 10 }}>
                <div className="metric-card">
                    <div className="metric-icon sales-bg">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">TOTAL INCOME</span>
                        <span className="metric-value">₹{income.toLocaleString()}</span>
                        <span className="metric-trend positive">{timeFilter} View</span>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon production-bg">
                        <span className="material-symbols-outlined">receipt_long</span>
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">TOTAL EXPENSES</span>
                        <span className="metric-value">₹{expense.toLocaleString()}</span>
                        <span className="metric-status" style={{ color: expense > income ? '#f43f5e' : '#10b981' }}>
                            {expense > income ? 'Over Income' : 'Within Budget'}
                        </span>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon expenses-bg">
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">NET PROFIT</span>
                        <span className="metric-value" style={{ color: profit >= 0 ? '#10b981' : '#f43f5e' }}>
                            ₹{profit.toLocaleString()}
                        </span>
                        <span className="metric-trend" style={{ color: profit >= 0 ? '#10b981' : '#f43f5e' }}>
                            {profit >= 0 ? 'Surplus' : 'Deficit'}
                        </span>
                    </div>
                </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="charts-row" style={{ marginTop: '24px' }}>
                {/* Bar Chart */}
                <div className="chart-card sales-expenses-card large-chart">
                    <div className="chart-header">
                        <h3>INCOME VS EXPENSES</h3>
                        <div className="filter-group small">
                            {["Daily", "Monthly", "Yearly", "All Time"].map(f => (
                                <button
                                    key={f}
                                    className={`filter-chip ${timeFilter === f ? 'active' : ''}`}
                                    onClick={() => setTimeFilter(f)}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="summary-pie-wrapper">
                        <div className="summary-pie-container">
                            {loading ? (
                                <div className="loading-spinner-simple">Loading...</div>
                            ) : (
                                <div className="pie-chart-main">
                                    <div 
                                        className="pie-slice sales-slice" 
                                        style={{ 
                                            transform: `rotate(0deg)`, 
                                            background: `conic-gradient(#2563eb 0deg ${income > 0 ? (income / (income + expense || 1)) * 360 : 180}deg, transparent 0deg 360deg)` 
                                        }}
                                    ></div>
                                    <div 
                                        className="pie-slice expenses-slice" 
                                        style={{ 
                                            transform: `rotate(${income > 0 ? (income / (income + expense || 1)) * 360 : 180}deg)`, 
                                            background: `conic-gradient(#f43f5e 0deg ${expense > 0 ? (expense / (income + expense || 1)) * 360 : 180}deg, transparent 0deg 360deg)` 
                                        }}
                                    ></div>
                                    <div className="pie-center-hole">
                                        <span className="pie-center-label">BALANCE</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="pie-stats-column">
                            <div className="stat-item sales">
                                <span className="stat-dot blue"></span>
                                <div className="stat-details">
                                    <span className="stat-label">Income</span>
                                    <span className="stat-val prominent">₹{income.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="stat-item expenses">
                                <span className="stat-dot red"></span>
                                <div className="stat-details">
                                    <span className="stat-label">Expenses</span>
                                    <span className="stat-val prominent">₹{expense.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendance & Sales distribution */}
                <div className="chart-card attendance-section" onClick={handleAttendanceClick} style={{ cursor: 'pointer' }}>
                    <div className="chart-header">
                        <h3>SALES DISTRIBUTION</h3>
                        <span className="view-details">Product Diversity →</span>
                    </div>
                    <div className="bar-analytics-grid">
                        {loading ? (
                             <div className="loading-spinner-simple">Processing...</div>
                        ) : (
                            analyticsData?.salesBySizeChart?.length > 0 ? (
                                analyticsData.salesBySizeChart.map(s => (
                                    <div key={s.name} className="bar-analytics-item" style={{ marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: '700', fontSize: '13px' }}>{s.name}</span>
                                            <span style={{ fontWeight: '800', color: '#2563eb' }}>{s.SalesQty.toLocaleString()}</span>
                                        </div>
                                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ 
                                                height: '100%', 
                                                width: `${Math.min(100, (s.SalesQty / (analyticsData.summary.totalSalesQty || 1)) * 100)}%`, 
                                                background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                                                borderRadius: '10px'
                                            }}></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-data-placeholder">No sales records found for this period.</div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* PRODUCTION STATS */}
            <div className="premium-stats-grid" style={{ marginTop: '24px' }}>
                <div className="premium-stat-card today">
                    <div className="p-stat-info">
                        <span className="p-stat-label">Production Distribution ({timeFilter})</span>
                        <div className="p-stat-value">{(stats.totalProductionQty || 0).toLocaleString()} <span style={{ fontSize: '14px', opacity: 0.8 }}>Units</span></div>
                        <div className="p-stat-breakdown">
                            {analyticsData?.prodSizeChart?.map(p => (
                                <span key={p.name} className="breakdown-tag" style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                    {p.name}: {p.ProdQty.toLocaleString()}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* LIVE STOCK INVENTORY */}
            {hasAccess('stock') && (
                <div className="stock-overview-section" style={{ marginTop: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>LIVE STOCK INVENTORY ({stockData.length})</h3>
                        <button onClick={handleStockClick} className="view-all-btn" style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>VIEW ALL →</button>
                    </div>
                    <div className="stock-grid">
                        {stockData.slice(0, 8).map((item, index) => {
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
                            const progress = targetQty > 0 ? Math.min(100, (producedThisMonth / targetQty) * 100) : 0;

                            return (
                                <div key={index} className="stock-item-card" onClick={handleStockClick} style={{ cursor: 'pointer' }}>
                                    <div className="stock-item-header">
                                        <div>
                                            <span className="stock-name" style={{ fontSize: '10px', fontWeight: '800', display: 'block', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>{item.name}</span>
                                            <span className="stock-size" style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{item.size}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className="stock-value" style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb' }}>{item.quantity.toLocaleString()}</span>
                                            <span style={{ display: 'block', fontSize: '9px', color: '#94a3b8', fontWeight: '600' }}>₹{item.totalValue.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {targetQty > 0 && (
                                        <div className="stock-target-progress" style={{ marginTop: '12px' }}>
                                            <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${progress}%`, background: progress >= 100 ? '#10b981' : '#3b82f6', height: '100%' }}></div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', fontWeight: '700', color: '#94a3b8' }}>
                                                <span>Target</span>
                                                <span>{progress.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    )}
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
