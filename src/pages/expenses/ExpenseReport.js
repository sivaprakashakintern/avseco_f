import React, { useState, useMemo } from 'react';
import "./ExpenseReport.css";
import { formatDate } from '../../utils/dateUtils.js';
import { formatCurrency, getDynamicFontSize } from '../../utils/formatUtils.js';
import { useAppContext } from '../../context/AppContext.js';

// ── Category config: colour palette for all 7 categories ──────────────────────
const CATEGORY_CONFIG = {
    "Machine Maintenance": { bg: "#e6f4ea", color: "#006A4E", icon: "build" },
    "Material": { bg: "#eff6ff", color: "#3b82f6", icon: "inventory_2" },
    "Salary": { bg: "#fef3c7", color: "#d97706", icon: "payments" },
    "Electricity": { bg: "#fce7f3", color: "#db2777", icon: "bolt" },
    "Transport": { bg: "#f0fdf4", color: "#16a34a", icon: "local_shipping" },
    "Rent": { bg: "#faf5ff", color: "#7c3aed", icon: "home" },
    "Others": { bg: "#f3e8ff", color: "#8b5cf6", icon: "more_horiz" },
};

const ExpenseReport = () => {
    const { expenses } = useAppContext();

    // ── Date range state ─────────────────────────────────────────────────────────
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: start, endDate: end };
    });
    const [viewType, setViewType] = useState("monthly");
    const [selectedChart, setSelectedChart] = useState("category");
    const [showCustomRange, setShowCustomRange] = useState(false);
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [expandedExpenseId, setExpandedExpenseId] = useState(null);

    // ── Toggle Expansion ──
    const toggleExpenseExpansion = (id) => {
        setExpandedExpenseId(expandedExpenseId === id ? null : id);
    };



    // ── Preset helpers ───────────────────────────────────────────────────────────
    const handlePreset = (preset) => {
        const today = new Date();
        let start, end;
        switch (preset) {
            case "thisMonth":
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setViewType("monthly"); break;
            case "lastMonth":
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                setViewType("lastMonth"); break;
            case "thisYear":
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31);
                setViewType("yearly"); break;
            default: return;
        }
        setDateRange({ startDate: start, endDate: end });
        setShowCustomRange(false);
    };

    const applyCustomRange = () => {
        if (customStart && customEnd) {
            setDateRange({ startDate: new Date(customStart), endDate: new Date(customEnd) });
            setViewType("custom");
            setShowCustomRange(false);
        }
    };

    const navigateMonth = (dir) => {
        const d = new Date(dateRange.startDate);
        d.setMonth(d.getMonth() + (dir === "prev" ? -1 : 1));
        setDateRange({
            startDate: new Date(d.getFullYear(), d.getMonth(), 1),
            endDate: new Date(d.getFullYear(), d.getMonth() + 1, 0),
        });
    };

    // ── Date parsing helper ──────────────────────────────────────────────────────
    const parseDateHelper = (dateStr) => {
        if (!dateStr) return new Date(0);
        if (dateStr instanceof Date) return dateStr;
        if (typeof dateStr === 'string' && dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts[0].length === 2) return new Date(parts[2], parts[1] - 1, parts[0]);
        }
        return new Date(dateStr);
    };

    // ── Filtered data ────────────────────────────────────────────────────────────
    const filteredExpenses = useMemo(() => {
        const s = new Date(dateRange.startDate); s.setHours(0, 0, 0, 0);
        const e = new Date(dateRange.endDate); e.setHours(23, 59, 59, 999);
        return (expenses || [])
            .filter((ex) => {
                const d = parseDateHelper(ex.date);
                return d >= s && d <= e;
            })
            .sort((a, b) => parseDateHelper(b.date) - parseDateHelper(a.date));
    }, [expenses, dateRange]);

    // ── Stats ────────────────────────────────────────────────────────────────────
    const totalExpense = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const maintenanceTotal = filteredExpenses.filter(e => ["Material", "Machine Maintenance", "Electricity", "Rent"].includes(e.category)).reduce((s, e) => s + Number(e.amount), 0);
    const salaryTotal = filteredExpenses.filter(e => e.category === "Salary").reduce((s, e) => s + Number(e.amount), 0);
    const othersTotal = totalExpense - maintenanceTotal - salaryTotal;

    const categoryStats = useMemo(() => {
        const stats = {};
        filteredExpenses.forEach((e) => {
            if (!stats[e.category]) stats[e.category] = { total: 0, count: 0 };
            stats[e.category].total += Number(e.amount);
            stats[e.category].count += 1;
        });
        return stats;
    }, [filteredExpenses]);

    const monthlyTrend = useMemo(() => {
        const months = {};
        expenses.forEach((e) => {
            const d = parseDateHelper(e.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (!months[key]) months[key] = { month: d.toLocaleString("default", { month: "short" }), year: d.getFullYear(), total: 0 };
            months[key].total += Number(e.amount);
        });
        return Object.values(months).sort((a, b) => a.year - b.year || a.month.localeCompare(b.month));
    }, [expenses]);

    const paymentStats = useMemo(() => {
        const s = {};
        filteredExpenses.forEach((e) => { s[e.paymentMode] = (s[e.paymentMode] || 0) + Number(e.amount); });
        return s;
    }, [filteredExpenses]);

    const maxChartValue = Math.max(...monthlyTrend.map((m) => m.total), 1);





    // ── Period helpers ───────────────────────────────────────────────────────────
    const formatPeriod = () =>
        `${formatDate(dateRange.startDate)} – ${formatDate(dateRange.endDate)}`;

    const getMonthName = () =>
        dateRange.startDate.toLocaleString("default", { month: "long", year: "numeric" });

    // ── Excel export ─────────────────────────────────────────────────────────────
    const exportToExcel = () => {
        const period = formatPeriod();
        const catRows = Object.entries(categoryStats)
            .map(([cat, s]) => `<tr>
        <td style="border:1px solid #ccc;padding:6px">${cat}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right">₹${s.total.toLocaleString()}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${s.count}</td>
      </tr>`).join("");

        const txRows = filteredExpenses
            .map((e) => `<tr>
        <td style="border:1px solid #ccc;padding:6px">${e.date}</td>
        <td style="border:1px solid #ccc;padding:6px">${e.category}</td>
        <td style="border:1px solid #ccc;padding:6px">${e.description}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right">₹${Number(e.amount).toLocaleString()}</td>
        <td style="border:1px solid #ccc;padding:6px">${e.paymentMode}</td>
      </tr>`).join("");

        const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"></head><body>
    <table>
      <tr><th colspan="5" style="font-size:20px;font-weight:bold;color:#006A4E;text-align:center">AVSECO – EXPENSE REPORT</th></tr>
      <tr><th colspan="5" style="font-size:11px;color:#64748b;text-align:center;border-bottom:2px solid #e2e8f0">PERIOD: ${period.toUpperCase()}</th></tr>
      <tr><td colspan="5" style="height:20px"></td></tr>
      <tr><td colspan="5" style="font-weight:bold;font-size:13px;border:1px solid #ccc;padding:8px;background:#f8fafc">CATEGORY SUMMARY</td></tr>
      <tr style="background:#e6f4ea;font-weight:bold">
        <td style="border:1px solid #ccc;padding:6px">Category</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right">Amount</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">Transactions</td>
      </tr>
      ${catRows}
      <tr style="font-weight:bold;background:#e6f4ea">
        <td style="border:1px solid #ccc;padding:6px">GRAND TOTAL</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right;color:#006A4E">₹${totalExpense.toLocaleString()}</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:center">${filteredExpenses.length}</td>
      </tr>
      <tr><td colspan="5" style="height:30px"></td></tr>
      <tr><td colspan="5" style="font-weight:bold;font-size:13px;border:1px solid #ccc;padding:8px;background:#f8fafc">DETAILED TRANSACTIONS</td></tr>
      <tr style="background:#006A4E;color:#fff;font-weight:bold">
        <td style="border:1px solid #ccc;padding:6px">Date</td>
        <td style="border:1px solid #ccc;padding:6px">Category</td>
        <td style="border:1px solid #ccc;padding:6px">Description</td>
        <td style="border:1px solid #ccc;padding:6px;text-align:right">Amount</td>
        <td style="border:1px solid #ccc;padding:6px">Payment Mode</td>
      </tr>
      ${txRows}
    </table></body></html>`;

        const blob = new Blob([html], { type: "application/vnd.ms-excel" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Expense_Report_${period.replace(/[^a-zA-Z0-9]/g, "_")}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="stock-page">

            {/* ── Header ── */}
            <div className="page-header premium-header">
                <div>
                    <h1 className="page-title">Expense Report</h1>
                </div>
                <div className="header-actions">
                    <button className="btn-export-premium" onClick={exportToExcel}>
                        <span className="material-symbols-outlined">download</span>
                        Export Report
                    </button>
                </div>
            </div>

            {/* ── Date Range Selector ── */}
            <div className="date-range-selector">
                <div className="preset-buttons">
                    {[
                        { key: "thisMonth", label: "This Month", type: "monthly" },
                        { key: "lastMonth", label: "Last Month", type: "lastMonth" },
                        { key: "thisYear", label: "This Year", type: "yearly" },
                    ].map((p) => (
                        <button
                            key={p.key}
                            className={`preset-btn ${viewType === p.type ? "active" : ""}`}
                            onClick={() => handlePreset(p.key)}
                        >
                            {p.label}
                        </button>
                    ))}
                    <button
                        className={`preset-btn ${viewType === "custom" ? "active" : ""}`}
                        onClick={() => setShowCustomRange(!showCustomRange)}
                    >
                        Custom Range
                    </button>
                </div>

                {showCustomRange && (
                    <div className="custom-range-inputs">
                        <div className="range-input-group">
                            <label>From:</label>
                            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="date-input" />
                        </div>
                        <div className="range-input-group">
                            <label>To:</label>
                            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="date-input" />
                        </div>
                        <button className="btn-primary" onClick={applyCustomRange} disabled={!customStart || !customEnd}>
                            Apply
                        </button>
                    </div>
                )}

                <div className="selected-range">
                    <span className="range-label">Selected Period:</span>
                    <span className="range-value">{formatPeriod()}</span>
                    {viewType === "monthly" && (
                        <div className="month-navigation">
                            <button onClick={() => navigateMonth("prev")} className="month-nav-btn">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <span className="current-month">{getMonthName()}</span>
                            <button onClick={() => navigateMonth("next")} className="month-nav-btn">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Key Metric Cards (Dashboard Style) ── */}
            <div className="stock-stats report-stats">
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Overall Expenses</span>
                        <span className="stat-value" style={getDynamicFontSize(totalExpense)}>
                            {formatCurrency(totalExpense, true)}
                        </span>
                        <div className="stat-sub"></div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon blue">
                        <span className="material-symbols-outlined">build</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Maintenance</span>
                        <span className="stat-value" style={getDynamicFontSize(maintenanceTotal)}>
                            {formatCurrency(maintenanceTotal, true)}
                        </span>
                        <div className="stat-sub"></div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon yellow">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Salary</span>
                        <span className="stat-value" style={getDynamicFontSize(salaryTotal)}>
                            {formatCurrency(salaryTotal, true)}
                        </span>
                        <div className="stat-sub"></div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon green">
                        <span className="material-symbols-outlined">more_horiz</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Others</span>
                        <span className="stat-value" style={getDynamicFontSize(othersTotal)}>
                            {formatCurrency(othersTotal, true)}
                        </span>
                        <div className="stat-sub"></div>
                    </div>
                </div>
            </div>

            {/* ── Chart Selector ── */}
            <div className="chart-selector">
                {[
                    { key: "category", label: "Category Breakdown" },
                    { key: "trend", label: "Monthly Trend" },
                    { key: "payment", label: "Payment Methods" },
                    { key: "comparison", label: "Month Comparison" },
                ].map((c) => (
                    <button
                        key={c.key}
                        className={`chart-btn ${selectedChart === c.key ? "active" : ""}`}
                        onClick={() => setSelectedChart(c.key)}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* ── Charts ── */}
            <div className="charts-container">

                {/* Category Breakdown */}
                {selectedChart === "category" && (
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Category-wise Expense Distribution</h3>
                        </div>
                        {Object.keys(categoryStats).length > 0 ? (
                            <div className="category-chart">
                                {Object.entries(categoryStats)
                                    .sort((a, b) => b[1].total - a[1].total)
                                    .map(([cat, data], idx) => {
                                        const pct = totalExpense > 0 ? (data.total / totalExpense * 100).toFixed(1) : 0;
                                        const cfg = CATEGORY_CONFIG[cat] || { color: "#006A4E", bg: "#e6f4ea" };
                                        return (
                                            <div key={cat} className="category-bar-item">
                                                <div className="category-info">
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: cfg.color }}>
                                                            {(CATEGORY_CONFIG[cat] || {}).icon || "label"}
                                                        </span>
                                                        <span className="category-name">{cat}</span>
                                                    </div>
                                                    <div className="category-stats">
                                                        <span className="category-amount">₹{data.total.toLocaleString()}</span>
                                                        <span className="category-percentage">{pct}%</span>
                                                        <span className="category-count">{data.count} entries</span>
                                                    </div>
                                                </div>
                                                <div className="progress-bar-container">
                                                    <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div className="no-data-chart">No category data for this period</div>
                        )}
                    </div>
                )}



                {/* Monthly Trend */}
                {selectedChart === "trend" && (
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Monthly Expense Trend</h3>
                            <div className="chart-legend">
                                <span className="legend-item">
                                    <span className="legend-color trend"></span>Total Expenses
                                </span>
                            </div>
                        </div>
                        {monthlyTrend.length > 0 ? (
                            <div className="bar-chart">
                                {monthlyTrend.map((m, i) => (
                                    <div key={i} className="chart-group">
                                        <div className="bars">
                                            <div
                                                className="bar trend-bar"
                                                style={{ height: `${(m.total / maxChartValue) * 200}px` }}
                                            >
                                                <span className="bar-value">₹{m.total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="chart-label">
                                            <span>{m.month}</span>
                                            <span className="chart-year">{m.year}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-data-chart">No data available for this period</div>
                        )}
                    </div>
                )}

                {/* Payment Methods */}
                {selectedChart === "payment" && (
                    <div className="chart-card">
                        <div className="chart-header"><h3>Payment Methods Analysis</h3></div>
                        {Object.keys(paymentStats).length > 0 ? (
                            <div className="payment-chart">
                                {Object.entries(paymentStats)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([mode, amount], idx) => {
                                        const pct = totalExpense > 0 ? (amount / totalExpense * 100).toFixed(1) : 0;
                                        const color = ["#006A4E", "#3b82f6", "#f59e0b", "#e11d48", "#8b5cf6"][idx % 5];
                                        return (
                                            <div key={mode} className="payment-item">
                                                <div className="payment-info">
                                                    <span className="payment-mode">{mode}</span>
                                                    <span className="payment-amount">₹{amount.toLocaleString()}</span>
                                                </div>
                                                <div className="progress-bar-container">
                                                    <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: color }} />
                                                </div>
                                                <span className="payment-percentage">{pct}%</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <div className="no-data-chart">No payment data available</div>
                        )}
                    </div>
                )}

                {/* Month Comparison */}
                {selectedChart === "comparison" && (
                    <div className="chart-card">
                        <div className="chart-header"><h3>Month-over-Month Comparison</h3></div>
                        {monthlyTrend.length > 1 ? (
                            <div className="comparison-chart">
                                {monthlyTrend.map((m, i) => {
                                    if (i === 0) return null;
                                    const prev = monthlyTrend[i - 1];
                                    const change = ((m.total - prev.total) / prev.total * 100).toFixed(1);
                                    const up = change > 0;
                                    return (
                                        <div key={i} className="comparison-item">
                                            <div className="comparison-months">
                                                <span>{prev.month} {prev.year} vs {m.month} {m.year}</span>
                                                <span className={`change ${up ? "positive" : "negative"}`}>
                                                    {up ? "▲" : "▼"} {Math.abs(change)}%
                                                </span>
                                            </div>
                                            <div className="comparison-bars">
                                                <div className="prev-bar" style={{ width: `${(prev.total / maxChartValue) * 100}%` }}>
                                                    ₹{prev.total.toLocaleString()}
                                                </div>
                                                <div className="current-bar" style={{ width: `${(m.total / maxChartValue) * 100}%` }}>
                                                    ₹{m.total.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="no-data-chart">Need at least 2 months of data for comparison</div>
                        )}
                    </div>
                )}


            </div>

            {/* ── Transaction Table ── */}
            <div className="stock-table-container">
                <div className="table-header">
                    <h3>
                        <span className="material-symbols-outlined header-icon-accent">table_chart</span>
                        Detailed Transaction List
                    </h3>
                    <span className="records-count-lite">
                        {filteredExpenses.length} records · {formatPeriod()}
                    </span>
                </div>
                <div className="table-responsive desktop-only-table">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th className="text-center">Date</th>
                                <th className="text-center">Category</th>
                                <th className="text-center">Description</th>
                                <th className="text-center">Payment Mode</th>
                                <th className="text-center">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map((ex) => (
                                    <tr key={ex.id}>
                                        <td className="date-cell text-center">{formatDate(ex.date)}</td>
                                        <td className="text-center">
                                            <span className={`status-badge-lite ${ex.category === 'Machine Maintenance' ? 'low' :
                                                ex.category === 'Material' ? 'normal' :
                                                    ex.category === 'Salary' ? 'critical' : 'normal'
                                                }`}>
                                                {ex.category}
                                            </span>
                                        </td>
                                        <td className="description-cell text-center">{ex.description}</td>
                                        <td className="text-center">
                                            <span className="payment-badge-lite">
                                                {ex.paymentMode}
                                            </span>
                                        </td>
                                        <td className="amount-cell">
                                            ₹{Number(ex.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="no-data">No expense records found for the selected period</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="4" className="footer-label-cell">Total:</td>
                                <td className="amount-cell footer-value-cell">
                                    ₹{totalExpense.toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="mobile-history-cards">
                    {filteredExpenses.length > 0 ? (
                        filteredExpenses.map((ex, index) => {
                            const cfg = CATEGORY_CONFIG[ex.category] || { icon: "payments", color: "#006A4E" };
                            const isExpanded = expandedExpenseId === ex.id;

                            return (
                                <div
                                    key={ex.id}
                                    className={`mobile-expense-card-minimal ${isExpanded ? 'expanded' : ''}`}
                                    onClick={() => toggleExpenseExpansion(ex.id)}
                                >
                                    <div className="expense-card-main">
                                        <div className="expense-sno">{index + 1}</div>
                                        <div className="expense-category-lite">
                                            <div className="category-marker" style={{ backgroundColor: cfg.color }} />
                                            {ex.category}
                                        </div>
                                        <div className="expense-amount-lite">₹{Number(ex.amount).toLocaleString()}</div>
                                        <span className="material-symbols-outlined expand-icon">
                                            {isExpanded ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </div>

                                    {isExpanded && (
                                        <div className="expense-card-details-expanded">
                                            <div className="expanded-info-grid">
                                                <div className="info-row">
                                                    <span className="info-label">Description</span>
                                                    <span className="info-value">{ex.description}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">Date</span>
                                                    <span className="info-value">{formatDate(ex.date)}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">Payment</span>
                                                    <span className="info-value">{ex.paymentMode}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-data-mobile">
                            <span className="material-symbols-outlined">search_off</span>
                            <p>No expense records found</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default ExpenseReport;