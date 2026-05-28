import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../../utils/axiosConfig.js';
import { useAppContext } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import './Sales.css';
import logo from '../../assets/logo.png';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const getFormattedTime = (transaction) => {
    if (!transaction.date) return "-";
    try {
        const parts = transaction.date.split(', ');
        if (parts.length > 1) return parts[1];
        return parts[0];
    } catch (e) {
        return "-";
    }
};

const SalesHistory = () => {
    const { clients } = useAppContext();
    const { user, isAdmin, canEdit } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [exportType, setExportType] = useState('all'); // all, paid, unpaid
    const [exportFormat, setExportFormat] = useState('csv'); // csv, excel
    const [exportLoading, setExportLoading] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusUpdateTarget, setStatusUpdateTarget] = useState(null);

    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/sales');
            const sorted = response.data.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.date);
                const dateB = new Date(b.createdAt || b.date);
                return dateB - dateA;
            });
            setTransactions(sorted);
        } catch (err) {
            console.error("Error fetching sales history:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const filteredTransactions = useMemo(() => {
        // Non-admins can only see their own logged sales
        const baseList = isAdmin
            ? transactions
            : transactions.filter(t => {
                const soldBy = String(t.soldBy || t.recordedBy || '').trim().toLowerCase();
                const currentName = String(user?.name || '').trim().toLowerCase();
                return soldBy === currentName;
              });

        return baseList.filter(t => {
            const searchLower = searchTerm.toLowerCase();
            const productMatch = t.saleItems?.some(item =>
                (item.productName && item.productName.toLowerCase().includes(searchLower)) ||
                (item.baseName && item.baseName.toLowerCase().includes(searchLower))
            );
            
            return (
                (t.company && t.company.toLowerCase().includes(searchLower)) ||
                (t.customer && t.customer.toLowerCase().includes(searchLower)) ||
                (t.invoiceNo && t.invoiceNo.toLowerCase().includes(searchLower)) ||
                (t.product && t.product.toLowerCase().includes(searchLower)) ||
                productMatch
            );
        });
    }, [transactions, searchTerm, isAdmin, user]);

    const handleDeleteTransaction = async (id) => {
        if (!window.confirm("Are you sure you want to delete this sales record?")) return;
        try {
            await axios.delete(`/sales/${id}`);
            setTransactions(prev => prev.filter(t => (t.id || t._id) !== id));
            setFeedbackMessage("✅ Transaction deleted successfully");
            setTimeout(() => setFeedbackMessage(""), 3000);
        } catch (err) {
            console.error("Error deleting transaction:", err);
            alert("Failed to delete transaction.");
        }
    };

    const handleTogglePaymentStatus = (transaction) => {
        const currentStatus = (transaction.paidStatus || transaction.paymentStatus || 'Paid').toLowerCase();
        if (currentStatus !== 'unpaid') return;
        setStatusUpdateTarget(transaction);
        setShowStatusModal(true);
    };

    const confirmStatusUpdate = async () => {
        if (!statusUpdateTarget) return;

        try {
            const updatedData = { paidStatus: 'Paid', paymentMode: 'Cash' };
            const response = await axios.put(`/sales/${statusUpdateTarget.id || statusUpdateTarget._id}`, updatedData);

            if (response.data) {
                setTransactions(prev => prev.map(t =>
                    (t.id || t._id) === (statusUpdateTarget.id || statusUpdateTarget._id)
                        ? { ...t, paidStatus: 'Paid', paymentMode: 'Cash' }
                        : t
                ));

                setFeedbackMessage("✅ Status updated to PAID");
                setTimeout(() => setFeedbackMessage(""), 3000);
            }
        } catch (err) {
            console.error("Error updating payment status:", err);
            alert("Failed to update status. Please try again.");
        } finally {
            setShowStatusModal(false);
            setStatusUpdateTarget(null);
        }
    };

    const handleViewBill = (transaction, returnOnly = false) => {

        // Match client by company name OR contact person name for more robust lookup
        const clientInfo = clients?.find(c =>
            (c.companyName && transaction.company && c.companyName === transaction.company) ||
            (c.contactPerson && transaction.customer && c.contactPerson === transaction.customer)
        );

        // For WhatsApp: Client database phone takes first priority, then fall back to transaction phone
        const resolvedPhone = clientInfo?.phone || transaction.phone || transaction.customerPhone || "N/A";

        const billData = {
            invoiceNo: transaction.invoiceNo || (transaction.id || transaction._id)?.slice(-6).toUpperCase() || "N/A",
            date: transaction.date?.split(', ')[0] || new Date(transaction.createdAt).toLocaleDateString(),
            company: transaction.company || "Direct Sale",
            customer: transaction.customer || clientInfo?.contactPerson || "Walking Customer",
            phone: resolvedPhone,
            email: transaction.email || transaction.customerEmail || clientInfo?.email || "N/A",
            gstin: transaction.gstin || transaction.customerGstin || clientInfo?.gst || "N/A",
            address: transaction.address || transaction.customerAddress || clientInfo?.address || "N/A",
            items: transaction.saleItems?.map(item => ({
                product: item.productName || item.product,
                baseName: item.baseName || item.productName || item.product,
                size: item.size || "-",
                qty: item.qty,
                rate: item.rate || (item.qty > 0 ? (item.amount / item.qty) : 0),
                amount: item.amount,
                gstRate: item.gstRate || 0,
                gstAmount: item.gstAmount || 0,
                hsn: item.hsn || "-"
            })) || [
                    {
                        product: transaction.product,
                        baseName: transaction.product,
                        size: transaction.size || "—",
                        qty: Math.abs(transaction.quantity),
                        rate: transaction.amount / Math.abs(transaction.quantity) || 0,
                        amount: transaction.totalAmount || transaction.amount,
                        gstRate: 0,
                        gstAmount: 0,
                        hsn: "-"
                    }
                ],
            totalAmount: transaction.totalAmount || transaction.amount,
            paidStatus: transaction.paidStatus || transaction.paymentStatus || "Paid",
            amountPaid: transaction.amountPaid || 0,
            paymentMode: transaction.paymentMode || "Cash",
            deliveryMode: transaction.deliveryMode || "Self Pickup",
            deliveredBy: transaction.deliveredBy || "N/A",
            soldBy: transaction.soldBy || "N/A"
        };

        if (returnOnly) return billData;
        setSelectedBill(billData);
        setShowBillModal(true);
    };

    const sendInvoiceToWhatsApp = async (bill) => {
        const invoiceElement = document.getElementById('printable-bill');
        if (!invoiceElement) {
            alert('Invoice preview not found.');
            return;
        }

        let phoneNum = (bill.phone && bill.phone !== 'N/A' && bill.phone.trim() !== "") ? bill.phone : "";
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
            alert('❌ No valid phone number found.\n\nPlease add the client\'s phone number in Client Details to send via WhatsApp.');
            return;
        }

        setFeedbackMessage(`🚀 Generating Invoice & Opening WhatsApp...`);

        try {
            const canvas = await html2canvas(invoiceElement, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794,
                height: invoiceElement.scrollHeight,
                windowWidth: 794,
                windowHeight: invoiceElement.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    clonedDoc.documentElement.style.setProperty('width', '794px', 'important');
                    clonedDoc.body.style.setProperty('width', '794px', 'important');
                    clonedDoc.body.style.setProperty('overflow', 'visible', 'important');
                    const el = clonedDoc.getElementById('printable-bill');
                    if (el) {
                        el.style.setProperty('width', '794px', 'important');
                        el.style.setProperty('min-width', '794px', 'important');
                        el.style.setProperty('max-width', '794px', 'important');
                        el.style.zoom = '1';
                        el.style.transform = 'none';
                        el.style.margin = '0';
                        el.style.padding = '0';
                        el.style.boxShadow = 'none';
                        el.style.position = 'absolute';
                        el.style.top = '0';
                        el.style.left = '0';
                        el.style.height = 'auto';
                        el.style.overflow = 'visible';
                    }
                    const container = clonedDoc.getElementById('printable-invoice');
                    if (container) {
                        container.style.setProperty('width', '794px', 'important');
                        container.style.setProperty('min-width', '794px', 'important');
                        container.style.setProperty('max-width', '794px', 'important');
                        container.style.setProperty('padding', '45px 35px', 'important');
                        container.style.setProperty('box-shadow', 'none', 'important');
                    }
                    const actionButtons = clonedDoc.querySelectorAll('.no-print');
                    actionButtons.forEach(btn => {
                        btn.style.display = 'none';
                    });
                }
            });

            // Generate full A4 PDF from canvas
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdfWidth = 210;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            const doc = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: [pdfWidth, pdfHeight],
                compress: true
            });
            doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

            // WhatsApp URL — opens WhatsApp with the client's phone number pre-selected
            const message = encodeURIComponent(`*INVOICE: ${bill.invoiceNo}*\n\nDear *${bill.customer}*,\n\nThank you for your business with *AVS ECO INDUSTRIES*! 🌿\n\nPlease find your invoice PDF attached.`);
            const waUrl = `https://wa.me/${phone}?text=${message}`;

            // Download PDF
            doc.save(`Invoice_${bill.invoiceNo}.pdf`);

            // To avoid popup blockers on mobile, use window.location.href to redirect directly to the WhatsApp app.
            // On PC/desktop, open in a new tab via window.open so the main page remains open.
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                setTimeout(() => {
                    window.location.href = waUrl;
                }, 800);
            } else {
                setTimeout(() => {
                    window.open(waUrl, '_blank');
                }, 800);
            }

            setFeedbackMessage("✅ PDF ready! WhatsApp opened with client's number.");
            setTimeout(() => setFeedbackMessage(""), 4000);
        } catch (err) {
            console.error('WhatsApp capture failed:', err);
            alert('Could not generate invoice PDF. Please try again.');
        } finally {
            setFeedbackMessage("");
        }
    };

    const downloadInvoiceAsPDF = async (bill) => {
        const invoiceElement = document.getElementById('printable-bill');
        if (!invoiceElement) {
            alert('Invoice preview not found.');
            return;
        }

        setFeedbackMessage(`🚀 Generating High-Res A4 Bill...`);

        try {
            const canvas = await html2canvas(invoiceElement, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794,
                height: invoiceElement.scrollHeight,
                windowWidth: 794,
                windowHeight: invoiceElement.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                onclone: (clonedDoc) => {
                    clonedDoc.documentElement.style.setProperty('width', '794px', 'important');
                    clonedDoc.body.style.setProperty('width', '794px', 'important');
                    clonedDoc.body.style.setProperty('overflow', 'visible', 'important');
                    const el = clonedDoc.getElementById('printable-bill');
                    if (el) {
                        el.style.setProperty('width', '794px', 'important');
                        el.style.setProperty('min-width', '794px', 'important');
                        el.style.setProperty('max-width', '794px', 'important');
                        el.style.zoom = '1';
                        el.style.transform = 'none';
                        el.style.margin = '0';
                        el.style.padding = '0';
                        el.style.boxShadow = 'none';
                        el.style.position = 'absolute';
                        el.style.top = '0';
                        el.style.left = '0';
                        el.style.height = 'auto';
                        el.style.overflow = 'visible';
                    }
                    const container = clonedDoc.getElementById('printable-invoice');
                    if (container) {
                        container.style.setProperty('width', '794px', 'important');
                        container.style.setProperty('min-width', '794px', 'important');
                        container.style.setProperty('max-width', '794px', 'important');
                        container.style.setProperty('padding', '45px 35px', 'important');
                        container.style.setProperty('box-shadow', 'none', 'important');
                    }
                    const actionButtons = clonedDoc.querySelectorAll('.no-print');
                    actionButtons.forEach(btn => {
                        btn.style.display = 'none';
                    });
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            // Calculate exact PDF dimensions in mm to match the canvas aspect ratio (maintaining exact scale)
            const pdfWidth = 210;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // Generate a standard or custom height portrait PDF to display the full invoice edge-to-edge
            const doc = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: [pdfWidth, pdfHeight],
                compress: true
            });

            // Add the A4 preview image to fill the PDF page 100% perfectly edge-to-edge
            doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            doc.save(`Invoice_${bill.invoiceNo}.pdf`);
            setFeedbackMessage("✅ PDF Downloaded successfully!");
            setTimeout(() => setFeedbackMessage(""), 3000);
        } catch (err) {
            console.error('PDF generation failed:', err);
            alert('Could not generate full invoice. Please try again.');
        } finally {
            setFeedbackMessage("");
        }
    };

    const exportToCSV = (data, fileName) => {
        const headers = ["Date", "Customer", "Company", "Products", "HSN Codes", "Pieces", "Subtotal", "Total GST", "Grand Total", "Status"];
        const csvData = data.map((item) => {
            const baseNames = [...new Set(item.saleItems?.map(si => si.baseName))].filter(Boolean);
            const hsnCodes = [...new Set(item.saleItems?.map(si => si.hsn))].filter(Boolean);
            const products = baseNames.length > 0 ? baseNames.join('; ') : (item.product || "-");
            const hsns = hsnCodes.length > 0 ? hsnCodes.join('; ') : "-";
            const totalPieces = item.saleItems?.reduce((sum, si) => sum + (Number(si.qty) || 0), 0) || Math.abs(item.quantity || 0);
            const subtotal = item.saleItems?.reduce((sum, si) => sum + (Number(si.amount) || 0), 0) || (item.totalAmount || item.amount || 0);
            const totalGst = item.saleItems?.reduce((sum, si) => sum + (Number(si.gstAmount) || 0), 0) || 0;
            const grandTotal = item.totalAmount || item.amount || 0;

            return [
                item.date?.split(', ')[0] || new Date(item.createdAt).toLocaleDateString(),
                item.customer || "-",
                item.company || "-",
                products,
                hsns,
                totalPieces,
                subtotal,
                totalGst,
                grandTotal,
                item.paidStatus || item.paymentStatus || "Paid"
            ];
        });

        const csvContent = [headers, ...csvData].map((e) => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const confirmExport = () => {
        setExportLoading(true);

        setTimeout(() => {
            let dataToExport = filteredTransactions;
            if (exportType !== 'all') {
                dataToExport = filteredTransactions.filter(t =>
                    (t.paidStatus || t.paymentStatus || 'Paid').toLowerCase() === exportType.toLowerCase()
                );
            }

            const fileName = `Sales_Report_${exportType}_${new Date().toISOString().split('T')[0]}`;
            exportToCSV(dataToExport, fileName);

            setExportLoading(false);
            setShowExportModal(false);
            setFeedbackMessage("✅ Report exported successfully");
            setTimeout(() => setFeedbackMessage(""), 3000);
        }, 1000);
    };

    return (
        <div className="erp-page">
            <div className="erp-header">
                <div className="header-left">
                    <h1 className="erp-title">Transaction History</h1>
                </div>
                <div className="erp-header-actions">
                    <button className="erp-header-btn solid btn-export" onClick={() => setShowExportModal(true)}>
                        <span className="material-symbols-outlined">download</span>
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            {feedbackMessage && (
                <div className={`feedback-toast ${feedbackMessage.includes('✅') ? 'success' : ''}`}>
                    <span className="material-symbols-outlined">
                        {feedbackMessage.includes('✅') ? 'check_circle' : 'info'}
                    </span>
                    <span>{feedbackMessage}</span>
                </div>
            )}

            <div className="erp-controls">
                <div className="erp-search">
                    <span className="material-symbols-outlined erp-search-icon">search</span>
                    <input
                        type="text"
                        placeholder="Search company, customer or products..."
                        className="erp-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="erp-search-clear" onClick={() => setSearchTerm('')}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="erp-card">
                <div className="erp-card-header">
                    <h3 className="erp-card-title">
                        <span className="material-symbols-outlined">analytics</span>
                        Sales Records ({filteredTransactions.length})
                    </h3>
                </div>
                <div className="erp-table-wrapper desktop-only-table">
                    <table className="erp-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>S.NO</th>
                                <th>DATE & TIME</th>
                                <th>COMPANY / CUSTOMER</th>
                                <th>PRODUCTS</th>
                                <th>AMOUNT</th>
                                <th>STATUS</th>
                                <th>SOLD BY</th>
                                <th style={{ width: '100px' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="erp-table-loading">
                                        <div className="erp-spinner"></div>
                                        <p>Loading sales history...</p>
                                    </td>
                                </tr>
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((transaction, index) => {
                                    const baseNames = [...new Set(transaction.saleItems?.map(item => item.baseName))].filter(Boolean);
                                    const baseProducts = baseNames.length > 0 ? baseNames.join(', ') : (transaction.product || "-");
                                    const totalPieces = transaction.saleItems?.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) || Math.abs(transaction.quantity || 0);
                                    const displayAmount = transaction.totalAmount || transaction.amount || 0;
                                    const formattedTime = getFormattedTime(transaction);
                                    const datePart = transaction.date?.split(', ')[0] || new Date(transaction.createdAt).toLocaleDateString();
                                    const status = (transaction.paidStatus || transaction.paymentStatus || 'Paid').toLowerCase();

                                    return (
                                        <tr key={transaction.id || transaction._id}>
                                            <td className="erp-td-center">{index + 1}</td>
                                            <td>
                                                <div className="erp-td-primary">{datePart}</div>
                                                <div className="erp-td-secondary">{formattedTime}</div>
                                            </td>
                                            <td>
                                                <div className="erp-td-primary">{transaction.company || "Direct Sale"}</div>
                                                <div className="erp-td-secondary">{transaction.customer || "Walking Customer"}</div>
                                            </td>
                                            <td>
                                                <div className="erp-td-primary erp-text-ellipsis" title={baseProducts} style={{ maxWidth: '200px' }}>
                                                    {baseProducts}
                                                </div>
                                                <div className="erp-td-secondary">{totalPieces} Pieces</div>
                                            </td>
                                            <td className="erp-td-amount">
                                                ₹{displayAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td>
                                                <span
                                                    className={`erp-badge ${status === 'paid' ? 'success' : status === 'unpaid' ? 'danger' : 'warning'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (status === 'unpaid' && canEdit) handleTogglePaymentStatus(transaction);
                                                    }}
                                                    style={{ cursor: (status === 'unpaid' && canEdit) ? 'pointer' : 'default' }}
                                                >
                                                    {transaction.paidStatus || transaction.paymentStatus || 'Paid'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="erp-badge neutral">{transaction.soldBy || "-"}</span>
                                            </td>
                                            <td>
                                                <div className="erp-table-actions">
                                                    <button
                                                        className="erp-btn ghost"
                                                        onClick={(e) => { e.stopPropagation(); handleViewBill(transaction); }}
                                                        title="View Bill"
                                                    >
                                                        <span className="material-symbols-outlined" style={{ color: '#10b981' }}>receipt_long</span>
                                                    </button>
                                                    {canEdit && (
                                                        <button
                                                            className="erp-btn ghost"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(transaction.id || transaction._id); }}
                                                            title="Delete"
                                                        >
                                                            <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="erp-table-empty">
                                        <span className="material-symbols-outlined">receipt_long</span>
                                        <p>No sales records found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View */}
                <div className="mobile-history-cards">
                    {loading ? (
                        <div className="erp-table-loading">
                            <div className="erp-spinner"></div>
                            <p>Loading sales history...</p>
                        </div>
                    ) : filteredTransactions.length > 0 ? (
                        filteredTransactions.map((transaction) => {
                            const baseNames = [...new Set(transaction.saleItems?.map(item => item.baseName))].filter(Boolean);
                            const baseProducts = baseNames.length > 0 ? baseNames.join(', ') : (transaction.product || "-");
                            const totalPieces = transaction.saleItems?.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) || Math.abs(transaction.quantity || 0);
                            const displayAmount = transaction.totalAmount || transaction.amount || 0;
                            const formattedTime = getFormattedTime(transaction);
                            const datePart = transaction.date?.split(', ')[0] || new Date(transaction.createdAt).toLocaleDateString();
                            const status = (transaction.paidStatus || transaction.paymentStatus || 'Paid').toLowerCase();

                            return (
                                <div key={transaction.id || transaction._id} className="mobile-sale-card">
                                    <div className="sale-card-header">
                                        <div className="sale-date">
                                            <span className="material-symbols-outlined">calendar_today</span>
                                            {datePart} &bull; {formattedTime}
                                        </div>
                                        <span
                                            className={`erp-badge ${status === 'paid' ? 'success' : status === 'unpaid' ? 'danger' : 'warning'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (status === 'unpaid' && canEdit) handleTogglePaymentStatus(transaction);
                                            }}
                                        >
                                            {transaction.paidStatus || transaction.paymentStatus || 'Paid'}
                                        </span>
                                    </div>
                                    <div className="sale-card-body">
                                        <div className="company-info">
                                            <h4 className="sale-company">{transaction.company || "Direct Sale"}</h4>
                                            <p className="sale-customer">{transaction.customer || "Walking Customer"}</p>
                                        </div>
                                        <div className="sale-details-grid">
                                            <div className="detail-item">
                                                <span className="detail-label">TOTAL AMOUNT</span>
                                                <span className="detail-value amount">₹{displayAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">SOLD BY</span>
                                                <span className="detail-value">{transaction.soldBy || "-"}</span>
                                            </div>
                                        </div>
                                        <div className="sale-product-line">
                                            <span className="material-symbols-outlined">inventory_2</span>
                                            {baseProducts} ({totalPieces} pcs)
                                        </div>
                                    </div>
                                    <div className="sale-card-actions" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="sale-action-btn view"
                                            onClick={() => handleViewBill(transaction)}
                                        >
                                            <span className="material-symbols-outlined">receipt_long</span>
                                            View Bill
                                        </button>
                                        {canEdit && (
                                            <button className="sale-action-btn delete" onClick={() => handleDeleteTransaction(transaction.id || transaction._id)}>
                                                <span className="material-symbols-outlined">delete</span>
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="erp-table-empty">
                            <span className="material-symbols-outlined">receipt_long</span>
                            <h4>No sales records found</h4>
                        </div>
                    )}
                </div>
            </div>

            {/* Bill Modal */}
            {showBillModal && selectedBill && (
                <div
                    className="bill-modal-overlay"
                    onClick={() => setShowBillModal(false)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        display: 'block', /* Changed to block for natural scrolling */
                        padding: '20px', zIndex: 3000,
                        overflowX: 'auto', overflowY: 'auto', backdropFilter: 'blur(6px)',
                        cursor: 'pointer', opacity: 1,
                        pointerEvents: 'auto',
                        WebkitOverflowScrolling: 'touch' /* Smooth scroll on iOS */
                    }}
                >
                    <div
                        className="bill-modal-content responsive-bill-modal"
                        id="printable-bill"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
                        <style>{`
                            .responsive-bill-modal { 
                                background: transparent !important; 
                                box-shadow: none !important; 
                                border: none !important; 
                                width: 794px !important; 
                                min-width: 794px !important; 
                                max-width: 794px !important; 
                                margin: 20px auto !important; 
                            }
                            .ci-container { 
                                padding: 45px 35px !important; 
                                background: #ffffff !important; 
                                width: 794px !important; 
                                min-height: 1123px !important; 
                                box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important; 
                                box-sizing: border-box !important; 
                                display: flex; 
                                flex-direction: column; 
                                border-radius: 4px;
                            }
                            .ci-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000000; padding: 0 0 18px 0; margin-bottom: 24px; }
                            .ci-logo-area { display: flex; align-items: flex-start; gap: 18px; width: 62%; }
                            .ci-logo-img { width: 90px; height: 90px; object-fit: contain; }
                            .ci-company-name { font-size: 22px; font-weight: 900; color: #000000; letter-spacing: -0.01em; margin-bottom: 4px; }
                            .ci-company-addr { font-size: 13px; color: #64748b; font-weight: 500; line-height: 1.45; }
                            .ci-header-right { width: 35%; display: flex; flex-direction: column; align-items: flex-end; }
                            .ci-invoice-title { font-size: 28px; font-weight: 900; color: #000000; text-align: right; letter-spacing: 0.05em; margin-bottom: 8px; }
                            .ci-invoice-meta { font-size: 13px; color: #334155; text-align: right; display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
                            .ci-invoice-meta div { white-space: nowrap; }
                            .ci-billto { display: flex; justify-content: space-between; padding: 0; margin-bottom: 20px; gap: 40px; }
                            .ci-billto-title { font-size: 12px; font-weight: 800; color: #000000; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
                            .ci-billto-row { font-size: 13px; margin-bottom: 5px; color: #1e293b; line-height: 1.5; }
                            .ci-billto-right { text-align: right; max-width: 320px; word-break: break-word; display: flex; flex-direction: column; align-items: flex-end; }
                            .ci-section-title { font-size: 15px; font-weight: 900; color: #000000; padding: 20px 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em; }
                            .ci-table-wrap { padding: 0; }
                            .ci-table { width: 100%; border-collapse: collapse; margin-top: 16px; border: 1.5px solid #000000; }
                            .ci-tbl-head th { background: #ffffff; color: #000000; padding: 12px 14px; font-size: 12px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #000000; border-right: 1px solid #000000; }
                            .ci-tbl-head th:last-child { border-right: none; }
                            .ci-tbody td { padding: 14px 14px; font-size: 13px; color: #000000; border-bottom: 1px solid #000000; border-right: 1px solid #000000; font-weight: 500; text-align: center; }
                            .ci-tbody tr:last-child td { border-bottom: none; }
                            .ci-tbody td:last-child { border-right: none; }
                            .ci-tbody tr:nth-child(even) { background: #fcfdfe; }
                            .ci-summary { display: flex; justify-content: flex-end; padding: 0; margin-top: -1.5px; }
                            .ci-summary-box { width: 280px; border: 1.5px solid #000000; border-top: none; }
                            .ci-sum-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 12.5px; border-bottom: 1px solid #e2e8f0; }
                            .ci-total-row { background: #ffffff; color: #000000; display: flex; justify-content: space-between; padding: 14px; font-size: 15px; font-weight: 900; border-top: 2px solid #000000; }
                            .ci-payment { display: grid; grid-template-columns: 1fr 1fr; padding: 24px 0; border-top: 2px solid #000000; margin-top: 20px; }
                            .ci-payment div { font-size: 13px; color: #1e293b; line-height: 1.6; font-weight: 500; }
                            .ci-pay-title { font-size: 13px; font-weight: 800; color: #000000; margin-bottom: 10px; text-transform: uppercase; }
                            .ci-footer { border-top: 2px solid #000000; margin-top: auto; padding: 20px 0 0 0; text-align: center; font-size: 12px; color: #64748b; font-weight: 500; }

                            @media print {
                                @page { size: A4 portrait; margin: 0; }
                                .no-print { display: none !important; }
                                .sidebar, .topbar, .mobile-overlay, aside, header, .erp-header, .erp-controls, .erp-card, .feedback-toast, .mobile-history-cards { 
                                    display: none !important; 
                                }
                                body, html { 
                                    margin: 0 !important; 
                                    padding: 0 !important; 
                                    background: #ffffff !important; 
                                    width: 794px !important; 
                                }
                                .bill-modal-overlay { 
                                    position: absolute !important; 
                                    top: 0 !important; 
                                    left: 0 !important; 
                                    width: 794px !important; 
                                    height: auto !important; 
                                    background: transparent !important; 
                                    padding: 0 !important; 
                                    margin: 0 !important;
                                    overflow: visible !important;
                                }
                                .bill-modal-content, .responsive-bill-modal { 
                                    width: 794px !important; 
                                    max-width: 794px !important; 
                                    min-width: 794px !important; 
                                    box-shadow: none !important; 
                                    border: none !important; 
                                    margin: 0 !important; 
                                    padding: 0 !important; 
                                    background: transparent !important;
                                }
                                .ci-container { 
                                    padding: 45px 35px !important; 
                                    min-height: 1123px !important; 
                                    width: 794px !important; 
                                    background: #ffffff !important;
                                    border: none !important;
                                    box-shadow: none !important;
                                }
                            }
                        `}</style>
                        <div className="ci-container" id="printable-invoice">
                            <div className="ci-header">
                                <div className="ci-logo-area">
                                    <img src={logo} alt="Logo" className="ci-logo-img" />
                                    <div>
                                        <div className="ci-company-name">AVS ECO INDUSTRIES</div>
                                        <div className="ci-company-addr">3/2, Mettu Street, Veeraragavapuram (Village & Post),</div>
                                        <div className="ci-company-addr">Thiruvalangadu, Thiruvallur (Dist), Tiruttani (TK)</div>
                                        <div className="ci-company-addr">Pincode - 631210</div>
                                        <div className="ci-company-addr" style={{ marginTop: '2px' }}><b>Contact No:</b> 80988 02581, 9444730165, 63836 32726</div>
                                    </div>
                                </div>
                                <div className="ci-header-right">
                                    <div className="ci-invoice-title">INVOICE</div>
                                    <div className="ci-invoice-meta">
                                        <div><b>GSTIN:</b> {selectedBill.gstin || "N/A"}</div>
                                        <div><b>Invoice Number:</b> AVS-{selectedBill.invoiceNo}</div>
                                        <div><b>Date:</b> {selectedBill.date}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="ci-billto">
                                <div className="ci-billto-left">
                                    <div className="ci-billto-title">Bill To</div>
                                    <div className="ci-billto-row"><b>Company:</b> {selectedBill.company}</div>
                                    <div className="ci-billto-row"><b>Contact:</b> {selectedBill.customer}</div>
                                    <div className="ci-billto-row"><b>Phone:</b> {selectedBill.phone}</div>
                                </div>
                                <div className="ci-billto-right" style={{ textAlign: 'right' }}>
                                    <div className="ci-billto-title">Customer Address</div>
                                    <div className="ci-billto-row">{selectedBill.address}</div>
                                </div>
                            </div>
                            <div className="ci-section-title">Billing Details</div>
                            <div className="ci-table-wrap">
                                <table className="ci-table">
                                    <thead className="ci-tbl-head">
                                        <tr>
                                            <th style={{ width: '6%', textAlign: 'center' }}>S.NO</th>
                                            <th style={{ width: '14%', textAlign: 'center' }}>HSN CODE</th>
                                            <th style={{ width: '38%', textAlign: 'left' }}>PRODUCT NAME</th>
                                            <th style={{ width: '8%', textAlign: 'center' }}>QTY</th>
                                            <th style={{ width: '14%', textAlign: 'center' }}>RATE</th>
                                            <th style={{ width: '8%', textAlign: 'center' }}>GST</th>
                                            <th style={{ width: '16%', textAlign: 'center' }}>AMOUNT</th>
                                        </tr>
                                    </thead>
                                    <tbody className="ci-tbody">
                                        {selectedBill.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td>{item.hsn}</td>
                                                <td style={{ textAlign: 'left' }}>
                                                    <b>{item.baseName}</b> <span style={{ fontSize: '11px', color: '#64748b' }}>({item.size})</span>
                                                </td>
                                                <td>{item.qty}</td>
                                                <td>₹{item.rate?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td>
                                                    {item.gstRate || 0}%
                                                </td>
                                                <td>₹{(item.amount + (item.gstAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="ci-summary">
                                <div className="ci-summary-box">
                                    <div className="ci-sum-row">
                                        <span>Subtotal:</span>
                                        <span>₹{selectedBill.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="ci-sum-row">
                                        <span>Total GST:</span>
                                        <span>₹{selectedBill.items.reduce((sum, item) => sum + (item.gstAmount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="ci-total-row">
                                        <span>GRAND TOTAL:</span>
                                        <span>₹{selectedBill.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {selectedBill.paidStatus === 'Partial' && (
                                        <>
                                            <div className="ci-sum-row" style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: 700, borderBottom: '1px solid #cbd5e1' }}>
                                                <span>Advance Paid:</span>
                                                <span>₹{selectedBill.amountPaid?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</span>
                                            </div>
                                            <div className="ci-sum-row" style={{ background: '#fff1f2', color: '#be123c', fontWeight: 800, fontSize: '13.5px', borderBottom: 'none' }}>
                                                <span>Balance Due:</span>
                                                <span>₹{(selectedBill.totalAmount - (selectedBill.amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="ci-payment">
                                <div>
                                    <div className="ci-pay-title">PAYMENT:</div>
                                    <div>Status: {selectedBill.paidStatus}</div>
                                    <div>Mode: {selectedBill.paymentMode}</div>
                                </div>
                                <div>
                                    <div className="ci-pay-title">DELIVERY:</div>
                                    <div>By: {selectedBill.deliveredBy}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bill-modal-footer no-print">
                            <button className="bill-btn bill-btn-close" onClick={() => setShowBillModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                                Close
                            </button>
                            <button className="bill-btn bill-btn-print" onClick={() => window.print()}>
                                <span className="material-symbols-outlined">print</span>
                                Print
                            </button>
                            <button className="bill-btn" onClick={() => downloadInvoiceAsPDF(selectedBill)} style={{ background: '#006A4E', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                                <span className="material-symbols-outlined">download</span>
                                Download PDF
                            </button>
                            <button className="bill-btn bill-btn-whatsapp" onClick={() => sendInvoiceToWhatsApp(selectedBill)}>
                                <span className="material-symbols-outlined">Chat</span>
                                WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="header-icon-title">
                                <span className="material-symbols-outlined header-icon">download</span>
                                <h3>Export Sales Report</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowExportModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="export-options-grid">
                                <div className="export-option-group">
                                    <label className="export-label">Transaction Type</label>
                                    <div className="export-selector">
                                        <button
                                            className={`selector-btn ${exportType === 'all' ? 'active' : ''}`}
                                            onClick={() => setExportType('all')}
                                        >All</button>
                                        <button
                                            className={`selector-btn ${exportType === 'paid' ? 'active' : ''}`}
                                            onClick={() => setExportType('paid')}
                                        >Paid</button>
                                        <button
                                            className={`selector-btn ${exportType === 'unpaid' ? 'active' : ''}`}
                                            onClick={() => setExportType('unpaid')}
                                        >Unpaid</button>
                                    </div>
                                </div>
                                <div className="export-option-group">
                                    <label className="export-label">Format</label>
                                    <div className="export-selector">
                                        <button
                                            className={`selector-btn ${exportFormat === 'csv' ? 'active' : ''}`}
                                            onClick={() => setExportFormat('csv')}
                                        >CSV</button>
                                        <button
                                            className={`selector-btn ${exportFormat === 'excel' ? 'active' : ''}`}
                                            onClick={() => setExportFormat('excel')}
                                        >Excel</button>
                                    </div>
                                </div>
                            </div>
                            <p className="export-note">This will export the currently filtered {filteredTransactions.length} records based on your search.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-cancel" onClick={() => setShowExportModal(false)}>Cancel</button>
                            <button
                                className="modal-confirm premium-btn"
                                onClick={confirmExport}
                                disabled={exportLoading}
                            >
                                {exportLoading ? (
                                    <><div className="btn-spinner"></div> Exporting...</>
                                ) : (
                                    <><span className="material-symbols-outlined">download</span> Download Report</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Confirmation Modal */}
            {showStatusModal && (
                <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                    <div className="modal-content status-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="header-icon-title">
                                <span className="material-symbols-outlined header-icon" style={{ color: '#10b981', background: '#ecfdf5' }}>payments</span>
                                <h3>Change Payment Status</h3>
                            </div>
                            <button className="modal-close" onClick={() => setShowStatusModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
                            <div className="status-confirm-icon">
                                <span className="material-symbols-outlined">help</span>
                            </div>
                            <h4 style={{ margin: '15px 0 10px', fontSize: '18px', color: '#1e293b' }}>Mark as Paid?</h4>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
                                Are you sure you want to change the status of invoice <strong>AVS-{statusUpdateTarget?.invoiceNo}</strong> to <strong>PAID</strong>?
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-cancel" onClick={() => setShowStatusModal(false)}>No, Keep Unpaid</button>
                            <button className="modal-confirm premium-btn" onClick={confirmStatusUpdate} style={{ background: '#10b981' }}>
                                Yes, Mark as Paid
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesHistory;