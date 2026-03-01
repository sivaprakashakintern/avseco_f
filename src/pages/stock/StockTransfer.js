import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Stock.css';

// Products list (stable reference for useEffect dependency)
const STOCK_TRANSFER_PRODUCTS = [
  { id: 1, name: "Areca Leaf Plate 6\" Round", sku: "FG-PL-006", category: "Finished Goods", unit: "pcs", currentStock: 6000, price: 2.50 },
  { id: 2, name: "Areca Leaf Plate 8\" Round", sku: "FG-PL-008", category: "Finished Goods", unit: "pcs", currentStock: 5000, price: 4.50 },
  { id: 3, name: "Areca Leaf Plate 10\" Round", sku: "FG-PL-010", category: "Finished Goods", unit: "pcs", currentStock: 3200, price: 6.50 },
  { id: 4, name: "Areca Leaf Plate 12\" Round", sku: "FG-PL-012", category: "Finished Goods", unit: "pcs", currentStock: 2500, price: 8.50 },
];

const StockTransactions = () => {
  const navigate = useNavigate();
  const [, setIsDropdownOpen] = useState(false);
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
  const [unitPrice, setUnitPrice] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billItems, setBillItems] = useState([]);

  // Search and Filter states for Recent History
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Initialize unit price when product is selected
  useEffect(() => {
    const product = STOCK_TRANSFER_PRODUCTS.find(p => p.name === selectedProduct);
    if (product) {
      setUnitPrice(product.price.toString());
    }
  }, [selectedProduct]);

  // Auto-calculate Total Amount when Quantity or Unit Price change
  useEffect(() => {
    if (quantity && unitPrice) {
      const calculatedAmount = (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2);
      setTotalAmount(calculatedAmount);
    } else {
      setTotalAmount("");
    }
  }, [quantity, unitPrice]);

  const [allTransactions, setAllTransactions] = useState([
    { id: 1, date: "Oct 24, 2023 14:32 PM", product: "Areca Leaf Plate 10\" Round", type: "PURCHASE", quantity: 1200, unit: "pcs", balance: 4500, status: "success", customer: "Global Exports", company: "AVS Eco" },
    { id: 2, date: "Oct 24, 2023 12:15 PM", product: "Raw Areca Sheaths (Grade A)", type: "SALE", quantity: -500, unit: "kg", balance: 2100, status: "failed", customer: "Local Vendor", company: "AVS Eco" },
    { id: 3, date: "Oct 23, 2023 16:20 PM", product: "Areca Leaf Bowl 6\"", type: "PURCHASE", quantity: 800, unit: "pcs", balance: 1850, status: "success", customer: "Bulk Supplier", company: "AVS Eco" },
  ]);

  // Filtered transactions based on search and filters
  const getFilteredTransactions = () => {
    return allTransactions.filter((transaction) => {
      const matchesSearch = searchTerm === "" ||
        transaction.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.company && transaction.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.customer && transaction.customer.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPayment = typeFilter === "all" ||
        (transaction.paymentStatus && transaction.paymentStatus.toLowerCase() === typeFilter.toLowerCase());

      return matchesSearch && matchesPayment;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Get filtered data for export based on type
  const getFilteredDataForExport = (type) => {
    if (type === 'all') return allTransactions;
    if (type === 'paid' || type === 'unpaid') {
      return allTransactions.filter(t => t.paymentStatus?.toLowerCase() === type.toLowerCase());
    }
    return allTransactions.filter(t => t.type?.toLowerCase() === type.toLowerCase());
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

  // Add item to current bill session
  const handleAddItem = () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      setFeedbackMessage("Please enter pieces");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    const newItem = {
      id: Date.now(),
      product: selectedProduct,
      qty: parseFloat(quantity),
      amount: parseFloat(totalAmount) || 0,
      unit: STOCK_TRANSFER_PRODUCTS.find(p => p.name === selectedProduct)?.unit || "pcs"
    };

    setBillItems([...billItems, newItem]);
    setQuantity("");
    setTotalAmount("");
    setFeedbackMessage(`Added ${selectedProduct} to bill`);
    setTimeout(() => setFeedbackMessage(""), 2000);
  };

  const handleLogTransaction = () => {
    if (billItems.length === 0 && (!quantity || parseFloat(quantity) <= 0)) {
      setFeedbackMessage("Please add items to bill or enter current item details");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    setIsLogging(true);

    setTimeout(() => {
      let itemsToLog = [...billItems];

      // If there's something currently entered but not "Added", include it
      if (quantity && parseFloat(quantity) > 0) {
        itemsToLog.push({
          product: selectedProduct,
          qty: parseFloat(quantity),
          amount: parseFloat(totalAmount) || 0,
          unit: STOCK_TRANSFER_PRODUCTS.find(p => p.name === selectedProduct)?.unit || "pcs"
        });
      }

      const totalPieces = itemsToLog.reduce((sum, item) => sum + item.qty, 0);
      const totalBillAmount = itemsToLog.reduce((sum, item) => sum + item.amount, 0);

      // Create a readable summary like "500x6\", 200x8\""
      const productSummary = itemsToLog.map(item =>
        `${item.qty}x${item.product.replace('Areca Leaf Plate ', '').replace(' Round', '')}`
      ).join(', ');

      const newHistoryEntry = {
        id: allTransactions.length + 1,
        date: formatDate(new Date()),
        product: productSummary,
        type: "SALE",
        quantity: -totalPieces,
        unit: "pcs",
        balance: (allTransactions[0]?.balance || 10000) - totalPieces,
        status: "success",
        company: companyName,
        customer: customerName,
        amount: totalBillAmount,
        paymentStatus: isPaid ? "Paid" : "Unpaid"
      };

      setAllTransactions([newHistoryEntry, ...allTransactions]);
      setBillItems([]);
      setQuantity("");
      setTotalAmount("");
      setCompanyName("");
      setCustomerName("");
      setIsLogging(false);
      setFeedbackMessage(`✅ Bill saved for ${companyName}! Total: ₹${totalBillAmount}`);

      setTimeout(() => setFeedbackMessage(""), 3000);
    }, 800);
  };

  const handleGenerateBill = () => {
    if (!companyName) {
      setFeedbackMessage("Please enter a Company Name");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    let itemsForBill = [...billItems];
    if (quantity && parseFloat(quantity) > 0) {
      itemsForBill.push({
        product: selectedProduct,
        qty: parseFloat(quantity),
        amount: parseFloat(totalAmount) || 0
      });
    }

    if (itemsForBill.length === 0) {
      setFeedbackMessage("No items to generate bill");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    const billData = {
      company: companyName,
      customer: customerName,
      date: formatDate(new Date()),
      items: itemsForBill.map(item => ({
        product: item.product,
        qty: item.qty,
        amount: item.amount
      }))
    };

    setSelectedBill(billData);
    setShowBillModal(true);
  };

  const openBillFromHistory = (transaction) => {
    // If it's a consolidated summary like "100x6\", 200x8\""
    // We can't perfectly decompose it without storing items separately, 
    // but for the UI we can show it as a single row in the bill or try a simple split

    const billData = {
      company: transaction.company,
      customer: transaction.customer,
      date: transaction.date,
      items: [{
        product: transaction.product,
        qty: Math.abs(transaction.quantity),
        amount: transaction.amount || 0
      }]
    };

    setSelectedBill(billData);
    setShowBillModal(true);
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      setAllTransactions(allTransactions.filter(t => t.id !== id));
      setFeedbackMessage("❌ Transaction deleted");
      setTimeout(() => setFeedbackMessage(""), 3000);
    }
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

      switch (exportFormat) {
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
    const headers = ["Date", "Customer", "Company", "Description", "Pieces", "Amount (₹)", "Payment Status"];
    const csvData = data.map((item) => [
      item.date,
      item.customer || "-",
      item.company || "-",
      item.product,
      Math.abs(item.quantity),
      item.amount || 0,
      item.paymentStatus || "Unpaid",
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

      {/* ===== PREMIUM ANALYTICS HEADER ===== */}
      <div className="page-header premium-header">
        <div>
          <h1 className="page-title">Stock Transactions</h1>
          <p className="page-subtitle">Log and monitor your areca leaf product movements in real-time</p>
        </div>
        <div className="header-actions">
          <button className="btn-transfer-premium" onClick={() => navigate('/stock')}>
            <span className="material-symbols-outlined">inventory</span>
            Stock Overview
          </button>
          <button className="btn-export-premium" onClick={handleExport} disabled={exportLoading}>
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
        <div className="quick-entry-grid">
          <div className="quick-entry-row">
            <div className="quick-entry-item">
              <span className="quick-entry-label">Company:</span>
              <input
                type="text"
                placeholder="Company Name"
                className="quick-entry-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="quick-entry-item">
              <span className="quick-entry-label">Customer:</span>
              <input
                type="text"
                placeholder="Customer Name"
                className="quick-entry-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          </div>

          <div className="quick-entry-row">
            <div className="quick-entry-item">
              <span className="quick-entry-label">Product:</span>
              <div className="product-dropdown">
                <button
                  onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                  className="product-dropdown-toggle"
                >
                  <span className="product-dropdown-text">{selectedProduct}</span>
                  <span className="material-symbols-outlined product-dropdown-arrow">
                    {isProductDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                  </span>
                </button>
                {isProductDropdownOpen && (
                  <div className="product-dropdown-menu">
                    {STOCK_TRANSFER_PRODUCTS.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setSelectedProduct(product.name);
                          setIsProductDropdownOpen(false);
                        }}
                        className={`product-dropdown-item ${selectedProduct === product.name ? 'active' : ''}`}
                      >
                        <span className="product-name-text">{product.name}</span>
                        <span className="product-sku-category">{product.sku}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="quick-entry-item">
              <span className="quick-entry-label">Total Pieces:</span>
              <input
                type="number"
                placeholder="0"
                className="quick-entry-input"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="quick-entry-row">
            <div className="quick-entry-item">
              <span className="quick-entry-label">Rate/Pc:</span>
              <div className="amount-input-wrapper">
                <span className="currency-prefix">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  className="quick-entry-input amount-input"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="quick-entry-item">
              <span className="quick-entry-label">Total Amount:</span>
              <div className="amount-input-wrapper">
                <span className="currency-prefix">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  className="quick-entry-input amount-input"
                  value={totalAmount}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="quick-entry-footer">
            <div className="quick-entry-item payment-status-item">
              <span className="quick-entry-label">Status:</span>
              <div className={`payment-toggle ${isPaid ? 'paid' : 'unpaid'}`} onClick={() => setIsPaid(!isPaid)}>
                <span className="toggle-label">{isPaid ? 'PAID' : 'UNPAID'}</span>
                <div className="toggle-switch"></div>
              </div>
            </div>

            <div className="quick-entry-action-group">
              <button
                className="btn-outline quick-entry-btn add-btn-colored"
                onClick={handleAddItem}
              >
                <span className="material-symbols-outlined">add_circle</span>
                ADD ITEM
              </button>

              <button
                className="btn-outline quick-entry-btn bill-btn-colored"
                onClick={handleGenerateBill}
              >
                <span className="material-symbols-outlined">receipt_long</span>
                GENERATE BILL
              </button>

              <button
                className="btn-primary quick-entry-btn log-btn-colored"
                onClick={handleLogTransaction}
                disabled={isLogging || (billItems.length === 0 && !quantity)}
              >
                <span className="material-symbols-outlined">
                  {isLogging ? "hourglass_empty" : "done_all"}
                </span>
                {isLogging ? "LOGGING..." : "LOG ALL & SAVE"}
              </button>
            </div>
          </div>

          {/* New: Quick Preview of added items */}
          {billItems.length > 0 && (
            <div className="bill-preview-section">
              <div className="preview-header">
                <span>Items in Current Bill ({billItems.length})</span>
                <button className="clear-bill" onClick={() => setBillItems([])}>Clear All</button>
              </div>
              <div className="preview-list">
                {billItems.map(item => (
                  <div key={item.id} className="preview-item">
                    <span className="item-name">{item.product}</span>
                    <span className="item-qty">{item.qty} pcs</span>
                    <span className="item-amt">₹{item.amount}</span>
                    <button className="remove-item" onClick={() => setBillItems(billItems.filter(i => i.id !== item.id))}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== RECENT HISTORY SECTION ========== */}
      {/* Search and Filter Bar - OUTSIDE Container */}
      <div className="history-filters-wrapper">
        <div className="history-filters-header">
          <h3 className="history-filters-title">Recent History</h3>
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
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
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
                <th>CUSTOMER / COMPANY</th>
                <th>PRODUCT DESCRIPTION</th>
                <th>PIECES</th>
                <th>AMOUNT</th>
                <th>PAYMENT</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.date}</td>
                    <td>
                      <div className="party-info">
                        <span className="customer-text">{transaction.customer || '-'}</span>
                        <span className="company-text">{transaction.company || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="product-info">
                        <span className="product-name">{transaction.product}</span>
                      </div>
                    </td>
                    <td className="quantity-cell">
                      {Math.abs(transaction.quantity)}
                    </td>
                    <td className="amount-cell">
                      ₹{transaction.amount?.toLocaleString() || '0'}
                    </td>
                    <td>
                      <span className={`payment-badge ${transaction.paymentStatus?.toLowerCase()}`}>
                        {transaction.paymentStatus || 'Unpaid'}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button className="icon-action-btn view" title="View Bill" onClick={() => openBillFromHistory(transaction)}>
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                      <button className="icon-action-btn delete" title="Delete" onClick={() => handleDeleteTransaction(transaction.id)}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
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
                  <label className={`type-option ${exportType === 'paid' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="paid"
                      checked={exportType === 'paid'}
                      onChange={(e) => setExportType(e.target.value)}
                    />
                    <span>Paid Only</span>
                  </label>
                  <label className={`type-option ${exportType === 'unpaid' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="unpaid"
                      checked={exportType === 'unpaid'}
                      onChange={(e) => setExportType(e.target.value)}
                    />
                    <span>Unpaid Only</span>
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
      {/* Bill Generation Modal */}
      {showBillModal && selectedBill && (
        <div className="bill-modal-overlay" onClick={() => setShowBillModal(false)}>
          <div className="bill-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="bill-header">
              <div className="bill-brand">
                <h2>AVS ECO PRODUCTS</h2>
                <p>Areca Leaf Plate Manufacturer</p>
              </div>
              <div className="bill-meta">
                <p><strong>Date:</strong> {selectedBill.date}</p>
                <p><strong>Company:</strong> {selectedBill.company}</p>
                <p><strong>Customer:</strong> {selectedBill.customer}</p>
              </div>
            </div>

            <div className="bill-table-container">
              <table className="bill-table">
                <thead>
                  <tr>
                    <th>Product Description</th>
                    <th>Qty (Pieces)</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.product}</td>
                      <td>{item.qty}</td>
                      <td>₹{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2" className="total-label">Grand Total</td>
                    <td className="total-value">
                      ₹{selectedBill.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="bill-footer">
              <p>Thank you for your business!</p>
              <div className="bill-actions">
                <button className="btn-outline" onClick={() => setShowBillModal(false)}>Close</button>
                <button className="btn-primary" onClick={() => window.print()}>
                  <span className="material-symbols-outlined">print</span>
                  Print Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransactions;