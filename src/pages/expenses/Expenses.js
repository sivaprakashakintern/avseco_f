import React, { useState } from "react";
import { useAppContext } from '../../context/AppContext.js';
import { formatDate, isWithinLast2Days } from '../../utils/dateUtils.js';
import { formatCurrency, getDynamicFontSize } from '../../utils/formatUtils.js';
import "./Expenses.css";

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
    const todayDateObj = new Date();
    const today = formatDate(todayDateObj);
    const currentDay = todayDateObj.getDate();

    // Stats Logic: Include today's expenses + Salary from day 1 if we are within day 1-5
    const statsExpenses = (expenses || []).filter(ex => {
        const exDateFormatted = formatDate(ex.date);
        const isToday = exDateFormatted === today;
        if (isToday) return true;

        // If it's between day 1 and 5 of the month, include Salary expenses dated the 1st
        if (currentDay >= 1 && currentDay <= 5 && ex.category === 'Salary') {
            const dParts = ex.date.includes('-') ? ex.date.split('-') : [];
            let d;
            if (dParts.length === 3) {
                // Handle DD-MM-YYYY or YYYY-MM-DD
                d = dParts[0].length === 4 ? new Date(ex.date) : new Date(dParts[2], dParts[1] - 1, dParts[0]);
            } else {
                d = new Date(ex.date);
            }

            const isFirstOfMonth = d.getDate() === 1 &&
                d.getMonth() === todayDateObj.getMonth() &&
                d.getFullYear() === todayDateObj.getFullYear();
            return isFirstOfMonth;
        }
        return false;
    });

    const todayExpenses = (expenses || []).filter(ex => formatDate(ex.date) === today);

    const todayTotal = statsExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const todayMaintenanceTotal = statsExpenses.filter(e => ["Material", "Machine Maintenance", "Electricity", "Rent"].includes(e.category)).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const todaySalaryTotal = statsExpenses.filter(e => e.category === "Salary").reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const todayOthersTotal = todayTotal - todayMaintenanceTotal - todaySalaryTotal;

    // --- Form Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewExpense({ ...newExpense, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const expenseData = {
            ...newExpense,
            description: newExpense.description || `${newExpense.category} Expense`,
            amount: parseFloat(newExpense.amount),
            date: isEditMode ? expenses.find(e => e.id === currentExpenseId).date : formatDate(new Date()),
        };

        try {
            if (isEditMode) {
                await ctxUpdateExpense(currentExpenseId, expenseData);
            } else {
                await ctxAddExpense(expenseData);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save expense:", error);
        }
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

    const filteredEmployees = (employees || []).filter(emp =>
        (emp.name?.toLowerCase() || "").includes(employeeSearch?.toLowerCase() || "") ||
        (emp.empId?.toLowerCase() || "").includes(employeeSearch?.toLowerCase() || "")
    );

    return (
        <div className="stock-page">
            <div className="page-header premium-header expenses-header-standard">
                <div className="header-left-group">
                    <h1 className="page-title-white">Expense Details</h1>
                </div>
                <div className="header-right-group">
                    <button className="btn-add-circle-premium" onClick={() => { setIsEditMode(false); setIsModalOpen(true); }} title="Add New Expense">
                        <span className="material-symbols-outlined">add_circle</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards - Daily */}
            <div className="stock-stats">
                <div className="stat-card" onClick={() => { setDetailCategory("All Expenses"); setShowDetailModal(true); }}>
                    <div className="stat-icon purple">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Today Overall Expenses</span>
                        <span className="stat-value" style={getDynamicFontSize(todayTotal)}>
                            {formatCurrency(todayTotal, true)}
                        </span>
                    </div>
                </div>
                <div className="stat-card" onClick={() => { setDetailCategory("Maintenance"); setShowDetailModal(true); }}>
                    <div className="stat-icon blue">
                        <span className="material-symbols-outlined">build</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Maintenance</span>
                        <span className="stat-value" style={getDynamicFontSize(todayMaintenanceTotal)}>
                            {formatCurrency(todayMaintenanceTotal, true)}
                        </span>
                    </div>
                </div>
                <div className="stat-card" onClick={() => { setDetailCategory("Salary"); setShowDetailModal(true); }}>
                    <div className="month-badge">{new Date().toLocaleString('default', { month: 'short' })}</div>
                    <div className="stat-icon yellow">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Salary</span>
                        <span className="stat-value" style={getDynamicFontSize(todaySalaryTotal)}>
                            {formatCurrency(todaySalaryTotal, true)}
                        </span>
                    </div>
                </div>
                <div className="stat-card" onClick={() => { setDetailCategory("Others"); setShowDetailModal(true); }}>
                    <div className="stat-icon green">
                        <span className="material-symbols-outlined">more_horiz</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Others</span>
                        <span className="stat-value" style={getDynamicFontSize(todayOthersTotal)}>
                            {formatCurrency(todayOthersTotal, true)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Recent Expenses Table */}
            <div className="stock-table-container">
                <div className="table-header">
                    <h3>
                        <span className="material-symbols-outlined" style={{ color: '#006A4E' }}>today</span>
                        Today's Expenses
                    </h3>
                </div>

                <div className="table-responsive desktop-only-table">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th className="text-center">S.No</th>
                                <th className="text-center">Date & Time</th>
                                <th className="text-center">Category</th>
                                <th className="text-center">Payment Mode</th>
                                <th className="text-center">Amount (₹)</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.filter(ex => formatDate(ex.date) === formatDate(new Date())).map((expense, index) => (
                                <tr key={expense.id}>
                                    <td className="sno-cell">{index + 1}</td>
                                    <td className="date-cell">{formatDate(expense.date)}</td>
                                    <td className="text-center">
                                        <span className={`status-badge-lite ${expense.category === 'Machine Maintenance' ? 'low' :
                                            expense.category === 'Material' ? 'normal' :
                                                expense.category === 'Salary' ? 'critical' : 'normal'
                                            }`}>
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <span className="payment-badge-lite">
                                            {expense.paymentMode}
                                        </span>
                                    </td>
                                    <td className="amount-cell">₹{Number(expense.amount).toLocaleString()}</td>
                                    <td className="text-center">
                                        <div className="action-buttons-center">
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
                                                <span className="locked-badge">Locked</span>
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
                    {expenses.filter(ex => formatDate(ex.date) === formatDate(new Date())).length > 0 ? (
                        expenses.filter(ex => formatDate(ex.date) === formatDate(new Date())).map((ex, index) => {
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
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '700', color: '#1e293b' }}>
                                                    {ex.category === "Salary" ? (ex.description.replace('Salary for ', '')) : ex.category}
                                                </span>
                                                {ex.category !== "Salary" && ex.description && (
                                                    <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                                                        {ex.description}
                                                    </span>
                                                )}
                                            </div>
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
                                                    <span className="expanded-info-label">Date</span>
                                                    <span className="expanded-info-value">{formatDate(ex.date)}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="expanded-info-label">Payment</span>
                                                    <span className="expanded-info-value">{ex.paymentMode}</span>
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
                            <p>No expenses recorded today</p>
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
                                <div className="modal-row-grid">
                                    <div className="perfect-input-group">
                                        <label className="perfect-label">Category</label>
                                        <div className="dropdown-container">
                                            <select
                                                name="category"
                                                value={newExpense.category}
                                                onChange={(e) => {
                                                    handleInputChange(e);
                                                    if (e.target.value === 'Salary') {
                                                        setEmployeeSearch("");
                                                    }
                                                }}
                                                className="perfect-input perfect-select"
                                            >
                                                <option value="Machine Maintenance">Machine Maintenance</option>
                                                <option value="Material">Material</option>
                                                <option value="Electricity">Electricity</option>
                                                <option value="Transport">Transport</option>
                                                <option value="Rent">Rent</option>
                                                <option value="Others">Others</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="perfect-input-group">
                                        <label className="perfect-label">Payment Method</label>
                                        <div className="dropdown-container">
                                            <select
                                                name="paymentMode"
                                                value={newExpense.paymentMode}
                                                onChange={handleInputChange}
                                                className="perfect-input perfect-select"
                                            >
                                                <option value="Cash">Cash</option>
                                                <option value="UPI">UPI</option>
                                                <option value="Bank Transfer">Bank Transfer</option>
                                                <option value="Cheque">Cheque</option>
                                                <option value="Card">Card</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {newExpense.category === 'Salary' && (
                                    <div className="perfect-input-group" style={{ position: 'relative' }}>
                                        <label className="perfect-label">Select Employee</label>
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
                                                className="perfect-input"
                                            />
                                            {showEmployeeDropdown && filteredEmployees.length > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '16px',
                                                    marginTop: '8px',
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                    zIndex: 1000,
                                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
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

                                <div className="modal-row-grid" style={{ marginBottom: '32px' }}>
                                    <div className="perfect-input-group">
                                        <label className="perfect-label">Amount (₹)</label>
                                        <input
                                            type="number"
                                            name="amount"
                                            required
                                            placeholder="0.00"
                                            value={newExpense.amount}
                                            onChange={handleInputChange}
                                            className="perfect-input"
                                        />
                                    </div>
                                    {newExpense.category === 'Others' ? (
                                        <div className="perfect-input-group">
                                            <label className="perfect-label">Description *</label>
                                            <input
                                                type="text"
                                                name="description"
                                                required
                                                placeholder="Details"
                                                value={newExpense.description}
                                                onChange={handleInputChange}
                                                className="perfect-input"
                                            />
                                        </div>
                                    ) : (
                                        <div className="perfect-input-group">
                                            <label className="perfect-label">Remarks (Optional)</label>
                                            <input
                                                type="text"
                                                name="description"
                                                placeholder="Remarks"
                                                value={newExpense.description}
                                                onChange={handleInputChange}
                                                className="perfect-input"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
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
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-header">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-symbols-outlined" style={{ color: '#006A4E' }}>
                                    {detailCategory === "Others" ? 'more_horiz' : 'analytics'}
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
                                        <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '12px', color: '#64748b' }}>DETAILS</th>
                                        <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '12px', color: '#64748b' }}>CATEGORY</th>
                                        <th style={{ textAlign: 'center', padding: '12px 20px', fontSize: '12px', color: '#64748b' }}>AMOUNT (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {todayExpenses
                                        .filter(e => {
                                            if (detailCategory === "All Expenses") return true;
                                            if (detailCategory === "Maintenance") return ["Material", "Machine Maintenance", "Electricity", "Rent"].includes(e.category);
                                            if (detailCategory === "Salary") return e.category === "Salary";
                                            if (detailCategory === "Others") return !["Material", "Machine Maintenance", "Electricity", "Rent", "Salary"].includes(e.category);
                                            return e.category === detailCategory;
                                        })
                                        .sort((a, b) => b.amount - a.amount)
                                        .map((exp, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                                                        {exp.category === "Salary" ? (exp.description.replace('Salary for ', '')) : exp.description}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{formatDate(exp.date)}</div>
                                                </td>
                                                <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        display: 'inline-block',
                                                        minWidth: '140px',
                                                        backgroundColor: exp.category === 'Salary' ? '#fff7ed' : '#f5f3ff',
                                                        color: exp.category === 'Salary' ? '#9a3412' : '#5b21b6'
                                                    }}>
                                                        {exp.category}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: '700', color: '#006A4E', fontSize: '14px' }}>
                                                    ₹{Number(exp.amount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            {todayExpenses.filter(e => {
                                if (detailCategory === "All Expenses") return true;
                                if (detailCategory === "Maintenance") return ["Material", "Machine Maintenance", "Electricity", "Rent"].includes(e.category);
                                if (detailCategory === "Salary") return e.category === "Salary";
                                if (detailCategory === "Others") return !["Material", "Machine Maintenance", "Electricity", "Rent", "Salary"].includes(e.category);
                                return e.category === detailCategory;
                            }).length === 0 && (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                        No records found for this category.
                                    </div>
                                )}
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '16px 20px' }}>
                            <div style={{ marginRight: 'auto', fontWeight: '700', fontSize: '15px' }}>
                                Total: ₹{todayExpenses
                                    .filter(e => {
                                        if (detailCategory === "All Expenses") return true;
                                        if (detailCategory === "Maintenance") return ["Material", "Machine Maintenance", "Electricity", "Rent"].includes(e.category);
                                        if (detailCategory === "Salary") return e.category === "Salary";
                                        if (detailCategory === "Others") return !["Material", "Machine Maintenance", "Electricity", "Rent", "Salary"].includes(e.category);
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
                    <div className="modal-content perfect-modal-delete">
                        <div className="delete-icon-container">
                            <span className="material-symbols-outlined">warning</span>
                        </div>
                        <h3 className="delete-modal-title">Confirm Deletion</h3>
                        <p className="delete-modal-text">
                            Are you sure you want to delete this expense record? This action cannot be undone.
                        </p>
                        <div className="modal-actions-flex">
                            <button
                                className="btn-outline perfect-btn-full"
                                onClick={() => setDeleteConfirm({ isOpen: false, id: null })}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-primary perfect-btn-full btn-danger"
                                onClick={confirmDelete}
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