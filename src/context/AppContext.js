import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { employeeApi, expenseApi, clientApi, productionApi, attendanceApi, productsApi, productionTargetApi, salesApi } from "../utils/api.js";
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
    const [salesHistory, setSalesHistory] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const { user, refreshUser } = useAuth();
    
    // ✅ Helper to avoid UTC timezone shift (IST+5:30 bug)
    const toLocalDateKey = useCallback((date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, []);

    const todayStr = toLocalDateKey(new Date());

    // ── Fetch Initial Data ──────────────────────────────────────────────────────
    const fetchData = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            
            // Refresh permissions from backend
            if (user) await refreshUser();
            const results = await Promise.allSettled([
                employeeApi.getAll(),
                expenseApi.getAll(),
                clientApi.getAll(),
                productionApi.getAll(),
                productsApi.getAll(),
                productionTargetApi.getAll(),
                salesApi.getAll(),
                attendanceApi.getByDate(todayStr)
            ]);

            const [empRes, expRes, clientRes, prodRes, productRes, targetRes, salesRes, attendanceRes] = results;
            
            const empData = empRes.status === 'fulfilled' ? empRes.value : [];
            const expData = expRes.status === 'fulfilled' ? expRes.value : [];
            const clientData = clientRes.status === 'fulfilled' ? clientRes.value : [];
            const prodData = prodRes.status === 'fulfilled' ? prodRes.value : [];
            const productData = productRes.status === 'fulfilled' ? productRes.value : [];
            const targetData = targetRes.status === 'fulfilled' ? targetRes.value : [];
            const salesData = salesRes.status === 'fulfilled' ? salesRes.value : [];
            const attendanceData = attendanceRes.status === 'fulfilled' ? attendanceRes.value : [];
            
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
            setSalesHistory(salesData.map(s => ({ ...s, id: s._id })));
            
            // Sync attendance
            const mappedAttendance = attendanceData.map(r => {
                const empId = r.employee?._id ? String(r.employee._id) : String(r.employee);
                return { ...r, empId, id: r._id };
            });
            setAttendanceRecords(prev => ({ ...prev, [todayStr]: mappedAttendance }));
        } catch (error) {
            console.error("Error fetching app data:", error);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [todayStr]);

    useEffect(() => {
        if (user) {
            fetchData(true); // First load with loading screen
            // Periodic background sync (No loading screen)
            const interval = setInterval(() => fetchData(false), 30000);
            return () => clearInterval(interval);
        }
    }, [fetchData, user]);

    // EMPLOYEES
    const addEmployee = useCallback(async (emp) => {
        setIsUpdating(true);
        try {
            const data = await employeeApi.add(emp);
            setEmployees(prev => [...prev, { ...data, id: data._id }].sort((a, b) => a.name.localeCompare(b.name)));
            return data;
        } catch (error) {
            console.error("Employee Creation Backend Error:", error);
            throw error;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const updateEmployee = useCallback(async (id, updates) => {
        setIsUpdating(true);
        try {
            const data = await employeeApi.update(id, updates);
            setEmployees(prev => prev.map(e => e.id === id ? { ...data, id: data._id } : e).sort((a, b) => a.name.localeCompare(b.name)));
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const deleteEmployee = useCallback(async (id) => {
        setIsUpdating(true);
        try {
            await employeeApi.delete(id);
            setEmployees(prev => prev.filter(e => e.id !== id));
        } finally {
            setIsUpdating(false);
        }
    }, []);

    // EXPENSES
    const addExpense = useCallback(async (exp) => {
        setIsUpdating(true);
        try {
            const data = await expenseApi.add(exp);
            setExpenses(prev => [{ ...data, id: data._id }, ...prev]);
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const updateExpense = useCallback(async (id, updates) => {
        setIsUpdating(true);
        try {
            const data = await expenseApi.update(id, updates);
            setExpenses(prev => prev.map(e => e.id === id ? { ...data, id: data._id } : e));
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const deleteExpense = useCallback(async (id) => {
        setIsUpdating(true);
        try {
            await expenseApi.delete(id);
            setExpenses(prev => prev.filter(e => e.id !== id));
        } finally {
            setIsUpdating(false);
        }
    }, []);

    // CLIENTS
    const addClient = useCallback(async (client) => {
        setIsUpdating(true);
        try {
            const data = await clientApi.add(client);
            setClients(prev => [...prev, { ...data, id: data._id }]);
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const updateClient = useCallback(async (id, updates) => {
        setIsUpdating(true);
        try {
            const data = await clientApi.update(id, updates);
            setClients(prev => prev.map(c => c.id === id ? { ...data, id: data._id } : c));
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const deleteClient = useCallback(async (id) => {
        setIsUpdating(true);
        try {
            await clientApi.delete(id);
            setClients(prev => prev.filter(c => c.id !== id));
        } finally {
            setIsUpdating(false);
        }
    }, []);

    // PRODUCTION
    const fetchTargets = useCallback(async () => {
        try {
            const data = await productionTargetApi.getAll();
            setProductionTargets(data.map(t => ({ ...t, id: t._id })));
        } catch (error) {
            console.error("Error fetching targets:", error);
        }
    }, []);

    const addProduction = useCallback(async (prod, skipTargetSync = false) => {
        setIsUpdating(true);
        try {
            // 1. Save the production record
            const data = await productionApi.add(prod);
            
            setProductionHistory(prev => {
                const exists = prev.find(p => p.id === data._id);
                if (exists) {
                    return prev.map(p => p.id === data._id ? { ...data, id: data._id } : p);
                }
                return [{ ...data, id: data._id }, ...prev];
            });

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
                await fetchTargets();
            }

            return data;
        } finally {
            setIsUpdating(false);
        }
    }, [fetchTargets]);

    const deleteProduction = useCallback(async (id) => {
        setIsUpdating(true);
        try {
            const record = productionHistory.find(p => p.id === id);
            await productionApi.delete(id);
            setProductionHistory(prev => prev.filter(p => p.id !== id));

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
        } finally {
            setIsUpdating(false);
        }
    }, [productionHistory, fetchTargets]);

    const clearAllProduction = useCallback(async () => {
        setIsUpdating(true);
        try {
            await productionApi.clearAll();
            setProductionHistory([]);
            const allTargets = await productionTargetApi.getAll();
            for (const target of allTargets) {
                await productionTargetApi.updateProduced(target._id, 0);
            }
            await fetchTargets();
        } catch (err) {
            console.warn("Failed to reset targets during production clear:", err);
        } finally {
            setIsUpdating(false);
        }
    }, [fetchTargets]);

    // SALES
    const addSale = useCallback(async (sale) => {
        setIsUpdating(true);
        try {
            const data = await salesApi.log(sale);
            setSalesHistory(prev => [{ ...data, id: data._id }, ...prev]);
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const updateSale = useCallback(async (id, updates) => {
        setIsUpdating(true);
        try {
            const data = await salesApi.update(id, updates);
            setSalesHistory(prev => prev.map(s => s.id === id ? { ...data, id: data._id } : s));
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const deleteSale = useCallback(async (id) => {
        setIsUpdating(true);
        try {
            await salesApi.delete(id);
            setSalesHistory(prev => prev.filter(s => s.id !== id));
        } finally {
            setIsUpdating(false);
        }
    }, []);

    // PRODUCTS
    const addProduct = useCallback(async (productData) => {
        setIsUpdating(true);
        try {
            const data = await productsApi.add(productData);
            setProducts(prev => [{ ...data, id: data._id }, ...prev]);
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const updateProduct = useCallback(async (id, updates) => {
        setIsUpdating(true);
        try {
            const data = await productsApi.update(id, updates);
            setProducts(prev => prev.map(p => p.id === id ? { ...data, id: data._id } : p));
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const deleteProduct = useCallback(async (id) => {
        setIsUpdating(true);
        try {
            await productsApi.delete(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } finally {
            setIsUpdating(false);
        }
    }, []);

    // ATTENDANCE
    const fetchAttendanceForDate = useCallback(async (dateStr) => {
        try {
            const data = await attendanceApi.getByDate(dateStr);
            const mapped = data.map(r => {
                const empId = r.employee?._id ? String(r.employee._id) : String(r.employee);
                return { ...r, empId, id: r._id };
            });
            setAttendanceRecords(prev => ({ ...prev, [dateStr]: mapped }));
            return mapped;
        } catch (error) {
            console.error("Error fetching attendance for date:", dateStr, error);
            return [];
        }
    }, []);

    const buildDefaultAttendance = useCallback((dateStr) => {
        return (employees || []).map(emp => ({
            date: dateStr,
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
        setIsUpdating(true);
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
        } finally {
            setIsUpdating(false);
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
        const size = (product.size || "").toLowerCase().trim().replace(" ", "-");
        const prodHistory = productionHistory.filter(h => 
            (h.size || "").toLowerCase().trim().replace(" ", "-") === size
        );
        const produced = prodHistory.reduce((sum, h) => sum + (h.quantity || 0), 0);
        
        // Calculate sold quantity from salesHistory (Case Insensitive)
        const sold = salesHistory.reduce((sum, sale) => {
            const itemMatch = sale.saleItems?.find(item => {
                const prodNameMatch = (item.productName || item.baseName || "").toLowerCase() === (product.name || "").toLowerCase();
                const sizeMatch = (item.size || "").toLowerCase() === (product.size || "").toLowerCase();
                return prodNameMatch && sizeMatch;
            });
            return sum + (itemMatch ? Number(itemMatch.qty || 0) : 0);
        }, 0);

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

    const toFormattedDate = useCallback((date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    }, []);

    const productionStats = useMemo(() => {
        const history = productionHistory || [];
        const today = toFormattedDate(new Date());
        
        const currentMonthIdx = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const last7Days = [];
        const prev7Days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(toFormattedDate(d));
            
            const pd = new Date();
            pd.setDate(pd.getDate() - (i + 7));
            prev7Days.push(toFormattedDate(pd));
        }

        const availableSizes = ['6-inch', '8-inch', '10-inch', '12-inch'];
        
        const todayHistory = history.filter(item => {
            const itemDateStr = item.date || "";
            // Handle both DD-MM-YYYY and YYYY-MM-DD
            if (itemDateStr.includes("-")) {
                const parts = itemDateStr.split("-");
                const formatted = parts[0].length === 4 ? `${parts[2]}-${parts[1]}-${parts[0]}` : itemDateStr;
                return formatted === today;
            }
            return itemDateStr === today;
        });
        const todayTotal = todayHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const todayBySize = {};
        availableSizes.forEach(size => {
            const sKey = size.toLowerCase().trim().replace(" ", "-");
            todayBySize[size] = todayHistory.filter(item => (item.size || "").toLowerCase().trim().replace(" ", "-") === sKey).reduce((sum, item) => sum + (item.quantity || 0), 0);
        });

        const weekHistory = history.filter(item => {
            const itemDateStr = item.date || "";
            if (itemDateStr.includes("-")) {
                const parts = itemDateStr.split("-");
                const formatted = parts[0].length === 4 ? `${parts[2]}-${parts[1]}-${parts[0]}` : itemDateStr;
                return last7Days.includes(formatted);
            }
            return last7Days.includes(itemDateStr);
        });
        const weekTotal = weekHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        const prevWeekHistory = history.filter(item => {
            const itemDateStr = item.date || "";
            if (itemDateStr.includes("-")) {
                const parts = itemDateStr.split("-");
                const formatted = parts[0].length === 4 ? `${parts[2]}-${parts[1]}-${parts[0]}` : itemDateStr;
                return prev7Days.includes(formatted);
            }
            return prev7Days.includes(itemDateStr);
        });
        const prevWeekTotal = prevWeekHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);

        const monthTotal = (history.filter(item => {
            const itemDateStr = item.date || "";
            if (!itemDateStr) return false;
            let m, y;
            if (itemDateStr.includes("-")) {
                const parts = itemDateStr.split("-");
                if (parts[0].length === 4) { // YYYY-MM-DD
                    m = parseInt(parts[1]); y = parseInt(parts[0]);
                } else { // DD-MM-YYYY
                    m = parseInt(parts[1]); y = parseInt(parts[2]);
                }
                return m === currentMonthIdx && y === currentYear;
            }
            return false;
        })).reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        const prevMonthIdx = currentMonthIdx === 1 ? 12 : currentMonthIdx - 1;
        const prevMonthYear = currentMonthIdx === 1 ? currentYear - 1 : currentYear;
        const prevMonthHistory = history.filter(item => {
            const itemDateStr = item.date || "";
            if (!itemDateStr) return false;
            let m, y;
            if (itemDateStr.includes("-")) {
                const parts = itemDateStr.split("-");
                if (parts[0].length === 4) { // YYYY-MM-DD
                    m = parseInt(parts[1]); y = parseInt(parts[0]);
                } else { // DD-MM-YYYY
                    m = parseInt(parts[1]); y = parseInt(parts[2]);
                }
                return m === prevMonthIdx && y === prevMonthYear;
            }
            return false;
        });
        const prevMonthTotal = prevMonthHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);

        const weekTrend = prevWeekTotal === 0 ? (weekTotal > 0 ? 100 : 0) : Math.round(((weekTotal - prevWeekTotal) / prevWeekTotal) * 100);
        const monthTrend = prevMonthTotal === 0 ? (monthTotal > 0 ? 100 : 0) : Math.round(((monthTotal - prevMonthTotal) / prevMonthTotal) * 100);

        return {
            today: todayTotal,
            week: weekTotal,
            weekTrend: weekTrend,
            month: monthTotal,
            monthTrend: monthTrend,
            stock: Object.values(availableSizes).reduce((sum, size) => sum + history.filter(item => item.size === size).reduce((sum, item) => sum + (item.quantity || 0), 0), 0),
            todayBySize,
            availableSizes
        };
    }, [productionHistory, toFormattedDate]);

    // Using todayStr calculated at the top of the component

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
            clearAllProduction,
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
            isUpdating,
            salesHistory, 
            addSale,
            updateSale,
            deleteSale,
            addProduct,
            updateProduct,
            deleteProduct
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
