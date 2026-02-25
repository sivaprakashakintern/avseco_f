/**
 * AppContext.js
 * ============================================================
 * GLOBAL STATE MANAGER – Single source of truth for entire app.
 * All modules (Employees, Attendance, Expenses, Dashboard) read
 * from and write to this shared context.
 * ============================================================
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ─── Storage helpers ──────────────────────────────────────────────────────────
const STORAGE_KEY = "avseco_app_data";

const loadFromStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
};

const saveToStorage = (data) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { }
};

// ─── Default seed data ────────────────────────────────────────────────────────
const DEFAULT_EMPLOYEES = [
    { id: 1, name: "Rajesh Kumar", department: "Ceo", email: "rajesh.k@avseco.com", phone: "+91 98765 43210", joinDate: "2020-01-15", dob: "1985-06-15", aadhar: "1234 5678 9012", pan: "ABCDE1234F", address: "123, Gandhi Road, Chennai", avatar: "" },
    { id: 2, name: "Priya Sharma", department: "Operator", email: "priya.s@avseco.com", phone: "+91 98765 43211", joinDate: "2021-03-10", dob: "1990-08-22", aadhar: "9876 5432 1098", pan: "WXYZ5678A", address: "45, Industrial Estate, Coimbatore", avatar: "" },
    { id: 3, name: "Amit Patel", department: "It admin", email: "amit.p@avseco.com", phone: "+91 98765 43212", joinDate: "2021-06-22", dob: "1992-11-05", aadhar: "4567 8901 2345", pan: "PQRS9012B", address: "78, Main Street, Trichy", avatar: "" },
    { id: 4, name: "Sneha Reddy", department: "Hr", email: "sneha.r@avseco.com", phone: "+91 98765 43213", joinDate: "2022-01-05", dob: "1994-03-30", aadhar: "3210 9876 5432", pan: "LMNO3456C", address: "12, Lake View Road, Madurai", avatar: "" },
    { id: 5, name: "Vikram Singh", department: "Machine operator", email: "vikram.s@avseco.com", phone: "+91 98765 43214", joinDate: "2022-09-18", dob: "1996-07-12", aadhar: "7890 1234 5678", pan: "DEFG7890H", address: "89, Cross Street, Salem", avatar: "" },
    { id: 6, name: "Anjali Mehta", department: "Hr", email: "anjali.m@avseco.com", phone: "+91 98765 43215", joinDate: "2021-11-30", dob: "1993-01-25", aadhar: "5678 9012 3456", pan: "JKLM1234K", address: "23, Park Avenue, Chennai", avatar: "" },
    { id: 7, name: "Karthik Rajan", department: "Operator", email: "karthik.r@avseco.com", phone: "+91 98765 43216", joinDate: "2022-02-14", dob: "1995-09-08", aadhar: "0123 4567 8901", pan: "UVWX5678L", address: "56, Temple Street, Madurai", avatar: "" },
    { id: 8, name: "Lakshmi Nair", department: "Hr", email: "lakshmi.n@avseco.com", phone: "+91 98765 43217", joinDate: "2021-08-19", dob: "1988-04-18", aadhar: "2345 6789 0123", pan: "QRST9012M", address: "34, River Side, Coimbatore", avatar: "" },
    { id: 9, name: "Manoj Kumar", department: "Driver", email: "manoj.k@avseco.com", phone: "+91 98765 43218", joinDate: "2022-05-23", dob: "1991-12-03", aadhar: "6789 0123 4567", pan: "NOPQ3456N", address: "90, West Lane, Trichy", avatar: "" },
    { id: 10, name: "Divya Krishnan", department: "Cleaning", email: "divya.k@avseco.com", phone: "+91 98765 43219", joinDate: "2021-11-11", dob: "1989-10-28", aadhar: "8901 2345 6789", pan: "HIJK7890P", address: "67, East Coast Road, Chennai", avatar: "" },
    { id: 11, name: "Suresh Babu", department: "Maitanice", email: "suresh.b@avseco.com", phone: "+91 98765 43220", joinDate: new Date().toISOString().split("T")[0], dob: "1998-05-15", aadhar: "1122 3344 5566", pan: "ZZZZ9999X", address: "12, New Street, Chennai", avatar: "" },
];

const DEFAULT_EXPENSES = [
    { id: 1, category: "Machine Maintenance", description: "Repair of CNC Machine", amount: "15000", date: "2026-02-18", paymentMode: "Bank Transfer" },
    { id: 2, category: "Material", description: "Raw Material – Steel Sheets", amount: "45000", date: "2026-02-19", paymentMode: "Cheque" },
    { id: 3, category: "Salary", description: "Advance Salary for Rahul", amount: "5000", date: "2026-02-10", paymentMode: "Cash" },
    { id: 4, category: "Others", description: "Office Stationery", amount: "1200", date: "2026-01-15", paymentMode: "UPI" },
];

const DEPARTMENTS = ["All Departments", "Ceo", "Hr", "It admin", "Operator", "Maitanice", "Machine operator", "Cleaning", "Driver", "Others"];

// ─── Create Context ───────────────────────────────────────────────────────────
const AppContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AppProvider = ({ children }) => {
    const stored = loadFromStorage();

    // ── Global State ────────────────────────────────────────────────────────────
    const [employees, setEmployeesRaw] = useState(stored?.employees ?? DEFAULT_EMPLOYEES);
    const [expenses, setExpensesRaw] = useState(stored?.expenses ?? DEFAULT_EXPENSES);
    const [attendanceRecords, setAttendanceRecordsRaw] = useState(stored?.attendanceRecords ?? {});
    // attendanceRecords shape: { "YYYY-MM-DD": [ { empId, status, note, halfDayTime } ] }

    // ── Persist every change to localStorage ────────────────────────────────────
    useEffect(() => {
        saveToStorage({ employees, expenses, attendanceRecords });
    }, [employees, expenses, attendanceRecords]);

    // ══════════════════════════════════════════════════════════
    // EMPLOYEES API
    // ══════════════════════════════════════════════════════════
    const setEmployees = useCallback((updater) => {
        setEmployeesRaw(updater);
    }, []);

    const addEmployee = useCallback((emp) => {
        setEmployeesRaw(prev => {
            const newEmp = { ...emp, id: Date.now() };
            return [...prev, newEmp];
        });
    }, []);

    const updateEmployee = useCallback((id, updates) => {
        setEmployeesRaw(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    }, []);

    const deleteEmployee = useCallback((id) => {
        setEmployeesRaw(prev => prev.filter(e => e.id !== id));
    }, []);

    // ══════════════════════════════════════════════════════════
    // EXPENSES API
    // ══════════════════════════════════════════════════════════
    const setExpenses = useCallback((updater) => {
        setExpensesRaw(updater);
    }, []);

    const addExpense = useCallback((exp) => {
        setExpensesRaw(prev => [{ ...exp, id: Date.now() }, ...prev]);
    }, []);

    const deleteExpense = useCallback((id) => {
        setExpensesRaw(prev => prev.filter(e => e.id !== id));
    }, []);

    // ══════════════════════════════════════════════════════════
    // ATTENDANCE API
    // ══════════════════════════════════════════════════════════

    /** Get attendance records for a specific date string "YYYY-MM-DD".
     *  If none saved yet, auto-generate from current employees list. */
    const getAttendanceForDate = useCallback((dateStr) => {
        return (attendanceRecords[dateStr] ?? []);
    }, [attendanceRecords]);

    /** Build default attendance rows from employees for a given date. */
    const buildDefaultAttendance = useCallback((dateStr) => {
        return employees.map(emp => ({
            empId: emp.id,
            status: "present",
            note: "",
            halfDayTime: null,
        }));
    }, [employees]);

    /** Initialize attendance for a date if it doesn't exist yet. */
    const initAttendanceForDate = useCallback((dateStr) => {
        setAttendanceRecordsRaw(prev => {
            if (prev[dateStr]) return prev;
            return { ...prev, [dateStr]: buildDefaultAttendance(dateStr) };
        });
    }, [buildDefaultAttendance]);

    /** Update a single employee's attendance for a date. */
    const updateAttendanceRecord = useCallback((dateStr, empId, updates) => {
        setAttendanceRecordsRaw(prev => {
            const dayRecords = prev[dateStr] ?? buildDefaultAttendance(dateStr);
            const updated = dayRecords.map(r => r.empId === empId ? { ...r, ...updates } : r);
            return { ...prev, [dateStr]: updated };
        });
    }, [buildDefaultAttendance]);

    /** Save entire attendance list for a date. */
    const saveAttendanceForDate = useCallback((dateStr, records) => {
        setAttendanceRecordsRaw(prev => ({ ...prev, [dateStr]: records }));
    }, []);

    // ══════════════════════════════════════════════════════════
    // DERIVED / ANALYTICS
    // ══════════════════════════════════════════════════════════

    /** Total expense amount */
    const totalExpenseAmount = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

    /** Expense breakdown by category */
    const expenseByCategory = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount || 0);
        return acc;
    }, {});

    /** Employee count by department */
    const employeesByDepartment = employees.reduce((acc, e) => {
        acc[e.department] = (acc[e.department] || 0) + 1;
        return acc;
    }, {});

    /** Today's attendance summary */
    const todayStr = new Date().toISOString().split("T")[0];
    const todayAttendance = attendanceRecords[todayStr] ?? [];
    const todayStats = {
        present: todayAttendance.filter(r => r.status === "present").length,
        absent: todayAttendance.filter(r => r.status === "absent").length,
        half: todayAttendance.filter(r => r.status === "half").length,
        total: employees.length,
    };

    /** Last 7 days attendance trend */
    const last7DaysTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const ds = d.toISOString().split("T")[0];
        const recs = attendanceRecords[ds] ?? [];
        return {
            date: ds,
            label: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
            present: recs.filter(r => r.status === "present").length,
            absent: recs.filter(r => r.status === "absent").length,
            half: recs.filter(r => r.status === "half").length,
            total: employees.length,
        };
    });

    return (
        <AppContext.Provider value={{
            // Raw data
            employees,
            expenses,
            attendanceRecords,
            departments: DEPARTMENTS,

            // Employee actions
            setEmployees,
            addEmployee,
            updateEmployee,
            deleteEmployee,

            // Expense actions
            setExpenses,
            addExpense,
            deleteExpense,

            // Attendance actions
            getAttendanceForDate,
            initAttendanceForDate,
            updateAttendanceRecord,
            saveAttendanceForDate,
            buildDefaultAttendance,

            // Analytics / Derived
            totalExpenseAmount,
            expenseByCategory,
            employeesByDepartment,
            todayStats,
            last7DaysTrend,
        }}>
            {children}
        </AppContext.Provider>
    );
};

/** Hook – use anywhere inside AppProvider */
export const useAppContext = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be used inside <AppProvider>");
    return ctx;
};

export default AppContext;
