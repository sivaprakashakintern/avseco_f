import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { employeeApi, expenseApi, clientApi, productionApi, attendanceApi, productsApi, productionTargetApi, salesApi } from "../utils/api.js";
import { useAuth } from "./AuthContext.js";

const DEPARTMENTS = ["All Departments", "CEO", "HR", "IT Admin", "Operator", "Maintenance", "Machine Operator", "Cleaning", "Driver", "Others"];

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
    const [fetchStatus, setFetchStatus] = useState({
        employees: 'pending',
        expenses: 'pending',
        clients: 'pending',
        production: 'pending',
        products: 'pending',
        sales: 'pending',
        attendance: 'pending'
    });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const { user, refreshUser, hasAccess } = useAuth();
    
    // ✅ Helper to avoid UTC timezone shift (IST+5:30 bug)
    const toLocalDateKey = useCallback((date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, []);

    const todayStr = toLocalDateKey(new Date());

    // ── Fetch Initial Data ──────────────────────────────────────────────────────
    const fetchData = useCallback(async (isInitial = false, isBackground = false) => {
        try {
            if (isInitial) {
                setLoading(true);
            } else if (!isBackground) {
                setIsUpdating(true);
            }
            
            // Refresh permissions from backend
            if (user) await refreshUser();

            // Build request map
            const requestMap = [];
            if (hasAccess('employees') || hasAccess('production') || hasAccess('attendance') || hasAccess('sales')) {
                requestMap.push({ key: 'employees', call: employeeApi.getAll() });
            }
            if (hasAccess('stock')) requestMap.push({ key: 'expenses', call: expenseApi.getAll() });
            if (hasAccess('clients') || hasAccess('sales')) {
                requestMap.push({ key: 'clients', call: clientApi.getAll() });
            }
            if (hasAccess('production') || hasAccess('sales')) {
                requestMap.push({ key: 'production', call: productionApi.getAll() });
                if (hasAccess('production')) {
                    requestMap.push({ key: 'productionTargets', call: productionTargetApi.getAll() });
                }
            }
            if (hasAccess('attendance')) requestMap.push({ key: 'attendance', call: attendanceApi.getByDate(todayStr) });
            if (hasAccess('products') || hasAccess('production') || hasAccess('sales')) {
                requestMap.push({ key: 'products', call: productsApi.getAll() });
            }
            if (hasAccess('sales') || hasAccess('production') || hasAccess('stock')) {
                requestMap.push({ key: 'sales', call: salesApi.getAll() });
            }

            const results = await Promise.allSettled(requestMap.map(r => r.call));

            results.forEach((result, index) => {
                const key = requestMap[index].key;
                if (result.status === 'fulfilled') {
                    setFetchStatus(prev => ({ ...prev, [key]: 'success' }));
                    const data = result.value || [];

                    if (key === 'employees') {
                        setEmployees(data.map(e => ({ ...e, id: e._id })).sort((a, b) => a.name.localeCompare(b.name)));
                    } else if (key === 'expenses') {
                        setExpenses(data.map(e => ({ ...e, id: e._id })).sort((a, b) => {
                            const dateA = a.date.includes('-') ? new Date(a.date.split('-').reverse().join('-')) : new Date(a.date);
                            const dateB = b.date.includes('-') ? new Date(b.date.split('-').reverse().join('-')) : new Date(b.date);
                            return dateB - dateA;
                        }));
                    } else if (key === 'clients') {
                        setClients(data.map(c => ({ ...c, id: c._id })));
                    } else if (key === 'production') {
                        setProductionHistory(data.map(p => ({ ...p, id: p._id })).sort((a, b) => {
                            const dateA = a.date && a.date.includes('-') ? new Date(a.date.split('-').reverse().join('-')) : new Date(a.date || a.createdAt);
                            const dateB = b.date && b.date.includes('-') ? new Date(b.date.split('-').reverse().join('-')) : new Date(b.date || b.createdAt);
                            return dateB - dateA;
                        }));
                    } else if (key === 'productionTargets') {
                        setProductionTargets(data.map(t => ({ ...t, id: t._id })));
                    } else if (key === 'attendance') {
                        const mapped = data.map(r => ({ ...r, empId: r.employee?._id ? String(r.employee._id) : String(r.employee), id: r._id }));
                        setAttendanceRecords(prev => ({ ...prev, [todayStr]: mapped }));
                    } else if (key === 'products') {
                        setProducts(data.map(p => ({ ...p, id: p._id })));
                    } else if (key === 'sales') {
                        setSalesHistory(data.map(s => ({ ...s, id: s._id })));
                    }
                } else {
                    setFetchStatus(prev => ({ ...prev, [key]: 'error' }));
                }
            });
        } catch (error) {
            console.error("Error fetching app data:", error);
        } finally {
            if (isInitial) {
                setLoading(false);
                setHasFetched(true);
            } else if (!isBackground) {
                setIsUpdating(false);
            }
        }
    }, [todayStr, user, refreshUser, hasAccess]);

    useEffect(() => {
        if (!user) return;
        
        if (user.isFirstLogin) {
            // Even if first login, we start the sync so sidebar/permissions update
            if (!hasFetched) {
                fetchData(true);
            }
        }
        
        
        // Initial fetch ONLY if not done yet
        if (!hasFetched) {
            fetchData(true);
        }

        // Periodic background sync (5 mins) - Always run for everyone
        const interval = setInterval(() => fetchData(false, true), 300000);
        return () => clearInterval(interval);
    }, [user, fetchData, employees.length, products.length, hasFetched]);

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

    const updateProduction = useCallback(async (id, updates) => {
        setIsUpdating(true);
        try {
            const oldRecord = productionHistory.find(p => p.id === id);
            const data = await productionApi.update(id, updates);
            
            // 1. Update history
            setProductionHistory(prev => prev.map(p => p.id === id ? { ...data, id: data._id } : p));

            // 2. Sync targets
            if (oldRecord) {
                const oldQty = Number(oldRecord.quantity || 0);
                const newQty = Number(updates.quantity || 0);
                const diff = newQty - oldQty;

                if (diff !== 0 || oldRecord.size !== updates.size || oldRecord.operator !== updates.operator) {
                    // Refresh targets to reflect backend changes
                    await fetchTargets();
                }
            }
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, [productionHistory, fetchTargets]);

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

    const resetAllStockData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                productionApi.clearAll(),
                salesApi.clearAll(),
                productsApi.resetStocks(),
                productionTargetApi.clearAll()
            ]);
            await fetchData(true);
            return true;
        } catch (error) {
            console.error("Reset Error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // ── DERIVED METRICS ─────────────────────────────────────────────────────────
    
    // Group production by size/product
    const stockData = products.map(product => {
        const rawPName = (product.name || "").toLowerCase().trim();
        const rawPSize = (product.size || "").toLowerCase().trim();

        const produced = productionHistory.reduce((sum, h) => {
            const hProduct = (h.product || "").toLowerCase().trim();
            const hSize = (h.size || "").toLowerCase().trim();
            
            const matchesSize = hSize === rawPSize;
            const matchesName = hProduct === rawPName || hProduct.includes(rawPName) || rawPName.includes(hProduct) || hProduct === "";
            
            if (matchesSize && matchesName) {
                return sum + (h.quantity || h.qty || 0);
            }
            return sum;
        }, 0);
        
        const sold = salesHistory.reduce((sum, sale) => {
            if (sale.status && (sale.status.toLowerCase().includes('cancel') || sale.status.toLowerCase().includes('reject'))) return sum;
            
            const salesQty = (sale.saleItems || []).reduce((itemSum, item) => {
                const sName = (item.productName || item.baseName || "").toLowerCase().trim();
                const sSize = (item.size || "").toLowerCase().trim();
                
                const matchesSize = sSize === rawPSize;
                const matchesName = sName === rawPName || sName.includes(rawPName) || rawPName.includes(sName);
                
                if (matchesSize && matchesName) {
                    return itemSum + (item.qty || item.quantity || 0);
                }
                return itemSum;
            }, 0);
            
            return sum + salesQty;
        }, 0);

        const quantity = (product.stock || 0) + produced - sold;
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
    const totalSalesAmount = salesHistory.reduce((sum, sale) => {
        if (sale.status && (sale.status.toLowerCase().includes('cancel') || sale.status.toLowerCase().includes('reject'))) return sum;
        return sum + Number(sale.totalAmount || sale.amount || 0);
    }, 0);

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
        const weekBySize = {};
        availableSizes.forEach(size => {
            const sKey = size.toLowerCase().trim().replace(" ", "-");
            weekBySize[size] = weekHistory.filter(item => (item.size || "").toLowerCase().trim().replace(" ", "-") === sKey).reduce((sum, item) => sum + (item.quantity || 0), 0);
        });

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

        const monthHistory = history.filter(item => {
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
        });
        const monthTotal = monthHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const monthBySize = {};
        availableSizes.forEach(size => {
            const sKey = size.toLowerCase().trim().replace(" ", "-");
            monthBySize[size] = monthHistory.filter(item => (item.size || "").toLowerCase().trim().replace(" ", "-") === sKey).reduce((sum, item) => sum + (item.quantity || 0), 0);
        });
        
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

        const stockBySize = {};
        availableSizes.forEach(size => {
            const sKey = size.toLowerCase().trim().replace(" ", "-");
            stockBySize[size] = history.filter(item => (item.size || "").toLowerCase().trim().replace(" ", "-") === sKey).reduce((sum, item) => sum + (item.quantity || 0), 0);
        });

        return {
            today: todayTotal,
            week: weekTotal,
            weekTrend: weekTrend,
            month: monthTotal,
            monthTrend: monthTrend,
            stock: Object.values(stockBySize).reduce((sum, val) => sum + val, 0),
            todayBySize,
            weekBySize,
            monthBySize,
            stockBySize,
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
            updateProduction,
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
            fetchStatus,
            isUpdating,
            setIsUpdating,
            totalSalesAmount,
            salesHistory, 
            addSale,
            updateSale,
            deleteSale,
            addProduct,
            updateProduct,
            deleteProduct,
            resetAllStockData
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
