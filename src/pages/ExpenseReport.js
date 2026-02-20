import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./stock/Stock.css";

const ExpenseReport = () => {
    const navigate = useNavigate();

    // Enhanced expense data with restricted categories
    const [expenses] = useState([
        { id: 1, category: "Machine Maintenance", description: "Repair of CNC Machine - Spindle replacement", amount: "15000", date: "2026-02-18 10:30 AM", paymentMode: "Bank Transfer", vendor: "TechMach Solutions" },
        { id: 2, category: "Stock Purchased", description: "Raw Material - Steel Sheets (Grade A)", amount: "45000", date: "2026-02-19 09:15 AM", paymentMode: "Cheque", vendor: "SteelMart Inc." },
        { id: 3, category: "Employee Salary", description: "Advance Salary for Rahul (February)", amount: "5000", date: "2026-02-10 02:45 PM", paymentMode: "Cash", vendor: "Employee" },
        { id: 4, category: "Others", description: "Office Stationery - Papers, pens, folders", amount: "1200", date: "2026-01-15 04:00 PM", paymentMode: "UPI", vendor: "Office Depot" },
        { id: 5, category: "Others", description: "Team Refreshments - Meeting snacks", amount: "800", date: "2026-02-05 11:00 AM", paymentMode: "Cash", vendor: "Local Store" },
        { id: 6, category: "Machine Maintenance", description: "Monthly maintenance - All machines", amount: "8500", date: "2026-02-12 03:30 PM", paymentMode: "Bank Transfer", vendor: "TechMach Solutions" },
        { id: 7, category: "Stock Purchased", description: "Packaging materials - Boxes, tape", amount: "12500", date: "2026-02-08 11:45 AM", paymentMode: "UPI", vendor: "PackWell Industries" },
        { id: 8, category: "Employee Salary", description: "February salary - Production staff", amount: "125000", date: "2026-02-01 10:00 AM", paymentMode: "Bank Transfer", vendor: "Staff Payments" },
        { id: 9, category: "Others", description: "Water supply bill", amount: "3200", date: "2026-02-14 02:15 PM", paymentMode: "Bank Transfer", vendor: "Municipal Corp" },
        { id: 10, category: "Others", description: "Raw material transport charges", amount: "5600", date: "2026-02-20 04:30 PM", paymentMode: "Cash", vendor: "LogiTrans" },
        { id: 11, category: "Others", description: "Product delivery to clients", amount: "4300", date: "2026-02-21 11:00 AM", paymentMode: "UPI", vendor: "FastDeliver" },
        { id: 12, category: "Others", description: "Brochures and catalog printing", amount: "8500", date: "2026-01-25 03:45 PM", paymentMode: "Cheque", vendor: "PrintHouse" },
    ]);

    // Date Range State
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        return {
            startDate: new Date(now.getFullYear(), now.getMonth(), 1),
            endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
    });

    const [viewType, setViewType] = useState("monthly");
    const [selectedChart, setSelectedChart] = useState("trend");
    const [showCustomRange, setShowCustomRange] = useState(false);

    // Custom date inputs
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    // Preset ranges
    const handlePresetRange = (preset) => {
        const today = new Date();
        let start, end;

        switch (preset) {
            case "thisMonth":
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setViewType('monthly');
                break;
            case "lastMonth":
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                setViewType('lastMonth');
                break;
            case "thisQuarter":
                const quarter = Math.floor(today.getMonth() / 3);
                start = new Date(today.getFullYear(), quarter * 3, 1);
                end = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
                setViewType('quarterly');
                break;
            case "thisYear":
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31);
                setViewType('yearly');
                break;
            default:
                return;
        }

        setDateRange({ startDate: start, endDate: end });
        setShowCustomRange(false);
    };

    // Handle custom range submit
    const handleCustomRangeSubmit = () => {
        if (customStartDate && customEndDate) {
            setDateRange({
                startDate: new Date(customStartDate),
                endDate: new Date(customEndDate)
            });
            setViewType('custom');
            setShowCustomRange(false);
        }
    };

    // Month navigation for monthly view
    const navigateMonth = (direction) => {
        const newDate = new Date(dateRange.startDate);
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }

        setDateRange({
            startDate: new Date(newDate.getFullYear(), newDate.getMonth(), 1),
            endDate: new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0)
        });
    };

    // Filter expenses based on date range
    const filteredExpenses = useMemo(() => {
        return expenses.filter((expense) => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= dateRange.startDate && expenseDate <= dateRange.endDate;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [expenses, dateRange]);

    // Calculate statistics
    const totalExpense = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const daysDiff = Math.ceil((dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60 * 24)) + 1;
    const averageDaily = daysDiff > 0 ? (totalExpense / daysDiff).toFixed(0) : 0;

    // Category-wise stats
    const categoryStats = useMemo(() => {
        const stats = {};
        filteredExpenses.forEach(e => {
            if (!stats[e.category]) {
                stats[e.category] = {
                    total: 0,
                    count: 0
                };
            }
            stats[e.category].total += Number(e.amount);
            stats[e.category].count += 1;
        });
        return stats;
    }, [filteredExpenses]);

    // Monthly trend data
    const monthlyTrend = useMemo(() => {
        const months = {};
        filteredExpenses.forEach(e => {
            const date = new Date(e.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleString('default', { month: 'short' });

            if (!months[monthKey]) {
                months[monthKey] = {
                    month: monthName,
                    year: date.getFullYear(),
                    total: 0,
                };
            }
            months[monthKey].total += Number(e.amount);
        });

        return Object.values(months).sort((a, b) => a.year - b.year || a.month - b.month);
    }, [filteredExpenses]);

    // Payment mode distribution
    const paymentModeStats = useMemo(() => {
        const stats = {};
        filteredExpenses.forEach(e => {
            stats[e.paymentMode] = (stats[e.paymentMode] || 0) + Number(e.amount);
        });
        return stats;
    }, [filteredExpenses]);

    // Comparison with previous period
    const getComparisonData = useMemo(() => {
        const daysDiff = (dateRange.endDate - dateRange.startDate) / (1000 * 60 * 60 * 24);
        const prevStartDate = new Date(dateRange.startDate);
        prevStartDate.setDate(prevStartDate.getDate() - daysDiff - 1);
        const prevEndDate = new Date(dateRange.startDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);

        const prevExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= prevStartDate && expenseDate <= prevEndDate;
        });

        const prevTotal = prevExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const change = prevTotal > 0 ? ((totalExpense - prevTotal) / prevTotal * 100).toFixed(1) : 0;

        return {
            previousTotal: prevTotal,
            change: change,
            isPositive: change > 0
        };
    }, [expenses, dateRange, totalExpense]);

    // Format period string
    const formatPeriod = () => {
        const start = dateRange.startDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
        const end = dateRange.endDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${start} - ${end}`;
    };

    // Get max value for chart scaling
    const maxChartValue = Math.max(...monthlyTrend.map(m => m.total), 1);

    // Get month name for monthly view
    const getMonthName = () => {
        return dateRange.startDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="stock-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Expense Analytics </h1>
                    <p className="page-subtitle">Comprehensive expense analysis with trends and comparisons</p>
                </div>
                <div className="header-actions">
                    <button className="btn-outline" onClick={() => navigate("/expenses")}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back
                    </button>
                </div>
            </div>

            {/* Date Range Selector */}
            <div className="date-range-selector">
                <div className="preset-buttons">
                    <button
                        className={`preset-btn ${viewType === 'monthly' ? 'active' : ''}`}
                        onClick={() => handlePresetRange('thisMonth')}
                    >
                        This Month
                    </button>
                    <button
                        className={`preset-btn ${viewType === 'lastMonth' ? 'active' : ''}`}
                        onClick={() => handlePresetRange('lastMonth')}
                    >
                        Last Month
                    </button>
                    <button
                        className={`preset-btn ${viewType === 'quarterly' ? 'active' : ''}`}
                        onClick={() => handlePresetRange('thisQuarter')}
                    >
                        This Quarter
                    </button>
                    <button
                        className={`preset-btn ${viewType === 'yearly' ? 'active' : ''}`}
                        onClick={() => handlePresetRange('thisYear')}
                    >
                        This Year
                    </button>
                    <button
                        className={`preset-btn ${viewType === 'custom' ? 'active' : ''}`}
                        onClick={() => setShowCustomRange(!showCustomRange)}
                    >
                        Custom Range
                    </button>
                </div>

                {showCustomRange && (
                    <div className="custom-range-inputs">
                        <div className="range-input-group">
                            <label>From:</label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="date-input"
                            />
                        </div>
                        <div className="range-input-group">
                            <label>To:</label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="date-input"
                            />
                        </div>
                        <button
                            className="btn-primary"
                            onClick={handleCustomRangeSubmit}
                            disabled={!customStartDate || !customEndDate}
                        >
                            Apply Range
                        </button>
                    </div>
                )}

                <div className="selected-range">
                    <span className="range-label">Selected Period:</span>
                    <span className="range-value">{formatPeriod()}</span>
                    {viewType === 'monthly' && (
                        <div className="month-navigation">
                            <button onClick={() => navigateMonth('prev')} className="month-nav-btn">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <span className="current-month">{getMonthName()}</span>
                            <button onClick={() => navigateMonth('next')} className="month-nav-btn">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="metric-card highlight">
                    <div className="metric-icon total">
                        <span className="material-symbols-outlined">account_balance</span>
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">Total Expenses</span>
                        <span className="metric-value">₹{totalExpense.toLocaleString()}</span>
                        <div className="metric-comparison">
                            <span className={getComparisonData.isPositive ? 'negative' : 'positive'}>
                                {getComparisonData.isPositive ? '▲' : '▼'} {Math.abs(getComparisonData.change)}%
                            </span>
                            <span>vs previous period</span>
                        </div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon average">
                        <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">Daily Average</span>
                        <span className="metric-value">₹{Number(averageDaily).toLocaleString()}</span>
                        <span className="metric-sub">per day ({daysDiff} days)</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon count">
                        <span className="material-symbols-outlined">receipt</span>
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">Total Transactions</span>
                        <span className="metric-value">{filteredExpenses.length}</span>
                        <span className="metric-sub">expense entries</span>
                    </div>
                </div>
            </div>

            {/* Chart View Selector */}
            <div className="chart-selector">
                <button
                    className={`chart-btn ${selectedChart === 'trend' ? 'active' : ''}`}
                    onClick={() => setSelectedChart('trend')}
                >
                    Monthly Trend
                </button>
                <button
                    className={`chart-btn ${selectedChart === 'category' ? 'active' : ''}`}
                    onClick={() => setSelectedChart('category')}
                >
                    Category Distribution
                </button>
                <button
                    className={`chart-btn ${selectedChart === 'payment' ? 'active' : ''}`}
                    onClick={() => setSelectedChart('payment')}
                >
                    Payment Methods
                </button>
                <button
                    className={`chart-btn ${selectedChart === 'comparison' ? 'active' : ''}`}
                    onClick={() => setSelectedChart('comparison')}
                >
                    Month Comparison
                </button>
            </div>

            {/* Charts Section */}
            <div className="charts-container">
                {selectedChart === 'trend' && (
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Monthly Expense Trend</h3>
                            <div className="chart-legend">
                                <span className="legend-item">
                                    <span className="legend-color trend"></span>
                                    Total Expenses
                                </span>
                            </div>
                        </div>
                        {monthlyTrend.length > 0 ? (
                            <div className="bar-chart">
                                {monthlyTrend.map((month, index) => (
                                    <div key={index} className="chart-group">
                                        <div className="bars">
                                            <div
                                                className="bar trend-bar"
                                                style={{ height: `${(month.total / maxChartValue) * 200}px` }}
                                            >
                                                <span className="bar-value">₹{month.total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="chart-label">
                                            <span>{month.month}</span>
                                            <span className="chart-year">{month.year}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-data-chart">No data available for this period</div>
                        )}
                    </div>
                )}

                {selectedChart === 'category' && (
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Category-wise Expense Distribution</h3>
                        </div>
                        {Object.keys(categoryStats).length > 0 ? (
                            <div className="category-chart">
                                {Object.entries(categoryStats).map(([category, data], index) => {
                                    const percentage = (data.total / totalExpense * 100).toFixed(1);
                                    return (
                                        <div key={category} className="category-bar-item">
                                            <div className="category-info">
                                                <span className="category-name">{category}</span>
                                                <div className="category-stats">
                                                    <span className="category-amount">₹{data.total.toLocaleString()}</span>
                                                    <span className="category-percentage">{percentage}%</span>
                                                    <span className="category-count">{data.count} transactions</span>
                                                </div>
                                            </div>
                                            <div className="progress-bar-container">
                                                <div
                                                    className="progress-bar"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        backgroundColor: ['#006A4E', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][index % 5]
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="no-data-chart">No category data available</div>
                        )}
                    </div>
                )}

                {selectedChart === 'payment' && (
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Payment Methods Analysis</h3>
                        </div>
                        {Object.keys(paymentModeStats).length > 0 ? (
                            <div className="payment-chart">
                                {Object.entries(paymentModeStats).map(([mode, amount], index) => {
                                    const percentage = (amount / totalExpense * 100).toFixed(1);
                                    return (
                                        <div key={mode} className="payment-item">
                                            <div className="payment-info">
                                                <span className="payment-mode">{mode}</span>
                                                <span className="payment-amount">₹{amount.toLocaleString()}</span>
                                            </div>
                                            <div className="progress-bar-container">
                                                <div
                                                    className="progress-bar"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        backgroundColor: ['#006A4E', '#3b82f6', '#f59e0b'][index % 3]
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="payment-percentage">{percentage}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="no-data-chart">No payment data available</div>
                        )}
                    </div>
                )}

                {selectedChart === 'comparison' && (
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Month-over-Month Comparison</h3>
                        </div>
                        {monthlyTrend.length > 1 ? (
                            <div className="comparison-chart">
                                {monthlyTrend.map((month, index) => {
                                    if (index === 0) return null;
                                    const prevMonth = monthlyTrend[index - 1];
                                    const change = ((month.total - prevMonth.total) / prevMonth.total * 100).toFixed(1);
                                    const isPositive = change > 0;

                                    return (
                                        <div key={index} className="comparison-item">
                                            <div className="comparison-months">
                                                <span>{prevMonth.month} {prevMonth.year} vs {month.month} {month.year}</span>
                                                <span className={`change ${isPositive ? 'positive' : 'negative'}`}>
                                                    {isPositive ? '▲' : '▼'} {Math.abs(change)}%
                                                </span>
                                            </div>
                                            <div className="comparison-bars">
                                                <div className="prev-bar" style={{ width: `${(prevMonth.total / maxChartValue) * 100}%` }}>
                                                    ₹{prevMonth.total.toLocaleString()}
                                                </div>
                                                <div className="current-bar" style={{ width: `${(month.total / maxChartValue) * 100}%` }}>
                                                    ₹{month.total.toLocaleString()}
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

            {/* Detailed Expense Table */}
            <div className="stock-table-container">
                <div className="table-header">
                    <h3>
                        <span className="material-symbols-outlined">table_chart</span>
                        Detailed Transaction Report
                    </h3>
                    <div className="table-filters">
                        <button
                            className="btn-primary"
                            onClick={() => {
                                const periodStr = formatPeriod();
                                const totalStr = totalExpense.toLocaleString();

                                // Category-wise summary rows for Excel
                                const categoryRows = Object.entries(categoryStats).map(([cat, stat]) => `
                                    <tr>
                                        <td style="border: 1px solid #000; padding: 5px;">${cat}</td>
                                        <td style="border: 1px solid #000; padding: 5px; text-align: right;">₹${stat.total.toLocaleString()}</td>
                                        <td style="border: 1px solid #000; padding: 5px; text-align: center;">${stat.count}</td>
                                    </tr>
                                `).join('');

                                // Main transaction rows
                                const transactionRows = filteredExpenses.map(e => `
                                    <tr>
                                        <td style="border: 1px solid #000; padding: 8px; font-size: 11px;">${e.date.replace(/-/g, '/').replace(/\s[AP]M/i, '')}</td>
                                        <td style="border: 1px solid #000; padding: 8px; font-size: 11px;">${e.category}</td>
                                        <td style="border: 1px solid #000; padding: 8px; font-size: 11px;">${e.description}</td>
                                        <td style="border: 1px solid #000; padding: 8px; text-align: right; font-size: 11px;">₹${Number(e.amount).toLocaleString()}</td>
                                        <td style="border: 1px solid #000; padding: 8px; font-size: 11px;">${e.paymentMode}</td>
                                    </tr>
                                `).join('');

                                const excelHTML = `
                                    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                                    <head>
                                        <meta charset="utf-8">
                                        <style>
                                            .header { font-size: 24px; font-weight: bold; text-align: center; color: #006A4E; }
                                            .period { font-size: 12px; font-weight: bold; text-align: center; color: #64748b; }
                                            .table-title { font-size: 14px; font-weight: bold; background-color: #f8fafc; padding: 8px; border: 1px solid #000; }
                                            .th-main { background-color: #006A4E; color: #ffffff; font-weight: bold; border: 1px solid #000; padding: 8px; }
                                            .th-sub { background-color: #f1f5f9; font-weight: bold; border: 1px solid #000; padding: 8px; }
                                            .cell { border: 1px solid #000; padding: 8px; }
                                            .total-cell { background-color: #e6f4ea; font-weight: bold; color: #006A4E; }
                                        </style>
                                    </head>
                                    <body>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th colspan="5" style="height: 60px; font-size: 24px; font-weight: bold; text-align: center; vertical-align: middle; color: #006A4E;">
                                                        AVSECO - EXPENSE ANALYTICS REPORT
                                                    </th>
                                                </tr>
                                                <tr>
                                                    <th colspan="5" style="height: 30px; font-size: 11px; font-weight: bold; text-align: center; vertical-align: middle; color: #64748b; border-bottom: 2px solid #e2e8f0;">
                                                        PERIOD: ${periodStr.toUpperCase()}
                                                    </th>
                                                </tr>
                                                <tr><td colspan="5" style="height: 20px;"></td></tr>
                                            </thead>
                                            <tbody>
                                                <!-- Category Summary -->
                                                <tr>
                                                    <td colspan="5" style="font-weight: bold; padding: 10px; border: 1px solid #000; font-size: 14px;">CATEGORY SUMMARY</td>
                                                </tr>
                                                <tr style="background-color: #f8fafc;">
                                                    <td style="border: 1px solid #000; padding: 8px; font-weight: bold; width: 150px;">Category</td>
                                                    <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: right; width: 150px;">Total Amount</td>
                                                    <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 120px;">Transactions</td>
                                                    <td style="border: 1px solid #000; width: 200px;"></td>
                                                    <td style="border: 1px solid #000; width: 150px;"></td>
                                                </tr>
                                                ${categoryRows}
                                                <tr style="font-weight: bold;">
                                                    <td style="border: 1px solid #000; padding: 8px;">GRAND TOTAL</td>
                                                    <td style="border: 1px solid #000; padding: 8px; text-align: right; background-color: #e6f4ea; color: #006A4E;">₹${totalStr}</td>
                                                    <td style="border: 1px solid #000; padding: 8px; text-align: center;">${filteredExpenses.length}</td>
                                                    <td style="border: 1px solid #000;"></td>
                                                    <td style="border: 1px solid #000;"></td>
                                                </tr>
                                                
                                                <tr><td colspan="5" style="height: 40px;"></td></tr>

                                                <!-- Detailed Transactions -->
                                                <tr>
                                                    <td colspan="5" style="font-weight: bold; padding: 10px; border: 1px solid #000; font-size: 14px;">DETAILED TRANSACTION LIST</td>
                                                </tr>
                                                <tr style="background-color: #006A4E; color: #ffffff; font-weight: bold;">
                                                    <td style="border: 1px solid #000; padding: 8px; width: 150px;">Date & Time</td>
                                                    <td style="border: 1px solid #000; padding: 8px; width: 150px;">Category</td>
                                                    <td style="border: 1px solid #000; padding: 8px; width: 400px;">Description</td>
                                                    <td style="border: 1px solid #000; padding: 8px; text-align: right; width: 150px;">Amount</td>
                                                    <td style="border: 1px solid #000; padding: 8px; width: 150px;">Payment Mode</td>
                                                </tr>
                                                ${transactionRows}
                                            </tbody>
                                        </table>
                                    </body>
                                    </html>
                                `;

                                const blob = new Blob([excelHTML], { type: 'application/vnd.ms-excel' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url;
                                link.download = `Expense_Analytics_Report_${periodStr.replace(/[ ,-]/g, '_')}.xls`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                        >
                            <span className="material-symbols-outlined">download</span>
                            Export Report
                        </button>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.length > 0 ? (
                                filteredExpenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td style={{ fontWeight: '500' }}>{expense.date}</td>
                                        <td>
                                            <span className="status-badge" style={{
                                                backgroundColor:
                                                    expense.category === 'Machine Maintenance' ? '#e6f4ea' :
                                                        expense.category === 'Stock Purchased' ? '#eff6ff' :
                                                            expense.category === 'Employee Salary' ? '#fef3c7' : '#f3e8ff',
                                                color:
                                                    expense.category === 'Machine Maintenance' ? '#006A4E' :
                                                        expense.category === 'Stock Purchased' ? '#3b82f6' :
                                                            expense.category === 'Employee Salary' ? '#f59e0b' : '#8b5cf6'
                                            }}>
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td style={{ color: '#64748b' }}>{expense.description}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#006A4E' }}>
                                            ₹{Number(expense.amount).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="no-data">
                                        No expense records found for the selected period
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#006A4E' }}>
                                    ₹{totalExpense.toLocaleString()}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExpenseReport;