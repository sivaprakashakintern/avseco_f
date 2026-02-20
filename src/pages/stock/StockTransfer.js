import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Stock.css';

const StockTransactions = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportType, setExportType] = useState('all'); // all, purchase, sale, return, adjustment, transfer
  
  // Product dropdown state
  const [selectedProduct, setSelectedProduct] = useState("Areca Leaf Plate 10\" Round");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [transactionType, setTransactionType] = useState("PURCHASE");
  const [isLogging, setIsLogging] = useState(false);

  // Search and Filter states for Recent History
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Products list
  const products = [
    { id: 1, name: "Areca Leaf Plate 10\" Round", sku: "FG-PL-010", category: "Finished Goods", unit: "pcs", currentStock: 4500 },
    { id: 2, name: "Areca Leaf Plate 8\" Round", sku: "FG-PL-008", category: "Finished Goods", unit: "pcs", currentStock: 3800 },
    { id: 3, name: "Areca Leaf Bowl 6\"", sku: "FG-BL-006", category: "Finished Goods", unit: "pcs", currentStock: 2500 },
    { id: 4, name: "Areca Leaf Square Plate", sku: "FG-PL-SQ", category: "Finished Goods", unit: "pcs", currentStock: 1800 },
    { id: 5, name: "Raw Areca Sheaths (Grade A)", sku: "RM-AL-001", category: "Raw Material", unit: "kg", currentStock: 1200 },
    { id: 6, name: "Raw Areca Sheaths (Grade B)", sku: "RM-AL-002", category: "Raw Material", unit: "kg", currentStock: 850 },
  ];

  const [allTransactions, setAllTransactions] = useState([
    { id: 1, date: "Oct 24, 2023 14:32 PM", product: "Areca Leaf Plate 10\" Round", type: "PURCHASE", quantity: 1200, unit: "pcs", balance: 4500, status: "success" },
    { id: 2, date: "Oct 24, 2023 12:15 PM", product: "Raw Areca Sheaths (Grade A)", type: "SALE", quantity: -500, unit: "kg", balance: 2100, status: "failed" },
    { id: 3, date: "Oct 23, 2023 16:20 PM", product: "Areca Leaf Bowl 6\"", type: "PURCHASE", quantity: 800, unit: "pcs", balance: 1850, status: "success" },
    { id: 4, date: "Oct 23, 2023 10:05 AM", product: "Areca Leaf Plate 8\" Round", type: "RETURN", quantity: 50, unit: "pcs", balance: 950, status: "success" },
    { id: 5, date: "Oct 22, 2023 14:30 PM", product: "Raw Areca Sheaths (Grade B)", type: "PURCHASE", quantity: 300, unit: "kg", balance: 850, status: "success" },
  ]);

  // Filtered transactions based on search and filters
  const getFilteredTransactions = () => {
    return allTransactions.filter((transaction) => {
      const matchesSearch = searchTerm === "" || 
        transaction.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === "all" || 
        transaction.type.toLowerCase() === typeFilter.toLowerCase();
      
      const matchesStatus = statusFilter === "all" || 
        transaction.status.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesType && matchesStatus;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Get filtered data for export based on type
  const getFilteredDataForExport = (type) => {
    if (type === 'all') return allTransactions;
    return allTransactions.filter(t => t.type.toLowerCase() === type.toLowerCase());
  };

  const StatusBadge = ({ status }) => (
    <span className={`status-badge ${status}`}>
      {status === 'success' ? '✅' : '❌'} {status.toUpperCase()}
    </span>
  );

  // Navigation handlers
  const handleNavigation = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Handle Log Transaction
  const handleLogTransaction = () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      setFeedbackMessage("Please enter valid quantity");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    setIsLogging(true);

    setTimeout(() => {
      const qty = parseFloat(quantity);
      const selectedProductObj = products.find(p => p.name === selectedProduct);
      const unit = selectedProductObj?.unit || "pcs";
      
      // Determine quantity sign based on transaction type
      let quantityValue = qty;
      if (transactionType === "SALE" || transactionType === "TRANSFER") {
        quantityValue = -qty;
      }

      // Calculate new balance
      const lastTransaction = allTransactions[0];
      const currentBalance = lastTransaction ? lastTransaction.balance : selectedProductObj?.currentStock || 0;
      const newBalance = currentBalance + quantityValue;

      const newTransaction = {
        id: allTransactions.length + 1,
        date: formatDate(new Date()),
        product: selectedProduct,
        type: transactionType,
        quantity: quantityValue,
        unit: unit,
        balance: newBalance,
        status: "success"
      };

      setAllTransactions([newTransaction, ...allTransactions]);
      setQuantity("");
      setIsLogging(false);
      setFeedbackMessage(`✅ Transaction logged successfully! New balance: ${newBalance} ${unit}`);

      setTimeout(() => setFeedbackMessage(""), 3000);
    }, 500);
  };

  // Export Handler
  const handleExport = () => {
    setShowExportModal(true);
  };

  const confirmExport = () => {
    setExportLoading(true);
    setShowExportModal(false);

    setTimeout(() => {
      const dataToExport = getFilteredDataForExport(exportType);
      const fileName = `${exportType === 'all' ? 'All' : exportType}_Stock_Report_${new Date().toISOString().split('T')[0]}`;

      switch(exportFormat) {
        case 'excel':
          exportToExcel(dataToExport, fileName);
          break;
        case 'csv':
          exportToCSV(dataToExport, fileName);
          break;
        case 'pdf':
          exportToPDF(dataToExport, fileName);
          break;
        default:
          exportToCSV(dataToExport, fileName);
      }

      setExportLoading(false);
      setExportSuccess(true);
      setFeedbackMessage(`✅ ${exportFormat.toUpperCase()} report downloaded successfully`);

      setTimeout(() => {
        setExportSuccess(false);
        setFeedbackMessage("");
      }, 3000);
    }, 1000);
  };

  const exportToCSV = (data, fileName) => {
    const headers = ["Date", "Product", "Type", "Quantity", "Unit", "Balance", "Status"];
    const csvData = data.map((item) => [
      item.date,
      item.product,
      item.type,
      item.quantity > 0 ? `+${item.quantity}` : item.quantity,
      item.unit,
      item.balance,
      item.status,
    ]);

    const csvContent = [headers, ...csvData].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = (data, fileName) => {
    // For demo, we'll use CSV format since xlsx library might not be installed
    exportToCSV(data, fileName);
  };

  const exportToPDF = (data, fileName) => {
    // For demo, we'll use CSV format since jsPDF might not be installed
    exportToCSV(data, fileName);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
      if (!event.target.closest('.product-dropdown')) {
        setIsProductDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="stock-page">
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className={`feedback-toast ${feedbackMessage.includes('✅') ? 'success' : ''}`}>
          <span className="material-symbols-outlined">
            {feedbackMessage.includes('✅') ? 'check_circle' : 'info'}
          </span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Export Success Toast */}
      {exportSuccess && (
        <div className="feedback-toast success">
          <span className="material-symbols-outlined">download_done</span>
          <span>Export completed successfully</span>
        </div>
      )}

      {/* Page Header with Dropdown */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Transactions</h1>
          <p className="page-subtitle">Log and monitor your areca leaf product movements in real-time</p>
        </div>
        <div className="header-actions">
          {/* Dropdown Menu - ONLY Menu Button */}
          <div className="dropdown-container">
            <button 
              className="btn-outline dropdown-toggle"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="material-symbols-outlined">menu</span>
              View 
              <span className="material-symbols-outlined dropdown-arrow">
                {isDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
              </span>
            </button>
            
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button 
                  className="dropdown-item"
                  onClick={() => handleNavigation('/stock')}
                >
                  <span className="material-symbols-outlined">inventory</span>
                  <span>Stock Overview</span>
                </button>
                <button 
                  className="dropdown-item active"
                  onClick={() => handleNavigation('/stock-transaction')}
                >
                  <span className="material-symbols-outlined">swap_horiz</span>
                  <span>Stock Transaction</span>
                  <span className="material-symbols-outlined check">check</span>
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleNavigation('/stock/production')}
                >
                  <span className="material-symbols-outlined">factory</span>
                  <span>Production</span>
                </button>
              </div>
            )}
          </div>

          {/* Export Button */}
          <button className="btn-outline" onClick={handleExport} disabled={exportLoading}>
            <span className="material-symbols-outlined">
              {exportLoading ? "hourglass_empty" : "download"}
            </span>
            {exportLoading ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* Quick Stock Entry Card */}
      <div className="stock-table-container quick-entry-card">
        <div className="table-header">
          <h3>Quick Stock Entry</h3>
        </div>
        <div className="quick-entry-container">
          {/* Product Dropdown */}
          <div className="quick-entry-item">
            <span className="quick-entry-label">Product:</span>
            <div className="product-dropdown">
              <button 
                onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                className="product-dropdown-toggle"
              >
                <span className="product-dropdown-text">
                  {selectedProduct}
                </span>
                <span className="material-symbols-outlined product-dropdown-arrow">
                  {isProductDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                </span>
              </button>
              
              {isProductDropdownOpen && (
                <div className="product-dropdown-menu">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product.name);
                        setIsProductDropdownOpen(false);
                      }}
                      className={`product-dropdown-item ${selectedProduct === product.name ? 'active' : ''}`}
                    >
                      <span className="product-name-text">{product.name}</span>
                      <span className="product-sku-category">{product.sku} • {product.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quantity Input */}
          <div className="quick-entry-item">
            <span className="quick-entry-label">Quantity:</span>
            <input 
              type="number" 
              placeholder="0.00" 
              className="quick-entry-input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <span className="unit-label">
              {products.find(p => p.name === selectedProduct)?.unit || "pcs"}
            </span>
          </div>

          {/* Transaction Type Dropdown */}
          <div className="quick-entry-item">
            <span className="quick-entry-label">Transaction Type:</span>
            <select 
              className="quick-entry-select"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
            >
              <option value="PURCHASE">Purchase</option>
              <option value="SALE">Sale</option>
              <option value="RETURN">Return</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>

          {/* LOG TRANSACTION Button */}
          <button 
            className="btn-primary quick-entry-btn"
            onClick={handleLogTransaction}
            disabled={isLogging}
          >
            <span className="material-symbols-outlined">
              {isLogging ? "hourglass_empty" : "add"}
            </span>
            {isLogging ? "LOGGING..." : "LOG TRANSACTION"}
          </button>
        </div>
      </div>

      {/* ========== RECENT HISTORY SECTION ========== */}
      {/* Search and Filter Bar - OUTSIDE Container */}
      <div className="history-filters-wrapper">
        <div className="history-filters-header">
          <h3 className="history-filters-title"></h3>
          {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
            <button
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              <span className="material-symbols-outlined">clear_all</span>
              Clear Filters
            </button>
          )}
        </div>

        <div className="history-filters">
          <div className="search-box">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Search by product or transaction type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm("")}>
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>

          <div className="filter-group">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="purchase">Purchase</option>
              <option value="sale">Sale</option>
              <option value="return">Return</option>
              <option value="adjustment">Adjustment</option>
              <option value="transfer">Transfer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recent History Table Container */}
      <div className="stock-table-container">
        {filteredTransactions.length < allTransactions.length && (
          <div className="filter-badge-container">
            <span className="filter-badge">
              Filtered: {filteredTransactions.length} of {allTransactions.length} items
            </span>
          </div>
        )}

        <div className="table-responsive">
          <table className="stock-table">
            <thead>
              <tr>
                <th>DATE & TIME</th>
                <th>PRODUCT DESCRIPTION</th>
                <th>TYPE</th>
                <th>QUANTITY</th>
                <th>BALANCE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.date}</td>
                    <td>
                      <div className="product-info">
                        <div className="product-icon">
                          <span className="material-symbols-outlined">
                            {transaction.type === 'PURCHASE' ? 'shopping_cart' : 
                             transaction.type === 'SALE' ? 'sell' : 
                             transaction.type === 'RETURN' ? 'assignment_return' : 
                             transaction.type === 'TRANSFER' ? 'swap_horiz' : 'tune'}
                          </span>
                        </div>
                        <span className="product-name">{transaction.product}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`transaction-type ${transaction.type.toLowerCase()}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className={`transaction-quantity ${transaction.type.toLowerCase()}`}>
                      {transaction.quantity > 0 ? '+' : ''}{transaction.quantity} {transaction.unit}
                    </td>
                    <td className="product-value">{transaction.balance} {transaction.unit}</td>
                    <td>
                      <StatusBadge status={transaction.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    <div className="empty-state">
                      <span className="material-symbols-outlined empty-icon">
                        search_off
                      </span>
                      <h4>No transactions found</h4>
                      <p>Try adjusting your search or filters</p>
                      <button 
                        className="btn-outline" 
                        onClick={clearFilters}
                        style={{ marginTop: '12px' }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination Info */}
        <div className="table-footer">
          <div className="pagination-info">
            Showing {filteredTransactions.length} of {allTransactions.length} transactions
          </div>
        </div>
      </div>

      {/* Export Modal with Format and Report Type Options */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Export Stock Report</h3>
              <button
                className="modal-close"
                onClick={() => setShowExportModal(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-icon info">
                <span className="material-symbols-outlined">download</span>
              </div>
              <p className="modal-title">Choose Export Options</p>
              
              <div className="export-section">
                <h4>Export Format</h4>
                <div className="export-format-options">
                  <label className={`format-option ${exportFormat === 'excel' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="format"
                      value="excel"
                      checked={exportFormat === 'excel'}
                      onChange={(e) => setExportFormat(e.target.value)}
                    />
                    <span className="material-symbols-outlined">grid_on</span>
                    <span>Excel</span>
                  </label>
                  <label className={`format-option ${exportFormat === 'csv' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="format"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value)}
                    />
                    <span className="material-symbols-outlined">description</span>
                    <span>CSV</span>
                  </label>
                  <label className={`format-option ${exportFormat === 'pdf' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      checked={exportFormat === 'pdf'}
                      onChange={(e) => setExportFormat(e.target.value)}
                    />
                    <span className="material-symbols-outlined">picture_as_pdf</span>
                    <span>PDF</span>
                  </label>
                </div>
              </div>

              <div className="export-section">
                <h4>Report Type</h4>
                <div className="export-type-options">
                  <label className={`type-option ${exportType === 'all' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="all"
                      checked={exportType === 'all'}
                      onChange={(e) => setExportType(e.target.value)}
                    />
                    <span>All Transactions</span>
                  </label>
                  <label className={`type-option ${exportType === 'purchase' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="purchase"
                      checked={exportType === 'purchase'}
                      onChange={(e) => setExportType(e.target.value)}
                    />
                    <span>Purchase Report</span>
                  </label>
                  <label className={`type-option ${exportType === 'sale' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="sale"
                      checked={exportType === 'sale'}
                      onChange={(e) => setExportType(e.target.value)}
                    />
                    <span>Sales Report</span>
                  </label>
                  <label className={`type-option ${exportType === 'return' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="return"
                      checked={exportType === 'return'}
                      onChange={(e) => setExportType(e.target.value)}
                    />
                    <span>Return Report</span>
                  </label>
                  <label className={`type-option ${exportType === 'adjustment' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="adjustment"
                      checked={exportType === 'adjustment'}
                      onChange={(e) => setExportType(e.target.value)}
                    />
                    <span>Adjustment Report</span>
                  </label>
                  <label className={`type-option ${exportType === 'transfer' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="transfer"
                      checked={exportType === 'transfer'}
                      onChange={(e) => setExportType(e.target.value)}
                    />
                    <span>Transfer Report</span>
                  </label>
                </div>
              </div>

              <p className="export-note">
                <span className="material-symbols-outlined">info</span>
                Export {exportType === 'all' ? 'all' : exportType} transactions as {exportFormat.toUpperCase()} file
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="modal-cancel"
                onClick={() => setShowExportModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-confirm"
                onClick={confirmExport}
                disabled={exportLoading}
              >
                {exportLoading ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransactions;