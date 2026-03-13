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
    { id: 1, empId: "EMP-001", name: "Rajesh Kumar", department: "Ceo", email: "rajesh.k@avseco.com", phone: "+91 98765 43210", joinDate: "2020-01-15", dob: "1985-06-15", aadhar: "1234 5678 9012", pan: "ABCDE1234F", address: "123, Gandhi Road, Chennai", avatar: "", salary: 75000 },
    { id: 2, empId: "EMP-002", name: "Priya Sharma", department: "Operator", email: "priya.s@avseco.com", phone: "+91 98765 43211", joinDate: "2021-03-10", dob: "1990-08-22", aadhar: "9876 5432 1098", pan: "WXYZ5678A", address: "45, Industrial Estate, Coimbatore", avatar: "", salary: 25000 },
    { id: 3, empId: "EMP-003", name: "Amit Patel", department: "It admin", email: "amit.p@avseco.com", phone: "+91 98765 43212", joinDate: "2021-06-22", dob: "1992-11-05", aadhar: "4567 8901 2345", pan: "PQRS9012B", address: "78, Main Street, Trichy", avatar: "", salary: 45000 },
    { id: 4, empId: "EMP-004", name: "Sneha Reddy", department: "Hr", email: "sneha.r@avseco.com", phone: "+91 98765 43213", joinDate: "2022-01-05", dob: "1994-03-30", aadhar: "3210 9876 5432", pan: "LMNO3456C", address: "12, Lake View Road, Madurai", avatar: "", salary: 35000 },
    { id: 5, empId: "EMP-005", name: "Vikram Singh", department: "Machine operator", email: "vikram.s@avseco.com", phone: "+91 98765 43214", joinDate: "2022-09-18", dob: "1996-07-12", aadhar: "7890 1234 5678", pan: "DEFG7890H", address: "89, Cross Street, Salem", avatar: "", salary: 28000 },
    { id: 6, empId: "EMP-006", name: "Anjali Mehta", department: "Hr", email: "anjali.m@avseco.com", phone: "+91 98765 43215", joinDate: "2021-11-30", dob: "1993-01-25", aadhar: "5678 9012 3456", pan: "JKLM1234K", address: "23, Park Avenue, Chennai", avatar: "", salary: 35000 },
    { id: 7, empId: "EMP-007", name: "Karthik Rajan", department: "Operator", email: "karthik.r@avseco.com", phone: "+91 98765 43216", joinDate: "2022-02-14", dob: "1995-09-08", aadhar: "0123 4567 8901", pan: "UVWX5678L", address: "56, Temple Street, Madurai", avatar: "", salary: 20000 },
    { id: 8, empId: "EMP-008", name: "Lakshmi Nair", department: "Hr", email: "lakshmi.n@avseco.com", phone: "+91 98765 43217", joinDate: "2021-08-19", dob: "1988-04-18", aadhar: "2345 6789 0123", pan: "QRST9012M", address: "34, River Side, Coimbatore", avatar: "", salary: 32000 },
    { id: 9, empId: "EMP-009", name: "Manoj Kumar", department: "Driver", email: "manoj.k@avseco.com", phone: "+91 98765 43218", joinDate: "2022-05-23", dob: "1991-12-03", aadhar: "6789 0123 4567", pan: "NOPQ3456N", address: "90, West Lane, Trichy", avatar: "", salary: 18000 },
    { id: 10, empId: "EMP-010", name: "Divya Krishnan", department: "Cleaning", email: "divya.k@avseco.com", phone: "+91 98765 43219", joinDate: "2021-11-11", dob: "1989-10-28", aadhar: "8901 2345 6789", pan: "HIJK7890P", address: "67, East Coast Road, Chennai", avatar: "", salary: 15000 },
    { id: 11, empId: "EMP-011", name: "Suresh Babu", department: "Maitanice", email: "suresh.b@avseco.com", phone: "+91 98765 43220", joinDate: "2023-01-10", dob: "1998-05-15", aadhar: "1122 3344 5566", pan: "ZZZZ9999X", address: "12, New Street, Chennai", avatar: "", salary: 22000 },
    { id: 12, empId: "EMP-012", name: "Meena Sundaram", department: "Operator", email: "meena.s@avseco.com", phone: "+91 98761 11201", joinDate: "2023-03-01", dob: "1997-02-14", aadhar: "2233 4455 6677", pan: "MNOP1122Q", address: "5, Anna Nagar, Chennai", avatar: "", salary: 20000 },
    { id: 13, empId: "EMP-013", name: "Ravi Chandran", department: "Machine operator", email: "ravi.c@avseco.com", phone: "+91 98761 11202", joinDate: "2022-07-15", dob: "1993-08-20", aadhar: "3344 5566 7788", pan: "RSTU2233R", address: "18, Gandhi Park, Coimbatore", avatar: "", salary: 26000 },
    { id: 14, empId: "EMP-014", name: "Kavya Nair", department: "Hr", email: "kavya.n@avseco.com", phone: "+91 98761 11203", joinDate: "2023-06-01", dob: "1999-04-05", aadhar: "4455 6677 8899", pan: "VWXY3344S", address: "32, MG Road, Bangalore", avatar: "", salary: 34000 },
    { id: 15, empId: "EMP-015", name: "Arun Selvam", department: "Driver", email: "arun.s@avseco.com", phone: "+91 98761 11204", joinDate: "2021-09-20", dob: "1987-11-30", aadhar: "5566 7788 9900", pan: "ABCD4455T", address: "77, Nehru Street, Trichy", avatar: "", salary: 19000 },
    { id: 16, empId: "EMP-016", name: "Nithya Devi", department: "Cleaning", email: "nithya.d@avseco.com", phone: "+91 98761 11205", joinDate: "2022-12-05", dob: "1995-07-17", aadhar: "6677 8899 0011", pan: "EFGH5566U", address: "9, Sundarapuram, Coimbatore", avatar: "", salary: 16000 },
    { id: 17, empId: "EMP-017", name: "Babu Rao", department: "Maitanice", email: "babu.r@avseco.com", phone: "+91 98761 11206", joinDate: "2023-02-14", dob: "1990-03-22", aadhar: "7788 9900 1122", pan: "IJKL6677V", address: "44, Railway Colony, Salem", avatar: "", salary: 21000 },
    { id: 18, empId: "EMP-018", name: "Deepa Rajendran", department: "Operator", email: "deepa.r@avseco.com", phone: "+91 98761 11207", joinDate: "2021-04-08", dob: "1992-09-11", aadhar: "8899 0011 2233", pan: "MNOP7788W", address: "61, West Street, Madurai", avatar: "", salary: 20000 },
    { id: 19, empId: "EMP-019", name: "Sunil Verma", department: "It admin", email: "sunil.v@avseco.com", phone: "+91 98761 11208", joinDate: "2023-07-01", dob: "1996-01-28", aadhar: "9900 1122 3344", pan: "QRST8899X", address: "15, IT Park Road, Chennai", avatar: "", salary: 40000 },
    { id: 20, empId: "EMP-020", name: "Geetha Murugan", department: "Cleaning", email: "geetha.m@avseco.com", phone: "+91 98761 11209", joinDate: "2022-10-17", dob: "1984-06-09", aadhar: "0011 2233 4455", pan: "UVWX9900Y", address: "28, South Street, Trichy", avatar: "", salary: 14000 },
    { id: 21, empId: "EMP-021", name: "Prashanth Kumar", department: "Machine operator", email: "prashanth.k@avseco.com", phone: "+91 98761 11210", joinDate: "2022-03-25", dob: "1994-12-15", aadhar: "1133 2244 3355", pan: "YZAB0011Z", address: "102, Vinayagar Kovil St, Salem", avatar: "", salary: 27000 },
    { id: 22, empId: "EMP-022", name: "Saranya Pillai", department: "Hr", email: "saranya.p@avseco.com", phone: "+91 98761 11211", joinDate: "2021-07-30", dob: "1997-05-03", aadhar: "2244 3355 4466", pan: "CDEF1133A", address: "37, LIC Colony, Madurai", avatar: "", salary: 31000 },
    { id: 23, empId: "EMP-023", name: "Murugesan T", department: "Driver", email: "murugesan.t@avseco.com", phone: "+91 98761 11212", joinDate: "2020-11-12", dob: "1982-08-19", aadhar: "3355 4466 5577", pan: "GHIJ2244B", address: "81, Bus Stand Road, Coimbatore", avatar: "", salary: 18500 },
    { id: 24, empId: "EMP-024", name: "Anitha Selvakumar", department: "Operator", email: "anitha.s@avseco.com", phone: "+91 98761 11213", joinDate: "2023-04-18", dob: "26-02-1998", aadhar: "4466 5577 6688", pan: "KLMN3355C", address: "53, East Masi St, Madurai", avatar: "", salary: 22000 },
    { id: 25, empId: "EMP-025", name: "Ramesh Gupta", department: "Maitanice", email: "ramesh.g@avseco.com", phone: "+91 98761 11214", joinDate: "2022-06-06", dob: "1988-10-04", aadhar: "5577 6688 7799", pan: "OPQR4466D", address: "66, SIDCO Industrial, Trichy", avatar: "", salary: 23000 },
    { id: 26, empId: "EMP-026", name: "Usha Kumari", department: "Cleaning", email: "usha.k@avseco.com", phone: "+91 98761 11215", joinDate: "2023-08-01", dob: "1986-04-30", aadhar: "6688 7799 8800", pan: "STUV5577E", address: "22, Anna Colony, Chennai", avatar: "", salary: 15500 },
    { id: 27, empId: "EMP-027", name: "Dinesh Raj", department: "Machine operator", email: "dinesh.r@avseco.com", phone: "+91 98761 11216", joinDate: "2021-05-14", dob: "1993-07-07", aadhar: "7799 8800 9911", pan: "WXYZ6688F", address: "41, New Concept Colony, Salem", avatar: "", salary: 26500 },
    { id: 28, empId: "EMP-028", name: "Sangeetha Devi", department: "Operator", email: "sangeetha.d@avseco.com", phone: "+91 98761 11217", joinDate: "2022-08-22", dob: "1995-11-18", aadhar: "8800 9911 0022", pan: "ABCD7799G", address: "76, Bharathi Nagar, Coimbatore", avatar: "", salary: 20000 },
    { id: 29, empId: "EMP-029", name: "Kannan Pillai", department: "Driver", email: "kannan.p@avseco.com", phone: "+91 98761 11218", joinDate: "2020-06-30", dob: "1980-09-25", aadhar: "9911 0022 1133", pan: "EFGH8800H", address: "11, Gandhi Nagar, Trichy", avatar: "", salary: 19500 },
    { id: 30, empId: "EMP-030", name: "Revathi Anand", department: "It admin", email: "revathi.a@avseco.com", phone: "+91 98761 11219", joinDate: "2023-09-01", dob: "2000-01-12", aadhar: "0022 1133 2244", pan: "IJKL9911I", address: "99, Tech Park, Chennai", avatar: "", salary: 38000 },
];

