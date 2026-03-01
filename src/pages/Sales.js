import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext.js';
import './Sales.css';

const Sales = () => {
    const { clients, addClient } = useAppContext();
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [newClientData, setNewClientData] = useState({ companyName: "", contactPerson: "" });
    const [exportLoading, setExportLoading] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState('excel');
    const [exportType, setExportType] = useState('all'); // all, upi, cash, card

    // Product dropdown state
    const [selectedProduct, setSelectedProduct] = useState("Areca Leaf Plate 10\" Round");
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const [quantity, setQuantity] = useState("");
    const [unitPrice, setUnitPrice] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [companyName, setCompanyName] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [billItems, setBillItems] = useState([]);

    // Search and Filter states for Recent History
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    // Products list
    const products = [
        { id: 1, name: "Areca Leaf Plate 6\" Round", sku: "FG-PL-006", category: "Finished Goods", unit: "pcs", currentStock: 6000, price: 2.50 },
        { id: 2, name: "Areca Leaf Plate 8\" Round", sku: "FG-PL-008", category: "Finished Goods", unit: "pcs", currentStock: 5000, price: 4.50 },
        { id: 3, name: "Areca Leaf Plate 10\" Round", sku: "FG-PL-010", category: "Finished Goods", unit: "pcs", currentStock: 3200, price: 6.50 },
        { id: 4, name: "Areca Leaf Plate 12\" Round", sku: "FG-PL-012", category: "Finished Goods", unit: "pcs", currentStock: 2500, price: 8.50 },
    ];

    // Initialize unit price when product is selected
    useEffect(() => {
        const product = products.find(p => p.name === selectedProduct);
        if (product) {
            setUnitPrice(product.price.toString());
        }
    }, [selectedProduct, products]);

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
        { id: 1, date: "Oct 24, 2023 14:32 PM", product: "Areca Leaf Plate 10\" Round", type: "SALE", quantity: -1200, unit: "pcs", balance: 4500, status: "success", customer: "Global Exports", company: "AVS Eco", amount: 7800, paymentStatus: "UPI" },
        { id: 2, date: "Oct 24, 2023 12:15 PM", product: "Raw Areca Sheaths (Grade A)", type: "SALE", quantity: -500, unit: "kg", balance: 2100, status: "success", customer: "Local Vendor", company: "AVS Eco", amount: 3250, paymentStatus: "Cash" },
        { id: 3, date: "Oct 23, 2023 16:20 PM", product: "Areca Leaf Bowl 6\"", type: "SALE", quantity: -800, unit: "pcs", balance: 1850, status: "success", customer: "Bulk Supplier", company: "AVS Eco", amount: 2000, paymentStatus: "Card" },
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
        return allTransactions.filter(t => t.paymentStatus?.toLowerCase() === type.toLowerCase());
    };

    const StatusBadge = ({ status }) => (
        <span className={`status-badge ${status}`}>
            {status === 'success' ? '✅' : '❌'} {status.toUpperCase()}
        </span>
    );

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
            unit: products.find(p => p.name === selectedProduct)?.unit || "pcs"
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
                    unit: products.find(p => p.name === selectedProduct)?.unit || "pcs"
                });
            }

            const totalPieces = itemsToLog.reduce((sum, item) => sum + item.qty, 0);
            const totalBillAmount = itemsToLog.reduce((sum, item) => sum + item.amount, 0);

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
                paymentStatus: paymentMode
            };

            setAllTransactions([newHistoryEntry, ...allTransactions]);
            setBillItems([]);
            setQuantity("");
            setTotalAmount("");
            setCompanyName("");
            setCustomerName("");
            setPaymentMode("Cash");
            setIsLogging(false);
            setFeedbackMessage(`✅ Sale saved for ${companyName}! Total: ₹${totalBillAmount}`);

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



    // Export Handler
    const handleExport = () => {
        setShowExportModal(true);
    };

    const confirmExport = () => {
        setExportLoading(true);
        setShowExportModal(false);

        setTimeout(() => {
            const dataToExport = getFilteredDataForExport(exportType);
            const fileName = `${exportType === 'all' ? 'All' : exportType}_Sales_Report_${new Date().toISOString().split('T')[0]}`;

            switch (exportFormat) {
                case 'excel':
                    exportToCSV(dataToExport, fileName);
                    break;
                case 'csv':
                    exportToCSV(dataToExport, fileName);
                    break;
                case 'pdf':
                    exportToCSV(dataToExport, fileName);
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

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm("");
        setTypeFilter("all");
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.product-dropdown')) {
                setIsProductDropdownOpen(false);
            }
            if (!event.target.closest('.client-dropdown')) {
                setIsClientDropdownOpen(false);
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
                <div className={`feedback-toast ${feedbackMessage.includes('✅') || feedbackMessage.toLowerCase().includes('added') || feedbackMessage.toLowerCase().includes('success') ? 'success' : ''}`}>
                    <span className="material-symbols-outlined">
                        {feedbackMessage.includes('✅') || feedbackMessage.toLowerCase().includes('added') || feedbackMessage.toLowerCase().includes('success') ? 'check_circle' : 'info'}
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
                    <h1 className="page-title">Sales Management</h1>
                    <p className="page-subtitle">Log and monitor your product sales and customer orders in real-time</p>
                </div>
                <div className="header-actions">
                    <button className="btn-export-premium" onClick={handleExport} disabled={exportLoading}>
                        <span className="material-symbols-outlined">
                            {exportLoading ? "hourglass_empty" : "download"}
                        </span>
                        {exportLoading ? "Exporting..." : "Export Report"}
                    </button>
                </div>
            </div>

            {/* Quick Sales Entry Card */}
            <div className="stock-table-container quick-entry-card">
                <div className="table-header">
                    <h3 className="section-title">Quick Sales Entry</h3>
                </div>
                <div className="quick-entry-grid">
                    <div className="quick-entry-row">
                        <div className="quick-entry-item">
                            <span className="quick-entry-label">Company:</span>
                            <div className="product-dropdown client-dropdown">
                                <div className="dropdown-input-wrapper">
                                    <button
                                        onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                        className="product-dropdown-toggle client-dropdown-toggle"
                                    >
                                        <span className="product-dropdown-text">{companyName || "Select Company"}</span>
                                        <span className="material-symbols-outlined product-dropdown-arrow">
                                            {isClientDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                                        </span>
                                    </button>
                                    {companyName && (
                                        <button className="clear-selection-btn" onClick={(e) => { e.stopPropagation(); setCompanyName(""); setCustomerName(""); }}>
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    )}
                                </div>
                                {isClientDropdownOpen && (
                                    <div className="product-dropdown-menu">
                                        <div className="dropdown-search-wrapper">
                                            <input
                                                type="text"
                                                placeholder="Search companies..."
                                                className="dropdown-search-input"
                                                autoFocus
                                                onChange={(e) => setCompanyName(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        {clients.filter(c =>
                                            c.companyName.toLowerCase().includes(companyName.toLowerCase())
                                        ).length > 0 ? (
                                            <>
                                                {clients
                                                    .filter(c => c.companyName.toLowerCase().includes(companyName.toLowerCase()))
                                                    .map((client) => (
                                                        <button
                                                            key={client.id}
                                                            onClick={() => {
                                                                setCompanyName(client.companyName);
                                                                setCustomerName(client.contactPerson);
                                                                setIsClientDropdownOpen(false);
                                                            }}
                                                            className={`product-dropdown-item ${companyName === client.companyName ? 'active' : ''}`}
                                                        >
                                                            <span className="product-name-text">{client.companyName}</span>
                                                            <span className="product-sku-category">{client.contactPerson}</span>
                                                        </button>
                                                    ))}
                                                <div className="dropdown-divider"></div>
                                                <button
                                                    className="add-new-client-dropdown-btn"
                                                    onClick={() => {
                                                        setNewClientData({ ...newClientData, companyName: companyName });
                                                        setShowAddClientModal(true);
                                                        setIsClientDropdownOpen(false);
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined">add_circle</span>
                                                    Add New Client
                                                </button>
                                            </>
                                        ) : (
                                            <div className="no-clients-found-container">
                                                <div className="no-clients-found">No clients found for "{companyName}"</div>
                                                <button
                                                    className="create-client-btn-inline"
                                                    onClick={() => {
                                                        setNewClientData({ ...newClientData, companyName: companyName });
                                                        setShowAddClientModal(true);
                                                        setIsClientDropdownOpen(false);
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined">person_add</span>
                                                    Create "{companyName}" as new client
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
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
                            <span className="quick-entry-label">Payment Mode:</span>
                            <div className="payment-mode-selector">
                                {['UPI', 'Cash', 'Card'].map(mode => (
                                    <button
                                        key={mode}
                                        className={`mode-btn ${paymentMode === mode ? 'active' : ''}`}
                                        onClick={() => setPaymentMode(mode)}
                                    >
                                        {mode}
                                    </button>
                                ))}
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
                                {isLogging ? "SAVING..." : "SAVE SALE ENTRY"}
                            </button>
                        </div>
                    </div>

                    {billItems.length > 0 && (
                        <div className="bill-preview-section">
                            <div className="preview-header">
                                <span>Items in Current Sale ({billItems.length})</span>
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

            <div className="history-filters-wrapper">
                <div className="history-filters-header">
                    <h3 className="section-title">Recent Sales History</h3>
                    {(searchTerm || typeFilter !== "all") && (
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
                            placeholder="Search by customer, company or product..."
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
                            <option value="all">All Modes</option>
                            <option value="upi">UPI</option>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="stock-table-container">
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
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="no-data">
                                        <div className="empty-state">
                                            <span className="material-symbols-outlined empty-icon">search_off</span>
                                            <h4>No sales records found</h4>
                                            <p>Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="table-footer">
                    <div className="pagination-info">
                        Showing {filteredTransactions.length} of {allTransactions.length} sales records
                    </div>
                </div>
            </div>

            {showExportModal && (
                <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Export Sales Report</h3>
                            <button className="modal-close" onClick={() => setShowExportModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="export-section">
                                <h4>Export Format</h4>
                                <div className="export-format-options">
                                    <label className={`format-option ${exportFormat === 'excel' ? 'active' : ''}`}>
                                        <input type="radio" value="excel" checked={exportFormat === 'excel'} onChange={(e) => setExportFormat(e.target.value)} />
                                        <span className="material-symbols-outlined">grid_on</span>
                                        <span className="format-name">Excel</span>
                                    </label>
                                    <label className={`format-option ${exportFormat === 'csv' ? 'active' : ''}`}>
                                        <input type="radio" value="csv" checked={exportFormat === 'csv'} onChange={(e) => setExportFormat(e.target.value)} />
                                        <span className="material-symbols-outlined">description</span>
                                        <span className="format-name">CSV</span>
                                    </label>
                                    <label className={`format-option ${exportFormat === 'pdf' ? 'active' : ''}`}>
                                        <input type="radio" value="pdf" checked={exportFormat === 'pdf'} onChange={(e) => setExportFormat(e.target.value)} />
                                        <span className="material-symbols-outlined">picture_as_pdf</span>
                                        <span className="format-name">PDF</span>
                                    </label>
                                </div>
                            </div>
                            <div className="export-section">
                                <h4>Report Type</h4>
                                <div className="export-type-options">
                                    <label className={`type-option ${exportType === 'all' ? 'active' : ''}`}>
                                        <input type="radio" value="all" checked={exportType === 'all'} onChange={(e) => setExportType(e.target.value)} />
                                        <span>All Sales</span>
                                    </label>
                                    <label className={`type-option ${exportType === 'upi' ? 'active' : ''}`}>
                                        <input type="radio" value="upi" checked={exportType === 'upi'} onChange={(e) => setExportType(e.target.value)} />
                                        <span>UPI Only</span>
                                    </label>
                                    <label className={`type-option ${exportType === 'cash' ? 'active' : ''}`}>
                                        <input type="radio" value="cash" checked={exportType === 'cash'} onChange={(e) => setExportType(e.target.value)} />
                                        <span>Cash Only</span>
                                    </label>
                                    <label className={`type-option ${exportType === 'card' ? 'active' : ''}`}>
                                        <input type="radio" value="card" checked={exportType === 'card'} onChange={(e) => setExportType(e.target.value)} />
                                        <span>Card Only</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-cancel" onClick={() => setShowExportModal(false)}>Cancel</button>
                            <button className="modal-confirm" onClick={confirmExport} disabled={exportLoading}>
                                {exportLoading ? 'Exporting...' : 'Export Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
            {/* Add New Client Modal */}
            {showAddClientModal && (
                <div className="modal-overlay">
                    <div className="export-modal quick-add-client-modal" style={{ maxWidth: '450px' }}>
                        <div className="export-modal-header">
                            <h2>Quick Add Client</h2>
                            <button className="modal-close" onClick={() => setShowAddClientModal(false)}>×</button>
                        </div>
                        <div className="export-modal-body">
                            <div className="quick-entry-item" style={{ marginBottom: '15px' }}>
                                <span className="quick-entry-label">Company Name:</span>
                                <input
                                    type="text"
                                    className="quick-entry-input"
                                    value={newClientData.companyName}
                                    onChange={(e) => setNewClientData({ ...newClientData, companyName: e.target.value })}
                                />
                            </div>
                            <div className="quick-entry-item">
                                <span className="quick-entry-label">Contact Person:</span>
                                <input
                                    type="text"
                                    className="quick-entry-input"
                                    placeholder="Enter contact person name"
                                    value={newClientData.contactPerson}
                                    onChange={(e) => setNewClientData({ ...newClientData, contactPerson: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="export-modal-footer">
                            <button className="btn-cancel" onClick={() => setShowAddClientModal(false)}>Cancel</button>
                            <button
                                className="btn-submit"
                                disabled={!newClientData.companyName || !newClientData.contactPerson}
                                onClick={() => {
                                    const newClient = {
                                        ...newClientData,
                                        email: "",
                                        phone: "",
                                        status: "Active",
                                        totalOrders: 0,
                                        totalSpent: "₹0",
                                        lastOrder: "Never",
                                        address: "",
                                        gst: ""
                                    };
                                    addClient(newClient);
                                    setCompanyName(newClientData.companyName);
                                    setCustomerName(newClientData.contactPerson);
                                    setShowAddClientModal(false);
                                }}
                            >
                                Add Client
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;