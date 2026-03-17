import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { employeeApi, expenseApi, clientApi, productionApi, attendanceApi } from "../utils/api.js";

const DEPARTMENTS = ["All Departments", "Ceo", "Hr", "It admin", "Operator", "Maitanice", "Machine operator", "Cleaning", "Driver", "Others"];

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [employees, setEmployees] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [clients, setClients] = useState([]);
    const [productionHistory, setProductionHistory] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // ── Fetch Initial Data ──────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [empData, expData, clientData, prodData] = await Promise.all([
                employeeApi.getAll(),
                expenseApi.getAll(),
                clientApi.getAll(),
                productionApi.getAll()
            ]);
            
            setEmployees(empData.map(e => ({ ...e, id: e._id })));
            setExpenses(expData.map(e => ({ ...e, id: e._id })));
            setClients(clientData.map(c => ({ ...c, id: c._id })));
            setProductionHistory(prodData.map(p => ({ ...p, id: p._id })));
        } catch (error) {
            console.error("Error fetching app data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // EMPLOYEES
    const addEmployee = useCallback(async (emp) => {
        const data = await employeeApi.add(emp);
        setEmployees(prev => [...prev, { ...data, id: data._id }]);
        return data;
    }, []);

    const updateEmployee = useCallback(async (id, updates) => {
        const data = await employeeApi.update(id, updates);
        setEmployees(prev => prev.map(e => e.id === id ? { ...data, id: data._id } : e));
        return data;
    }, []);

    const deleteEmployee = useCallback(async (id) => {
        await employeeApi.delete(id);
        setEmployees(prev => prev.filter(e => e.id !== id));
    }, []);

    // EXPENSES
    const addExpense = useCallback(async (exp) => {
        const data = await expenseApi.add(exp);
        setExpenses(prev => [{ ...data, id: data._id }, ...prev]);
        return data;
    }, []);

    const updateExpense = useCallback(async (id, updates) => {
        const data = await expenseApi.update(id, updates);
        setExpenses(prev => prev.map(e => e.id === id ? { ...data, id: data._id } : e));
        return data;
    }, []);

    const deleteExpense = useCallback(async (id) => {
        await expenseApi.delete(id);
        setExpenses(prev => prev.filter(e => e.id !== id));
    }, []);

    // CLIENTS
    const addClient = useCallback(async (client) => {
        const data = await clientApi.add(client);
        setClients(prev => [...prev, { ...data, id: data._id }]);
        return data;
    }, []);

    const updateClient = useCallback(async (id, updates) => {
        const data = await clientApi.update(id, updates);
        setClients(prev => prev.map(c => c.id === id ? { ...data, id: data._id } : c));
        return data;
    }, []);

    const deleteClient = useCallback(async (id) => {
        await clientApi.delete(id);
        setClients(prev => prev.filter(c => c.id !== id));
    }, []);

    // PRODUCTION
    const addProduction = useCallback(async (prod) => {
        const data = await productionApi.add(prod);
        setProductionHistory(prev => [{ ...data, id: data._id }, ...prev]);
        return data;
    }, []);

    const deleteProduction = useCallback(async (id) => {
        await productionApi.delete(id);
        setProductionHistory(prev => prev.filter(p => p.id !== id));
    }, []);

    // ATTENDANCE
    const fetchAttendanceForDate = useCallback(async (dateStr) => {
        try {
            const data = await attendanceApi.getByDate(dateStr);
            const mapped = data.map(r => ({ ...r, empId: r.employee, id: r._id }));
            setAttendanceRecords(prev => ({ ...prev, [dateStr]: mapped }));
            return mapped;
        } catch (error) {
            console.error("Error fetching attendance:", error);
            return [];
        }
    }, []);

    const buildDefaultAttendance = useCallback((dateStr) => {
        return employees.map(emp => ({
            empId: emp.id,
            status: "present",
            note: "",
            halfDayTime: null,
        }));
    }, [employees]);

    const initAttendanceForDate = useCallback(async (dateStr) => {
        const existing = await fetchAttendanceForDate(dateStr);
        if (existing.length === 0) {
            setAttendanceRecords(prev => ({ ...prev, [dateStr]: buildDefaultAttendance(dateStr) }));
        }
    }, [fetchAttendanceForDate, buildDefaultAttendance]);

    const updateAttendanceRecord = useCallback((dateStr, empId, updates) => {
        setAttendanceRecords(prev => {
            const dayRecords = prev[dateStr] ?? buildDefaultAttendance(dateStr);
            const updated = dayRecords.map(r => r.empId === empId ? { ...r, ...updates } : r);
            return { ...prev, [dateStr]: updated };
        });
    }, [buildDefaultAttendance]);

    const saveAttendanceForDate = useCallback(async (dateStr, records) => {
        try {
            const formattedRecords = records.map(r => ({
                employee: r.empId,
                status: r.status,
                note: r.note,
                halfDayTime: r.halfDayTime
            }));
            const data = await attendanceApi.saveBulk(dateStr, formattedRecords);
            const mapped = data.map(r => ({ ...r, empId: r.employee, id: r._id }));
            setAttendanceRecords(prev => ({ ...prev, [dateStr]: mapped }));
            return mapped;
        } catch (error) {
            console.error("Error saving attendance:", error);
            throw error;
        }
    }, []);

    // ANALYTICS / DERIVED
    const totalExpenseAmount = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const expenseByCategory = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount || 0);
        return acc;
    }, {});
    const employeesByDepartment = employees.reduce((acc, e) => {
        acc[e.department] = (acc[e.department] || 0) + 1;
        return acc;
    }, {});

    const todayStr = new Date().toISOString().split("T")[0];
    const todayAttendance = attendanceRecords[todayStr] ?? [];
    const todayStats = {
        present: todayAttendance.filter(r => r.status === "present").length,
        absent: todayAttendance.filter(r => r.status === "absent").length,
        half: todayAttendance.filter(r => r.status === "half").length,
        total: employees.length,
    };

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
            employees,
            expenses,
            clients,
            productionHistory,
            attendanceRecords,
            departments: DEPARTMENTS,
            loading,
            addEmployee,
            updateEmployee,
            deleteEmployee,
            addExpense,
            updateExpense,
            deleteExpense,
            addClient,
            updateClient,
            deleteClient,
            addProduction,
            deleteProduction,
            fetchAttendanceForDate,
            initAttendanceForDate,
            updateAttendanceRecord,
            saveAttendanceForDate,
            buildDefaultAttendance,
            totalExpenseAmount,
            expenseByCategory,
            employeesByDepartment,
            todayStats,
            last7DaysTrend,
            isMobileMenuOpen,
            setIsMobileMenuOpen,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be used inside <AppProvider>");
    return ctx;
};

export default AppContext;
