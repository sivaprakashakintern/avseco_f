import React, { useState } from "react";
import { useAppContext } from '../../context/AppContext.js';
import { formatDate, isWithinLast2Days } from '../../utils/dateUtils.js';
import "../stock/Stock.css";
import "./ExpenseReport.css";

const CATEGORY_CONFIG = {
    "Machine Maintenance": { color: "#006A4E", icon: "build" },
    "Material": { color: "#3b82f6", icon: "inventory_2" },
    "Salary": { color: "#d97706", icon: "payments" },
    "Electricity": { color: "#db2777", icon: "bolt" },
    "Transport": { color: "#16a34a", icon: "local_shipping" },
    "Rent": { color: "#7c3aed", icon: "home" },
    "Others": { color: "#8b5cf6", icon: "more_horiz" },
};

const Expenses = () => {
    // ── Global shared state ─────────────────────────────────────────────────
    const {
        expenses,
        addExpense: ctxAddExpense,
        updateExpense: ctxUpdateExpense,
        deleteExpense: ctxDeleteExpense,
        employees,
        totalExpenseAmount,
        expenseByCategory,
    } = useAppContext();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentExpenseId, setCurrentExpenseId] = useState(null);
    const [expandedExpenseId, setExpandedExpenseId] = useState(null);
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailCategory, setDetailCategory] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

    // ── Toggle Expansion ──
    const toggleExpenseExpansion = (id) => {
        setExpandedExpenseId(expandedExpenseId === id ? null : id);
    };

    const handleDeleteExpense = (id) => {
        setDeleteConfirm({ isOpen: true, id });
    };

    const confirmDelete = () => {
        if (deleteConfirm.id) {
            ctxDeleteExpense(deleteConfirm.id);
            setDeleteConfirm({ isOpen: false, id: null });
        }
    };

    const handleEditExpense = (id) => {
        const expenseToEdit = expenses.find(e => e.id === id);
        if (expenseToEdit) {
            setNewExpense({
                category: expenseToEdit.category,
                description: expenseToEdit.description,
                amount: expenseToEdit.amount,
                paymentMode: expenseToEdit.paymentMode,
            });
            
            if (expenseToEdit.category === 'Salary') {
                const nameMatch = expenseToEdit.description.match(/Salary for (.*)/);
                if (nameMatch) {
                    setEmployeeSearch(nameMatch[1]);
                }
            }

            setIsEditMode(true);
            setCurrentExpenseId(id);
            setIsModalOpen(true);
        }
    };

    // Add Expense Form State
    const [newExpense, setNewExpense] = useState({
        category: "Machine Maintenance",
        description: "",
        amount: "",
        paymentMode: "Cash",
    });

    // Stats derived from global state
    const totalExpense = totalExpenseAmount;
    const machineMaintTotal = expenseByCategory["Machine Maintenance"] || 0;
    const materialTotal = expenseByCategory["Material"] || 0;
    const salaryTotal = expenseByCategory["Salary"] || 0;
    const othersTotal = totalExpense - machineMaintTotal - materialTotal - salaryTotal;

    // --- Form Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewExpense({ ...newExpense, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const expenseData = {
            ...newExpense,
            date: isEditMode ? expenses.find(e => e.id === currentExpenseId).date : formatDate(new Date()),
        };

        if (isEditMode) {
            ctxUpdateExpense(currentExpenseId, expenseData);
        } else {
            ctxAddExpense(expenseData);
        }
        
        handleCloseModal();
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setCurrentExpenseId(null);
        setNewExpense({ category: "Machine Maintenance", description: "", amount: "", paymentMode: "Cash" });
        setEmployeeSearch("");
    };

    const handleEmployeeSelect = (emp) => {
        setNewExpense({
            ...newExpense,
            description: `Salary for ${emp.name}`,
            amount: emp.salary || ""
        });
        setEmployeeSearch(emp.name);
        setShowEmployeeDropdown(false);
    };

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.empId.toLowerCase().includes(employeeSearch.toLowerCase())
    );

    return (
        <div className="stock-page">
            {/* ===== PREMIUM ANALYTICS HEADER ===== */}
            <div className="page-header premium-header">
                <div>
                    <h1 className="page-title">Expense Details</h1>
                    <p className="page-subtitle">Track and manage company expenses with precision</p>
                </div>
                <div className="header-actions">
                    <button className="btn-export-premium" onClick={() => { setIsEditMode(false); setIsModalOpen(true); }}>
                        <span className="material-symbols-outlined">add</span>
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Stats Cards - Overall */}
            <div className="stock-stats">
                <div className="stat-card" onClick={() => { setDetailCategory("All Expenses"); setShowDetailModal(true); }}>
                    <div className="stat-icon purple">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Expenses</span>
                        <span className="stat-value">₹{totalExpense.toLocaleString()}</span>
                    </div>
                </div>
                <div className="stat-card" onClick={() => { setDetailCategory("Machine Maintenance"); setShowDetailModal(true); }}>
                    <div className="stat-icon blue">
                        <span className="material-symbols-outlined">build</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Machine Maint.</span>
                        <span className="stat-value">₹{machineMaintTotal.toLocaleString()}</span>
                    </div>
                </div>
                <div className="stat-card" onClick={() => { setDetailCategory("Material"); setShowDetailModal(true); }}>
                    <div className="stat-icon green">
                        <span className="material-symbols-outlined">shopping_cart</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Material Total</span>
                        <span className="stat-value">₹{materialTotal.toLocaleString()}</span>
                    </div>
                </div>
                <div className="stat-card" onClick={() => { setDetailCategory("Salary & Others"); setShowDetailModal(true); }}>
                    <div className="stat-icon yellow">
                        <span className="material-symbols-outlined">group</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Salary & Others</span>
                        <span className="stat-value">₹{(salaryTotal + othersTotal).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Recent Expenses Table */}
            <div className="stock-table-container">
                <div className="table-header">
                    <h3>
                        <span className="material-symbols-outlined" style={{ color: '#006A4E' }}>history</span>
                        Recent Expenses
                    </h3>
                </div>

                <div className="table-responsive desktop-only-table">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Date & Time</th>
                                <th>Category</th>
                                <th>Payment Mode</th>
                                <th>Amount (₹)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.slice(0, 10).map((expense, index) => (
                                <tr key={expense.id}>
                                    <td style={{ fontWeight: '700', color: '#94a3b8' }}>{index + 1}</td>
                                    <td style={{ fontWeight: '500' }}>{formatDate(expense.date)}</td>
                                    <td>
                                        <span className={`status-badge ${expense.category === 'Machine Maintenance' ? 'low' :
                                             expense.category === 'Material' ? 'normal' :
                                                 expense.category === 'Salary' ? 'critical' : 'normal'
                                             }`}>
                                             {expense.category}
                                         </span>
                                     </td>
                                    <td>
                                        <span className="payment-badge" style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            backgroundColor: '#f1f5f9',
                                            color: '#475569'
                                        }}>
                                            {expense.paymentMode}
                                        </span>
                                    </td>
                                    <td className="amount" style={{ fontWeight: '800', color: '#006A4E' }}>₹{Number(expense.amount).toLocaleString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            {isWithinLast2Days(expense.date) ? (
                                                <>
                                                    <button 
                                                        className="action-btn edit" 
                                                        title="Edit"
                                                        onClick={() => handleEditExpense(expense.id)}
                                                    >
                                                        <span className="material-symbols-outlined">edit</span>
                                                    </button>
                                                    <button 
                                                        className="action-btn delete" 
                                                        title="Delete"
                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Locked</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards View */}
                <div className="mobile-history-cards">
                    {expenses.length > 0 ? (
                        expenses.slice(0, 10).map((ex, index) => {
                            const cfg = CATEGORY_CONFIG[ex.category] || { icon: "payments", color: "#006A4E" };
                            const isExpanded = expandedExpenseId === ex.id;

                            return (
                                <div
                                    key={ex.id}
                                    className={`mobile-expense-card-minimal ${isExpanded ? 'expanded' : ''}`}
                                    onClick={() => toggleExpenseExpansion(ex.id)}
                                >
                                    <div className="expense-card-main">
                                        <div className="expense-sno">{index + 1}</div>
                                        <div className="expense-category-lite">
                                            <div className="category-marker" style={{ backgroundColor: cfg.color }} />
                                            {ex.category}
                                        </div>
                                        <div className="expense-amount-lite">₹{Number(ex.amount).toLocaleString()}</div>
                                        <span className="material-symbols-outlined expand-icon">
                                            {isExpanded ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </div>

                                    {isExpanded && (
                                        <div className="expense-card-details-expanded">
                                            <div className="expanded-info-grid">
                                                <div className="info-row">
                                                    <span className="info-label">Date</span>
                                                    <span className="info-value">{formatDate(ex.date)}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">Payment</span>
                                                    <span className="info-value">{ex.paymentMode}</span>
                                                </div>
                                            </div>
                                            {isWithinLast2Days(ex.date) && (
                                                <div className="expense-action-buttons">
                                                    <button
                                                        className="expense-mini-btn edit"
                                                        onClick={(e) => { e.stopPropagation(); handleEditExpense(ex.id); }}
                                                    >
                                                        <span className="material-symbols-outlined">edit</span>
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="expense-mini-btn delete"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteExpense(ex.id); }}
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-data-mobile">
                            <span className="material-symbols-outlined">search_off</span>
                            <p>No expense records found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Expense Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{isEditMode ? "Edit Expense" : "Add New Expense"}</h3>
                            <button
                                className="modal-close"
                                onClick={handleCloseModal}
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Category</label>
                                    <div className="dropdown-container" style={{ width: '100%' }}>
                                        <select
                                            name="category"
                                            value={newExpense.category}
                                            onChange={(e) => {
                                                handleInputChange(e);
                                                if (e.target.value === 'Salary') {
                                                    setEmployeeSearch("");
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '14px',
                                                outline: 'none',
                                                backgroundColor: '#f8fafc',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="Machine Maintenance">Machine Maintenance</option>
                                            <option value="Material">Material</option>
                                            <option value="Salary">Salary</option>
                                            <option value="Electricity">Electricity</option>
                                            <option value="Transport">Transport</option>
                                            <option value="Rent">Rent</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>
                                </div>

                                {newExpense.category === 'Salary' && (
                                    <div style={{ marginBottom: '16px', position: 'relative' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Select Employee</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="text"
                                                placeholder="Search by name"
                                                value={employeeSearch}
                                                onChange={(e) => {
                                                    setEmployeeSearch(e.target.value);
                                                    setShowEmployeeDropdown(true);
                                                }}
                                                onFocus={() => setShowEmployeeDropdown(true)}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e2e8f0',
                                                    fontSize: '14px',
                                                    outline: 'none',
                                                    backgroundColor: '#f8fafc'
                                                }}
                                            />
                                            {showEmployeeDropdown && filteredEmployees.length > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    marginTop: '4px',
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                    zIndex: 1000,
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                                }}>
                                                    {filteredEmployees.map(emp => (
                                                        <div
                                                            key={emp.id}
                                                            onClick={() => handleEmployeeSelect(emp)}
                                                            style={{
                                                                padding: '10px 12px',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid #f1f5f9',
                                                                fontSize: '14px'
                                                            }}
                                                            onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                                            onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                                                        >
                                                            <strong>{emp.name}</strong>
                                                            <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.department}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Payment Method</label>
                                    <div className="dropdown-container" style={{ width: '100%' }}>
                                        <select
                                            name="paymentMode"
                                            value={newExpense.paymentMode}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '14px',
                                                outline: 'none',
                                                backgroundColor: '#f8fafc',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="UPI">UPI</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Card">Card</option>
                                        </select>
                                    </div>
                                </div>

                                {newExpense.category === 'Others' && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                                            Description *
                                        </label>
                                        <input
                                            type="text"
                                            name="description"
                                            required
                                            placeholder="Enter expense details"
                                            value={newExpense.description}
                                            onChange={handleInputChange}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '14px',
                                                outline: 'none',
                                                backgroundColor: '#f8fafc'
                                            }}
                                        />
                                    </div>
                                )}

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Amount (₹)</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        required
                                        placeholder="0.00"
                                        value={newExpense.amount}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '14px',
                                            outline: 'none',
                                            backgroundColor: '#f8fafc'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="btn-outline"
                                        style={{ justifyContent: 'center' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        style={{ justifyContent: 'center' }}
                                    >
                                        {isEditMode ? "Update Expense" : "Save Expense"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Detail Breakdown Modal */}
            {showDetailModal && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)} style={{ zIndex: 1100 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-symbols-outlined" style={{ color: '#006A4E' }}>
                                    {detailCategory === "Salary & Others" ? 'group' : 'analytics'}
                                </span>
                                {detailCategory} Breakdown
                            </h3>
                            <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '12px', color: '#64748b' }}>DETAILS</th>
                                        <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '12px', color: '#64748b' }}>CATEGORY</th>
                                        <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: '12px', color: '#64748b' }}>AMOUNT (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...expenses]
                                        .filter(e => {
                                            if (detailCategory === "All Expenses") return true;
                                            if (detailCategory === "Salary & Others") return e.category === "Salary" || e.category === "Others";
                                            return e.category === detailCategory;
                                        })
                                        .sort((a, b) => b.amount - a.amount)
                                        .map((exp, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                                                        {exp.category === "Salary" ? (exp.description.replace('Salary for ', '')) : exp.description}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{formatDate(exp.date)}</div>
                                                </td>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <span style={{ 
                                                        padding: '4px 8px', 
                                                        borderRadius: '4px', 
                                                        fontSize: '11px', 
                                                        fontWeight: '700',
                                                        backgroundColor: exp.category === 'Salary' ? '#fff7ed' : '#f5f3ff',
                                                        color: exp.category === 'Salary' ? '#9a3412' : '#5b21b6'
                                                    }}>
                                                        {exp.category}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700', color: '#006A4E', fontSize: '14px' }}>
                                                    ₹{Number(exp.amount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            {expenses.filter(e => {
                                if (detailCategory === "All Expenses") return true;
                                if (detailCategory === "Salary & Others") return e.category === "Salary" || e.category === "Others";
                                return e.category === detailCategory;
                            }).length === 0 && (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                    No records found for this category.
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '16px 20px' }}>
                            <div style={{ marginRight: 'auto', fontWeight: '700', fontSize: '15px' }}>
                                Total: ₹{expenses
                                    .filter(e => {
                                        if (detailCategory === "All Expenses") return true;
                                        if (detailCategory === "Salary & Others") return e.category === "Salary" || e.category === "Others";
                                        return e.category === detailCategory;
                                    })
                                    .reduce((acc, curr) => acc + Number(curr.amount), 0)
                                    .toLocaleString()}
                            </div>
                            <button className="btn-primary" onClick={() => setShowDetailModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.isOpen && (
                <div className="modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
                        <div style={{ color: '#ef4444', marginBottom: '20px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '64px' }}>warning</span>
                        </div>
                        <h3 style={{ fontSize: '20px', marginBottom: '10px', color: '#1e293b' }}>Confirm Deletion</h3>
                        <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '14px' }}>
                            Are you sure you want to delete this expense record? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button 
                                className="btn-outline" 
                                onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-primary" 
                                onClick={confirmDelete}
                                style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444', justifyContent: 'center' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
