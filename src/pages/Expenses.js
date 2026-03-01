import React, { useState } from "react";
import { useAppContext } from '../context/AppContext.js';
import "./stock/Stock.css"; // Reuse Stock CSS for consistent theme

const Expenses = () => {
    // ── Global shared state ─────────────────────────────────────────────────
    const {
        expenses,
        addExpense: ctxAddExpense,
        totalExpenseAmount,
        expenseByCategory,
    } = useAppContext();

    const [isModalOpen, setIsModalOpen] = useState(false);

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

        // Use current date/time for new entry
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        const expenseToAdd = {
            ...newExpense,
            date: formattedDate,
        };

        ctxAddExpense(expenseToAdd);
        setIsModalOpen(false);
        setNewExpense({ category: "Machine Maintenance", description: "", amount: "", paymentMode: "Cash" });
    };

    return (
        <div className="stock-page">
            {/* ... (Header and Stats remain same) ... */}
            {/* ===== PREMIUM ANALYTICS HEADER ===== */}
            <div className="page-header premium-header">
                <div>
                    <h1 className="page-title">Expense Details</h1>
                    <p className="page-subtitle">Track and manage company expenses with precision</p>
                </div>
                <div className="header-actions">
                    <button className="btn-export-premium" onClick={() => setIsModalOpen(true)}>
                        <span className="material-symbols-outlined">add</span>
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Stats Cards - Overall */}
            <div className="stock-stats">
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Expenses</span>
                        <span className="stat-value">₹{totalExpense.toLocaleString()}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <span className="material-symbols-outlined">build</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Machine Maint.</span>
                        <span className="stat-value">₹{machineMaintTotal.toLocaleString()}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <span className="material-symbols-outlined">shopping_cart</span>
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Material Total</span>
                        <span className="stat-value">₹{materialTotal.toLocaleString()}</span>
                    </div>
                </div>
                <div className="stat-card">
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

                <div className="table-responsive">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Payment Mode</th>
                                <th>Amount (₹)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.slice(0, 10).map((expense) => (
                                <tr key={expense.id}>
                                    <td style={{ fontWeight: '500' }}>{expense.date}</td>
                                    <td>
                                        <span className={`status-badge ${expense.category === 'Machine Maintenance' ? 'low' :
                                            expense.category === 'Stock Purchased' ? 'normal' :
                                                expense.category === 'Employee Salary' ? 'critical' : 'normal'
                                            }`}>
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td style={{ color: '#64748b' }}>{expense.description}</td>
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
                                            <button className="action-btn edit" title="Edit">
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            <button className="action-btn delete" title="Delete">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Expense Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Add New Expense</h3>
                            <button
                                className="modal-close"
                                onClick={() => setIsModalOpen(false)}
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

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                                        {newExpense.category === 'Others' ? 'Description (Required for Others) *' : 'Description'}
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
                                        onClick={() => setIsModalOpen(false)}
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
                                        Save Expense
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
