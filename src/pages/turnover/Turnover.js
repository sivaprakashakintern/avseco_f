import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import './Turnover.css';

const Turnover = () => {
  const { 
    salesHistory = [], 
    expenses: appContextExpenses = [], 
    productionHistory = [],
    turnoverRecords = []
  } = useAppContext();

  const [filterType, setFilterType] = useState('monthly'); // 'daily', 'monthly', 'yearly', 'all'

  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Main Analytics Logic
  const analytics = useMemo(() => {
    const parseDate = (info) => {
      if (!info) return null;
      if (info instanceof Date) return info;
      
      const dStr = String(info);
      // Extract parts using regex to be format-agnostic
      // Matches DD-MM-YYYY or YYYY-MM-DD, ignoring time/suffixes
      const match = dStr.match(/(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})/);
      if (match) {
        const [, p1, p2, p3] = match;
        // YYYY-MM-DD
        if (p1.length === 4) return new Date(Number(p1), Number(p2) - 1, Number(p3));
        // DD-MM-YYYY
        if (p3.length === 4) return new Date(Number(p3), Number(p2) - 1, Number(p1));
      }

      const d = new Date(dStr);
      return isNaN(d.getTime()) ? null : d;
    };

    const isMatch = (date) => {
      const d = parseDate(date);
      if (!d || isNaN(d.getTime())) return false;
      if (filterType === 'all') return true;

      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const day = d.getDate();

      if (filterType === 'daily') {
        const [sy, sm, sd] = selectedDate.split('-').map(Number);
        return y === sy && m === sm && day === sd;
      }
      if (filterType === 'monthly') {
        const [sy, sm] = selectedMonth.split('-').map(Number);
        return y === sy && m === sm;
      }
      if (filterType === 'yearly') {
        return y === Number(selectedYear);
      }
      return false;
    };

    // 1. Filtered Sets
    const filteredSales = (salesHistory || []).filter(s => {
      // Exclude cancelled or rejected sales
      if (s.status && (s.status.toLowerCase().includes('cancel') || s.status.toLowerCase().includes('reject'))) return false;
      return isMatch(s.date || s.createdAt);
    });
    const filteredExpenses = (appContextExpenses || []).filter(e => isMatch(e.date || e.createdAt));
    const filteredProduction = (productionHistory || []).filter(p => isMatch(p.date || p.createdAt));
    const filteredManualTurnover = (turnoverRecords || []).filter(t => isMatch(t.date || t.createdAt));

    // 2. Financial Metrics
    const salesIncome = filteredSales.reduce((sum, s) => {
      return sum + Number(s.totalAmount || s.amount || 0);
    }, 0);
    const manualIncome = filteredManualTurnover.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const totalIncome = salesIncome + manualIncome;
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    // 3. Expense Categories
    const expCatMap = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'Others';
      expCatMap[cat] = (expCatMap[cat] || 0) + Number(e.amount || 0);
    });
    const expenseCatChart = Object.keys(expCatMap).map(name => ({ name, Amount: expCatMap[name] }))
      .sort((a, b) => b.Amount - a.Amount);

    // 4. Monthly Trend Data
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYearNum = filterType === 'yearly' ? Number(selectedYear) : new Date().getFullYear();
    
    const monthlyIncomeData = monthsShort.map((m, i) => {
      const sVal = (salesHistory || []).filter(s => {
        const d = parseDate(s.date || s.createdAt);
        return d && d.getFullYear() === currentYearNum && d.getMonth() === i;
      }).reduce((sum, s) => sum + Number(s.totalAmount || s.amount || 0), 0);
      
      const tVal = (turnoverRecords || []).filter(t => {
        const d = parseDate(t.date || t.createdAt);
        return d && d.getFullYear() === currentYearNum && d.getMonth() === i;
      }).reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      return { name: m, Income: sVal + tVal };
    });

    const monthlyProdData = monthsShort.map((m, i) => {
      const val = (productionHistory || []).filter(p => {
        const d = parseDate(p.date || p.createdAt);
        return d && d.getFullYear() === currentYearNum && d.getMonth() === i;
      }).reduce((sum, p) => sum + Number(p.quantity || 0), 0);
      return { name: m, Production: val };
    });

    // 5. Size Breakdown
    const salesSizeMap = {};
    filteredSales.forEach(s => {
      if (s.saleItems && s.saleItems.length > 0) {
        s.saleItems.forEach(item => {
          const sz = (item.size || '').toString().trim() || 'Other';
          // Fix: database uses 'qty', frontend was looking for 'quantity'
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

    const prodSizeMap = {};
    filteredProduction.forEach(p => {
      const sz = (p.size || p.productSize || '').toString().trim() || 'Other';
      prodSizeMap[sz] = (prodSizeMap[sz] || 0) + Number(p.quantity || 0);
    });
    const prodSizeChart = Object.keys(prodSizeMap)
      .map(name => ({ name, ProdQty: prodSizeMap[name] }))
      .sort((a, b) => (parseFloat(a.name) || 0) - (parseFloat(b.name) || 0));

    return {
      financials: { totalIncome, totalExpenses, netProfit },
      charts: { expenseCatChart, monthlyIncomeData, monthlyProdData, salesSizeChart, prodSizeChart },
      manualRecords: filteredManualTurnover
    };
  }, [salesHistory, appContextExpenses, productionHistory, turnoverRecords, filterType, selectedDate, selectedMonth, selectedYear]);

  const { financials, charts } = analytics;

  return (
    <div className="turnover-container">
      {/* HEADER */}
      <div className="premium-header-green">
        <div className="header-left-group">
          <h1>Turnover</h1>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters-section">
        <div className="filter-type-buttons">
          {['daily', 'monthly', 'yearly', 'all'].map(t => (
            <button key={t} className={`filter-btn ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="filter-inputs">
          {filterType === 'daily' && <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="search-input" />}
          {filterType === 'monthly' && <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="search-input" />}
          {filterType === 'yearly' && (
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="search-input">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          {filterType === 'all' && <span className="all-time-label">Showing All Time Data</span>}
        </div>
      </div>

      {/* KPI GRID */}
      <div className="turnover-stats">
        <div className="stat-card">
          <div className="stat-icon icon-income"><span className="material-symbols-outlined">payments</span></div>
          <div className="stat-info">
            <span className="stat-label">Total Turnover</span>
            <span className="stat-value income">₹{financials.totalIncome.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon icon-expense"><span className="material-symbols-outlined">receipt_long</span></div>
          <div className="stat-info">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value expense">₹{financials.totalExpenses.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon icon-profit"><span className="material-symbols-outlined">savings</span></div>
          <div className="stat-info">
            <span className="stat-label">Net Profit</span>
            <span className="stat-value profit">₹{financials.netProfit.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* PREMIUM CSS VISUALIZATIONS */}
      <div className="analytics-grid">
        {/* INCOME VS EXPENSES BALANCER */}
        <div className="analytics-card">
          <div className="card-header-main">
            <div className="title-group">
              <span className="material-symbols-outlined icon-accent">balance</span>
              <h3>Profitability Ratio</h3>
            </div>
          </div>
          <div className="css-chart-container">
            <div className="balance-metrics">
              <div className="balance-item">
                <div className="label-row">
                  <span>Gross Sales</span>
                  <span className="val income">₹{financials.totalIncome.toLocaleString()}</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill income" 
                    style={{ width: `${financials.totalIncome > 0 ? (financials.totalIncome / Math.max(financials.totalIncome, financials.totalExpenses)) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div className="balance-item">
                <div className="label-row">
                  <span>Total Expenses</span>
                  <span className="val expense">₹{financials.totalExpenses.toLocaleString()}</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill expense" 
                    style={{ width: `${financials.totalExpenses > 0 ? (financials.totalExpenses / Math.max(financials.totalIncome, financials.totalExpenses)) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="profit-gauge">
               <div className="gauge-circle">
                  <div className="gauge-fill" style={{ 
                    background: `conic-gradient(#10b981 ${financials.totalIncome > 0 ? (financials.netProfit / financials.totalIncome) * 360 : 0}deg, #f1f5f9 0deg)`
                  }}></div>
                  <div className="gauge-center">
                    <span className="perc">{financials.totalIncome > 0 ? Math.round((financials.netProfit / financials.totalIncome) * 100) : 0}%</span>
                    <span className="lbl">Margin</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* EXPENSE CATEGORY BARS */}
        <div className="analytics-card">
          <div className="card-header-main">
            <div className="title-group">
              <span className="material-symbols-outlined icon-accent-purple">analytics</span>
              <h3>Expense Breakdown</h3>
            </div>
          </div>
          <div className="css-chart-container scrollable">
            {charts.expenseCatChart.length > 0 ? (
              charts.expenseCatChart.map((cat, i) => (
                <div key={i} className="cat-bar-item">
                  <div className="cat-info">
                    <span className="cat-name">{cat.name}</span>
                    <span className="cat-val">₹{cat.Amount.toLocaleString()}</span>
                  </div>
                  <div className="cat-track">
                    <div 
                      className="cat-fill" 
                      style={{ 
                        width: `${(cat.Amount / financials.totalExpenses) * 100}%`,
                        backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e'][i % 5]
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-chart-msg">No expenses found for this period</div>
            )}
          </div>
        </div>
      </div>

      {/* MONTHLY REVENUE TREND (CSS GRID) */}
      <div className="analytics-grid-full" style={{ marginBottom: '24px' }}>
        <div className="analytics-card">
          <div className="card-header-main">
            <div className="title-group">
              <span className="material-symbols-outlined icon-accent">trending_up</span>
              <h3>Monthly Performance ({filterType === 'yearly' ? selectedYear : new Date().getFullYear()})</h3>
            </div>
          </div>
          <div className="css-trend-chart">
            <div className="trend-grid">
              {charts.monthlyIncomeData.map((m, i) => {
                const maxIncome = Math.max(...charts.monthlyIncomeData.map(d => d.Income), 1);
                const heightPerc = (m.Income / maxIncome) * 100;
                return (
                  <div key={i} className="trend-col">
                    <div className="col-bar-wrapper">
                      <div className="col-bar" style={{ height: `${heightPerc}%` }}>
                        {m.Income > 0 && <span className="bar-tip">₹{Math.round(m.Income/1000)}k</span>}
                      </div>
                    </div>
                    <span className="col-label">{m.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SIZE ANALYSIS GRID */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="card-header-main">
            <div className="title-group">
              <span className="material-symbols-outlined icon-accent">shopping_bag</span>
              <h3>Sales Qty by Size</h3>
            </div>
          </div>
          <div className="css-size-grid">
            {charts.salesSizeChart.length > 0 ? charts.salesSizeChart.map((s, i) => (
              <div key={i} className="size-stat-item">
                <span className="s-lbl">{s.name}</span>
                <div className="s-bar-group">
                  <div className="s-bar sales" style={{ width: `${(s.SalesQty / Math.max(...charts.salesSizeChart.map(x => x.SalesQty), 1)) * 100}%` }}></div>
                  <span className="s-qty">{s.SalesQty}</span>
                </div>
              </div>
            )) : <div className="empty-chart-msg">No sales data</div>}
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-header-main">
            <div className="title-group">
              <span className="material-symbols-outlined icon-accent-purple">precision_manufacturing</span>
              <h3>Production Qty by Size</h3>
            </div>
          </div>
          <div className="css-size-grid">
            {charts.prodSizeChart.length > 0 ? charts.prodSizeChart.map((s, i) => (
              <div key={i} className="size-stat-item">
                <span className="s-lbl">{s.name}</span>
                <div className="s-bar-group">
                  <div className="s-bar prod" style={{ width: `${(s.ProdQty / Math.max(...charts.prodSizeChart.map(x => x.ProdQty), 1)) * 100}%` }}></div>
                  <span className="s-qty">{s.ProdQty}</span>
                </div>
              </div>
            )) : <div className="empty-chart-msg">No production data</div>}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Turnover;
