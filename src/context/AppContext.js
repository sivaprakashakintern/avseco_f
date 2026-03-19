import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { employeeApi, expenseApi, clientApi, productionApi, attendanceApi, productsApi, productionTargetApi } from "../utils/api.js";
import { useAuth } from "./AuthContext.js";

const DEPARTMENTS = ["All Departments", "Ceo", "Hr", "It admin", "Operator", "Maitanice", "Machine operator", "Cleaning", "Driver", "Others"];

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [employees, setEmployees] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [clients, setClients] = useState([]);
    const [productionHistory, setProductionHistory] = useState([]);
    const [productionTargets, setProductionTargets] = useState([]);
    const [products, setProducts] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user } = useAuth();

    // ── Fetch Initial Data ──────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [empData, expData, clientData, prodData, productData, targetData] = await Promise.all([
                employeeApi.getAll(),
                expenseApi.getAll(),
                clientApi.getAll(),
                productionApi.getAll(),
                productsApi.getAll(),
                productionTargetApi.getAll()
            ]);
            
            setEmployees(empData.map(e => ({ ...e, id: e._id })).sort((a, b) => a.name.localeCompare(b.name)));
            setExpenses(expData.map(e => ({ ...e, id: e._id })).sort((a, b) => {
                const dateA = a.date.includes('-') ? new Date(a.date.split('-').reverse().join('-')) : new Date(a.date);
                const dateB = b.date.includes('-') ? new Date(b.date.split('-').reverse().join('-')) : new Date(b.date);
                return dateB - dateA;
            }));
            setClients(clientData.map(c => ({ ...c, id: c._id })));
            setProductionHistory(prodData.map(p => ({ ...p, id: p._id })).sort((a, b) => {
                const dateA = a.date && a.date.includes('-') ? new Date(a.date.split('-').reverse().join('-')) : new Date(a.date || a.createdAt);
                const dateB = b.date && b.date.includes('-') ? new Date(b.date.split('-').reverse().join('-')) : new Date(b.date || b.createdAt);
                return dateB - dateA;
            }));
            setProducts(productData.map(p => ({ ...p, id: p._id })));
            setProductionTargets(targetData.map(t => ({ ...t, id: t._id })));
        } catch (error) {
            console.error("Error fetching app data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [fetchData, user]);

    // EMPLOYEES
    const addEmployee = useCallback(async (emp) => {
        try {
            const data = await employeeApi.add(emp);
            setEmployees(prev => [...prev, { ...data, id: data._id }].sort((a, b) => a.name.localeCompare(b.name)));
            return data;
        } catch (error) {
            if (error.response) {
                console.error("Employee Creation Backend Error:", error.response.data);
            }
            throw error;
        }
    }, []);

    const updateEmployee = useCallback(async (id, updates) => {
        const data = await employeeApi.update(id, updates);
        setEmployees(prev => prev.map(e => e.id === id ? { ...data, id: data._id } : e).sort((a, b) => a.name.localeCompare(b.name)));
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
    const fetchTargets = useCallback(async () => {
        try {
            const targetData = await productionTargetApi.getAll();
            setProductionTargets(targetData.map(t => ({ ...t, id: t._id })));
        } catch (error) {
            console.error("Error fetching targets:", error);
        }
    }, []);

    // PRODUCTION - Enhanced with Sync
    const addProduction = useCallback(async (prod, skipTargetSync = false) => {
        // 1. Save the production record
        const data = await productionApi.add(prod);
        setProductionHistory(prev => [{ ...data, id: data._id }, ...prev]);

        // 2. Sync with Production Plan (Targets)
        if (!skipTargetSync) {
            try {
                const allTargets = await productionTargetApi.getAll();
                const matchingTarget = allTargets.find(t => 
                    t.operator === prod.operator && 
                    t.productSize === prod.size
                );

                if (matchingTarget) {
                    const newProduced = (matchingTarget.producedQty || 0) + Number(prod.quantity);
                    await productionTargetApi.updateProduced(matchingTarget._id, newProduced);
                    await fetchTargets();
                }
            } catch (err) {
                console.warn("Sync with target failed:", err);
            }
        } else {
            // Even if skipping sync, we should refresh the targets to show the new state
            await fetchTargets();
        }

        return data;
    }, [fetchTargets]);

    const deleteProduction = useCallback(async (id) => {
        // Find the record before delete to sync back
        const record = productionHistory.find(p => p.id === id);
        
        await productionApi.delete(id);
        setProductionHistory(prev => prev.filter(p => p.id !== id));

        // Sync Back: Decrement target if found
        if (record) {
            try {
                const allTargets = await productionTargetApi.getAll();
                const matchingTarget = allTargets.find(t => 
                    t.operator === record.operator && 
                    t.productSize === record.size
                );

                if (matchingTarget) {
                    const newProduced = Math.max(0, (matchingTarget.producedQty || 0) - Number(record.quantity));
                    await productionTargetApi.updateProduced(matchingTarget._id, newProduced);
                    await fetchTargets();
                }
            } catch (err) {
                console.warn("Sync delete with target failed:", err);
            }
        }
    }, [productionHistory, fetchTargets]);

    // ATTENDANCE
    const fetchAttendanceForDate = useCallback(async (dateStr) => {
        try {
            const data = await attendanceApi.getByDate(dateStr);
            const mapped = data.map(r => {
                // r.employee may be a populated object OR a plain ObjectId string
                const empId = r.employee?._id ? String(r.employee._id) : String(r.employee);
                return { ...r, empId, id: r._id };
            });
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
                status: r.status || 'present',
                note: r.note || '',
                halfDayTime: r.halfDayTime || null
            }));
            const data = await attendanceApi.saveBulk(dateStr, formattedRecords);
            const mapped = data.map(r => {
                const empId = r.employee?._id ? String(r.employee._id) : String(r.employee);
                return { ...r, empId, id: r._id };
            });
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

    // ── DERIVED METRICS ─────────────────────────────────────────────────────────
    
    // Group production by size/product
    const stockData = products.map(product => {
        // Sum total produced for this product/size
        const produced = productionHistory
            .filter(p => p.product === product.name && p.size === product.size)
            .reduce((sum, p) => sum + Number(p.quantity || 0), 0);
        
        // Sold logic (PLACEHOLDER for future Sales model - currently assumed 0 if not tracked)
        // Since the user wants it to be REAL from DB, until we have Sales, stock = ALL Produced.
        const sold = 0; 
        const quantity = produced - sold;
        const totalValue = quantity * Number(product.sellPrice || 0);
        
        return {
            ...product,
            quantity,
            perPlateRate: Number(product.sellPrice || 0),
            totalValue
        };
    });

    const totalStockUnits = stockData.reduce((sum, s) => sum + s.quantity, 0);
    const totalStockValue = stockData.reduce((sum, s) => sum + s.totalValue, 0);

    const toFormattedDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const productionStats = (() => {
        const history = productionHistory || [];
        const targets = productionTargets || [];
        const today = toFormattedDate(new Date());
        
        const currentMonthIdx = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const last7Days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(toFormattedDate(d));
        }

        const availableSizes = ['6-inch', '8-inch', '10-inch', '12-inch'];
        
        const todayHistory = history.filter(item => item.date === today);
        const todayTotal = todayHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const todayBySize = {};
        availableSizes.forEach(size => {
            todayBySize[size] = todayHistory.filter(item => item.size === size).reduce((sum, item) => sum + (item.quantity || 0), 0);
        });

        const weekHistory = history.filter(item => last7Days.includes(item.date));
        const weekTotal = weekHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const weekBySize = {};
        availableSizes.forEach(size => {
            weekBySize[size] = weekHistory.filter(item => item.size === size).reduce((sum, item) => sum + (item.quantity || 0), 0);
        });

        const monthHistory = history.filter(item => {
            if (!item.date) return false;
            const parts = item.date.split('-');
            const month = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            return month === currentMonthIdx && year === currentYear;
        });
        const monthTotal = monthHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const monthBySize = {};
        availableSizes.forEach(size => {
            monthBySize[size] = monthHistory.filter(item => item.size === size).reduce((sum, item) => sum + (item.quantity || 0), 0);
        });

        const stockTotal = targets.reduce((sum, item) => sum + (item.producedQty || 0), 0);

        return {
            today: todayTotal,
            week: weekTotal,
            month: monthTotal,
            stock: stockTotal,
            todayBySize,
            weekBySize,
            monthBySize,
            availableSizes
        };
    })();

  // ✅ Local date key helper - avoids UTC timezone shift (IST+5:30 bug)
  const toLocalDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const todayStr = toLocalDateKey(new Date());

    const todayAttendance = attendanceRecords[todayStr] ?? [];
    const todayStats = {
        present: todayAttendance.filter(r => r.status === "present").length,
        absent: todayAttendance.filter(r => r.status === "absent").length,
        half: todayAttendance.filter(r => r.status === "half").length,
        total: employees.length || 0,
    };

    const last7DaysTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const ds = toLocalDateKey(d);
        const recs = attendanceRecords[ds] ?? [];
        return {
            date: ds,
            label: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
            present: recs.filter(r => r.status === "present").length,
            absent: recs.filter(r => r.status === "absent").length,
            half: recs.filter(r => r.status === "half").length,
            total: employees.length || 0,
        };
    });


    return (
        <AppContext.Provider value={{
            employees,
            expenses,
            clients,
            productionHistory,
            productionTargets,
            products,
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
            fetchTargets,
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
            totalStockUnits,
            totalStockValue,
            stockData,
            productionStats,
            isMobileMenuOpen,
            setIsMobileMenuOpen,
            fetchData,
            setLoading,
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
