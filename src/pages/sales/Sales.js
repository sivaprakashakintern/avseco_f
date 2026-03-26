import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import './Sales.css';
import logo from '../../assets/logo.png';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";



const Sales = () => {
    const { 
        clients, addClient, employees, products: dbProducts, stockData,
        salesHistory, addSale, updateSale, deleteSale 
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

    const [viewMode, setViewMode] = useState('entry'); // 'entry' or 'history'
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
    const [soldBy, setSoldBy] = useState("");
    
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
    const [showBillModal, setShowBillModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [billItems, setBillItems] = useState([]);


    const [summaryType] = useState("all");
    const [isAutoSharing, setIsAutoSharing] = useState(false);

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

    // ========== PERSISTENCE ==========

    // Filtered transactions based on today's date only (Robust across format changes)
    const getFilteredTransactions = () => {
        const now = new Date();
        const todayNew = formatDate(now); // 23-03-2026
        const todayOld = now.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); // Mar 23, 2026
        
        let filtered = allTransactions.filter(t => {
            const saleDate = t.date || "";
            return saleDate.includes(todayNew) || saleDate.includes(todayOld);
        });

        if (summaryType && summaryType !== 'all') {
            filtered = filtered.filter(t => t.paymentStatus?.toLowerCase() === summaryType.toLowerCase());
        }
        return filtered;
    };

    const filteredTransactions = getFilteredTransactions();

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
                    hsn: products.find(p => p.id === selectedProductId)?.hsn || "-"
                };
                return [...prevItems, newItem];
            }
        });

        setQuantity("");
    };
    const handleLogTransaction = async () => {
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
                unit: item.unit || "pcs"
            }))
        };

        setIsLogging(true);
        try {
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
        setCustomerPhone("");
        setCustomerGstin("");
        setCustomerAddress("");
        setDeliveryEmployee("");
        setSoldBy("");
        setDeliveryMode("Door Delivery");
        setPaymentMode("Cash");
        setPaidStatus("Paid");
        setAmountPaid("");
        setTimeout(() => setFeedbackMessage(""), 3000);
    };

    const handleEditTransaction = (transaction) => {
        setEditingTransactionId(transaction.id);
        setCompanyName(transaction.company || "");
        setCustomerName(transaction.customer || "");
        setCustomerEmail(transaction.customerEmail || "");
        setCustomerPhone(transaction.customerPhone || "");
        setCustomerGstin(transaction.customerGstin || "");
        setCustomerAddress(transaction.customerAddress || "");
        setDeliveryEmployee(transaction.deliveredBy || "");
        setSoldBy(transaction.soldBy || "");
        setDeliveryMode(transaction.deliveryMode || "Door Delivery");
        setPaymentMode(transaction.paymentStatus || "Cash");
        setPaidStatus(transaction.paidStatus || (transaction.paymentStatus === 'Unpaid' ? 'Unpaid' : 'Paid'));

        // Populate bill items from saleItems
        if (transaction.saleItems) {
            setBillItems(transaction.saleItems.map((item, idx) => ({
                id: idx,
                product: item.productName || item.product,
                baseName: item.baseName || item.productName || item.product,
                size: item.size || "-",
                qty: item.qty,
                amount: item.amount,
                unit: "pcs"
            })));
        } else {
            // Fallback for old records
            setBillItems([{
                id: Date.now(),
                product: transaction.product,
                baseName: transaction.product,
                size: "-",
                qty: Math.abs(transaction.quantity),
                amount: transaction.amount,
                unit: "pcs"
            }]);
        }

        setViewMode('entry');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingTransactionId(null);
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
        setSoldBy("");
        setDeliveryMode("Door Delivery");
        setPaymentMode("Cash");
        setPaidStatus("Paid");
        setAmountPaid("");
    };

    const handleGenerateBill = () => {
        if (!customerPhone || !customerAddress) {
            setFeedbackMessage("Please enter Customer Phone and Address");
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
            email: customerEmail || clientInfo?.email || 'N/A',
            phone: customerPhone || clientInfo?.phone || 'N/A',
            address: customerAddress || clientInfo?.address || 'N/A',
            gstin: customerGstin || clientInfo?.gst || 'N/A',
            date: formatDate(new Date()),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            items: itemsForBill.map(item => ({
                product: item.product,
                baseName: item.baseName || item.product,
                size: item.size || "-",
                qty: item.qty,
                amount: item.amount,
                hsn: item.hsn || products.find(p => p.name === item.product)?.hsn || "-",
                rate: item.rate || (item.qty ? (item.amount / item.qty).toFixed(2) : 0)
            })),
            deliveredBy: deliveryEmployee,
            soldBy: soldBy,
            paymentMode: paymentMode,
            paidStatus: paidStatus,
            deliveryMode: deliveryMode
        };

        setSelectedBill(billData);
        setShowBillModal(true);
    };



    // View a transaction's bill details
    const handleViewBill = (transaction, returnOnly = false) => {
        const clientInfo = clients.find(c => c.companyName === transaction.company);

        const billData = {
            invoiceNo: transaction.invoiceNo || `INV-${transaction.id.toString().slice(-6)}`,
            company: transaction.company,
            customer: transaction.customer || clientInfo?.contactPerson || 'N/A',
            email: transaction.customerEmail || clientInfo?.email || 'N/A',
            phone: transaction.customerPhone || transaction.phone || clientInfo?.phone || 'N/A',
            address: transaction.customerAddress || clientInfo?.address || 'N/A',
            gstin: transaction.customerGstin || clientInfo?.gst || 'N/A',
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
                hsn: products.find(p => p.name === transaction.product)?.hsn || "-",
                rate: transaction.quantity ? (transaction.amount / Math.abs(transaction.quantity)).toFixed(2) : 0
            }],
            totalAmount: transaction.totalAmount || transaction.amount,
            paymentMode: transaction.paymentStatus,
            paidStatus: transaction.paidStatus || (transaction.paymentStatus === 'Unpaid' ? 'Unpaid' : 'Paid'),
            deliveredBy: transaction.deliveredBy,
            soldBy: transaction.soldBy
        };

        if (returnOnly) return billData;
        setSelectedBill(billData);
        setShowBillModal(true);
    };

    // Delete a transaction from history
    const handleDeleteTransaction = (id) => {
        // This should call deleteSale from useAppContext
        deleteSale(id);
    };

    // ─── Shared: Capture HTML preview & Send to WhatsApp ──────────────────
    const sendInvoiceToWhatsApp = async (bill) => {
        const invoiceElement = document.getElementById('printable-bill');
        if (!invoiceElement) {
            alert('Invoice preview not found.');
            return;
        }

        // 1. Ultra-Smart Phone Normalization (Ensures it goes straight to the contact)
        let phoneNum = (bill.phone && bill.phone !== 'N/A' && bill.phone.trim() !== "") ? bill.phone : "";

        if (!phoneNum || phoneNum === "") {
            const savedClient = clients.find(c =>
                (bill.company && bill.company !== 'N/A' && c.companyName === bill.company) ||
                (bill.customer && bill.customer !== 'N/A' && c.contactPerson === bill.customer)
            );
            phoneNum = savedClient?.phone || customerPhone || "";
        }

        // Clean & Normalize for India (+91)
        let cleaned = phoneNum.replace(/\D/g, '');
        if (cleaned.startsWith('910')) {
            cleaned = '91' + cleaned.substring(3);
        } else if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }

        if (cleaned.length === 10) {
            cleaned = '91' + cleaned;
        }

        const phone = cleaned;
        if (!phone || phone.length < 10) {
            alert('Please enter a valid WhatsApp number in Customer Details.');
            return;
        }

        // Visual Feedback for "Straight" transition
        setFeedbackMessage(`🚀 Generating High-Res Bill & Connecting to WhatsApp...`);

        try {
            // 2. Capture the invoice with optimized high-res settings (2.5x is faster than 3x)
            const fullHeight = invoiceElement.scrollHeight;
            const canvas = await html2canvas(invoiceElement, {
                scale: 2.5,           // Slightly reduced for speed, still look great
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 850,
                windowWidth: 850,
                height: fullHeight,
                scrollY: -window.scrollY,
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById('printable-bill');
                    if (el) {
                        el.style.zoom = '1';
                        el.style.transform = 'none';
                        el.style.margin = '0 auto';  // Center horizontally in the capture
                        el.style.boxShadow = 'none';
                        el.style.position = 'relative';
                        el.style.top = '0';
                        el.style.left = '0';
                        el.style.width = '850px';
                        el.style.height = `${fullHeight}px`;
                        el.style.overflow = 'visible';
                    }
                    // Hide action buttons (Close, Send, Print) from the capture
                    const actionButtons = clonedDoc.querySelector('.no-print');
                    if (actionButtons) {
                        actionButtons.style.display = 'none';
                    }
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0); // Maximum quality
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // 3. Generate PDF matching the exact aspect ratio of the bill
            const pdfWidth = (imgWidth / (3 * 96)) * 25.4;
            const pdfHeight = (imgHeight / (3 * 96)) * 25.4;

            const doc = new jsPDF({
                orientation: pdfWidth > pdfHeight ? 'l' : 'p',
                unit: 'mm',
                format: [pdfWidth, pdfHeight],
                compress: false // Disable compression for best quality
            });

            doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'SLOW');
            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], `Invoice_${bill.invoiceNo}.pdf`, { type: 'application/pdf' });

            // 4. WhatsApp message
            const message = `*INVOICE: ${bill.invoiceNo}*%0A%0ADear *${bill.customer}*,%0A%0AThank you for your business with *AVSECO INDUSTRIES*! 🌿%0A%0APlease find your invoice attached below.`;
            const finalPhone = phone.startsWith('91') ? phone : '91' + phone;
            const waUrl = `https://wa.me/${finalPhone}?text=${message}`;

            // 5. Share logic
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    files: [pdfFile],
                    title: `Invoice ${bill.invoiceNo}`,
                    text: `Dear ${bill.customer}, Please find your invoice from AVSECO INDUSTRIES.`
                }).catch(() => {
                    doc.save(`Invoice_${bill.invoiceNo}.pdf`);
                    window.open(waUrl, '_blank');
                });
            } else {
                doc.save(`Invoice_${bill.invoiceNo}.pdf`);
                window.open(waUrl, '_blank');
            }
        } catch (err) {
            console.error('WhatsApp capture failed:', err);
            alert('Could not generate full invoice. Please try again.');
        } finally {
            setFeedbackMessage("");
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
            if (!event.target.closest('.sold-by-dropdown')) {
                setIsSoldByDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // Helper to extract and format time consistently (12h AM/PM)
    const getFormattedTime = (transaction) => {
        // Robust handling for older DD-MM-YYYY vs newer strings (Always pull the last comma part for time)
        const parts = transaction.date?.split(', ') || [];
        const rawTime = parts.length > 1 ? parts[parts.length - 1] : (transaction.time || "-");
        
        if (rawTime === "-") return "-";
        
        if (rawTime.includes('AM') || rawTime.includes('PM')) return rawTime;
        
        const [h, m] = rawTime.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return rawTime;
        
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    };

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
                    <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="section-title">{editingTransactionId ? "Edit Sales Record" : "Customer Details"}</h3>
                        {editingTransactionId && (
                            <button className="btn-outline" onClick={handleCancelEdit} style={{ padding: '6px 12px', fontSize: '12px', borderColor: '#ef4444', color: '#ef4444' }}>
                                Cancel Edit
                            </button>
                        )}
                    </div>
                    <div className="quick-entry-grid">
                        <div className="quick-entry-row">
                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Company (Optional):</span>
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
                                                (c.companyName?.toLowerCase() || "").includes(companyName?.toLowerCase() || "") ||
                                                (c.contactPerson?.toLowerCase() || "").includes(companyName?.toLowerCase() || "")
                                            ).length > 0 ? (
                                                <>
                                                    {clients
                                                        .filter(c => (c.companyName?.toLowerCase() || "").includes(companyName?.toLowerCase() || ""))
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

                            <div className="quick-entry-item two-col-item">
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
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="quick-entry-row">
                            <div className="quick-entry-item two-col-item">
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

                    <div className="table-header" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                        <h3 className="section-title">Billing Details</h3>
                    </div>
                    <div className="quick-entry-grid">
                        <div className="quick-entry-row">
                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Product Name:</span>
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
                                                [...new Set(products.map(p => p.baseName))].map((baseName) => (
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
                                                ))
                                            ) : (
                                                <div className="no-items-dropdown">No stock available. Please add production first.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Size/Variant:</span>
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
                                <span className="quick-entry-label">Total Pieces:</span>
                                <div style={{ width: '100%', position: 'relative' }}>
                                    {selectedBaseProduct && selectedSize && (
                                        <div style={{ position: 'absolute', top: '-18px', right: '4px', zIndex: 1 }}>
                                            <span className="available-badge">
                                                {(() => {
                                                    const product = products.find(p => 
                                                        (p.baseName || "").toLowerCase().trim() === (selectedBaseProduct || "").toLowerCase().trim() && 
                                                        (p.size || "").toLowerCase().trim() === (selectedSize || "").toLowerCase().trim());
                                                    const stock = product?.stock || 0;
                                                    const inBill = billItems.find(item => item.productId === product?.id)?.qty || 0;
                                                    return `Available: ${stock - inBill}`;
                                                })()}
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        type="number"
                                        placeholder="Enter total pieces"
                                        className="quick-entry-input"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Per Plate Price:</span>
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
                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Total Plate Amount:</span>
                                <div className="amount-input-wrapper" style={{ background: '#f8fafc' }}>
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

                            <div className="quick-entry-item" style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                                <button
                                    className="btn-primary"
                                    onClick={handleAddItem}
                                    style={{ width: '100%', height: '42px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
                                    ADD ITEM
                                </button>
                            </div>
                        </div>

                        <div className="quick-entry-row">
                            <div className="quick-entry-item two-col-item">
                                <span className="quick-entry-label">Overall Bill Amount:</span>
                                <div className="amount-input-wrapper" style={{ background: '#f8fafc' }}>
                                    <span className="currency-prefix">₹</span>
                                    <input
                                        type="text"
                                        className="quick-entry-input amount-input"
                                        style={{ fontWeight: 600, color: '#1a6b3c' }}
                                        value={billItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="quick-entry-item" style={{ flex: 1 }}></div>
                        </div>

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
                            <div className="quick-entry-item two-col-item" style={{ visibility: 'hidden' }}></div>
                        </div>

                        {(paidStatus === 'Pending' || paidStatus === 'Advance') && (
                            <div className="quick-entry-row">
                                <div className="quick-entry-item two-col-item">
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
                                            <th style={{ padding: '12px 16px', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', width: '15%' }}>HSN</th>
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
                                {editingTransactionId ? (isLogging ? "UPDATING..." : "UPDATE ENTRY") : (isLogging ? "SAVING..." : "SAVE ENTRY")}
                            </button>
                        </div>
                        <div className="history-view-trigger">
                            <button className="view-history-btn" onClick={() => setViewMode('history')}>
                                <span className="material-symbols-outlined">history</span>
                                View Recent Sales History
                            </button>
                        </div>
                    </div>
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

                    <div className="history-filters-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h3 className="section-title">Today's Sales History</h3>
                    </div>

                    <div className="stock-table-container">
                        <div className="table-responsive desktop-only-table">
                            <table className="stock-table">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'center' }}>S.NO</th>
                                        <th style={{ textAlign: 'center' }}>TIME</th>
                                        <th style={{ textAlign: 'center' }}>COMPANY</th>
                                        <th className="hide-mobile" style={{ textAlign: 'center' }}>PRODUCT</th>
                                        <th className="hide-mobile" style={{ textAlign: 'center' }}>SIZE</th>
                                        <th className="hide-mobile" style={{ textAlign: 'center' }}>PIECES</th>
                                        <th className="hide-mobile" style={{ textAlign: 'center' }}>AMOUNT</th>
                                        <th className="hide-mobile" style={{ textAlign: 'center' }}>PAYMENT</th>
                                        <th className="hide-mobile" style={{ textAlign: 'center' }}>SOLD BY</th>
                                        <th className="text-center" style={{ textAlign: 'center' }}>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.length > 0 ? (
                                        filteredTransactions.slice(0, 10).map((transaction, index) => {
                                            const baseNames = [...new Set(transaction.saleItems?.map(item => item.baseName))].filter(Boolean);
                                            const baseProducts = baseNames.length > 0 ? baseNames.join(', ') : (transaction.product || "-");
                                            
                                            const sizeValues = [...new Set(transaction.saleItems?.map(item => item.size))].filter(Boolean);
                                            const sizes = sizeValues.length > 0 ? sizeValues.join(', ') : (transaction.size || "-");
                                            
                                            const totalPieces = transaction.saleItems?.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) || Math.abs(transaction.quantity || 0);
                                            const displayAmount = transaction.totalAmount || transaction.amount || 0;
                                            const formattedTime = getFormattedTime(transaction);

                                            return (
                                                <tr key={transaction.id || transaction._id}>
                                                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                                    <td style={{ textAlign: 'center', fontSize: '13px', whiteSpace: 'nowrap' }}>{formattedTime}</td>
                                                    <td style={{ textAlign: 'center' }} onClick={() => handleViewBill(transaction)}>
                                                        <span className="company-text clickable-company">{transaction.company || '-'}</span>
                                                    </td>
                                                    <td className="hide-mobile" style={{ textAlign: 'center' }}>
                                                        <div className="product-info" style={{ justifyContent: 'center' }}>
                                                            <span className="product-name">{baseProducts}</span>
                                                        </div>
                                                    </td>
                                                    <td className="hide-mobile" style={{ textAlign: 'center' }}>{sizes}</td>
                                                    <td className="quantity-cell hide-mobile" style={{ textAlign: 'center' }}>
                                                        {totalPieces}
                                                    </td>
                                                    <td className="amount-cell hide-mobile" style={{ textAlign: 'center' }}>
                                                        ₹{displayAmount?.toLocaleString() || '0'}
                                                    </td>
                                                    <td className="hide-mobile" style={{ textAlign: 'center' }}>
                                                        <span className={`payment-badge ${(transaction.paidStatus || transaction.paymentStatus || 'Paid').toLowerCase()}`}>
                                                            {transaction.paidStatus || transaction.paymentStatus || 'Paid'}
                                                        </span>
                                                    </td>
                                                    <td className="hide-mobile" style={{ textAlign: 'center' }}>
                                                        <span className="sold-by-badge">{transaction.soldBy || "-"}</span>
                                                    </td>
                                                    <td className="text-center" style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                            <button
                                                                className="icon-action-btn"
                                                                onClick={async () => {
                                                                    const billData = handleViewBill(transaction, true);
                                                                    setSelectedBill(billData);
                                                                    setIsAutoSharing(true);
                                                                    setFeedbackMessage("🚀 Generating High-Res Bill & Connecting...");
                                                                    
                                                                    // Wait for DOM to render the hidden bill
                                                                    setTimeout(async () => {
                                                                        try {
                                                                            await sendInvoiceToWhatsApp(billData);
                                                                        } finally {
                                                                            setIsAutoSharing(false);
                                                                        }
                                                                    }, 600);
                                                                }}
                                                                title="Send to WhatsApp"
                                                                style={{ color: '#25D366', background: 'rgba(37, 211, 102, 0.1)' }}
                                                            >
                                                                <span className="material-symbols-outlined">share</span>
                                                            </button>
                                                            <button
                                                                className="icon-action-btn edit"
                                                                onClick={() => handleEditTransaction(transaction)}
                                                                title="Edit Record"
                                                                style={{ color: '#0ea5e9' }}
                                                            >
                                                                <span className="material-symbols-outlined">edit</span>
                                                            </button>
                                                            <button
                                                                className="icon-action-btn delete"
                                                                onClick={() => handleDeleteTransaction(transaction.id || transaction._id)}
                                                                title="Delete Record"
                                                            >
                                                                <span className="material-symbols-outlined">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="no-data" style={{ textAlign: 'center', padding: '40px' }}>
                                                <h4>No sales records found for today</h4>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile History Cards */}
                        <div className="mobile-history-cards">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.slice(0, 10).map((transaction) => {
                                        const formattedTime = getFormattedTime(transaction);
                                        return (
                                            <div key={transaction.id || transaction._id} className="mobile-sale-card" onClick={() => handleViewBill(transaction)}>
                                        <div className="sale-card-header">
                                            <div className="sale-date">
                                                <span className="material-symbols-outlined">calendar_today</span>
                                                <span style={{ fontWeight: '500' }}>{transaction.date?.split(', ')[0]}</span>
                                                <span style={{ marginLeft: '8px', opacity: 0.8, fontSize: '12px' }}>{formattedTime}</span>
                                            </div>
                                            <span className={`payment-badge ${(transaction.paidStatus || transaction.paymentStatus || 'Paid').toLowerCase()}`}>
                                                {transaction.paidStatus || transaction.paymentStatus || 'Paid'}
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
                                                    <span className="detail-value amount">₹{(transaction.totalAmount || transaction.amount || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">PIECES</span>
                                                    <span className="detail-value">
                                                        {transaction.saleItems?.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) || Math.abs(transaction.quantity || 0)} Pcs
                                                    </span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">SOLD BY</span>
                                                    <span className="detail-value">{transaction.soldBy || "-"}</span>
                                                </div>
                                            </div>
                                            <div className="sale-product-line">
                                                <span className="material-symbols-outlined">inventory_2</span>
                                                {transaction.saleItems?.map(item => item.baseName).join(', ') || transaction.product}
                                            </div>
                                        </div>
                                        <div className="sale-card-actions" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                className="sale-action-btn"
                                                onClick={async () => {
                                                    const billData = handleViewBill(transaction, true);
                                                    setSelectedBill(billData);
                                                    setIsAutoSharing(true);
                                                    setFeedbackMessage("🚀 Generating Bill...");
                                                    
                                                    setTimeout(async () => {
                                                        try {
                                                            await sendInvoiceToWhatsApp(billData);
                                                        } finally {
                                                            setIsAutoSharing(false);
                                                        }
                                                    }, 600);
                                                }}
                                                style={{ color: '#25D366', background: 'rgba(37, 211, 102, 0.1)' }}
                                            >
                                                <span className="material-symbols-outlined">share</span>
                                                WhatsApp
                                            </button>
                                            <button className="sale-action-btn edit" onClick={() => handleEditTransaction(transaction)} style={{ color: '#0ea5e9' }}>
                                                <span className="material-symbols-outlined">edit</span>
                                                Edit
                                            </button>
                                            <button className="sale-action-btn delete" onClick={() => handleDeleteTransaction(transaction.id || transaction._id)}>
                                                <span className="material-symbols-outlined">delete</span>
                                                Delete
                                            </button>
                                            <button className="sale-action-btn view" onClick={() => handleViewBill(transaction)}>
                                                <span className="material-symbols-outlined">receipt_long</span>
                                                Bill
                                            </button>
                                            </div>
                                        </div>
                                        );
                                    })
                                ) : (
                                <div className="no-data-mobile">
                                    <span className="material-symbols-outlined">search_off</span>
                                    <p>No sales records found for today</p>
                                </div>
                            )}
                        </div>

                        <div className="table-footer">
                            <div className="pagination-info">
                                {filteredTransactions.length > 10 
                                    ? `Showing 10 Most Recent of ${filteredTransactions.length} Today's Sales` 
                                    : `Showing ${filteredTransactions.length} Sales Records`}
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

            {(showBillModal || isAutoSharing) && selectedBill && (
                <div
                    className="bill-modal-overlay"
                    onClick={() => setShowBillModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: isAutoSharing ? 'transparent' : 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '20px',
                        zIndex: isAutoSharing ? -1000 : 3000,
                        overflow: 'auto',
                        backdropFilter: isAutoSharing ? 'none' : 'blur(6px)',
                        cursor: 'pointer',
                        opacity: isAutoSharing ? 0.01 : 1, // Keep it slightly visible so DOM rendering engine counts it
                        pointerEvents: isAutoSharing ? 'none' : 'auto'
                    }}
                >
                    <div
                        className="bill-modal-content"
                        id="printable-bill"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            padding: '0',
                            background: '#ffffff',
                            maxWidth: '850px',
                            width: '850px',
                            zoom: window.innerWidth < 850 ? (window.innerWidth - 40) / 850 : 1,
                            margin: 'auto',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
                            border: 'none',
                            borderRadius: '4px',
                            position: 'relative',
                            cursor: 'default'
                        }}
                    >
                        {/* Google Fonts */}
                        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
                        <style>{`
                            @media print {
                                @page { size: portrait; margin: 0; }
                                .no-print, .sidebar, .topbar, .navbar, .top-nav, .bill-modal-overlay > *:not(#printable-bill) { display: none !important; }
                                body, html { 
                                    margin: 0 !important; 
                                    padding: 0 !important; 
                                    background: #fff !important; 
                                    width: 850px !important; /* Force exact preview width */
                                    height: auto !important; 
                                    -webkit-print-color-adjust: exact !important; 
                                    print-color-adjust: exact !important; 
                                }
                                .bill-modal-overlay {
                                    position: absolute !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    background: #fff !important;
                                    padding: 0 !important;
                                    display: block !important;
                                    backdrop-filter: none !important;
                                    width: 850px !important;
                                }
                                #printable-bill { 
                                    position: relative !important;
                                    width: 850px !important; 
                                    min-width: 850px !important;
                                    max-width: 850px !important;
                                    margin: 0 !important; 
                                    padding: 0 !important;
                                    box-shadow: none !important;
                                    visibility: visible !important;
                                    border: none !important;
                                    zoom: 1 !important;
                                    transform: none !important;
                                }
                                body * { visibility: hidden; }
                                #printable-bill, #printable-bill * { visibility: visible; }
                                .ci-tbl-head tr { background-color: #1a6b3c !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                                .ci-tbl-head th { color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                                .ci-total-row { background-color: #1a6b3c !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                                .ci-footer { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                                .ci-company-name, .ci-invoice-title, .ci-billto-title, .ci-section-title { color: #1a6b3c !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                            }
                            #printable-bill { font-family: 'Inter', sans-serif; background: #fff; color: #1a1a1a; margin-bottom: 20px; min-width: 850px; }
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
                                        <th style={{ width: '30%' }}>Product Name</th>
                                        <th style={{ width: '12%' }}>Size</th>
                                        <th style={{ width: '14%' }}>HSN Code</th>
                                        <th style={{ width: '10%' }}>Pieces</th>
                                        <th style={{ width: '13%' }}>Rate</th>
                                        <th style={{ width: '15%' }}>Amount</th>
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
                                                <td style={{ fontWeight: '500' }}>{item.hsn || '-'}</td>
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
                                <div className="ci-pay-row">Payment Status: <span style={{ color: selectedBill.paidStatus === 'Paid' ? '#15803d' : '#dc2626', fontWeight: '800' }}>{selectedBill.paidStatus}</span></div>
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
                                onClick={() => sendInvoiceToWhatsApp(selectedBill)}
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
                                            placeholder="Enter email address"
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
                                                phone: "",
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
