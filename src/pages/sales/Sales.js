import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import './Sales.css';
import logo from '../../assets/logo.png';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const PRODUCTS_LIST = [
    { id: 1, baseName: "Areca Leaf Plate", size: "6\" Round", name: "Areca Leaf Plate 6\" Round", sku: "FG-PL-006", category: "Finished Goods", unit: "pcs", currentStock: 6000, price: 2.50 },
    { id: 2, baseName: "Areca Leaf Plate", size: "8\" Round", name: "Areca Leaf Plate 8\" Round", sku: "FG-PL-008", category: "Finished Goods", unit: "pcs", currentStock: 5000, price: 4.50 },
    { id: 3, baseName: "Areca Leaf Plate", size: "10\" Round", name: "Areca Leaf Plate 10\" Round", sku: "FG-PL-010", category: "Finished Goods", unit: "pcs", currentStock: 3200, price: 6.50 },
    { id: 4, baseName: "Areca Leaf Plate", size: "12\" Round", name: "Areca Leaf Plate 12\" Round", sku: "FG-PL-012", category: "Finished Goods", unit: "pcs", currentStock: 2500, price: 8.50 },
];

const Sales = () => {
    const { clients, addClient, employees } = useAppContext();
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [newClientData, setNewClientData] = useState({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        gst: ""
    });
    const [exportLoading, setExportLoading] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState('excel');
    const [exportType, setExportType] = useState('all'); // all, upi, cash, card

    // Product Selection State
    const [selectedBaseProduct, setSelectedBaseProduct] = useState("Areca Leaf Plate");
    const [isBaseProductDropdownOpen, setIsBaseProductDropdownOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState("10\" Round");
    const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);

    const [quantity, setQuantity] = useState("");
    const [unitPrice, setUnitPrice] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [companyName, setCompanyName] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerGstin, setCustomerGstin] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [deliveryEmployee, setDeliveryEmployee] = useState("");
    const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
    const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
    const [paidStatus, setPaidStatus] = useState("Paid");
    const [isPaidStatusDropdownOpen, setIsPaidStatusDropdownOpen] = useState(false);
    const [amountPaid, setAmountPaid] = useState("");
    const [deliveryMode, setDeliveryMode] = useState("Door Delivery");
    const [isDeliveryModeDropdownOpen, setIsDeliveryModeDropdownOpen] = useState(false);
    const [isHistoryFilterDropdownOpen, setIsHistoryFilterDropdownOpen] = useState(false);
    const isLogging = false;
    const [showBillModal, setShowBillModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [billItems, setBillItems] = useState([]);
    const [viewMode, setViewMode] = useState('entry'); // 'entry' or 'history'

    // Search and Filter states for Recent History
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    const products = PRODUCTS_LIST;

    // Derived selected product
    const selectedProduct = products.find(p => p.baseName === selectedBaseProduct && p.size === selectedSize)?.name || "";

    // Auto-select first available size when base product changes
    useEffect(() => {
        const availableSizes = products.filter(p => p.baseName === selectedBaseProduct).map(p => p.size);
        if (!availableSizes.includes(selectedSize) && availableSizes.length > 0) {
            setSelectedSize(availableSizes[0]);
        }
    }, [selectedBaseProduct, products, selectedSize]);

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

    const [allTransactions, setAllTransactions] = useState([]);

    // ========== PERSISTENCE ==========
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        const savedSales = localStorage.getItem('salesHistory');
        if (savedSales) {
            try {
                setAllTransactions(JSON.parse(savedSales));
            } catch (e) {
                console.error("Error loading sales history:", e);
            }
        } else {
            // Initial default data if none exists
            setAllTransactions([
                { id: 1, date: "Oct 24, 2023 14:32 PM", product: "Areca Leaf Plate 10\" Round", type: "SALE", quantity: -1200, unit: "pcs", balance: 4500, status: "success", customer: "Global Exports", company: "AVS Eco", amount: 7800, paymentStatus: "UPI" },
                { id: 2, date: "Oct 24, 2023 12:15 PM", product: "Raw Areca Sheaths (Grade A)", type: "SALE", quantity: -500, unit: "kg", balance: 2100, status: "success", customer: "Local Vendor", company: "AVS Eco", amount: 3250, paymentStatus: "Cash" },
                { id: 3, date: "Oct 23, 2023 16:20 PM", product: "Areca Leaf Bowl 6\"", type: "SALE", quantity: -800, unit: "pcs", balance: 1850, status: "success", customer: "Bulk Supplier", company: "AVS Eco", amount: 2000, paymentStatus: "Card" },
            ]);
        }
        setDataLoaded(true);
    }, []);

    useEffect(() => {
        if (dataLoaded) {
            localStorage.setItem('salesHistory', JSON.stringify(allTransactions));
        }
    }, [allTransactions, dataLoaded]);

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

    // Format date for display
    const formatDate = (date) => {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Add item to current bill session - Merges duplicates if the same product is added
    const handleAddItem = () => {
        if (!quantity || parseFloat(quantity) <= 0) return;
        
        const qtyToAdd = parseFloat(quantity);
        const pricePerUnit = parseFloat(unitPrice) || 0;

        setBillItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => item.product === selectedProduct);
            
            if (existingItemIndex !== -1) {
                const updatedItems = [...prevItems];
                const item = updatedItems[existingItemIndex];
                updatedItems[existingItemIndex] = {
                    ...item,
                    qty: item.qty + qtyToAdd,
                    amount: item.amount + (pricePerUnit * qtyToAdd)
                };
                return updatedItems;
            } else {
                const newItem = {
                    id: Date.now(),
                    product: selectedProduct,
                    baseName: selectedBaseProduct,
                    size: selectedSize,
                    qty: qtyToAdd,
                    amount: (pricePerUnit * qtyToAdd) || 0,
                    unit: products.find(p => p.name === selectedProduct)?.unit || "pcs"
                };
                return [...prevItems, newItem];
            }
        });

        setQuantity("");
    };

    const handleLogTransaction = () => {
        if (billItems.length === 0 && (!quantity || parseFloat(quantity) <= 0)) {
            return;
        }

        let itemsToLog = [...billItems];

        // If there's something currently entered but not "Added", include it
        if (quantity && parseFloat(quantity) > 0) {
            itemsToLog.push({
                product: selectedProduct,
                qty: parseFloat(quantity),
                amount: (parseFloat(unitPrice) * parseFloat(quantity)) || 0,
                unit: products.find(p => p.name === selectedProduct)?.unit || "pcs"
            });
        }

        const totalPieces = itemsToLog.reduce((sum, item) => sum + item.qty, 0);
        const totalBillAmount = itemsToLog.reduce((sum, item) => sum + item.amount, 0);

        const productSummary = itemsToLog.map(item =>
            `${item.qty}x${item.product.replace('Areca Leaf Plate ', '').replace(' Round', '')}`
        ).join(', ');

        const newHistoryEntry = {
            id: Date.now(),
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
            paymentStatus: paymentMode,
            saleItems: itemsToLog.map(item => ({
                productName: item.product,
                baseName: item.baseName || item.product,
                size: item.size || "-",
                qty: item.qty,
                amount: item.amount
            })),
            deliveredBy: deliveryEmployee
        };

        setAllTransactions([newHistoryEntry, ...allTransactions]);
        setBillItems([]);
        setQuantity("");
        setTotalAmount("");
        setCompanyName("");
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setCustomerGstin("");
        setCustomerAddress("");
        setDeliveryEmployee("");
        setDeliveryMode("Door Delivery");
        setPaymentMode("Cash");
        setPaidStatus("Paid");
        setAmountPaid("");
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
                baseName: selectedBaseProduct,
                size: selectedSize,
                qty: parseFloat(quantity),
                amount: parseFloat(totalAmount) || 0
            });
        }

        if (itemsForBill.length === 0) {
            setFeedbackMessage("No items to generate bill");
            setTimeout(() => setFeedbackMessage(""), 3000);
            return;
        }

        const clientInfo = clients.find(c => c.companyName === companyName);

        const billData = {
            invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
            company: companyName,
            customer: customerName || clientInfo?.contactPerson || 'N/A',
            email: clientInfo?.email || 'N/A',
            phone: clientInfo?.phone || 'N/A',
            address: clientInfo?.address || 'N/A',
            gstin: clientInfo?.gst || 'N/A',
            date: formatDate(new Date()),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            items: itemsForBill.map(item => ({
                product: item.product,
                baseName: item.baseName || item.product,
                size: item.size || "-",
                qty: item.qty,
                amount: item.amount,
                rate: item.rate || (item.qty ? (item.amount / item.qty).toFixed(2) : 0)
            })),
            deliveredBy: deliveryEmployee,
            paymentMode: paymentMode,
            deliveryMode: deliveryMode
        };

        setSelectedBill(billData);
        setShowBillModal(true);
    };



    // View a transaction's bill details
    const handleViewBill = (transaction) => {
        const clientInfo = clients.find(c => c.companyName === transaction.company);

        const billData = {
            invoiceNo: `INV-${transaction.id.toString().slice(-6)}`,
            company: transaction.company,
            customer: transaction.customer || clientInfo?.contactPerson || 'N/A',
            email: clientInfo?.email || 'N/A',
            phone: clientInfo?.phone || 'N/A',
            address: clientInfo?.address || 'N/A',
            gstin: clientInfo?.gst || 'N/A',
            date: transaction.date.includes(',') ? transaction.date.split(',')[0] : transaction.date,
            time: transaction.date.includes(',') ? transaction.date.split(',').slice(1).join(',') : "",
            items: transaction.saleItems?.map(item => ({
                product: item.productName || item.product,
                baseName: item.baseName || item.productName || item.product,
                size: item.size || "-",
                qty: item.qty,
                amount: item.amount || transaction.amount,
                rate: item.qty ? ((item.amount || transaction.amount) / item.qty).toFixed(2) : 0
            })) || [{ 
                product: transaction.product, 
                baseName: transaction.product, 
                size: transaction.product.includes('"') ? (transaction.product.match(/\d+".*/) || ["—"])[0] : "—", 
                qty: Math.abs(transaction.quantity), 
                amount: transaction.amount,
                rate: transaction.quantity ? (transaction.amount / Math.abs(transaction.quantity)).toFixed(2) : 0
            }],
            totalAmount: transaction.amount,
            paymentMode: transaction.paymentStatus,
            deliveredBy: transaction.deliveredBy || '-'
        };

        setSelectedBill(billData);
        setShowBillModal(true);
    };

    // Delete a transaction from history
    const handleDeleteTransaction = (id) => {
        const updatedTransactions = allTransactions.filter(t => t.id !== id);
        setAllTransactions(updatedTransactions);
    };

    // ─── Shared: Capture HTML preview & Send to WhatsApp ──────────────────
    const sendInvoiceToWhatsApp = async (bill) => {
        // 1. Find the invoice HTML element
        const invoiceElement = document.getElementById('printable-bill');
        if (!invoiceElement) {
            alert('Invoice preview not found. Please try again.');
            return;
        }

        try {
            // 2. Screenshot the exact HTML using html2canvas
            const canvas = await html2canvas(invoiceElement, {
                scale: 2,          // 2x for high resolution
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                removeContainer: true
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // 3. Create a PDF exactly the same size as the captured content
            // Convert px to mm (96 dpi -> mm: px / 96 * 25.4)
            const pdfWidth  = (imgWidth  / (2 * 96)) * 25.4;
            const pdfHeight = (imgHeight / (2 * 96)) * 25.4;

            const doc = new jsPDF({
                orientation: pdfWidth > pdfHeight ? 'l' : 'p',
                unit: 'mm',
                format: [pdfWidth, pdfHeight],
                compress: true
            });

            doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], `Invoice_${bill.invoiceNo}.pdf`, { type: 'application/pdf' });

            // 4. WhatsApp message
            const welcomeMsg = `Welcome *${bill.customer}*,%0A%0AThank you for your business with *AVSECO INDUSTRIES*! 🌿%0A%0APlease find your invoice attached below.`;
            const phone = (bill.phone || "").replace(/\D/g, '');
            const waUrl = `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${welcomeMsg}`;

            // 5. Share on mobile or download + open WhatsApp on desktop
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                try {
                    await navigator.share({
                        files: [pdfFile],
                        title: `Invoice AVS-${bill.invoiceNo}`,
                        text: `Welcome ${bill.customer}, Thank you for your business with AVSECO INDUSTRIES!`
                    });
                } catch (err) {
                    doc.save(`Invoice_${bill.invoiceNo}.pdf`);
                    window.open(waUrl, '_blank');
                }
            } else {
                doc.save(`Invoice_${bill.invoiceNo}.pdf`);
                window.open(waUrl, '_blank');
            }
        } catch (err) {
            console.error('Invoice PDF generation failed:', err);
            alert('Could not generate PDF. Please try again.');
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



    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.base-product-dropdown')) {
                setIsBaseProductDropdownOpen(false);
            }
            if (!event.target.closest('.size-dropdown')) {
                setIsSizeDropdownOpen(false);
            }
            if (!event.target.closest('.client-dropdown')) {
                setIsClientDropdownOpen(false);
            }
            if (!event.target.closest('.employee-dropdown')) {
                setIsEmployeeDropdownOpen(false);
            }
            if (!event.target.closest('.payment-dropdown')) {
                setIsPaymentDropdownOpen(false);
            }
            if (!event.target.closest('.delivery-mode-dropdown')) {
                setIsDeliveryModeDropdownOpen(false);
            }
            if (!event.target.closest('.history-filter-dropdown')) {
                setIsHistoryFilterDropdownOpen(false);
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
            <div className={`desktop-view-section ${viewMode !== 'entry' ? 'mobile-hidden' : ''}`}>
                <div className="stock-table-container quick-entry-card">
                    <div className="table-header">
                        <h3 className="section-title">Customer Details</h3>
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
                                            <button className="clear-selection-btn" onClick={(e) => {
                                                e.stopPropagation();
                                                setCompanyName("");
                                                setCustomerName("");
                                                setCustomerEmail("");
                                                setCustomerPhone("");
                                                setCustomerGstin("");
                                                setCustomerAddress("");
                                            }}>
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
                                                                    setCustomerName(client.contactPerson || "");
                                                                    setCustomerEmail(client.email || "");
                                                                    setCustomerPhone(client.phone || "");
                                                                    setCustomerGstin(client.gst || "");
                                                                    setCustomerAddress(client.address || "");
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
                                <span className="quick-entry-label">Customer Name:</span>
                                <div style={{ width: '100%' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter customer name"
                                        className="quick-entry-input"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="quick-entry-item">
                                <span className="quick-entry-label">Email Address:</span>
                                <div style={{ width: '100%' }}>
                                    <input
                                        type="email"
                                        placeholder="Enter email address"
                                        className="quick-entry-input"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="quick-entry-row">
                            <div className="quick-entry-item">
                                <span className="quick-entry-label">Phone Number:</span>
                                <div style={{ width: '100%' }}>
                                    <input
                                        type="tel"
                                        placeholder="Enter phone number"
                                        className="quick-entry-input"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="quick-entry-item">
                                <span className="quick-entry-label">GSTIN:</span>
                                <div style={{ width: '100%' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter GSTIN Number"
                                        className="quick-entry-input"
                                        value={customerGstin}
                                        onChange={(e) => setCustomerGstin(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="quick-entry-item">
                                <span className="quick-entry-label">Address:</span>
                                <div style={{ width: '100%' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter complete address"
                                        className="quick-entry-input"
                                        value={customerAddress}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="table-header" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                        <h3 className="section-title">Billing Details</h3>
                    </div>
                    <div className="quick-entry-grid">
                        <div className="quick-entry-row">
                            <div className="quick-entry-item">
                                <span className="quick-entry-label">Product Name:</span>
                                <div className="product-dropdown base-product-dropdown">
                                    <button
                                        onClick={() => setIsBaseProductDropdownOpen(!isBaseProductDropdownOpen)}
                                        className="product-dropdown-toggle"
                                    >
                                        <span className="product-dropdown-text">{selectedBaseProduct}</span>
                                        <span className="material-symbols-outlined product-dropdown-arrow">
                                            {isBaseProductDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                                        </span>
                                    </button>
                                    {isBaseProductDropdownOpen && (
                                        <div className="product-dropdown-menu">
                                            {[...new Set(products.map(p => p.baseName))].map((baseName) => (
                                                <button
                                                    key={baseName}
                                                    onClick={() => {
                                                        setSelectedBaseProduct(baseName);
                                                        setIsBaseProductDropdownOpen(false);
                                                    }}
                                                    className={`product-dropdown-item ${selectedBaseProduct === baseName ? 'active' : ''}`}
                                                >
                                                    <span className="product-name-text">{baseName}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="quick-entry-item">
                                <span className="quick-entry-label">Size/Variant:</span>
                                <div className="product-dropdown size-dropdown">
                                    <button
                                        onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                                        className="product-dropdown-toggle"
                                    >
                                        <span className="product-dropdown-text">{selectedSize}</span>
                                        <span className="material-symbols-outlined product-dropdown-arrow">
                                            {isSizeDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                                        </span>
                                    </button>
                                    {isSizeDropdownOpen && (
                                        <div className="product-dropdown-menu">
                                            {products.filter(p => p.baseName === selectedBaseProduct).map((product) => (
                                                <button
                                                    key={product.size}
                                                    onClick={() => {
                                                        setSelectedSize(product.size);
                                                        setIsSizeDropdownOpen(false);
                                                    }}
                                                    className={`product-dropdown-item ${selectedSize === product.size ? 'active' : ''}`}
                                                >
                                                    <span className="product-name-text">{product.size}</span>
                                                    <span className="product-sku-category">{product.sku}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="quick-entry-item">
                                <span className="quick-entry-label">Total Pieces:</span>
                                <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="quick-entry-input flex-1"
                                        style={{ flex: 1, minWidth: 0 }}
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                    />
                                    <button
                                        className="btn-outline quick-entry-btn add-btn-colored mobile-only-add-btn"
                                        onClick={handleAddItem}
                                        title="Add Item"
                                    >
                                        <span className="material-symbols-outlined">add_circle</span>
                                    </button>
                                </div>
                            </div>

                            <div className="quick-entry-item">
                                <span className="quick-entry-label">Rate Per Piece:</span>
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
                        </div>

                        <div className="quick-entry-row">
                            <div className="quick-entry-item">
                                <span className="quick-entry-label">Total Bill Amount:</span>
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

                            <div className="quick-entry-item">
                                <span className="quick-entry-label">Delivery Mode:</span>
                                <div className="product-dropdown delivery-mode-dropdown">
                                    <button
                                        onClick={() => setIsDeliveryModeDropdownOpen(!isDeliveryModeDropdownOpen)}
                                        className="product-dropdown-toggle"
                                    >
                                        <span className="product-dropdown-text">{deliveryMode}</span>
                                        <span className="material-symbols-outlined product-dropdown-arrow">
                                            {isDeliveryModeDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                                        </span>
                                    </button>
                                    {isDeliveryModeDropdownOpen && (
                                        <div className="product-dropdown-menu">
                                            {['Door Delivery', 'Self Pickup'].map(mode => (
                                                <button
                                                    key={mode}
                                                    className={`product-dropdown-item ${deliveryMode === mode ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setDeliveryMode(mode);
                                                        setIsDeliveryModeDropdownOpen(false);
                                                    }}
                                                >
                                                    <span className="product-name-text">{mode}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="quick-entry-item">
                                <span className={`quick-entry-label ${deliveryMode !== 'Door Delivery' ? 'disabled-label' : ''}`} style={deliveryMode !== 'Door Delivery' ? { opacity: 0.5 } : {}}>Delivered By:</span>
                                <div className={`product-dropdown employee-dropdown ${deliveryMode !== 'Door Delivery' ? 'disabled-dropdown' : ''}`} style={deliveryMode !== 'Door Delivery' ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                                    <div className="dropdown-input-wrapper">
                                        <button
                                            onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                                            className="product-dropdown-toggle"
                                            disabled={deliveryMode !== 'Door Delivery'}
                                        >
                                            <span className="product-dropdown-text">{deliveryEmployee || "Select Employee"}</span>
                                            <span className="material-symbols-outlined product-dropdown-arrow">
                                                {isEmployeeDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                                            </span>
                                        </button>
                                        {deliveryEmployee && deliveryMode === 'Door Delivery' && (
                                            <button className="clear-selection-btn" onClick={(e) => { e.stopPropagation(); setDeliveryEmployee(""); }}>
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        )}
                                    </div>
                                    {isEmployeeDropdownOpen && deliveryMode === 'Door Delivery' && (
                                        <div className="product-dropdown-menu">
                                            <div className="dropdown-search-wrapper">
                                                <input
                                                    type="text"
                                                    placeholder="Search employees..."
                                                    className="dropdown-search-input"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => setDeliveryEmployee(e.target.value)}
                                                />
                                            </div>
                                            {employees.filter(emp =>
                                                emp.name.toLowerCase().includes((deliveryEmployee || "").toLowerCase())
                                            ).length > 0 ? (
                                                employees
                                                    .filter(emp => emp.name.toLowerCase().includes((deliveryEmployee || "").toLowerCase()))
                                                    .map((emp) => (
                                                        <button
                                                            key={emp.id}
                                                            onClick={() => {
                                                                setDeliveryEmployee(emp.name);
                                                                setIsEmployeeDropdownOpen(false);
                                                            }}
                                                            className={`product-dropdown-item ${deliveryEmployee === emp.name ? 'active' : ''}`}
                                                        >
                                                            <span className="product-name-text">{emp.name}</span>
                                                            <span className="product-sku-category">{emp.department}</span>
                                                        </button>
                                                    ))
                                            ) : (
                                                <div className="no-clients-found">No employees matching "{deliveryEmployee}"</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="quick-entry-row">
                            <div className="quick-entry-item">
                                <span className="quick-entry-label">Payment Status:</span>
                                <div className="product-dropdown payment-dropdown">
                                    <button
                                        onClick={() => setIsPaidStatusDropdownOpen(!isPaidStatusDropdownOpen)}
                                        className="product-dropdown-toggle"
                                    >
                                        <span className="product-dropdown-text">{paidStatus}</span>
                                        <span className="material-symbols-outlined product-dropdown-arrow">
                                            {isPaidStatusDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                                        </span>
                                    </button>
                                    {isPaidStatusDropdownOpen && (
                                        <div className="product-dropdown-menu">
                                            {['Paid', 'Unpaid', 'Advance', 'Pending'].map(status => (
                                                <button
                                                    key={status}
                                                    className={`product-dropdown-item ${paidStatus === status ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setPaidStatus(status);
                                                        setIsPaidStatusDropdownOpen(false);
                                                    }}
                                                >
                                                    <span className="product-name-text">{status}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="quick-entry-item">
                                <span className={`quick-entry-label ${paidStatus === 'Unpaid' ? 'disabled-label' : ''}`} style={paidStatus === 'Unpaid' ? { opacity: 0.5 } : {}}>Payment Mode:</span>
                                <div className={`product-dropdown payment-dropdown ${paidStatus === 'Unpaid' ? 'disabled-dropdown' : ''}`} style={paidStatus === 'Unpaid' ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                                    <button
                                        onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
                                        className="product-dropdown-toggle"
                                        disabled={paidStatus === 'Unpaid'}
                                    >
                                        <span className="product-dropdown-text">{paidStatus === 'Unpaid' ? "N/A" : paymentMode}</span>
                                        <span className="material-symbols-outlined product-dropdown-arrow">
                                            {isPaymentDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                                        </span>
                                    </button>
                                    {isPaymentDropdownOpen && paidStatus !== 'Unpaid' && (
                                        <div className="product-dropdown-menu">
                                            {['UPI', 'Cash', 'Card'].map(mode => (
                                                <button
                                                    key={mode}
                                                    className={`product-dropdown-item ${paymentMode === mode ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setPaymentMode(mode);
                                                        setIsPaymentDropdownOpen(false);
                                                    }}
                                                >
                                                    <span className="product-name-text">{mode}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(paidStatus === 'Pending' || paidStatus === 'Advance') ? (
                                <div className="quick-entry-item">
                                    <span className="quick-entry-label">Amount Paid:</span>
                                    <div className="amount-input-wrapper">
                                        <span className="currency-prefix">₹</span>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className="quick-entry-input amount-input"
                                            value={amountPaid}
                                            onChange={(e) => setAmountPaid(e.target.value)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="quick-entry-item" style={{ visibility: 'hidden' }}></div>
                            )}
                        </div>
                    </div>

                    <div className="quick-entry-footer">
                        <div className="quick-entry-action-group">
                            <button
                                className="btn-outline quick-entry-btn add-btn-colored add-btn-pc"
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
                                {isLogging ? "SAVING..." : "SAVE ENTRY"}
                            </button>
                        </div>
                        <div className="history-view-trigger">
                            <button className="view-history-btn" onClick={() => setViewMode('history')}>
                                <span className="material-symbols-outlined">history</span>
                                View Recent Sales History
                            </button>
                        </div>
                    </div>

                    {billItems.length > 0 && (
                        <div className="bill-preview-section" style={{ marginTop: '24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', padding: 0 }}>
                            <div className="preview-header" style={{ padding: '16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                                <span style={{ fontWeight: 600, color: '#334155' }}>Items in Current Bill ({billItems.length})</span>
                                <button className="clear-bill" onClick={() => setBillItems([])} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>Clear All</button>
                            </div>
                            <div className="preview-table-container" style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
                                    <thead>
                                        <tr style={{ background: '#fefefe', borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px 16px', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', width: '35%' }}>PRODUCT NAME</th>
                                            <th style={{ padding: '12px 16px', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', width: '25%' }}>SIZE</th>
                                            <th style={{ padding: '12px 16px', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '15%' }}>QTY</th>
                                            <th style={{ padding: '12px 16px', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: '15%' }}>TOTAL</th>
                                            <th style={{ padding: '12px 16px', width: '10%', textAlign: 'center' }}>ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billItems.map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '16px', color: '#1e293b', fontSize: '0.9rem', textAlign: 'left' }}>{item.baseName}</td>
                                                <td style={{ padding: '16px', color: '#334155', fontSize: '0.9rem', textAlign: 'left' }}>{item.size}</td>
                                                <td style={{ padding: '16px', color: '#334155', fontSize: '0.9rem', textAlign: 'right' }}>{item.qty}</td>
                                                <td style={{ padding: '16px', color: '#1e293b', fontWeight: 500, fontSize: '0.9rem', textAlign: 'right' }}>₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => setBillItems(billItems.filter(i => i.id !== item.id))}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '4px', margin: '0 auto' }}
                                                        title="Remove Item"
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <td colSpan="3" style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>SUBTOTAL</td>
                                            <td style={{ padding: '16px', fontWeight: 700, color: '#10b981', fontSize: '1.1rem', textAlign: 'right' }}>
                                                ₹{billItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={`desktop-view-section ${viewMode !== 'history' ? 'mobile-hidden' : ''}`}>
                <div className="history-section-wrapper">
                    <div className="history-header-actions">
                        <button className="back-to-entry-btn" onClick={() => setViewMode('entry')}>
                            <span className="material-symbols-outlined">arrow_back</span>
                            Back to Sales Entry
                        </button>
                    </div>

                    <div className="history-filters-wrapper">
                        <div className="history-filters-header">
                            <h3 className="section-title">Recent Sales History</h3>
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
                                <div className="product-dropdown history-filter-dropdown">
                                    <button
                                        onClick={() => setIsHistoryFilterDropdownOpen(!isHistoryFilterDropdownOpen)}
                                        className="product-dropdown-toggle filter-dropdown-toggle"
                                    >
                                        <span className="product-dropdown-text">
                                            {typeFilter === 'all' ? 'All Modes' : typeFilter.toUpperCase()}
                                        </span>
                                        <div className="filter-controls-inside">
                                            {typeFilter !== 'all' && (
                                                <span
                                                    className="material-symbols-outlined clear-filter-inside"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTypeFilter('all');
                                                    }}
                                                >
                                                    close
                                                </span>
                                            )}
                                            <span className="material-symbols-outlined product-dropdown-arrow">
                                                {isHistoryFilterDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                                            </span>
                                        </div>
                                    </button>
                                    {isHistoryFilterDropdownOpen && (
                                        <div className="product-dropdown-menu">
                                            {['all', 'upi', 'cash', 'card'].map((mode) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => {
                                                        setTypeFilter(mode);
                                                        setIsHistoryFilterDropdownOpen(false);
                                                    }}
                                                    className={`product-dropdown-item ${typeFilter === mode ? 'active' : ''}`}
                                                >
                                                    <span className="product-name-text">
                                                        {mode === 'all' ? 'All Modes' : mode.toUpperCase()}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="stock-table-container">
                        <div className="table-responsive desktop-only-table">
                            <table className="stock-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>DATE</th>
                                        <th style={{ textAlign: 'left' }}>COMPANY</th>
                                        <th className="hide-mobile" style={{ textAlign: 'left' }}>CUSTOMER NAME</th>
                                        <th className="hide-mobile" style={{ textAlign: 'left' }}>PRODUCT</th>
                                        <th className="hide-mobile" style={{ textAlign: 'right' }}>PIECES</th>
                                        <th className="hide-mobile" style={{ textAlign: 'right' }}>AMOUNT</th>
                                        <th className="hide-mobile" style={{ textAlign: 'left' }}>PAYMENT</th>
                                        <th className="hide-mobile" style={{ textAlign: 'left' }}>DELIVERED BY</th>
                                        <th className="text-center">DELETE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.length > 0 ? (
                                        filteredTransactions.map((transaction) => (
                                            <tr key={transaction.id}>
                                                <td>
                                                    {(() => {
                                                        const parts = transaction.date?.split(', ') || [transaction.date || ''];
                                                        const datePart = parts.slice(0, 2).join(', ');
                                                        const timePart = parts.slice(2).join(', ');
                                                        return (
                                                            <>
                                                                {datePart}
                                                                {timePart && <span className="hide-mobile">, {timePart}</span>}
                                                            </>
                                                        );
                                                    })()}
                                                </td>
                                                <td onClick={() => handleViewBill(transaction)} style={{ cursor: 'pointer' }}>
                                                    <span className="company-text clickable-company">{transaction.company || '-'}</span>
                                                </td>
                                                <td className="hide-mobile">
                                                    <span className="customer-text">{transaction.customer || '-'}</span>
                                                </td>
                                                <td className="hide-mobile">
                                                    <div className="product-info">
                                                        <span className="product-name">{transaction.product}</span>
                                                    </div>
                                                </td>
                                                <td className="quantity-cell hide-mobile" style={{ textAlign: 'right' }}>
                                                    {Math.abs(transaction.quantity)}
                                                </td>
                                                <td className="amount-cell hide-mobile" style={{ textAlign: 'right' }}>
                                                    ₹{transaction.amount?.toLocaleString() || '0'}
                                                </td>
                                                <td className="hide-mobile">
                                                    <span className={`payment-badge ${transaction.paymentStatus?.toLowerCase()}`}>
                                                        {transaction.paymentStatus || 'Unpaid'}
                                                    </span>
                                                </td>
                                                <td className="hide-mobile">
                                                    <div className="delivery-info">
                                                        <span className="delivery-person">{transaction.deliveredBy || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <button
                                                        className="icon-action-btn delete"
                                                        onClick={() => handleDeleteTransaction(transaction.id)}
                                                        title="Delete Record"
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="10" className="no-data">
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

                        {/* Mobile History Cards */}
                        <div className="mobile-history-cards">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((transaction) => (
                                    <div key={transaction.id} className="mobile-sale-card" onClick={() => handleViewBill(transaction)}>
                                        <div className="sale-card-header">
                                            <div className="sale-date">
                                                <span className="material-symbols-outlined">calendar_today</span>
                                                {transaction.date?.split(', ')[0]}
                                            </div>
                                            <span className={`payment-badge ${transaction.paymentStatus?.toLowerCase()}`}>
                                                {transaction.paymentStatus}
                                            </span>
                                        </div>
                                        <div className="sale-card-body">
                                            <div className="company-info">
                                                <h4 className="sale-company">{transaction.company || 'Direct Sale'}</h4>
                                                <p className="sale-customer">{transaction.customer || 'No Customer'}</p>
                                            </div>
                                            <div className="sale-details-grid">
                                                <div className="detail-item">
                                                    <span className="detail-label">AMOUNT</span>
                                                    <span className="detail-value amount">₹{transaction.amount?.toLocaleString()}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">QUANTITY</span>
                                                    <span className="detail-value">{Math.abs(transaction.quantity)} Pcs</span>
                                                </div>
                                            </div>
                                            <div className="sale-product-line">
                                                <span className="material-symbols-outlined">inventory_2</span>
                                                {transaction.product}
                                            </div>
                                        </div>
                                        <div className="sale-card-actions" onClick={(e) => e.stopPropagation()}>
                                            <button className="sale-action-btn delete" onClick={() => handleDeleteTransaction(transaction.id)}>
                                                <span className="material-symbols-outlined">delete</span>
                                                Delete
                                            </button>
                                            <button className="sale-action-btn view" onClick={() => handleViewBill(transaction)}>
                                                <span className="material-symbols-outlined">receipt_long</span>
                                                Bill
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-data-mobile">
                                    <span className="material-symbols-outlined">search_off</span>
                                    <p>No sales records found</p>
                                </div>
                            )}
                        </div>

                        <div className="table-footer">
                            <div className="pagination-info">
                                Showing {filteredTransactions.length} of {allTransactions.length} sales records
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {
                showExportModal && (
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
                <div 
                    className="bill-modal-overlay" 
                    onClick={() => setShowBillModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '40px 20px',
                        zIndex: 3000,
                        overflowY: 'auto',
                        backdropFilter: 'blur(6px)',
                        cursor: 'pointer'
                    }}
                >
                    <div 
                        className="bill-modal-content" 
                        id="printable-bill" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                            padding: '0', 
                            background: '#ffffff', 
                            maxWidth: '860px', 
                            width: '100%',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
                            border: 'none',
                            borderRadius: '4px',
                            position: 'relative',
                            cursor: 'default',
                            marginBottom: '40px'
                        }}
                    >
                        {/* Google Fonts */}
                        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
                        <style>{`
                            @media print {
                                .no-print, .sidebar, .topbar, .navbar, .top-nav, .bill-modal-overlay > *:not(#printable-bill) { display: none !important; }
                                body, html { margin: 0; padding: 0; background: #fff; height: auto; }
                                .bill-modal-overlay {
                                    position: relative !important;
                                    background: none !important;
                                    padding: 0 !important;
                                    display: block !important;
                                }
                                #printable-bill { 
                                    position: absolute; 
                                    left: 0; 
                                    top: 0; 
                                    width: 100%; 
                                    max-width: 100% !important;
                                    margin: 0 !important; 
                                    padding: 0 !important;
                                    box-shadow: none !important;
                                    visibility: visible !important;
                                }
                                body * { visibility: hidden; }
                                #printable-bill, #printable-bill * { visibility: visible; }
                                .ci-tbl-head tr, .ci-total-row { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                                .ci-footer { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                                @page { margin: 0; }
                            }
                            #printable-bill { font-family: 'Inter', sans-serif; background: #fff; color: #1a1a1a; margin-bottom: 20px; }
                            #printable-bill * { box-sizing: border-box; }

                            /* ── Header ── */
                            .ci-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 32px 40px 20px; border-bottom: 2px solid #1a6b3c; }
                            .ci-logo-area { display: flex; align-items: flex-start; gap: 14px; }
                            .ci-logo-img { width: 72px; height: 72px; object-fit: contain; }
                            .ci-company-name { font-size: 22px; font-weight: 900; color: #1a6b3c; letter-spacing: 0.02em; margin-bottom: 4px; }
                            .ci-company-addr { font-size: 11px; color: #333; line-height: 1.6; font-weight: 500; }
                            .ci-invoice-block { text-align: right; }
                            .ci-invoice-title { font-size: 40px; font-weight: 900; color: #1a6b3c; line-height: 1; }
                            .ci-invoice-meta { font-size: 12px; color: #333; margin-top: 8px; line-height: 1.8; font-weight: 600; }
                            .ci-invoice-meta span { color: #111; font-weight: 700; }

                            /* ── Bill To ── */
                            .ci-billto { padding: 18px 40px; border-bottom: 2px solid #1a6b3c; display: flex; gap: 60px; align-items: flex-start; }
                            .ci-billto-title { font-size: 16px; font-weight: 800; color: #1a6b3c; margin-bottom: 10px; }
                            .ci-billto-row { font-size: 12px; color: #333; line-height: 1.9; font-weight: 600; }
                            .ci-billto-row b { min-width: 130px; display: inline-block; }
                            .ci-addr-block { font-size: 12px; color: #333; font-weight: 600; line-height: 1.7; }

                            /* ── Billing Details ── */
                            .ci-section-title { font-size: 22px; font-weight: 800; color: #1a6b3c; padding: 18px 40px 10px; }

                            /* ── Table ── */
                            .ci-table-wrap { padding: 0 40px; }
                            .ci-table { width: 100%; border-collapse: collapse; border: 1.5px solid #1a6b3c; }
                            .ci-tbl-head tr { background: #1a6b3c; }
                            .ci-tbl-head th { padding: 11px 12px; font-size: 10.5px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.1em; text-align: left; border-right: 1px solid rgba(255,255,255,0.2); }
                            .ci-tbl-head th:last-child { border-right: none; }
                            .ci-tbody td { padding: 10px 12px; font-size: 12.5px; color: #333; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
                            .ci-tbody td:last-child { border-right: none; }
                            .ci-tbody tr:last-child td { border-bottom: none; }

                            /* ── Summary ── */
                            .ci-summary { display: flex; justify-content: flex-end; padding: 0 40px; margin-top: 0; }
                            .ci-summary-box { width: 280px; border: 1.5px solid #1a6b3c; border-top: none; }
                            .ci-sum-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 12.5px; border-bottom: 1px solid #e2e8f0; }
                            .ci-total-row { background: #1a6b3c; color: #fff; display: flex; justify-content: space-between; padding: 11px 14px; font-size: 14px; font-weight: 900; }

                            /* ── Payment Info ── */
                            .ci-payment { display: grid; grid-template-columns: 1fr 1fr; gap: 0; padding: 20px 40px 10px; border-top: 2px solid #1a6b3c; margin-top: 24px; }
                            .ci-pay-title { font-size: 13px; font-weight: 800; color: #1a6b3c; margin-bottom: 8px; }
                            .ci-pay-row { font-size: 12px; font-weight: 700; color: #333; margin-bottom: 5px; }

                            /* ── Footer ── */
                            .ci-footer { border-top: 2px solid #1a6b3c; margin-top: 20px; padding: 14px 40px; text-align: center; font-size: 12px; color: #333; font-weight: 500; font-style: italic; }
                        `}</style>

                        {/* ══════════════════════════════════════════
                             EXACT CANVA INVOICE DESIGN
                        ══════════════════════════════════════════ */}

                        {/* ── TOP HEADER: Logo + Company | INVOICE ── */}
                        <div className="ci-header">
                            <div className="ci-logo-area">
                                <img src={logo} alt="AVS ECO Logo" className="ci-logo-img" />
                                <div>
                                    <div className="ci-company-name">AVSECO INDUSTRIES</div>
                                    <div className="ci-company-addr">
                                        No.3/44, Middle Street,<br />
                                        Veeraragavapuram Village &amp; Post<br />
                                        Thiruvalangadu, Tiruttani (Tk),<br />
                                        Thiruvallur (Dt) - 631210
                                    </div>
                                </div>
                            </div>
                            <div className="ci-invoice-block">
                                <div className="ci-invoice-title">INVOICE</div>
                                <div className="ci-invoice-meta">
                                    <div><b>Invoice Number :</b> <span>AVS-{selectedBill.invoiceNo}</span></div>
                                    <div><b>Date :</b> <span>{selectedBill.date}</span></div>
                                    <div><b>Time :</b> <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* ── BILL TO ── */}
                        <div className="ci-billto">
                            <div style={{ flex: 1 }}>
                                <div className="ci-billto-title">BILL TO:</div>
                                <div className="ci-billto-row"><b>Company Name :</b> {selectedBill.company || 'N/A'}</div>
                                <div className="ci-billto-row"><b>Contact Person :</b> {selectedBill.customer || 'N/A'}</div>
                                <div className="ci-billto-row"><b>Email Address &nbsp; :</b> {selectedBill.email || 'N/A'}</div>
                                <div className="ci-billto-row"><b>Phone Number :</b> {selectedBill.phone || 'N/A'}</div>
                                <div className="ci-billto-row"><b>GSTIN &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</b> {selectedBill.gstin || 'N/A'}</div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ height: '28px' }}></div>
                                <div className="ci-addr-block">
                                    <b>Address :</b> {selectedBill.address || 'N/A'}
                                </div>
                            </div>
                        </div>

                        {/* ── BILLING DETAILS ── */}
                        <div className="ci-section-title">Billing Details</div>

                        {/* ── TABLE ── */}
                        <div className="ci-table-wrap">
                            <table className="ci-table">
                                <thead className="ci-tbl-head">
                                    <tr>
                                        <th style={{ width: '6%' }}>Item</th>
                                        <th style={{ width: '36%' }}>Product Name</th>
                                        <th style={{ width: '12%' }}>Size</th>
                                        <th style={{ width: '13%' }}>Pieces</th>
                                        <th style={{ width: '15%' }}>Rate</th>
                                        <th style={{ width: '18%' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="ci-tbody">
                                    {selectedBill.items.map((item, idx) => {
                                        const amt = parseFloat(item.amount) || 0;
                                        const qty = parseFloat(item.qty) || 1;
                                        const rate = qty > 0 ? amt / qty : amt;
                                        return (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: '600', color: '#555' }}>{idx + 1}.</td>
                                                <td style={{ fontWeight: '600' }}>{item.baseName || item.product}</td>
                                                <td>{item.size || '—'}</td>
                                                <td>{item.qty}</td>
                                                <td>₹{rate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                                <td style={{ fontWeight: '700' }}>₹{amt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* ── SUMMARY ── */}
                        {(() => {
                            const subtotal = selectedBill.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
                            const tax = 0;
                            const total = subtotal + tax;
                            return (
                                <div className="ci-summary">
                                    <div className="ci-summary-box">
                                        <div className="ci-sum-row">
                                            <span style={{ color: '#555' }}>Sub Total:</span>
                                            <span style={{ fontWeight: '700' }}>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="ci-sum-row">
                                            <span style={{ color: '#555' }}>Sales Tax:</span>
                                            <span style={{ fontWeight: '700' }}>₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="ci-total-row">
                                            <span>TOTAL:</span>
                                            <span>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ── PAYMENT INFORMATION ── */}
                        <div className="ci-payment">
                            <div>
                                <div className="ci-pay-title">PAYMENT INFORMATION:</div>
                                <div className="ci-pay-row">Payment Status: <span style={{ color: paidStatus === 'Paid' ? '#15803d' : '#dc2626', fontWeight: '800' }}>{paidStatus}</span></div>
                                <div className="ci-pay-row">Payment Mode: <span>{selectedBill.paymentMode || 'N/A'}</span></div>
                            </div>
                            <div>
                                <div className="ci-pay-title">DELIVERY INFORMATION:</div>
                                <div className="ci-pay-row">Delivery Mode: <span>{selectedBill.deliveryMode || 'N/A'}</span></div>
                                <div className="ci-pay-row">Delivered By: <span>{selectedBill.deliveredBy || 'N/A'}</span></div>
                            </div>
                        </div>

                        {/* ── FOOTER ── */}
                        <div className="ci-footer">
                            Thank you for joining the green revolution with AVS ECO INDUSTRIES—together, let's sustain nature, one plate at a time
                        </div>

                        {/* ── ACTION BUTTONS (screen only) ── */}
                        <div className="no-print" style={{
                            padding: '16px 40px', background: '#f8fafc',
                            borderTop: '1px solid #e2e8f0', display: 'flex',
                            justifyContent: 'flex-end', gap: '12px'
                        }}>
                            <button onClick={() => setShowBillModal(false)} style={{
                                padding: '9px 24px', border: '1px solid #cbd5e1', background: 'white',
                                color: '#475569', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                                borderRadius: '6px', fontFamily: 'Inter, sans-serif'
                            }}>Close</button>
                            
                            <button 
                                onClick={() => sendInvoiceToWhatsApp(selectedBill, paidStatus)}
                                style={{
                                    padding: '9px 24px', border: 'none', background: '#25D366',
                                    color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                    borderRadius: '6px', boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
                                    fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>share</span>
                                Send to WhatsApp
                            </button>

                            <button onClick={() => window.print()} style={{
                                padding: '9px 28px', border: 'none', background: '#1a6b3c',
                                color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                borderRadius: '6px', boxShadow: '0 4px 12px rgba(26,107,60,0.3)',
                                fontFamily: 'Inter, sans-serif'
                            }}>🖨️ Print Invoice</button>
                        </div>
                    </div>
                </div>
            )}



            {
                showAddClientModal && (
                    <div className="modal-overlay">
                        <div className="modal-content quick-add-client-modal" style={{ maxWidth: '450px' }}>
                            <div className="modal-header">
                                <h3 className="section-title">Add New Client</h3>
                                <button className="modal-close" onClick={() => setShowAddClientModal(false)}>
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="modal-form-group">
                                    <label>COMPANY NAME *</label>
                                    <input
                                        type="text"
                                        className="modal-input"
                                        placeholder="Enter company name"
                                        value={newClientData.companyName}
                                        onChange={(e) => setNewClientData({ ...newClientData, companyName: e.target.value })}
                                    />
                                </div>

                                <div className="modal-form-group">
                                    <label>CONTACT PERSON *</label>
                                    <input
                                        type="text"
                                        className="modal-input"
                                        placeholder="Enter contact person"
                                        value={newClientData.contactPerson}
                                        onChange={(e) => setNewClientData({ ...newClientData, contactPerson: e.target.value })}
                                    />
                                </div>
                                <div className="modal-row">
                                    <div className="modal-form-group">
                                        <label>EMAIL ADDRESS *</label>
                                        <input
                                            type="email"
                                            className="modal-input"
                                            placeholder="Enter email address"
                                            value={newClientData.email}
                                            onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>PHONE NUMBER</label>
                                        <input
                                            type="tel"
                                            className="modal-input"
                                            placeholder="Enter phone number"
                                            value={newClientData.phone}
                                            onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-form-group">
                                    <label>GSTIN</label>
                                    <input
                                        type="text"
                                        className="modal-input"
                                        placeholder="Enter GSTIN Number (optional)"
                                        value={newClientData.gst}
                                        onChange={(e) => setNewClientData({ ...newClientData, gst: e.target.value })}
                                    />
                                </div>
                                <div className="modal-form-group" style={{ marginBottom: 0 }}>
                                    <label>ADDRESS</label>
                                    <textarea
                                        className="modal-textarea"
                                        placeholder="Enter complete address"
                                        rows="3"
                                        value={newClientData.address}
                                        onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="modal-cancel" onClick={() => setShowAddClientModal(false)}>Cancel</button>
                                <button
                                    className="modal-confirm"
                                    disabled={!newClientData.companyName || !newClientData.contactPerson || !newClientData.email}
                                    onClick={() => {
                                        const newClient = {
                                            ...newClientData,
                                            totalOrders: 0,
                                            totalSpent: "₹0",
                                            lastOrder: "Never",
                                        };
                                        addClient(newClient);
                                        setCompanyName(newClientData.companyName);
                                        setCustomerName(newClientData.contactPerson);
                                        setShowAddClientModal(false);
                                        // Reset form
                                        setNewClientData({
                                            companyName: "",
                                            contactPerson: "",
                                            email: "",
                                            phone: "",
                                            address: "",
                                            gst: ""
                                        });
                                    }}
                                >
                                    Add Client
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Sales;
