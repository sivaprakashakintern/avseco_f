import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import axios from '../../utils/axiosConfig.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';
import './Turnover.css';

const Turnover = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterType, setFilterType] = useState('monthly'); // 'daily', 'monthly', 'yearly', 'all'
  const getToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sync date range based on filter type
  useEffect(() => {
    if (filterType === 'daily') {
      setStartDate(selectedDate);
      setEndDate(selectedDate);
    } else if (filterType === 'monthly') {
      const [year, month] = selectedMonth.split('-');
      setStartDate(`${year}-${month}-01`);
      const lastDay = new Date(year, parseInt(month), 0).getDate();
      setEndDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
    } else if (filterType === 'yearly') {
      setStartDate(`${selectedYear}-01-01`);
      setEndDate(`${selectedYear}-12-31`);
    } else if (filterType === 'all') {
      setStartDate('');
      setEndDate('');
    }
  }, [filterType, selectedDate, selectedMonth, selectedYear]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (filterType) params.append('type', filterType);

      // For daily, explicitly send the date as 'date' param too (matching spec)
      if (filterType === 'daily' && selectedDate) {
        params.append('date', selectedDate);
      } else if (filterType === 'monthly') {
        const [y, m] = selectedMonth.split('-');
        params.append('year', y);
        params.append('month', m);
      } else if (filterType === 'yearly') {
        params.append('year', selectedYear);
      }

      const query = `?${params.toString()}`;
      const res = await axios.get(`turnover/analytics${query}`);
      setAnalytics(res.data);
    } catch (error) {
      console.error('API Error: Failed to fetch turnover analytics.', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const { salesHistory, expenses: appContextExpenses } = useAppContext();

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, salesHistory, appContextExpenses]);

  if (loading || !analytics) {
    return (
      <div className="turnover-container">
        <div className="loader-container">
          <div className="premium-loader"></div>
          <div className="loader-text">Analyzing ERP Insights...</div>
        </div>
      </div>
    );
  }

  const { financials, production, charts } = analytics;

  // Growth colors
  const incomeGrowthColor = financials.incomeGrowthPercent >= 0 ? 'badge-green' : 'badge-red';
  const prodGrowthColor = production.prodGrowthPercent >= 0 ? 'badge-green' : 'badge-red';

  return (
    <div className="turnover-container">
      {/* 1. Header Section */}
      <div className="premium-header-green">
        <div className="header-left-group">
          <h1>Turnover</h1>
          <p className="subtitle-slim"></p>
        </div>
        <button className="btn-add-premium-outline" onClick={fetchAnalytics}>
          Refresh Insights
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-type-buttons">
          {['daily', 'monthly', 'yearly', 'all'].map(type => (
            <button
              key={type}
              className={`filter-btn ${filterType === type ? 'active' : ''}`}
              onClick={() => {
                setFilterType(type);
                if (type === 'daily') setSelectedDate(getToday());
                if (type === 'monthly') setSelectedMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
                if (type === 'yearly') setSelectedYear(new Date().getFullYear().toString());
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="filter-inputs">
          {filterType === 'daily' && (
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="search-input" />
          )}
          {filterType === 'monthly' && (
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="search-input" />
          )}
          {filterType === 'yearly' && (
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="search-input">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          {filterType === 'all' && <span style={{ color: '#64748b', fontWeight: 600 }}>All Time Records</span>}
        </div>
      </div>

      {/* 3. Top Summary KPI Cards */}
      <div className="turnover-stats">
        <div className="stat-card">
          <div className="stat-icon icon-income"><span className="material-symbols-outlined">payments</span></div>
          <div className="stat-info">
            <span className="stat-label">Total Income ({filterType})</span>
            <span className="stat-value income">₹{financials.totalIncome.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon icon-expense"><span className="material-symbols-outlined">receipt_long</span></div>
          <div className="stat-info">
            <span className="stat-label">Total Expenses ({filterType})</span>
            <span className="stat-value expense">₹{financials.totalExpenses.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon icon-profit"><span className="material-symbols-outlined">savings</span></div>
          <div className="stat-info">
            <span className="stat-label">Net Profit ({filterType})</span>
            <span className="stat-value profit">
              ₹{financials.netProfit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      <div className="analytics-grid-main" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="analytics-card" style={{ minWidth: 0 }}>
          <div className="card-header-main">
            <div className="title-group">
              <span className="material-symbols-outlined icon-accent">bar_chart</span>
              <h3>Sales Performance</h3>
            </div>

          </div>

          <div className="chart-wrapper-premium" style={{ height: 350, width: '100%', minWidth: 0, marginTop: '20px', position: 'relative' }}>
            <ResponsiveContainer width="99%" height="100%" debounce={50}>
              <BarChart data={charts.fullMonthlyChart} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                  interval={0}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#b4c2d3', fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  cursor={false}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Income']}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card" style={{ minWidth: 0, position: 'relative' }}>
          <h3 className="card-title">Sales by Size</h3>
          <div style={{ height: 350, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={charts.salesSizeChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip cursor={false} />
                <Bar dataKey="SalesQty" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="analytics-grid-main" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="analytics-card" style={{ minWidth: 0 }}>
          <div className="card-header-main">
            <div className="title-group">
              <span className="material-symbols-outlined icon-accent-purple">monitoring</span>
              <h3>Monthly Production Performance</h3>
            </div>
            <div className={`trend-badge-premium ${prodGrowthColor}`}>
              {production.prodGrowthPercent >= 0 ? 'add_box' : 'do_not_disturb_on'}
              <span>{Math.abs(production.prodGrowthPercent)}%</span>
            </div>
          </div>

          <div style={{ height: 350, minWidth: 0, marginTop: '20px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={charts.monthlyProductionChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis hide />
                <Tooltip cursor={false} />
                <Bar dataKey="Production" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card" style={{ minWidth: 0, position: 'relative' }}>
          <h3 className="card-title">Production by Size</h3>
          <div style={{ height: 350, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={charts.prodSizeChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip cursor={false} />
                <Bar dataKey="ProdQty" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Financial Distribution */}
      <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="analytics-card" style={{ minWidth: 0, position: 'relative' }}>
          <div className="card-header-main">
            <div className="title-group">
              <span className="material-symbols-outlined icon-accent">pie_chart</span>
              <h3>Income vs Expenses</h3>
            </div>
          </div>
          <div style={{ height: 320, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Income', value: financials.totalIncome },
                    { name: 'Expenses', value: financials.totalExpenses }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip cursor={false} formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="analytics-card" style={{ minWidth: 0, position: 'relative' }}>
          <div className="card-header-main">
            <div className="title-group">
              <span className="material-symbols-outlined icon-accent">account_balance_wallet</span>
              <h3>Expense Analysis by Category</h3>
            </div>
          </div>
          <div style={{ height: 320, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart layout="vertical" data={charts.expenseCatChart} margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip cursor={false} formatter={(value) => `₹${value.toLocaleString()}`} />
                <Bar dataKey="Amount" radius={[0, 4, 4, 0]} barSize={25}>
                  {charts.expenseCatChart.map((entry, index) => {
                    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Turnover;
