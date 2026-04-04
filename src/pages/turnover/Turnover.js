import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import axios from '../../utils/axiosConfig.js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
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
      const res = await axios.get(`/turnover/analytics${query}`);
      setAnalytics(res.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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
      <div className="turnover-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loader">Loading Modern ERP Insights...</div>
      </div>
    );
  }

  const { financials, production, charts, recentData } = analytics;

  const displayDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    if (dateStr.includes(',')) return dateStr.split(',')[0].trim();
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert YYYY-MM-DD to DD-MM-YYYY
        return dateStr;
    }
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  // Prepare Profit/Loss Donut Data
  const donutData = [
    { name: 'Income', value: financials.totalIncome, color: '#10b981' },
    { name: 'Expenses', value: financials.totalExpenses, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Growth colors
  const incomeGrowthColor = financials.incomeGrowthPercent >= 0 ? 'badge-green' : 'badge-red';
  const prodGrowthColor = production.prodGrowthPercent >= 0 ? 'badge-green' : 'badge-red';

  return (
    <div className="turnover-container">
      {/* 1. Header Section */}
      <div className="premium-header-green">
        <div className="header-left-group">
          <h1>Modern ERP Analytics Dashboard</h1>
          <p className="subtitle-slim">Real-time performance tracking for AVSECO Inventory & Sales</p>
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
                // Auto-reset context on click
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

      {/* 4. Analytics Section (Comparison Panels) */}
      <div className="analytics-grid">
        {/* Redesigned Sales Performance Comparison */}
        <div className="analytics-card comparison-card-v2">
          <div className="card-header-main">
            <div className="title-group">
              <span className="material-symbols-outlined icon-accent">analytics</span>
              <h3>Sales Performance (MoM)</h3>
            </div>
            <div className={`trend-badge-premium ${incomeGrowthColor}`}>
               {financials.incomeGrowthPercent >= 0 ? 'trending_up' : 'trending_down'}
               <span>{Math.abs(financials.incomeGrowthPercent)}%</span>
            </div>
          </div>
          
          <div className="dual-metric-grid">
            <div className="metric-box start">
              <span className="label-lite">Selected Period</span>
              <div className="metric-value-huge">₹{financials.currentMonthIncome.toLocaleString('en-IN')}</div>
            </div>
            <div className="metric-box end">
              <span className="label-lite">Prior Period</span>
              <div className="metric-value-ghost">₹{financials.prevMonthIncome.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div style={{ height: 160, minWidth: 0, marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <AreaChart data={charts.monthlyIncomeChart}>
                <defs>
                  <linearGradient id="colorIncomeV2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncomeV2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Redesigned Production Growth Comparison */}
        <div className="analytics-card comparison-card-v2">
          <div className="card-header-main">
            <div className="title-group">
              <span className="material-symbols-outlined icon-accent-purple">inventory_2</span>
              <h3>Production Analysis</h3>
            </div>
            <div className={`trend-badge-premium ${prodGrowthColor}`}>
               {production.prodGrowthPercent >= 0 ? 'add_circle' : 'do_not_disturb_on'}
               <span>{Math.abs(production.prodGrowthPercent)}%</span>
            </div>
          </div>

          <div className="production-vs-grid">
            <div className="prod-period">
              <div className="main-stat">{production.currentMonthProduction.toLocaleString()}</div>
              <span className="sub-stat">Current Pcs</span>
            </div>
            <div className="vs-center">VS</div>
            <div className="prod-period ghost">
              <div className="main-stat">{production.prevMonthProduction.toLocaleString()}</div>
              <span className="sub-stat">Prior Pcs</span>
            </div>
          </div>

          <div className="progress-stack">
            <div className="progress-label-row">
              <span className="p-label">Volume Target Progress</span>
              <span className="p-val">{Math.min(100, Math.round((production.currentMonthProduction / (production.prevMonthProduction || 1)) * 100))}%</span>
            </div>
            <div className="modern-progress-bar">
              <div 
                className={`progress-fill-glow ${production.prodGrowthPercent >= 0 ? 'safe' : 'warn'}`}
                style={{ width: `${Math.min(100, (production.currentMonthProduction / (production.prevMonthProduction || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Charts Section (Donut & Distribution) */}
      <div className="charts-grid">
        {/* Income vs Expense Donut */}
        <div className="chart-card">
          <h3 className="card-title">Financial Balance (Income vs Expenses)</h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '60%', height: 260, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart>
                  <Pie 
                    data={donutData} 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ width: '40%' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ height: '10px', width: '10px', background: '#10b981', display: 'inline-block', borderRadius: '50%', marginRight: '8px' }}></span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Income: </span>
                <div style={{ fontWeight: 800 }}>₹{financials.totalIncome.toLocaleString()}</div>
              </div>
              <div>
                <span style={{ height: '10px', width: '10px', background: '#ef4444', display: 'inline-block', borderRadius: '50%', marginRight: '8px' }}></span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Expenses: </span>
                <div style={{ fontWeight: 800 }}>₹{financials.totalExpenses.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Size Distribution Bar */}
        <div className="chart-card">
          <h3 className="card-title">Sales Distribution by Size</h3>
          <div style={{ height: 260, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={charts.salesSizeChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="SalesQty" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Production Size Distribution Bar */}
        <div className="chart-card">
          <h3 className="card-title">Stock Availability by Size</h3>
          <div style={{ height: 260, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={charts.prodSizeChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="ProdQty" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New Expense Categories Chart */}
        <div className="chart-card">
          <div className="card-header-main">
            <h3 className="card-title">Top Expense Sources</h3>
            <span className="material-symbols-outlined" style={{color: '#f43f5e'}}>account_balance_wallet</span>
          </div>
          <div style={{ height: 260, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart 
                data={(charts.expenseCatChart || []).slice(0, 5)} 
                layout="vertical"
                margin={{ left: 20, right: 30, top: 10, bottom: 10 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={100}
                  tick={{fill: '#475569', fontSize: 12, fontWeight: 700}} 
                />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}} 
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="Amount" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Turnover;