const DEFAULT_CLIENTS = [
    {
        id: 1,
        companyName: "Eco Products Ltd",
        contactPerson: "Rahul Sharma",
        email: "rahul@ecoproducts.com",
        phone: "+91 98765 43210",
        status: "Active",
        totalOrders: 45,
        totalSpent: "₹12,45,000",
        lastOrder: "2026-02-10",
        address: "123 Green Street, Mumbai - 400001",
        gst: "27ABCDE1234F1Z5",
    },
    {
        id: 2,
        companyName: "Green Earth Solutions",
        contactPerson: "Priya Patel",
        email: "priya@greenearth.com",
        phone: "+91 87654 32109",
        status: "Active",
        totalOrders: 38,
        totalSpent: "₹8,90,500",
        lastOrder: "2026-02-08",
        address: "456 Eco Park, Delhi - 110001",
        gst: "07FGHIJ5678K2L6",
    },
    {
        id: 3,
        companyName: "Sustainable Living Store",
        contactPerson: "Amit Kumar",
        email: "amit@sustainable.com",
        phone: "+91 76543 21098",
        status: "Active",
        totalOrders: 22,
        totalSpent: "₹5,67,800",
        lastOrder: "2026-02-05",
        address: "789 Green Avenue, Bangalore - 560001",
        gst: "29KLMNO9012P3M7",
    },
    {
        id: 4,
        companyName: "Nature's Basket",
        contactPerson: "Sneha Reddy",
        email: "sneha@naturesbasket.com",
        phone: "+91 65432 10987",
        status: "Active",
        totalOrders: 5,
        totalSpent: "₹85,200",
        lastOrder: "2026-01-28",
        address: "321 Organic Road, Chennai - 600001",
        gst: "33PQRST3456R4N8",
    },
    {
        id: 5,
        companyName: "Eco Friendly Mart",
        contactPerson: "Vikram Singh",
        email: "vikram@ecofriendly.com",
        phone: "+91 54321 09876",
        status: "Active",
        totalOrders: 12,
        totalSpent: "₹2,34,600",
        lastOrder: "2026-01-15",
        address: "654 Zero Waste, Pune - 411001",
        gst: "27UVWXY6789S5P9",
    },
    {
        id: 6,
        companyName: "Green Hospitality",
        contactPerson: "Anjali Mehta",
        email: "anjali@greenhospitality.com",
        phone: "+91 43210 98765",
        status: "Active",
        totalOrders: 28,
        totalSpent: "₹7,89,300",
        lastOrder: "2026-02-12",
        address: "987 Sustainable St, Hyderabad - 500001",
        gst: "36ZABCD1234T6Q1",
    },
    {
        id: 7,
        companyName: "Organic Retail Chain",
        contactPerson: "Karthik Rajan",
        email: "karthik@organicretail.com",
        phone: "+91 32109 87654",
        status: "Pending",
        totalOrders: 3,
        totalSpent: "₹45,000",
        lastOrder: "2026-01-20",
        address: "147 Natural Way, Ahmedabad - 380001",
        gst: "24EFGHI5678U7R2",
    },
    {
        id: 8,
        companyName: "Eco Packaging Solutions",
        contactPerson: "Lakshmi Nair",
        email: "lakshmi@ecopackaging.com",
        phone: "+91 21098 76543",
        status: "Active",
        totalOrders: 52,
        totalSpent: "₹18,45,600",
        lastOrder: "2026-02-11",
        address: "258 Green Circle, Kochi - 682001",
        gst: "32JKLMN9012V8S3",
    }
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
    const storedEmployees = stored?.employees;
    const initialEmployees = (storedEmployees && storedEmployees.length >= DEFAULT_EMPLOYEES.length)
        ? storedEmployees
        : DEFAULT_EMPLOYEES;
    const [employees, setEmployeesRaw] = useState(initialEmployees);
    const [expenses, setExpensesRaw] = useState(stored?.expenses ?? DEFAULT_EXPENSES);
    const [attendanceRecords, setAttendanceRecordsRaw] = useState(stored?.attendanceRecords ?? {});
    const [clients, setClientsRaw] = useState(stored?.clients ?? DEFAULT_CLIENTS);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // ── Persist every change to localStorage ────────────────────────────────────
    useEffect(() => {
        saveToStorage({ employees, expenses, attendanceRecords, clients });
    }, [employees, expenses, attendanceRecords, clients]);

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

    const updateExpense = useCallback((id, updates) => {
        setExpensesRaw(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
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
    // CLIENTS API
    // ══════════════════════════════════════════════════════════
    const addClient = useCallback((client) => {
        setClientsRaw(prev => {
            const newClient = { ...client, id: Date.now() };
            return [...prev, newClient];
        });
    }, []);

    const updateClient = useCallback((id, updates) => {
        setClientsRaw(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }, []);

    const deleteClient = useCallback((id) => {
        setClientsRaw(prev => prev.filter(c => c.id !== id));
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
            updateExpense,
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

            // Clients
            clients,
            addClient,
            updateClient,
            deleteClient,

            // Mobile menu state
            isMobileMenuOpen,
            setIsMobileMenuOpen,
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
