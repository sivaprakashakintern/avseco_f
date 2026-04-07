import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import './Sales.css';




const Sales = () => {
    const {
        clients, addClient, employees, products: dbProducts, stockData,
        salesHistory, addSale, updateSale
    } = useAppContext();
    const { user, isAdmin } = useAuth();

    // Helper: Format date for display (Moved up to avoid initialization error)
    // Helper: Format date for display (Standardized to avoid split conflicts)
    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const formatPhone = (value) => {
        if (!value.startsWith("+91 ")) {
            value = "+91 " + value.replace(/^\+91\s*/, "");
        }
        const digits = value.slice(4).replace(/\D/g, "").slice(0, 10);
        return "+91 " + digits;
    };

    // Process products into unique base names and their variants
    const products = React.useMemo(() => {
        const processed = (dbProducts || []).map(p => {
            const stockItem = stockData?.find(s =>
                (s.name || "").toLowerCase().trim() === (p.name || "").toLowerCase().trim() &&
                (s.size || "").toLowerCase().trim() === (p.size || "").toLowerCase().trim()
            );
            return {
                ...p,
                baseName: p.name,
                price: p.sellPrice || 0,
                stock: stockItem ? stockItem.quantity : 0
            };
        });

        // Return only products that have stock (as requested by user previously)
        return processed.filter(p => p.stock > 0);
    }, [dbProducts, stockData]);
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [newClientData, setNewClientData] = useState({
        clientType: "Company",
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "+91 ",
        address: "",
        gst: ""
    });

    const [exportSuccess, setExportSuccess] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState('excel');
    const [exportType, setExportType] = useState('all'); // all, upi, cash, card

    const [viewMode] = useState('entry'); // 'entry' or 'history'
    const [editingTransactionId, setEditingTransactionId] = useState(null);
    const [selectedBaseProduct, setSelectedBaseProduct] = useState("");

    // Auto-select first product to streamline entry
    useEffect(() => {
        if (products.length > 0 && !selectedBaseProduct && !editingTransactionId) {
            setSelectedBaseProduct(products[0].baseName);
        }
    }, [products, selectedBaseProduct, editingTransactionId]);

    const [isBaseProductDropdownOpen, setIsBaseProductDropdownOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState("");
    const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);

    const [quantity, setQuantity] = useState("");
    const [unitPrice, setUnitPrice] = useState("");
    const [, setTotalAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [companyName, setCompanyName] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("+91 ");
    const [customerGstin, setCustomerGstin] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const [deliveryEmployee, setDeliveryEmployee] = useState("");
    const [soldBy, setSoldBy] = useState(user?.name || "");
    const [clientType, setClientType] = useState("Company"); // Company or Individual
    const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);

    // Auto-fill Sold By for non-admin employees
    useEffect(() => {
        if (!isAdmin && user && !soldBy && !editingTransactionId) {
            setSoldBy(user.name);
        }
    }, [user, isAdmin, soldBy, editingTransactionId]);

    const [isSoldByDropdownOpen, setIsSoldByDropdownOpen] = useState(false);
    const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
    const [paidStatus, setPaidStatus] = useState("Paid");
    const [isPaidStatusDropdownOpen, setIsPaidStatusDropdownOpen] = useState(false);
    const [amountPaid, setAmountPaid] = useState("");
    const [deliveryMode, setDeliveryMode] = useState("Door Delivery");
    const [isDeliveryModeDropdownOpen, setIsDeliveryModeDropdownOpen] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [billItems, setBillItems] = useState([]);
    const [exportLoading, setExportLoading] = useState(false);

    // Keyboard navigation focus refs
    const itemRefs = {
        quantity: React.useRef(null),
        unitPrice: React.useRef(null),
        customerPhone: React.useRef(null),
        customerName: React.useRef(null),
        companySearch: React.useRef(null)
    };


    // Filtered employees for delivery
    const deliveryEmployees = React.useMemo(() => {
        return (employees || []).filter(emp =>
            emp.department?.toLowerCase().includes("delivery") ||
            emp.department?.toLowerCase().includes("driver")
        );
    }, [employees]);

    // Filtered employees for sales
    const salesEmployees = React.useMemo(() => {
        return (employees || []).filter(emp =>
            emp.department?.toLowerCase().includes("sales") ||
            emp.department?.toLowerCase().includes("admin") ||
            emp.department?.toLowerCase().includes("office") ||
            emp.department?.toLowerCase().includes("ceo") ||
            emp.department?.toLowerCase().includes("hr")
        );
    }, [employees]);

    // Derived selected product
    const selectedProductObj = products.find(p => p.baseName === selectedBaseProduct && p.size === selectedSize);
    const selectedProduct = selectedProductObj?.name || "";
    const selectedProductId = selectedProductObj?.id || "";

    // Auto-select first available size when base product changes
    useEffect(() => {
        const availableSizes = products.filter(p => p.baseName === selectedBaseProduct).map(p => p.size);
        if (!availableSizes.includes(selectedSize) && availableSizes.length > 0) {
            setSelectedSize(availableSizes[0]);
        }
    }, [selectedBaseProduct, products, selectedSize]);

    // Initialize unit price when product variant (name + size) is selected
    useEffect(() => {
        if (selectedProductObj) {
            setUnitPrice(selectedProductObj.price.toString());
        }
    }, [selectedProductObj]);

    // Auto-calculate Total Amount when Quantity or Unit Price change
    useEffect(() => {
        if (quantity && unitPrice) {
            const calculatedAmount = (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2);
            setTotalAmount(calculatedAmount);
        } else {
            setTotalAmount("");
        }
    }, [quantity, unitPrice]);

    // Using salesHistory from AppContext
    const allTransactions = salesHistory;

    // Get filtered data for export based on type
    const getFilteredDataForExport = (type) => {
        if (type === 'all') return allTransactions;
        return allTransactions.filter(t => t.paymentStatus?.toLowerCase() === type.toLowerCase());
    };



    // Add item to current bill session - Merges duplicates if the same product is added
    const handleAddItem = () => {
        if (!quantity || parseFloat(quantity) <= 0) return;

        const qtyToAdd = parseFloat(quantity);
        const pricePerUnit = parseFloat(unitPrice) || 0;

        // Find available stock
        const stockItem = stockData?.find(s =>
            (s.name || "").toLowerCase().trim() === (selectedBaseProduct || "").toLowerCase().trim() &&
            (s.size || "").toLowerCase().trim() === (selectedSize || "").toLowerCase().trim()
        );
        const currentStock = stockItem ? stockItem.quantity : 0;

        // Find existing qty in bill for THIS SPECIFIC variant to ensure sum doesn't exceed stock
        const existingItemIndex = billItems.findIndex(item => item.productId === selectedProductId);
        const currentQtyInBill = existingItemIndex !== -1 ? billItems[existingItemIndex].qty : 0;

        if (currentQtyInBill + qtyToAdd > currentStock) {
            setFeedbackMessage(`Error: Only ${currentStock - currentQtyInBill} pieces left (You already have ${currentQtyInBill} in bill)`);
            setTimeout(() => setFeedbackMessage(""), 3000);
            return;
        }

        setBillItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => item.productId === selectedProductId);

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
                    productId: selectedProductId, // Use ID for unique identification
                    product: selectedProduct,
                    baseName: selectedBaseProduct,
                    size: selectedSize,
                    qty: qtyToAdd,
                    amount: (pricePerUnit * qtyToAdd) || 0,
                    unit: products.find(p => p.id === selectedProductId)?.unit || "pcs",
                    hsn: products.find(p => p.id === selectedProductId)?.hsnCode || "-"
                };
                return [...prevItems, newItem];
            }
        });

        setQuantity("");
        // Remove focus after adding item as per user request
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    };
    const handleKeyDown = (e, nextField = null) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextField && itemRefs[nextField]?.current) {
                itemRefs[nextField].current.focus();
            } else {
                handleAddItem();
            }
        }
    };

    const handleLogTransaction = useCallback(async () => {
        if (billItems.length === 0 && (!quantity || parseFloat(quantity) <= 0)) {
            return;
        }

        if (!customerPhone || !customerAddress) {
            setFeedbackMessage("Please enter Customer Phone and Address");
            setTimeout(() => setFeedbackMessage(""), 3000);
            return;
        }

        let itemsToLog = [...billItems];

        // If there's something currently entered but not "Added", include it
        if (quantity && parseFloat(quantity) > 0) {
            itemsToLog.push({
                product: selectedProduct,
                qty: parseFloat(quantity),
                amount: (parseFloat(unitPrice) * parseFloat(quantity)) || 0,
                unit: selectedProductObj?.unit || "pcs"
            });
        }

        const totalBillAmount = itemsToLog.reduce((sum, item) => sum + item.amount, 0);

        const payload = {
            invoiceNo: editingTransactionId ? (salesHistory.find(s => s.id === editingTransactionId)?.invoiceNo || `INV-${Date.now().toString().slice(-6)}`) : `INV-${Date.now().toString().slice(-6)}`,
            date: formatDate(new Date()) + ", " + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
            customer: customerName,
            company: companyName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            customerGstin: customerGstin,
            customerAddress: customerAddress,
            totalAmount: totalBillAmount,
            paidStatus: paidStatus,
            paymentMode: paymentMode,
            amountPaid: Number(amountPaid || 0),
            deliveryMode: deliveryMode,
            deliveredBy: deliveryEmployee,
            soldBy: soldBy,
            saleItems: itemsToLog.map(item => ({
                productName: item.product,
                baseName: item.baseName || item.product,
                size: item.size || "-",
                qty: item.qty,
                amount: item.amount,
                unit: item.unit || "pcs",
                hsn: item.hsn
            }))
        };

        setIsLogging(true);
        try {
            // Check if customer exists in DB, if not, or if details differ, add/sync them automatically
            const existingClientByPhone = clients.find(c => customerPhone && c.phone === customerPhone);
            const existingClientByName = clients.find(c => !customerPhone && customerName && (c.contactPerson === customerName || c.companyName === customerName));
            const existingClient = existingClientByPhone || existingClientByName;

            if (!existingClient && !editingTransactionId) {
                try {
                    await addClient({
                        clientType: companyName ? 'Company' : 'Personal',
                        companyName: companyName || "",
                        contactPerson: customerName || companyName || "Cash Customer",
                        email: customerEmail || "",
                        phone: customerPhone || "+91 ",
                        address: customerAddress || "N/A",
                        gst: customerGstin || ""
                    });
                } catch (err) {
                    console.error("Auto-client creation failed:", err);
                }
            }

            if (editingTransactionId) {
                // Update existing transaction
                await updateSale(editingTransactionId, payload);
                setFeedbackMessage("✅ Sales record updated successfully");
                setEditingTransactionId(null);
            } else {
                // Create new transaction
                await addSale(payload);
                setFeedbackMessage("✅ Sales record added successfully");
            }
        } catch (error) {
            console.error("Sales logging error:", error);
            setFeedbackMessage("❌ Failed to save sale. Please check all fields.");
        } finally {
            setIsLogging(false);
        }

        // Reset form
        setBillItems([]);
        setQuantity("");
        setTotalAmount("");
        setCompanyName("");
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("+91 ");
        setCustomerGstin("");
        setCustomerAddress("");
        setDeliveryEmployee("");
        setSoldBy(user?.name || "");
        setDeliveryMode("Door Delivery");
        setPaymentMode("Cash");
        setPaidStatus("Paid");
        setAmountPaid("");
        setTimeout(() => setFeedbackMessage(""), 3000);
    }, [addClient, addSale, amountPaid, billItems, clients, companyName, customerAddress, customerEmail, customerGstin, customerName, customerPhone, deliveryEmployee, deliveryMode, editingTransactionId, formatDate, isLogging, paidStatus, paymentMode, quantity, salesHistory, selectedProduct, selectedProductObj, setIsLogging, soldBy, updateSale, user?.name, unitPrice]);













    const handleCancelEdit = () => {
        setEditingTransactionId(null);
        setBillItems([]);
        setQuantity("");
        setTotalAmount("");
        setCompanyName("");
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("+91 ");
        setCustomerGstin("");
        setCustomerAddress("");
        setDeliveryEmployee("");
        setSoldBy("");
        setDeliveryMode("Door Delivery");
        setPaymentMode("Cash");
        setPaidStatus("Paid");
        setAmountPaid("");
    };

    // ─── Shared: Capture HTML preview & Send to WhatsApp ──────────────────


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
            // Sum quantities from saleItems if available, otherwise use single quantity
            item.saleItems?.reduce((sum, saleItem) => sum + (Number(saleItem.qty) || 0), 0) || Math.abs(item.quantity || 0),
            item.totalAmount || item.amount || 0,
            item.paidStatus || item.paymentStatus || "Unpaid",
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



    // Keyboard Shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Avoid shortcuts when typing in inputs (except for specifically handled keys)
            const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
            
            // SHIFT + Z -> Toggle Client Type (Company / Individual)
            if (e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
                e.preventDefault();
                setClientType(prev => prev === 'Company' ? 'Individual' : 'Company');
                setFeedbackMessage("Client Type Switched");
                setTimeout(() => setFeedbackMessage(""), 1000);
                return;
            }

            // Global Shortcuts (only when NOT typing)
            if (!isTyping && !e.ctrlKey && !e.altKey && !e.metaKey) {
                const key = e.key.toLowerCase();
                // 'c' -> Open/Focus Company selection
                if (key === 'c') {
                    if (clientType === 'Company') {
                        setIsClientDropdownOpen(true);
                        setTimeout(() => itemRefs.companySearch.current?.focus(), 100);
                        e.preventDefault();
                    }
                }
                // 'n' -> Focus Person/Customer Name field
                if (key === 'n') {
                    itemRefs.customerName.current?.focus();
                    e.preventDefault();
                }
                // 'p' -> Cycle Product Name
                if (key === 'p') {
                    const baseProducts = [...new Set(products.map(p => p.baseName))];
                    if (!isBaseProductDropdownOpen) {
                        setIsBaseProductDropdownOpen(true);
                    } else {
                        const currentIndex = baseProducts.indexOf(selectedBaseProduct);
                        const nextIndex = (currentIndex + 1) % baseProducts.length;
                        setSelectedBaseProduct(baseProducts[nextIndex]);
                        // Auto-open size dropdown if we moved to a new product
                        setTimeout(() => setIsSizeDropdownOpen(true), 50);
                    }
                    e.preventDefault();
                }
                // 's' -> Cycle Size dropdown
                if (key === 's') {
                    if (selectedBaseProduct) {
                        const availableSizes = products.filter(p => p.baseName === selectedBaseProduct).map(p => p.size);
                        if (!isSizeDropdownOpen) {
                            setIsSizeDropdownOpen(true);
                        } else {
                            const currentIndex = availableSizes.indexOf(selectedSize);
                            const nextIndex = (currentIndex + 1) % availableSizes.length;
                            setSelectedSize(availableSizes[nextIndex]);
                        }
                    }
                    e.preventDefault();
                }
                // 'q' -> Quantity
                if (key === 'q') {
                    itemRefs.quantity.current?.focus();
                    e.preventDefault();
                }
                // 'r' -> Rate
                if (key === 'r') {
                    itemRefs.unitPrice.current?.focus();
                    e.preventDefault();
                }
                // 'p' -> Cycle Product Name
                if (key === 'p') {
                    const baseProducts = [...new Set(products.map(p => p.baseName))];
                    if (!isBaseProductDropdownOpen) {
                        setIsBaseProductDropdownOpen(true);
                    } else {
                        const currentIndex = baseProducts.indexOf(selectedBaseProduct);
                        const nextIndex = (currentIndex + 1) % baseProducts.length;
                        setSelectedBaseProduct(baseProducts[nextIndex]);
                        // Auto-open size dropdown if we moved to a new product
                        setTimeout(() => setIsSizeDropdownOpen(true), 50);
                    }
                    e.preventDefault();
                }
                // 's' -> Cycle Size dropdown
                if (key === 's') {
                    if (selectedBaseProduct) {
                        const availableSizes = products.filter(p => p.baseName === selectedBaseProduct).map(p => p.size);
                        if (!isSizeDropdownOpen) {
                            setIsSizeDropdownOpen(true);
                        } else {
                            const currentIndex = availableSizes.indexOf(selectedSize);
                            const nextIndex = (currentIndex + 1) % availableSizes.length;
                            setSelectedSize(availableSizes[nextIndex]);
                        }
                    }
                    e.preventDefault();
                }
                // 'q' -> Quantity
                if (key === 'q') {
                    itemRefs.quantity.current?.focus();
                    e.preventDefault();
                }
                // 'r' -> Rate
                if (key === 'r') {
                    itemRefs.unitPrice.current?.focus();
                    e.preventDefault();
                }
            }

            // Shift + Enter -> SAVE ENTRY (Log Transaction)
            if (e.shiftKey && e.key === 'Enter') {
                if (!isLogging && (billItems.length > 0 || quantity)) {
                    handleLogTransaction();
                    e.preventDefault();
                }
            }

            if (e.key === 'Enter') {
                if (isPaymentDropdownOpen || isPaidStatusDropdownOpen || isDeliveryModeDropdownOpen || isBaseProductDropdownOpen || isSizeDropdownOpen) {
                    setIsPaymentDropdownOpen(false);
                    setIsPaidStatusDropdownOpen(false);
                    setIsDeliveryModeDropdownOpen(false);
                    setIsBaseProductDropdownOpen(false);
                    setIsSizeDropdownOpen(false);
                    if (document.activeElement) document.activeElement.blur();
                    e.preventDefault();
                    return;
                }
            }

            // Dropdown selection (1-9) when a dropdown is open
            const anyOpenDropdown = isClientDropdownOpen || isCustomerDropdownOpen || isBaseProductDropdownOpen || isSizeDropdownOpen;
            if (anyOpenDropdown) {
                const num = parseInt(e.key);
                if (!isNaN(num) && num >= 1 && num <= 9) {
                    if (isClientDropdownOpen || isCustomerDropdownOpen) {
                        const dropdownType = isClientDropdownOpen ? 'client' : 'customer';
                        const list = dropdownType === 'client' 
                            ? clients.filter(c => (clientType === 'Company' ? (c.companyName && (c.clientType?.toLowerCase() !== 'personal')) : (!c.companyName || c.clientType?.toLowerCase() === 'personal')))
                                .filter(c => (c.companyName?.toLowerCase() || "").includes(companyName?.toLowerCase() || ""))
                            : clients.filter(c => {
                                    const isComp = !!(c.companyName && c.companyName.trim() !== "");
                                    const isPers = !isComp || c.clientType?.toLowerCase() === 'personal';
                                    return clientType === 'Company' ? isComp : isPers;
                                }).filter(c => (c.contactPerson?.toLowerCase().includes(customerName.toLowerCase()) || c.companyName?.toLowerCase().includes(customerName.toLowerCase())));
                        
                        if (list[num - 1]) {
                            e.preventDefault();
                            const client = list[num - 1];
                            if (dropdownType === 'client') {
                                setCompanyName(client.companyName);
                                setCustomerName(client.contactPerson || "");
                                setCustomerEmail(client.email || "");
                                setCustomerPhone(client.phone || "");
                                setCustomerGstin(client.gst || "");
                                setCustomerAddress(client.address || "");
                                setIsClientDropdownOpen(false);
                                if (document.activeElement) document.activeElement.blur();
                            } else {
                                setCustomerName(client.companyName || client.contactPerson);
                                setCompanyName(client.companyName || "");
                                setCustomerEmail(client.email || "");
                                setCustomerPhone(client.phone || "+91 ");
                                setCustomerGstin(client.gst || "");
                                setCustomerAddress(client.address || "");
                                setIsCustomerDropdownOpen(false);
                                if (document.activeElement) document.activeElement.blur();
                            }
                        }
                    } else if (isBaseProductDropdownOpen) {
                        const list = [...new Set(products.map(p => p.baseName))];
                        if (list[num - 1]) {
                            e.preventDefault();
                            setSelectedBaseProduct(list[num - 1]);
                            setIsBaseProductDropdownOpen(false);
                            // Auto-progress to size
                            setTimeout(() => setIsSizeDropdownOpen(true), 50);
                        }
                    } else if (isSizeDropdownOpen) {
                        const list = products.filter(p => p.baseName === selectedBaseProduct);
                        if (list[num - 1]) {
                            e.preventDefault();
                            const product = list[num - 1];
                            setSelectedSize(product.size);
                            setIsSizeDropdownOpen(false);
                            // Auto-progress to quantity
                            setTimeout(() => itemRefs.quantity.current?.focus(), 50);
                        }
                    }
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [clientType, isClientDropdownOpen, isCustomerDropdownOpen, isBaseProductDropdownOpen, isSizeDropdownOpen, companyName, customerName, clients, products, selectedBaseProduct, paidStatus, paymentMode, billItems.length, handleLogTransaction, isDeliveryModeDropdownOpen, isLogging, isPaidStatusDropdownOpen, isPaymentDropdownOpen, itemRefs.companySearch, itemRefs.customerName, itemRefs.quantity, itemRefs.unitPrice, quantity, selectedSize]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.client-dropdown')) setIsClientDropdownOpen(false);
            if (!event.target.closest('.customer-dropdown')) setIsCustomerDropdownOpen(false);
            if (!event.target.closest('.base-product-dropdown')) setIsBaseProductDropdownOpen(false);
            if (!event.target.closest('.size-dropdown')) setIsSizeDropdownOpen(false);
            if (!event.target.closest('.employee-dropdown')) setIsEmployeeDropdownOpen(false);
            if (!event.target.closest('.payment-dropdown')) setIsPaymentDropdownOpen(false);
            if (!event.target.closest('.delivery-mode-dropdown')) setIsDeliveryModeDropdownOpen(false);
            if (!event.target.closest('.sold-by-dropdown')) setIsSoldByDropdownOpen(false);
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Helper to extract and format time consistently (12h AM/PM)


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
                    <h1 className="page-title">Sale</h1>
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
                    <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <h3 className="section-title">{editingTransactionId ? "Edit Sales Record" : "Customer Details"}</h3>
                            <div className="client-type-toggle-mini">
                                <button 
                                    className={`mini-toggle-btn ${clientType === 'Company' ? 'active' : ''}`}
                                    onClick={() => setClientType('Company')}
                                >
                                    <span className="material-symbols-outlined">business</span>
                                    COMPANY
                                </button>
                                <button 
                                    className={`mini-toggle-btn ${clientType === 'Individual' ? 'active' : ''}`}
                                    onClick={() => setClientType('Individual')}
                                >
                                    <span className="material-symbols-outlined">person</span>
                                    INDIVIDUAL
                                </button>
                            </div>
                        </div>
                        {editingTransactionId && (
                            <button className="btn-outline" onClick={handleCancelEdit} style={{ padding: '6px 12px', fontSize: '12px', borderColor: '#ef4444', color: '#ef4444' }}>
                                Cancel Edit
                            </button>
                        )}
                    </div>
                    <div className="quick-entry-grid" style={{ paddingBottom: '8px' }}>
                        <div className="quick-entry-row">
                            <div className="quick-entry-item two-col-item" style={clientType === 'Individual' ? { opacity: 0.6 } : {}}>
                                <span className="quick-entry-label">Company Name: <span className="shortcut-hint">C</span></span>
                                <div className={`product-dropdown client-dropdown ${clientType === 'Individual' ? 'disabled-dropdown' : ''}`}>
                                    <div className="dropdown-input-wrapper">
                                        <button
                                            onClick={() => clientType === 'Company' && setIsClientDropdownOpen(!isClientDropdownOpen)}
                                            className="product-dropdown-toggle client-dropdown-toggle"
                                            disabled={clientType === 'Individual'}
                                            style={clientType === 'Individual' ? { cursor: 'not-allowed' } : {}}
                                        >
                                            <span className="product-dropdown-text">
                                                {clientType === 'Individual' ? "N/A (Individual)" : (companyName || "Select Company")}
                                            </span>
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
                                                setCustomerPhone("+91 ");
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
                                                    ref={itemRefs.companySearch}
                                                    placeholder="Search companies..."
                                                    className="dropdown-search-input"
                                                    autoFocus
                                                    disabled={clientType === 'Individual'}
                                                    onChange={(e) => setCompanyName(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            {clients.filter(c =>
                                                (c.companyName?.toLowerCase() || "").includes(companyName?.toLowerCase() || "") ||
                                                (c.contactPerson?.toLowerCase() || "").includes(companyName?.toLowerCase() || "")
                                            ).length > 0 ? (
                                                <>
                                                    {clients
                                                        .filter(c => (clientType === 'Company' ? (c.companyName && (c.clientType?.toLowerCase() !== 'personal')) : (!c.companyName || c.clientType?.toLowerCase() === 'personal')))
                                                        .filter(c => (c.companyName?.toLowerCase() || "").includes(companyName?.toLowerCase() || ""))
                                                        .map((client, idx) => (
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
                                                                    // Remove focus after selection
                                                                    if (document.activeElement) document.activeElement.blur();
                                                                }}
                                                                className={`product-dropdown-item ${companyName === client.companyName ? 'active' : ''}`}
                                                            >
                                                                <span className="product-name-text">
                                                                    <span className="keyboard-shortcut-tag">{idx + 1}</span> {client.companyName}
                                                                </span>
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

                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">{clientType === 'Individual' ? 'Person Name' : 'Customer Name'}: <span className="shortcut-hint">N</span></span>
                                <div className="product-dropdown customer-dropdown">
                                    <div className="dropdown-input-wrapper">
                                        <input
                                            type="text"
                                            ref={itemRefs.customerName}
                                            placeholder={clientType === 'Individual' ? "Enter or search person name..." : "Enter or search customer name..."}
                                            className="quick-entry-input dropdown-search-input"
                                            style={{ width: '100%' }}
                                            value={customerName}
                                            onChange={(e) => {
                                                setCustomerName(e.target.value);
                                                setIsCustomerDropdownOpen(true);
                                            }}
                                            onClick={() => setIsCustomerDropdownOpen(true)}
                                            onFocus={() => setIsCustomerDropdownOpen(true)}
                                        />
                                        <span className="material-symbols-outlined dropdown-input-icon">
                                            {isCustomerDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                                        </span>
                                    </div>
                                    {isCustomerDropdownOpen && (
                                        <div className="product-dropdown-menu">
                                            {clients
                                            .filter(c => {
                                                const isCompany = !!(c.companyName && c.companyName.trim() !== "");
                                                const isPersonal = !isCompany || c.clientType?.toLowerCase() === 'personal';
                                                return clientType === 'Company' ? isCompany : isPersonal;
                                            })
                                            .filter(c =>
                                                (c.contactPerson?.toLowerCase().includes(customerName.toLowerCase()) ||
                                                 c.companyName?.toLowerCase().includes(customerName.toLowerCase()))
                                            ).length > 0 ? (
                                                clients
                                                    .filter(c => {
                                                        const isCompany = !!(c.companyName && c.companyName.trim() !== "");
                                                        const isPersonal = !isCompany || c.clientType?.toLowerCase() === 'personal';
                                                        return clientType === 'Company' ? isCompany : isPersonal;
                                                    })
                                                    .filter(c =>
                                                        (c.contactPerson?.toLowerCase().includes(customerName.toLowerCase()) ||
                                                         c.companyName?.toLowerCase().includes(customerName.toLowerCase()))
                                                    )
                                                    .map((client, idx) => (
                                                        <button
                                                            key={client.id || client._id}
                                                            onClick={() => {
                                                                setCustomerName(client.companyName || client.contactPerson);
                                                                setCompanyName(client.companyName || "");
                                                                setCustomerEmail(client.email || "");
                                                                setCustomerPhone(client.phone || "+91 ");
                                                                setCustomerGstin(client.gst || "");
                                                                setCustomerAddress(client.address || "");
                                                                setIsCustomerDropdownOpen(false);
                                                                // Remove focus after selection
                                                                if (document.activeElement) document.activeElement.blur();
                                                            }}
                                                            className="product-dropdown-item"
                                                        >
                                                            <div className="client-option-main">
                                                                <span className="product-name-text">
                                                                    <span className="keyboard-shortcut-tag">{idx + 1}</span> {client.companyName || client.contactPerson}
                                                                </span>
                                                                <span className="type-tag">{client.clientType || 'Personal'}</span>
                                                            </div>
                                                            <div className="client-option-sub">
                                                                <span>{client.phone}</span>
                                                                {client.gst && <span> | {client.gst}</span>}
                                                            </div>
                                                        </button>
                                                    ))
                                            ) : (
                                                <div className="no-items-dropdown">No matching customer. Enter name manually.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="quick-entry-row">
                            <div className="quick-entry-item two-col-item">
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

                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Phone Number *:</span>
                                <div style={{ width: '100%' }}>
                                    <input
                                        type="tel"
                                        placeholder="Enter mandatory phone number"
                                        className="quick-entry-input"
                                        style={{ borderLeft: '3px solid #10b981' }}
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="quick-entry-row">
                            <div className="quick-entry-item two-col-item" style={clientType === 'Individual' ? { opacity: 0.6 } : {}}>
                                <span className="quick-entry-label">GSTIN No:</span>
                                <div className="input-with-icon">
                                    <span className="material-symbols-outlined input-icon">receipt</span>
                                    <input
                                        type="text"
                                        className="quick-entry-input"
                                        placeholder={clientType === 'Individual' ? "N/A" : "Enter GSTIN"}
                                        value={clientType === 'Individual' ? "" : customerGstin}
                                        disabled={clientType === 'Individual'}
                                        onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                                        style={clientType === 'Individual' ? { cursor: 'not-allowed' } : {}}
                                    />
                                </div>
                            </div>

                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Address *:</span>
                                <div style={{ width: '100%' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter mandatory address"
                                        className="quick-entry-input"
                                        style={{ borderLeft: '3px solid #10b981' }}
                                        value={customerAddress}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="section-divider"></div>
<div className="table-header" style={{ padding: '14px 32px' }}>
                        <h3 className="section-title">Billing Details</h3>
                    </div>
                    <div className="quick-entry-grid" style={{ paddingTop: 0 }}>
                        <div className="quick-entry-row">
                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Product Name: <span className="shortcut-hint">P</span></span>
                                <div className="product-dropdown base-product-dropdown">
                                    <button
                                        onClick={() => setIsBaseProductDropdownOpen(!isBaseProductDropdownOpen)}
                                        className="product-dropdown-toggle"
                                    >
                                        <span className="product-dropdown-text">{selectedBaseProduct || "Select Product"}</span>
                                        <span className="material-symbols-outlined product-dropdown-arrow">
                                            {isBaseProductDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                                        </span>
                                    </button>
                                    {isBaseProductDropdownOpen && (
                                        <div className="product-dropdown-menu">
                                            {products.length > 0 ? (
                                                [...new Set(products.map(p => p.baseName))].map((baseName, idx) => (
                                                    <button
                                                        key={baseName}
                                                        onClick={() => {
                                                            setSelectedBaseProduct(baseName);
                                                            setIsBaseProductDropdownOpen(false);
                                                            // Auto-progress to size
                                                            setTimeout(() => setIsSizeDropdownOpen(true), 100);
                                                        }}
                                                        className={`product-dropdown-item ${selectedBaseProduct === baseName ? 'active' : ''}`}
                                                    >
                                                        <span className="product-name-text">
                                                            <span className="keyboard-shortcut-tag">{idx + 1}</span> {baseName}
                                                        </span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="no-items-dropdown">No stock available. Please add production first.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Size/Variant: <span className="shortcut-hint">S</span></span>
                                <div className="product-dropdown size-dropdown">
                                    <button
                                        onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                                        className="product-dropdown-toggle"
                                        disabled={!selectedBaseProduct}
                                        style={!selectedBaseProduct ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                                    >
                                        <span className="product-dropdown-text">
                                            {!selectedBaseProduct ? "Select Product First" : (selectedSize || "Select Size")}
                                        </span>
                                        <span className="material-symbols-outlined product-dropdown-arrow">
                                            {isSizeDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                                        </span>
                                    </button>
                                    {isSizeDropdownOpen && selectedBaseProduct && (
                                        <div className="product-dropdown-menu">
                                            {products.filter(p => p.baseName === selectedBaseProduct).map((product, idx) => (
                                                <button
                                                    key={product.size}
                                                    onClick={() => {
                                                        setSelectedSize(product.size);
                                                        setIsSizeDropdownOpen(false);
                                                        // Focus quantity after size selection
                                                        setTimeout(() => itemRefs.quantity.current?.focus(), 100);
                                                    }}
                                                    className={`product-dropdown-item ${selectedSize === product.size ? 'active' : ''}`}
                                                >
                                                    <span className="product-name-text">
                                                        <span className="keyboard-shortcut-tag">{idx + 1}</span> {product.size}
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '11px', color: '#059669', background: '#f0fdf4', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                            {product.stock || 0} in stock
                                                        </span>
                                                        <span style={{ fontSize: '11px', color: '#1a6b3c', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                            ₹{product.price}
                                                        </span>
                                                        <span className="product-sku-category">{product.sku}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="quick-entry-row">
                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Total Pieces: <span className="shortcut-hint">Q</span></span>
                                <div style={{ width: '100%', position: 'relative' }}>
                                    {selectedBaseProduct && selectedSize && (
                                        <div style={{ position: 'absolute', top: '-14px', right: '10px', zIndex: 10 }}>
                                            {(() => {
                                                const product = products.find(p =>
                                                    (p.baseName || "").toLowerCase().trim() === (selectedBaseProduct || "").toLowerCase().trim() &&
                                                    (p.size || "").toLowerCase().trim() === (selectedSize || "").toLowerCase().trim());
                                                const stock = product?.stock || 0;
                                                const inBill = billItems.find(item => item.productId === product?.id)?.qty || 0;
                                                const available = stock - inBill;
                                                const isLow = available < 100;

                                                return (
                                                    <div className={`stock-badge-premium ${isLow ? 'low' : 'ok'}`}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                                            {isLow ? 'warning' : 'inventory'}
                                                        </span>
                                                        <span className="stock-badge-text">
                                                            Available: <strong>{available.toLocaleString()}</strong>
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                    <input
                                        type="number"
                                        placeholder="Enter total pieces"
                                        className="quick-entry-input"
                                        ref={itemRefs.quantity}
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, 'unitPrice')}
                                    />
                                </div>
                            </div>

                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Per Plate Price: <span className="shortcut-hint">R</span></span>
                                <div className="amount-input-wrapper">
                                    <span className="currency-prefix">₹</span>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="quick-entry-input amount-input"
                                        ref={itemRefs.unitPrice}
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="quick-entry-row">
                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Total Plate Amount:</span>
                                <div className="amount-input-wrapper" style={{ background: '#ffffff' }}>
                                    <span className="currency-prefix">₹</span>
                                    <input
                                        type="text"
                                        className="quick-entry-input amount-input"
                                        style={{ fontWeight: 600, color: '#1a6b3c' }}
                                        value={((parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className="quick-entry-item two-col-item" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <span className="quick-entry-label" style={{ visibility: 'hidden' }}>Action:</span>
                                <button
                                    className="btn-primary"
                                    onClick={handleAddItem}
                                    style={{ width: '100%', height: '44px', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
                                    ADD ITEM
                                </button>
                            </div>
                        </div>

                        <div className="overall-bill-summary-fixed" style={{ marginTop: '28px', marginBottom: '42px', padding: '12px 32px', background: '#ffffff', borderRadius: '12px', border: '2px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#334155', color: '#ffffff', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>receipt_long</span>
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Summary</h4>
                                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Total Bill</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>₹</span>
                                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.01em', lineHeight: 1 }}>
                                    {billItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <div className="section-divider" style={{ margin: '0 -32px 32px -32px' }}></div>

                        <div className="quick-entry-row" style={{ marginBottom: '16px' }}>
                            <div className="quick-entry-item two-col-item">
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

                            <div className="quick-entry-item two-col-item">
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
                                            {deliveryEmployees.filter(emp =>
                                                emp.name.toLowerCase().includes((deliveryEmployee || "").toLowerCase())
                                            ).length > 0 ? (
                                                deliveryEmployees
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
                                                <div className="no-clients-found">No delivery staff found matching "{deliveryEmployee}"</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="quick-entry-row" style={{ marginBottom: '16px' }}>
                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Sold By:</span>
                                <div className="product-dropdown sold-by-dropdown">
                                    <div className="dropdown-input-wrapper">
                                        <button
                                            onClick={() => setIsSoldByDropdownOpen(!isSoldByDropdownOpen)}
                                            className="product-dropdown-toggle"
                                        >
                                            <span className="product-dropdown-text">{soldBy || "Select Sales Employee"}</span>
                                            <span className="material-symbols-outlined product-dropdown-arrow">
                                                {isSoldByDropdownOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
                                            </span>
                                        </button>
                                        {soldBy && (
                                            <button className="clear-selection-btn" onClick={(e) => { e.stopPropagation(); setSoldBy(""); }}>
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        )}
                                    </div>
                                    {isSoldByDropdownOpen && (
                                        <div className="product-dropdown-menu">
                                            <div className="dropdown-search-wrapper">
                                                <input
                                                    type="text"
                                                    placeholder="Search sales staff..."
                                                    className="dropdown-search-input"
                                                    autoFocus
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => setSoldBy(e.target.value)}
                                                />
                                            </div>
                                            {(salesEmployees.length > 0 ? salesEmployees : employees).filter(emp =>
                                                emp.name.toLowerCase().includes((soldBy || "").toLowerCase())
                                            ).length > 0 ? (
                                                (salesEmployees.length > 0 ? salesEmployees : employees)
                                                    .filter(emp => emp.name.toLowerCase().includes((soldBy || "").toLowerCase()))
                                                    .map((emp) => (
                                                        <button
                                                            key={emp.id}
                                                            onClick={() => {
                                                                setSoldBy(emp.name);
                                                                setIsSoldByDropdownOpen(false);
                                                            }}
                                                            className={`product-dropdown-item ${soldBy === emp.name ? 'active' : ''}`}
                                                        >
                                                            <span className="product-name-text">{emp.name}</span>
                                                            <span className="product-sku-category">{emp.department}</span>
                                                        </button>
                                                    ))
                                            ) : (
                                                <div className="no-clients-found">No sales staff found matching "{soldBy}"</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="quick-entry-item two-col-item">
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
                        </div>

                        <div className="quick-entry-row">
                            <div className="quick-entry-item two-col-item">
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
                            <div className="quick-entry-item two-col-item">
                                {(paidStatus === 'Pending' || paidStatus === 'Advance') ? (
                                    <>
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
                                    </>
                                ) : (
                                    <div style={{ visibility: 'hidden' }}></div>
                                )}
                            </div>
                        </div>

                        {(paidStatus === 'Pending' || paidStatus === 'Advance') && (
                            <div className="quick-entry-row">
                                <div className="quick-entry-item two-col-item">
                                    <span className="quick-entry-label">Balance Amount:</span>
                                    <div className="amount-input-wrapper" style={{ background: '#fff1f2' }}>
                                        <span className="currency-prefix">₹</span>
                                        <input
                                            type="text"
                                            className="quick-entry-input amount-input"
                                            style={{ fontWeight: 600, color: '#e11d48' }}
                                            value={(billItems.reduce((sum, item) => sum + item.amount, 0) - (parseFloat(amountPaid) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="quick-entry-item two-col-item" style={{ visibility: 'hidden' }}></div>
                            </div>
                        )}
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
                                            <th style={{ padding: '12px 16px', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', width: '25%' }}>PRODUCT NAME</th>
                                            <th style={{ padding: '12px 16px', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', width: '15%' }}>SIZE</th>
                                            <th style={{ padding: '12px 16px', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', width: '15%' }}>HSN CODE</th>
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
                                                <td style={{ padding: '16px', color: '#334155', fontSize: '0.9rem', textAlign: 'left' }}>{item.hsn || "-"}</td>
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
                                            <td colSpan="4" style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>SUBTOTAL</td>
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

                    <div className="quick-entry-footer">
                        <div className="quick-entry-action-group">
                            <button
                                className="btn-primary quick-entry-btn log-btn-colored"
                                onClick={handleLogTransaction}
                                style={{ width: '100%', height: '52px', fontSize: '1rem', fontWeight: 800 }}
                                disabled={isLogging || (billItems.length === 0 && !quantity)}
                            >
                                <span className="material-symbols-outlined">
                                    {isLogging ? "hourglass_empty" : "done_all"}
                                </span>
                                {editingTransactionId ? (isLogging ? "UPDATING..." : "UPDATE ENTRY") : (isLogging ? "SAVING..." : "SAVE ENTRY")}
                            </button>
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
                                    <label>COMPANY NAME (Optional)</label>
                                    <input
                                        type="text"
                                        className="modal-input"
                                        placeholder="Enter company name (leave empty for individuals)"
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
                                            placeholder="jofra@avseco.in"
                                            value={newClientData.email}
                                            onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>PHONE NUMBER *</label>
                                        <input
                                            type="tel"
                                            className="modal-input"
                                            placeholder="Enter phone number"
                                            value={newClientData.phone}
                                            required
                                            onChange={(e) => setNewClientData({ ...newClientData, phone: formatPhone(e.target.value) })}
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
                                    <label>ADDRESS *</label>
                                    <textarea
                                        className="modal-textarea"
                                        placeholder="Enter complete address"
                                        rows="3"
                                        required
                                        value={newClientData.address}
                                        onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="modal-cancel" onClick={() => setShowAddClientModal(false)}>Cancel</button>
                                <button
                                    className="modal-confirm"
                                    disabled={!newClientData.contactPerson || !newClientData.phone || !newClientData.address}
                                    onClick={async () => {
                                        try {
                                            const newClient = {
                                                ...newClientData,
                                                totalOrders: 0,
                                                totalSpent: "₹0",
                                                lastOrder: "Never",
                                            };
                                            await addClient(newClient);
                                            setCompanyName(newClientData.companyName);
                                            setCustomerName(newClientData.contactPerson);
                                            setCustomerEmail(newClientData.email);
                                            setCustomerPhone(newClientData.phone || "");
                                            setCustomerGstin(newClientData.gst || "");
                                            setCustomerAddress(newClientData.address || "");
                                            setShowAddClientModal(false);

                                            setFeedbackMessage("✅ New client added to database");
                                            setTimeout(() => setFeedbackMessage(""), 3000);

                                            // Reset form
                                            setNewClientData({
                                                companyName: "",
                                                contactPerson: "",
                                                email: "",
                                                phone: "+91 ",
                                                address: "",
                                                gst: ""
                                            });
                                        } catch (err) {
                                            console.error("Error adding client from Sales:", err);
                                            alert("Failed to save client. Please check details.");
                                        }
                                    }}
                                >
                                    Add Client
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default Sales;
