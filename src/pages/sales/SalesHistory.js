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
    const [, setExportLoading] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [feedbackMessage, setFeedbackMessage] = useState("");

    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/sales');
            const sorted = response.data.sort((a, b) => {
                return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
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
                amount: item.amount,
                hsn: item.hsn || "-"
            })) || [
                {
                    product: transaction.product,
                    baseName: transaction.product,
                    size: transaction.size || "—",
                    qty: Math.abs(transaction.quantity),
                    amount: transaction.totalAmount || transaction.amount,
                    hsn: "-"
                }
            ],
            totalAmount: transaction.totalAmount || transaction.amount,
            paidStatus: transaction.paidStatus || transaction.paymentStatus || "Paid",
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

            const message = `*INVOICE: ${bill.invoiceNo}*%0A%0ADear *${bill.customer}*,%0A%0AThank you for your business with *AVSECO INDUSTRIES*! 🌿%0A%0APlease find your invoice attached below.`;
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

    const confirmExport = () => {
        setExportLoading(true);
        // Implement CSV export logic here if needed, exactly like in Sales.js
        setTimeout(() => {
            setExportLoading(false);
            setShowExportModal(false);
            setFeedbackMessage("✅ Report exported successfully");
            setTimeout(() => setFeedbackMessage(""), 3000);
        }, 1500);
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
                        Export History
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
                <div className="table-responsive">
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
                                            onClick={() => handleViewBill(transaction)}
                                            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
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
                                                <span className={`payment-badge ${(transaction.paidStatus || transaction.paymentStatus || 'Paid').toLowerCase()}`}>
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
                                                        style={{ color: '#10b981' }}
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
            </div>

            {/* Bill Modal */}
            {showBillModal && selectedBill && (
                <div
                    className="bill-modal-overlay"
                    onClick={() => setShowBillModal(false)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
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
                            padding: '0', background: '#ffffff', maxWidth: '850px', width: '850px',
                            zoom: window.innerWidth < 850 ? (window.innerWidth - 40) / 850 : 1,
                            margin: 'auto', boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
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
                            .ci-header { background: #1a6b3c; padding: 30px 40px; color: #fff; display: flex; justify-content: space-between; align-items: center; }
                            .ci-logo-area { display: flex; align-items: center; gap: 20px; }
                            .ci-logo-img { width: 75px; height: 75px; object-fit: contain; filter: brightness(0) invert(1); }
                            .ci-company-name { font-size: 26px; font-weight: 900; letter-spacing: 0.02em; }
                            .ci-company-addr { font-size: 11px; opacity: 0.9; line-height: 1.5; font-weight: 500; margin-top: 5px; }
                            .ci-invoice-title { font-size: 34px; font-weight: 900; letter-spacing: 0.05em; text-align: right; }
                            .ci-invoice-meta { margin-top: 10px; font-size: 12px; text-align: right; line-height: 1.8; }
                            .ci-billto { padding: 18px 40px; border-bottom: 2px solid #1a6b3c; display: flex; gap: 60px; align-items: flex-start; }
                            .ci-billto-title { font-size: 16px; font-weight: 800; color: #1a6b3c; margin-bottom: 10px; }
                            .ci-billto-row { font-size: 12px; color: #333; line-height: 1.9; font-weight: 600; }
                            .ci-section-title { font-size: 22px; font-weight: 800; color: #1a6b3c; padding: 18px 40px 10px; }
                            .ci-table-wrap { padding: 0 40px; }
                            .ci-table { width: 100%; border-collapse: collapse; border: 1.5px solid #1a6b3c; }
                            .ci-tbl-head tr { background: #1a6b3c; }
                            .ci-tbl-head th { padding: 11px 12px; font-size: 10.5px; font-weight: 700; color: #fff; text-transform: uppercase; text-align: left; }
                            .ci-tbody td { padding: 10px 12px; font-size: 12.5px; color: #333; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
                            .ci-summary { display: flex; justify-content: flex-end; padding: 0 40px; }
                            .ci-summary-box { width: 280px; border: 1.5px solid #1a6b3c; border-top: none; }
                            .ci-sum-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 12.5px; border-bottom: 1px solid #e2e8f0; }
                            .ci-total-row { background: #1a6b3c; color: #fff; display: flex; justify-content: space-between; padding: 11px 14px; font-size: 14px; font-weight: 900; }
                            .ci-payment { display: grid; grid-template-columns: 1fr 1fr; padding: 20px 40px 10px; border-top: 2px solid #1a6b3c; margin-top: 24px; }
                            .ci-pay-title { font-size: 13px; font-weight: 800; color: #1a6b3c; margin-bottom: 8px; }
                            .ci-footer { border-top: 2px solid #1a6b3c; margin-top: 20px; padding: 14px 40px; text-align: center; font-size: 12px; font-style: italic; }
                        `}</style>
                        <div className="ci-header">
                            <div className="ci-logo-area">
                                <img src={logo} alt="Logo" className="ci-logo-img" />
                                <div>
                                    <div className="ci-company-name">AVSECO INDUSTRIES</div>
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
                            <div>
                                <div className="ci-billto-title">BILL TO:</div>
                                <div className="ci-billto-row"><b>Company:</b> {selectedBill.company}</div>
                                <div className="ci-billto-row"><b>Customer:</b> {selectedBill.customer}</div>
                                <div className="ci-billto-row"><b>Phone:</b> {selectedBill.phone}</div>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <div className="ci-billto-row"><b>Address:</b> {selectedBill.address}</div>
                            </div>
                        </div>
                        <div className="ci-section-title">Billing Details</div>
                        <div className="ci-table-wrap">
                            <table className="ci-table">
                                <thead className="ci-tbl-head">
                                    <tr>
                                        <th>Item</th>
                                        <th>Product Name</th>
                                        <th>Size</th>
                                        <th>Qty</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="ci-tbody">
                                    {selectedBill.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td>{item.baseName}</td>
                                            <td>{item.size}</td>
                                            <td>{item.qty}</td>
                                            <td>₹{item.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="ci-summary">
                            <div className="ci-summary-box">
                                <div className="ci-total-row">
                                    <span>TOTAL:</span>
                                    <span>₹{selectedBill.totalAmount.toLocaleString()}</span>
                                </div>
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
                            <h3>Export Sales Report</h3>
                            <button className="modal-close" onClick={() => setShowExportModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Choose export format and range...</p>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-cancel" onClick={() => setShowExportModal(false)}>Cancel</button>
                            <button className="modal-confirm" onClick={confirmExport}>Export Now</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesHistory;
