import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from '../../utils/axiosConfig.js';
import { useAppContext } from '../../context/AppContext.js';
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
    const [expandedCardId, setExpandedCardId] = useState(null);

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
        return transactions.filter(t => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (t.company && t.company.toLowerCase().includes(searchLower)) ||
                (t.customer && t.customer.toLowerCase().includes(searchLower)) ||
                (t.product && t.product.toLowerCase().includes(searchLower))
            );
        });
    }, [transactions, searchTerm]);

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


        const clientInfo = clients?.find(c => c.companyName === transaction.company);
        const billData = {
            invoiceNo: transaction.invoiceNo || (transaction.id || transaction._id)?.slice(-6).toUpperCase() || "N/A",
            date: transaction.date?.split(', ')[0] || new Date(transaction.createdAt).toLocaleDateString(),
            company: transaction.company || "Direct Sale",
            customer: transaction.customer || clientInfo?.contactPerson || "Walking Customer",
            phone: transaction.phone || transaction.customerPhone || clientInfo?.phone || "N/A",
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
            alert('Please enter a valid WhatsApp number.');
            return;
        }

        setFeedbackMessage(`🚀 Generating High-Res Bill & Connecting to WhatsApp...`);

        try {
            const fullHeight = invoiceElement.scrollHeight;
            const canvas = await html2canvas(invoiceElement, {
                scale: 2.5,
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
                        el.style.margin = '0 auto';
                        el.style.boxShadow = 'none';
                        el.style.position = 'relative';
                        el.style.top = '0';
                        el.style.left = '0';
                        el.style.width = '850px';
                        el.style.height = `${fullHeight}px`;
                        el.style.overflow = 'visible';
                    }
                    const actionButtons = clonedDoc.querySelector('.no-print');
                    if (actionButtons) {
                        actionButtons.style.display = 'none';
                    }
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            const pdfWidth = (imgWidth / (3 * 96)) * 25.4;
            const pdfHeight = (imgHeight / (3 * 96)) * 25.4;

            const doc = new jsPDF({
                orientation: pdfWidth > pdfHeight ? 'l' : 'p',
                unit: 'mm',
                format: [pdfWidth, pdfHeight],
                compress: false
            });

            doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'SLOW');
            const pdfBlob = doc.output('blob');
            const pdfFile = new File([pdfBlob], `Invoice_${bill.invoiceNo}.pdf`, { type: 'application/pdf' });

            const message = `*INVOICE: ${bill.invoiceNo}*%0A%0ADear *${bill.customer}*,%0A%0AThank you for your business with *AVS ECO INDUSTRIES*! 🌿%0A%0APlease find your invoice attached below.`;
            const waUrl = `https://wa.me/${phone}?text=${message}`;

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
        <div className="stock-page">
            <div className="page-header premium-header">
                <div className="header-content">
                    <h1 className="page-title">Transaction History</h1>
                </div>
                <div className="history-actions">
                    <button className="btn-export-premium" onClick={() => setShowExportModal(true)}>
                        <span className="material-symbols-outlined">download</span>
                        <span className="export-text">Export History</span>
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

            <div className="history-filters-wrapper">
                <div className="search-box" style={{ maxWidth: '100%' }}>
                    <span className="material-symbols-outlined search-icon">search</span>
                    <input
                        type="text"
                        placeholder="Search by company, customer, or product..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ borderRadius: '12px' }}
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm('')}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="stock-table-container">
                <div className="table-header">
                    <h3 className="section-title">Sales Records</h3>
                </div>
                <div className="table-responsive desktop-only-table">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center' }}>S.NO</th>
                                <th style={{ textAlign: 'center' }}>DATE & TIME</th>
                                <th style={{ textAlign: 'center' }}>COMPANY / CUSTOMER</th>
                                <th style={{ textAlign: 'center' }}>PRODUCTS</th>
                                <th style={{ textAlign: 'center' }}>TOTAL AMOUNT</th>
                                <th style={{ textAlign: 'center' }}>STATUS</th>
                                <th style={{ textAlign: 'center' }}>SOLD BY</th>
                                <th style={{ textAlign: 'center' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                        <div className="loading-spinner"></div>
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

                                    return (
                                        <tr 
                                            key={transaction.id || transaction._id}
                                            style={{ transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '13px' }}>{datePart}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>{formattedTime}</div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ fontWeight: 600 }}>{transaction.company || "Direct Sale"}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{transaction.customer || "Walking Customer"}</div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ maxWidth: '200px', margin: '0 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={baseProducts}>
                                                    {baseProducts}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>{totalPieces} Pieces</div>
                                            </td>
                                            <td style={{ textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                                                ₹{displayAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span 
                                                    className={`payment-badge ${(transaction.paidStatus || transaction.paymentStatus || 'Paid').toLowerCase()}`}
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        if ((transaction.paidStatus || transaction.paymentStatus || 'Paid').toLowerCase() === 'unpaid') {
                                                            handleTogglePaymentStatus(transaction);
                                                        }
                                                    }}
                                                    style={{ 
                                                        cursor: (transaction.paidStatus || transaction.paymentStatus || 'Paid').toLowerCase() === 'unpaid' ? 'pointer' : 'default',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title={(transaction.paidStatus || transaction.paymentStatus || 'Paid').toLowerCase() === 'unpaid' ? "Click to mark as Paid" : ""}
                                                >
                                                    {transaction.paidStatus || transaction.paymentStatus || 'Paid'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="sold-by-badge">{transaction.soldBy || "-"}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button 
                                                        className="icon-action-btn" 
                                                        onClick={(e) => { e.stopPropagation(); handleViewBill(transaction); }} 
                                                        title="View Bill"
                                                        style={{ color: '#10b981', cursor: 'pointer' }}
                                                    >
                                                        <span className="material-symbols-outlined">receipt_long</span>
                                                    </button>
                                                    <button 
                                                        className="icon-action-btn" 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteTransaction(transaction.id || transaction._id); }} 
                                                        title="Delete" 
                                                        style={{ color: '#ef4444' }}
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
                                    <td colSpan="8" className="no-data" style={{ textAlign: 'center', padding: '40px' }}>
                                        <h4>No sales records found</h4>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View */}
                <div className="mobile-history-cards">
                    {loading ? (
                        <div className="no-data-mobile">
                            <div className="loading-spinner"></div>
                            <p>Loading sales history...</p>
                        </div>
                    ) : filteredTransactions.length > 0 ? (
                        filteredTransactions.map((transaction, index) => {
                            const baseNames = [...new Set(transaction.saleItems?.map(item => item.baseName))].filter(Boolean);
                            const baseProducts = baseNames.length > 0 ? baseNames.join(', ') : (transaction.product || "-");
                            const totalPieces = transaction.saleItems?.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) || Math.abs(transaction.quantity || 0);
                            const displayAmount = transaction.totalAmount || transaction.amount || 0;
                            const formattedTime = getFormattedTime(transaction);
                            const datePart = transaction.date?.split(', ')[0] || new Date(transaction.createdAt).toLocaleDateString();
                            
                            const isExpanded = expandedCardId === (transaction.id || transaction._id);
                            const status = (transaction.paidStatus || transaction.paymentStatus || 'Paid').toLowerCase();

                            return (
                                <div 
                                    key={transaction.id || transaction._id} 
                                    className={`mobile-expense-card-minimal ${isExpanded ? 'expanded' : ''}`}
                                    onClick={() => setExpandedCardId(isExpanded ? null : (transaction.id || transaction._id))}
                                >
                                    <div className="expense-card-main">
                                        <div className="expense-sno">{index + 1}</div>
                                        <div className="expense-category-lite">
                                            <div className="category-marker" style={{ backgroundColor: status === 'paid' ? '#10b981' : '#ef4444' }} />
                                            <div className="name-container" style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                                                    {transaction.company || transaction.customer || "Direct Sale"}
                                                </span>
                                                {!isExpanded && <span style={{ fontSize: '11px', color: '#94a3b8' }}>{datePart}</span>}
                                            </div>
                                        </div>
                                        <div className="expense-amount-lite" style={{ color: '#0f172a' }}>
                                            ₹{displayAmount?.toLocaleString()}
                                        </div>
                                        <span className="material-symbols-outlined expand-icon">
                                            {isExpanded ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </div>

                                    {isExpanded && (
                                        <div className="expense-card-details-expanded" onClick={(e) => e.stopPropagation()}>
                                            <div className="expanded-info-grid">
                                                <div className="info-row">
                                                    <span className="expanded-info-label">Date & Time</span>
                                                    <span className="expanded-info-value">{datePart} • {formattedTime}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="expanded-info-label">Customer</span>
                                                    <span className="expanded-info-value">{transaction.customer || "Walking Customer"}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="expanded-info-label">Products</span>
                                                    <span className="expanded-info-value">{baseProducts} ({totalPieces} pcs)</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="expanded-info-label">Status</span>
                                                    <span 
                                                        className={`payment-badge ${status}`}
                                                        style={{ fontSize: '10px', padding: '2px 8px' }}
                                                    >
                                                        {transaction.paidStatus || transaction.paymentStatus || 'Paid'}
                                                    </span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="expanded-info-label">Sold By</span>
                                                    <span className="expanded-info-value">{transaction.soldBy || "-"}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="expense-action-buttons" style={{ marginTop: '16px' }}>
                                                <button 
                                                    className="expense-mini-btn" 
                                                    onClick={() => handleViewBill(transaction)}
                                                    disabled={status === 'unpaid'}
                                                    style={{ color: '#10b981', opacity: status === 'unpaid' ? 0.5 : 1 }}
                                                >
                                                    <span className="material-symbols-outlined">receipt_long</span>
                                                    Bill
                                                </button>
                                                <button 
                                                    className="expense-mini-btn delete" 
                                                    onClick={() => handleDeleteTransaction(transaction.id || transaction._id)}
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-data-mobile">
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
                        display: 'flex', justifyContent: window.innerWidth < 850 ? 'flex-start' : 'center', alignItems: window.innerWidth < 850 ? 'flex-start' : 'center',
                        padding: '20px', zIndex: 3000,
                        overflow: 'auto', backdropFilter: 'blur(6px)',
                        cursor: 'pointer', opacity: 1,
                        pointerEvents: 'auto'
                    }}
                >
                    <div
                        className="bill-modal-content"
                        id="printable-bill"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            padding: '0', background: '#ffffff', minWidth: '850px', width: '850px',
                            
                            margin: window.innerWidth < 850 ? '0' : 'auto', boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
                            border: 'none', borderRadius: '4px', position: 'relative', cursor: 'default'
                        }}
                    >
                        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
                        <style>{`
                            @media print {
                                @page { size: portrait; margin: 0; }
                                .no-print { display: none !important; }
                                body, html { margin: 0 !important; padding: 0 !important; background: #fff !important; width: 850px !important; }
                            }
                            .ci-container { padding: 35px 0; background: #fff; width: 100%; min-height: 800px; display: flex; flex-direction: column; }
                            .ci-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #045b54; padding: 0 40px 18px; margin-bottom: 24px; }
                            .ci-logo-area { display: flex; align-items: center; gap: 18px; }
                            .ci-logo-img { height: 70px; object-fit: contain; }
                            .ci-company-name { font-size: 22px; font-weight: 900; color: #045b54; letter-spacing: -0.01em; }
                            .ci-company-addr { font-size: 13px; color: #64748b; font-weight: 500; }
                            .ci-invoice-title { font-size: 28px; font-weight: 900; color: #045b54; text-align: right; letter-spacing: 0.05em; margin-bottom: 8px; }
                            .ci-invoice-meta { font-size: 13px; color: #334155; text-align: right; display: flex; flex-direction: column; gap: 4px; }
                            .ci-billto { display: flex; justify-content: space-between; padding: 0 40px; margin-bottom: 30px; gap: 40px; }
                            .ci-billto-title { font-size: 12px; font-weight: 800; color: #045b54; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
                            .ci-billto-row { font-size: 13px; margin-bottom: 5px; color: #1e293b; line-height: 1.5; }
                            .ci-section-title { background: #f8fafc; padding: 10px 40px 18px; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; margin-bottom: 0; }
                            .ci-table-wrap { padding: 16px 40px 0; flex-grow: 1; }
                            .ci-table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 1.5px solid #045b54; }
                            .ci-tbl-head th { background: #045b54; color: #fff; padding: 12px 14px; font-size: 12px; font-weight: 700; text-transform: uppercase; border-right: 1px solid rgba(255,255,255,0.2); text-align: center; }
                            .ci-tbody td { padding: 14px 14px; font-size: 13px; color: #333; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; text-align: center; font-weight: 500; }
                            .ci-tbody tr:nth-child(even) { background: #fcfdfe; }
                            .ci-summary { display: flex; justify-content: flex-end; padding: 0 40px; margin-top: -1.5px; }
                            .ci-summary-box { width: 280px; border: 1.5px solid #045b54; border-top: none; }
                            .ci-sum-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 12.5px; border-bottom: 1px solid #e2e8f0; }
                            .ci-total-row { background: #045b54; color: #fff; display: flex; justify-content: space-between; padding: 14px; font-size: 15px; font-weight: 900; }
                            .ci-payment { display: grid; grid-template-columns: 1fr 1fr; padding: 24px 40px; border-top: 2px solid #045b54; margin-top: 40px; background: #fcfdfe; }
                            .ci-pay-title { font-size: 13px; font-weight: 800; color: #045b54; margin-bottom: 10px; text-transform: uppercase; }
                            .ci-footer { border-top: 2px solid #045b54; margin-top: auto; padding: 20px 40px; text-align: center; font-size: 12px; color: #64748b; font-weight: 500; }
                            
                            /* MOBILE RESPONSIVE INVOICE */
                            @media screen and (max-width: 600px) {
                                .ci-header { flex-direction: column; text-align: center; gap: 20px; padding: 0 20px 20px; }
                                .ci-logo-area { flex-direction: column; gap: 10px; }
                                .ci-invoice-title { text-align: center; font-size: 24px; }
                                .ci-invoice-meta { text-align: center; align-items: center; }
                                .ci-billto { flex-direction: column; gap: 25px; padding: 0 20px; }
                                .ci-billto-right { text-align: left !important; }
                                .ci-table-wrap { padding: 0 10px; overflow-x: auto; }
                                .ci-table th, .ci-table td { padding: 10px 8px; font-size: 11px; }
                                .ci-summary { padding: 0 20px; }
                                .ci-summary-box { width: 100%; }
                                .ci-payment { grid-template-columns: 1fr; gap: 20px; padding: 20px; }
                                .ci-footer { padding: 15px 20px; }
                                .bill-modal-content { width: 95% !important; max-width: 95% !important; zoom: 1 !important; }
                            }
                        `}</style>
                        <div className="ci-container" id="printable-invoice">
                        <div className="ci-header">
                            <div className="ci-logo-area">
                                <img src={logo} alt="Logo" className="ci-logo-img" />
                                <div>
                                    <div className="ci-company-name">AVS ECO INDUSTRIES</div>
                                    <div className="ci-company-addr">Tiruttani, Thiruvallur (Dt) - 631210</div>
                                </div>
                            </div>
                            <div>
                                <div className="ci-invoice-title">INVOICE</div>
                                <div className="ci-invoice-meta">
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
                                <div className="ci-billto-title">Project Address</div>
                                <div className="ci-billto-row">{selectedBill.address}</div>
                            </div>
                        </div>
                        <div className="ci-section-title">Billing Details</div>
                        <div className="ci-table-wrap">
                            <table className="ci-table">
                                <thead className="ci-tbl-head">
                                    <tr>
                                        <th>S.NO</th>
                                        <th>HSN CODE</th>
                                        <th>PRODUCT NAME</th>
                                        <th>QTY</th>
                                        <th>RATE</th>
                                        <th>GST</th>
                                        <th>AMOUNT</th>
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
                                        <div className="ci-sum-row" style={{ background: '#f0fdf4', color: '#166534', fontWeight: 700, borderBottom: '1px solid #bbf7d0' }}>
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
                            <div className="export-section">
                                <h4>Export Format</h4>
                                <div className="export-format-options">
                                    <label className={`format-option ${exportFormat === 'csv' ? 'active' : ''}`}>
                                        <input type="radio" value="csv" checked={exportFormat === 'csv'} onChange={(e) => setExportFormat(e.target.value)} />
                                        <span className="material-symbols-outlined">description</span>
                                        <span className="format-name">CSV</span>
                                    </label>
                                    <label className={`format-option ${exportFormat === 'excel' ? 'active' : ''}`}>
                                        <input type="radio" value="excel" checked={exportFormat === 'excel'} onChange={(e) => setExportFormat(e.target.value)} />
                                        <span className="material-symbols-outlined">grid_on</span>
                                        <span className="format-name">Excel</span>
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
                                    <label className={`type-option ${exportType === 'paid' ? 'active' : ''}`}>
                                        <input type="radio" value="paid" checked={exportType === 'paid'} onChange={(e) => setExportType(e.target.value)} />
                                        <span>Paid Only</span>
                                    </label>
                                    <label className={`type-option ${exportType === 'unpaid' ? 'active' : ''}`}>
                                        <input type="radio" value="unpaid" checked={exportType === 'unpaid'} onChange={(e) => setExportType(e.target.value)} />
                                        <span>Unpaid Only</span>
                                    </label>
                                </div>
                            </div>
                            <p className="export-note" style={{marginTop: '15px'}}>This will export the currently filtered {filteredTransactions.length} records based on your search.</p>
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
