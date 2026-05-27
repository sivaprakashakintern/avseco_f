import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { employeeApi, expenseApi, clientApi, productionApi, attendanceApi, productsApi, productionTargetApi, salesApi, notificationApi, turnoverApi } from "../utils/api.js";
import { calculateRawMaterialCapacity } from "../utils/formatUtils.js";
import { useAuth } from "./AuthContext.js";

const DEPARTMENTS = ["All Departments", "CEO", "HR", "Sales Team", "IT Admin", "Operator", "Maintenance", "Machine Operator", "Cleaning", "Driver", "Others"];

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [employees, setEmployees] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [clients, setClients] = useState([]);
    const [productionHistory, setProductionHistory] = useState([]);
    const [productionTargets, setProductionTargets] = useState([]);
    const [products, setProducts] = useState([]);
    const [salesHistory, setSalesHistory] = useState([]);
    const [turnoverRecords, setTurnoverRecords] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchStatus, setFetchStatus] = useState({
        employees: 'pending',
        expenses: 'pending',
        clients: 'pending',
        production: 'pending',
        products: 'pending',
        sales: 'pending',
        turnover: 'pending',
        attendance: 'pending',
        notifications: 'pending'
    });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [toast, setToast] = useState(null); // { message, type }
    const [isUpdating, setIsUpdating] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const { user, refreshUser, hasAccess, isSuperAdmin } = useAuth();
    
    // ✅ Helper to avoid UTC timezone shift (IST+5:30 bug)
    const toLocalDateKey = useCallback((date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, []);

    const todayStr = toLocalDateKey(new Date());

    const syncRawMaterialPurchase = useCallback((expense) => {
        if (!expense || expense.category !== "Material") return;
        const costNum = Number(expense.amount || expense.cost || 0);
        if (costNum <= 0) return;

        try {
            const saved = localStorage.getItem("raw_material_purchases");
            const purchases = saved ? JSON.parse(saved) : [];
            const sourceExpenseId = expense.id || expense._id || String(Date.now());
            const newRecord = {
                id: `expense-${sourceExpenseId}`,
                sourceExpenseId,
                date: expense.date || toLocalDateKey(new Date()),
                name: expense.description || "Material Purchase",
                cost: costNum,
                capacity: calculateRawMaterialCapacity(costNum)
            };
            const existingIndex = purchases.findIndex(p => p.sourceExpenseId === sourceExpenseId);
            if (existingIndex >= 0) {
                purchases[existingIndex] = { ...purchases[existingIndex], ...newRecord };
            } else {
                purchases.unshift(newRecord);
            }
            localStorage.setItem("raw_material_purchases", JSON.stringify(purchases));
            window.dispatchEvent(new Event("rawMaterialPurchasesUpdated"));
        } catch (error) {
            console.error("Failed to sync raw material purchase with expense:", error);
        }
    }, [toLocalDateKey]);

    const removeRawMaterialPurchase = useCallback((expenseId) => {
        if (!expenseId) return;
        try {
            const saved = localStorage.getItem("raw_material_purchases");
            if (!saved) return;
            const purchases = JSON.parse(saved);
            const filtered = purchases.filter(p => p.sourceExpenseId !== expenseId && p.id !== `expense-${expenseId}`);
            if (filtered.length !== purchases.length) {
                localStorage.setItem("raw_material_purchases", JSON.stringify(filtered));
                window.dispatchEvent(new Event("rawMaterialPurchasesUpdated"));
            }
        } catch (error) {
            console.error("Failed to remove raw material purchase record:", error);
        }
    }, []);

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
            } else {
                // Fetch logged-in user's production if they don't have global access
                requestMap.push({ key: 'myProduction', call: productionApi.getMyProduction() });
            }
            if (hasAccess('attendance')) {
                requestMap.push({ key: 'attendance', call: attendanceApi.getByDate(todayStr) });
                requestMap.push({ key: 'attendanceYear', call: attendanceApi.getByYear(new Date().getFullYear()) });
            } else {
                // If no global access, just fetch my own attendance for the year
                requestMap.push({ key: 'myAttendanceYear', call: attendanceApi.getMyByYear(new Date().getFullYear()) });
            }
            if (hasAccess('products') || hasAccess('production') || hasAccess('sales')) {
                requestMap.push({ key: 'products', call: productsApi.getAll() });
            }
            if (hasAccess('sales') || hasAccess('production') || hasAccess('stock')) {
                requestMap.push({ key: 'sales', call: salesApi.getAll() });
            }
            if (hasAccess('turnover')) {
                requestMap.push({ key: 'turnover', call: turnoverApi.getAll() });
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
                        setProductionHistory(data.map(p => ({ ...p, id: p._id, employeeId: p.employeeId || p.employee?._id || '', employeeName: p.employeeName || p.recordedBy || '' })).sort((a, b) => {
                            const dateA = a.date && a.date.includes('-') ? new Date(a.date.split('-').reverse().join('-')) : new Date(a.date || a.createdAt);
                            const dateB = b.date && b.date.includes('-') ? new Date(b.date.split('-').reverse().join('-')) : new Date(b.date || b.createdAt);
                            return dateB - dateA;
                        }));
                    } else if (key === 'myProduction') {
                        setProductionHistory(data.map(p => ({ ...p, id: p._id, employeeId: p.employeeId || p.employee?._id || '', employeeName: p.employeeName || p.recordedBy || '' })).sort((a, b) => {
                            const dateA = a.date && a.date.includes('-') ? new Date(a.date.split('-').reverse().join('-')) : new Date(a.date || a.createdAt);
                            const dateB = b.date && b.date.includes('-') ? new Date(b.date.split('-').reverse().join('-')) : new Date(b.date || b.createdAt);
                            return dateB - dateA;
                        }));
                    } else if (key === 'productionTargets') {
                        setProductionTargets(data.map(t => ({ ...t, id: t._id })));
                    } else if (key === 'attendance') {
                        const mapped = data.map(r => ({ ...r, empId: r.employee?._id ? String(r.employee._id) : String(r.employee), id: r._id }));
                        setAttendanceRecords(prev => ({ ...prev, [todayStr]: mapped }));
                    } else if (key === 'attendanceYear') {
                        const mapped = data.map(r => ({ ...r, empId: r.employee?._id ? String(r.employee._id) : String(r.employee), id: r._id }));
                        setAttendanceRecords(prev => ({ ...prev, year: mapped }));
                    } else if (key === 'myAttendanceYear') {
                        const mapped = data.map(r => ({ ...r, empId: r.employee?._id ? String(r.employee._id) : String(r.employee), id: r._id }));
                        setAttendanceRecords(prev => ({ ...prev, year: mapped }));
                    } else if (key === 'products') {
                        setProducts(data.map(p => ({ ...p, id: p._id })));
                    } else if (key === 'sales') {
                        setSalesHistory(data.map(s => ({ ...s, id: s._id })));
                    } else if (key === 'turnover') {
                        setTurnoverRecords(data.map(t => ({ ...t, id: t._id })));
                    }
                } else {
                    setFetchStatus(prev => ({ ...prev, [key]: 'error' }));
                }
            });

            // Fetch Notifications separately (more frequent)
            if (user && hasAccess('notifications')) {
                const notifs = await notificationApi.getAll();
                setNotifications(notifs);
                setFetchStatus(prev => ({ ...prev, notifications: 'success' }));
            }
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

    // ── DERIVED METRICS ─────────────────────────────────────────────────────────
    
    // Group production by size/product
    const stockData = useMemo(() => {
        return products.map(product => {
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
    }, [products, productionHistory, salesHistory]);

    // ── Low Stock Notifications ──────────────────────────────────────────────────
    const [lastNotifiedProducts, setLastNotifiedProducts] = useState(new Set());
    const [lastNotifiedRawMaterial, setLastNotifiedRawMaterial] = useState(false);

    useEffect(() => {
        if (!user || !isSuperAdmin) return;
        if (stockData.length === 0) return;

        const checkLowStock = async () => {
            const lowStockItems = stockData.filter(item => item.quantity < 2000);
            
            for (const item of lowStockItems) {
                const productKey = `${item.name}-${item.size}`;
                
                // Only notify if we haven't notified for this product in this session AND it's not already in notifications
                const alreadyNotifiedInSession = lastNotifiedProducts.has(productKey);
                const alreadyInNotifications = notifications.some(n => 
                    !n.isRead && n.type === 'admin_push' && n.title.includes('LOW STOCK') && n.title.includes(item.name) && n.title.includes(item.size)
                );

                if (!alreadyNotifiedInSession && !alreadyInNotifications) {
                    try {
                        await notificationApi.sendPush({
                            title: `⚠️ LOW STOCK ALERT: ${item.name} (${item.size})`,
                            message: `Stock level for ${item.name} (${item.size}) has fallen below 2,000 units. Current stock: ${item.quantity.toLocaleString()} units. Please plan production soon.`,
                            link: '/stock'
                        });
                        setLastNotifiedProducts(prev => new Set([...prev, productKey]));
                    } catch (e) {
                        console.error("Failed to send low stock alert:", e);
                    }
                }
            }
        };

        // Delay check slightly to ensure data is settled
        const timer = setTimeout(checkLowStock, 5000);
        return () => clearTimeout(timer);
    }, [stockData, notifications, user, lastNotifiedProducts, isSuperAdmin]);

    // ── Raw Material Low Stock Notifications ──
    useEffect(() => {
        if (!user || !isSuperAdmin) return;

        const checkRawMaterialStock = async () => {
            let purchases = [];
            try {
                const saved = localStorage.getItem("raw_material_purchases");
                if (saved) purchases = JSON.parse(saved);
            } catch (e) {
                console.error("Error reading purchases in AppContext:", e);
            }
            if (purchases.length === 0) {
                purchases = [
                    {
                        id: 1,
                        date: "2026-05-18",
                        name: "Premium Leaf Material",
                        cost: 30000,
                        capacity: 23000
                    }
                ];
            }

            const totalProd = (productionHistory || []).reduce(
                (sum, item) => sum + (Number(item.quantity) || Number(item.qty) || 0),
                0
            );
            const totalPurchased = purchases.reduce((sum, p) => sum + (Number(p.capacity) || 0), 0);
            const remaining = Math.max(0, totalPurchased - totalProd);

            if (remaining < 10000) {
                const alreadyNotifiedInSession = lastNotifiedRawMaterial;
                const alreadyInNotifications = notifications.some(n => 
                    !n.isRead && n.type === 'admin_push' && n.title.includes('RAW MATERIAL ALERT')
                );

                if (!alreadyNotifiedInSession && !alreadyInNotifications) {
                    try {
                        await notificationApi.sendPush({
                            title: `⚠️ RAW MATERIAL ALERT: STOCK IS LOW`,
                            message: `Remaining raw leaf material capacity has fallen below 10,000 plates. Current remaining: ${remaining.toLocaleString()} plates. Please purchase raw materials immediately.`,
                            link: '/stock/raw-materials'
                        });
                        setLastNotifiedRawMaterial(true);
                    } catch (e) {
                        console.error("Failed to send raw material stock alert:", e);
                    }
                }
            } else {
                if (lastNotifiedRawMaterial) {
                    setLastNotifiedRawMaterial(false);
                }
            }
        };

        const timer = setTimeout(checkRawMaterialStock, 5000);
        return () => clearTimeout(timer);
    }, [productionHistory, notifications, user, lastNotifiedRawMaterial, isSuperAdmin]);

    // Auto-accrue salaries on the 1st of each month
    useEffect(() => {
        if (employees.length === 0 || !hasFetched || !hasAccess('stock')) return;

        const checkAndAddSalaries = async () => {
            const now = new Date();
            const currentDay = now.getDate();
            const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            
            // 1. Check if we are in the first 5 days of the month
            if (currentDay > 5) return;

            // 2. Check if we already accrued salaries for this month (using localStorage)
            const lastAccruedMonth = localStorage.getItem('salary_accrued_month');
            if (lastAccruedMonth === currentMonthYear) return;

            // 3. Fallback check: if any salary expense exists for this month
            const hasSalariesThisMonth = (expenses || []).some(ex => {
                if (ex.category !== 'Salary') return false;
                const dParts = ex.date.includes('-') ? ex.date.split('-') : [];
                let d;
                if (dParts.length === 3) {
                    d = dParts[0].length === 4 ? new Date(ex.date) : new Date(dParts[2], dParts[1] - 1, dParts[0]);
                } else {
                    d = new Date(ex.date);
                }
                const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return monthYear === currentMonthYear;
            });

            if (!hasSalariesThisMonth) {
                console.log("Accruing salaries for", currentMonthYear);
                const salaryDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                
                let anyAdded = false;
                for (const emp of employees) {
                    if (emp.salary && Number(emp.salary) > 0) {
                        try {
                            await expenseApi.add({
                                category: 'Salary',
                                description: `Salary for ${emp.name}`,
                                amount: Number(emp.salary),
                                date: salaryDate,
                                paymentMode: 'Bank Transfer'
                            });
                            anyAdded = true;
                        } catch (e) {
                            console.error("Failed to add auto-salary for", emp.name, e);
                        }
                    }
                }
                
                // Mark as accrued in localStorage so it doesn't run again if deleted
                localStorage.setItem('salary_accrued_month', currentMonthYear);

                if (anyAdded) {
                    const updatedExpenses = await expenseApi.getAll();
                    setExpenses(updatedExpenses.map(e => ({ ...e, id: e._id })).sort((a, b) => {
                        const dateA = a.date.includes('-') ? new Date(a.date.split('-').reverse().join('-')) : new Date(a.date);
                        const dateB = b.date.includes('-') ? new Date(b.date.split('-').reverse().join('-')) : new Date(b.date);
                        return dateB - dateA;
                    }));
                }
            } else {
                // If it already exists in DB, mark localStorage so it doesn't re-trigger if later deleted
                localStorage.setItem('salary_accrued_month', currentMonthYear);
            }
        };

        checkAndAddSalaries();
    }, [employees, hasFetched, hasAccess, expenses]);

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
        
        // Faster polling for notifications (10 seconds)
        const notificationInterval = setInterval(async () => {
            if (user && hasAccess('notifications')) {
                try {
                    const notifs = await notificationApi.getAll();
                    // Auto-toast for new incoming notifications
                    setNotifications(prev => {
                        const prevUnread = prev.filter(n => !n.isRead).length;
                        const newUnread = notifs.filter(n => !n.isRead).length;
                        if (newUnread > prevUnread) {
                            const latest = notifs[0]; // Assuming sorted by newest
                            setToast({ 
                                message: latest.title || "New Notification Received", 
                                type: "info",
                                icon: "notifications_active"
                            });
                            setTimeout(() => setToast(null), 4000);
                        }
                        return notifs;
                    });
                } catch (e) { console.error("Notif Poll Error", e); }
            }
        }, 10000);

        return () => {
            clearInterval(interval);
            clearInterval(notificationInterval);
        };
    }, [user, fetchData, employees.length, products.length, hasFetched, hasAccess]);

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
            const expense = { ...exp, ...data, id: data._id };
            setExpenses(prev => [{ ...expense }, ...prev]);
            syncRawMaterialPurchase(expense);
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, [syncRawMaterialPurchase]);

    const updateExpense = useCallback(async (id, updates) => {
        setIsUpdating(true);
        try {
            const data = await expenseApi.update(id, updates);
            const expense = { ...data, id: data._id };
            setExpenses(prev => prev.map(e => e.id === id ? expense : e));
            if (expense.category === "Material") {
                syncRawMaterialPurchase(expense);
            } else {
                removeRawMaterialPurchase(id);
            }
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, [removeRawMaterialPurchase, syncRawMaterialPurchase]);

    const deleteExpense = useCallback(async (id) => {
        setIsUpdating(true);
        try {
            await expenseApi.delete(id);
            setExpenses(prev => prev.filter(e => e.id !== id));
            removeRawMaterialPurchase(id);
        } finally {
            setIsUpdating(false);
        }
    }, [removeRawMaterialPurchase]);

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

    const saveProductionTarget = useCallback(async (target) => {
        setIsUpdating(true);
        try {
            const data = await productionTargetApi.save(target);
            setProductionTargets(prev => {
                const exists = prev.find(t => 
                    t.id === data._id || 
                    (t.productName === data.productName && t.productSize === data.productSize && t.date === data.date)
                );
                if (exists) {
                    return prev.map(t => (t.id === exists.id || t._id === data._id) ? { ...data, id: data._id } : t);
                }
                return [{ ...data, id: data._id }, ...prev];
            });
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const deleteProductionTarget = useCallback(async (id) => {
        setIsUpdating(true);
        try {
            await productionTargetApi.delete(id);
            setProductionTargets(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error("Error deleting target:", error);
            // If it's a 404, it's already gone from DB, so remove from local state too
            if (error.response?.status === 404) {
                setProductionTargets(prev => prev.filter(t => t.id !== id));
            } else {
                throw error;
            }
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const addProduction = useCallback(async (prod) => {
        setIsUpdating(true);
        try {
            // 1. Save the production record
            const data = await productionApi.add(prod);
            
            // 2. Update local state
            setProductionHistory(prev => {
                const exists = prev.find(p => p.id === data._id);
                if (exists) {
                    return prev.map(p => p.id === data._id ? { ...data, id: data._id } : p);
                }
                return [{ ...data, id: data._id }, ...prev];
            });

            // 3. Refresh targets (backend already updated them)
            await fetchTargets();

            return data;
        } finally {
            setIsUpdating(false);
        }
    }, [fetchTargets]);

    const updateProduction = useCallback(async (id, updates) => {
        setIsUpdating(true);
        try {
            const data = await productionApi.update(id, updates);
            
            // 1. Update history
            setProductionHistory(prev => prev.map(p => p.id === id ? { ...data, id: data._id } : p));

            // 2. Refresh targets (backend already updated them)
            await fetchTargets();
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, [fetchTargets]);

    const deleteProduction = useCallback(async (id) => {
        setIsUpdating(true);
        try {
            await productionApi.delete(id);
            setProductionHistory(prev => prev.filter(p => p.id !== id));

            // 2. Refresh targets (backend already updated them)
            await fetchTargets();
        } finally {
            setIsUpdating(false);
        }
    }, [fetchTargets]);

    const clearAllProduction = useCallback(async (date) => {
        setIsUpdating(true);
        try {
            await productionApi.clearAll(date);
            setProductionHistory(prev => date ? prev.filter(p => p.date !== date) : []);
            // Refresh targets to show reset counts
            await fetchTargets();
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
            status: "none", // Changed from present to none so the UI is fresh/empty
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
            const dayRecords = (prev[dateStr] && prev[dateStr].length > 0) ? prev[dateStr] : buildDefaultAttendance(dateStr);
            const updated = dayRecords.map(r => r.empId === empId ? { ...r, ...updates } : r);
            return { ...prev, [dateStr]: updated };
        });
    }, [buildDefaultAttendance]);

    const saveAttendanceForDate = useCallback(async (dateStr, records) => {
        setIsUpdating(true);
        try {
            const formattedRecords = records.map(r => {
                const empObj = (employees || []).find(e => e.id === r.empId || e._id === r.empId || e.empId === r.empId);
                return {
                    employee: empObj ? empObj._id : r.empId,
                    status: r.status || 'present',
                    note: r.note || '',
                    halfDayTime: r.halfDayTime || null
                };
            }).filter(r => r.employee);
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
    }, [employees]);

    // TURNOVER
    const addTurnover = useCallback(async (turnover) => {
        setIsUpdating(true);
        try {
            const data = await turnoverApi.add(turnover);
            setTurnoverRecords(prev => [{ ...data, id: data._id }, ...prev]);
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const updateTurnover = useCallback(async (id, updates) => {
        setIsUpdating(true);
        try {
            const data = await turnoverApi.update(id, updates);
            setTurnoverRecords(prev => prev.map(t => t.id === id ? { ...data, id: data._id } : t));
            return data;
        } finally {
            setIsUpdating(false);
        }
    }, []);

    const deleteTurnover = useCallback(async (id) => {
        setIsUpdating(true);
        try {
            await turnoverApi.delete(id);
            setTurnoverRecords(prev => prev.filter(t => t.id !== id));
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
            
            // Clear notifications too? Maybe just systemic ones
            setNotifications([]);
            
            return true;
        } catch (error) {
            console.error("Reset Error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // NOTIFICATIONS
    const markNotificationAsRead = useCallback(async (id) => {
        try {
            await notificationApi.markRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Error marking notification read:", error);
        }
    }, []);

    const markAllNotificationsAsRead = useCallback(async () => {
        try {
            await notificationApi.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Error marking all read:", error);
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await notificationApi.getAll();
            setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }, []);



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

        // Dynamically collect all sizes available in the system
        const sizesSet = new Set();
        (products || []).forEach(p => {
            if (p.size && p.size !== 'All Sizes') sizesSet.add(p.size);
        });
        (history || []).forEach(p => {
            const s = p.size || p.productSize;
            if (s && s !== 'All Sizes') sizesSet.add(s);
        });
        // Ensure default standard sizes are always populated
        ['6-inch', '8-inch', '10-inch', '12-inch'].forEach(s => sizesSet.add(s));

        const availableSizes = Array.from(sizesSet).sort((a, b) => {
            const valA = parseFloat(a) || 0;
            const valB = parseFloat(b) || 0;
            return valA - valB;
        });

        // Helper to extract the numeric size (e.g., "6-inch" -> 6, "12" -> 12, "8 inch" -> 8)
        const parseNumericSize = (sizeStr) => {
            if (!sizeStr) return 0;
            const match = String(sizeStr).match(/(\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : 0;
        };

        // Check if two size strings represent the same size numerically
        const sizeMatches = (itemSize, targetSize) => {
            const itemNum = parseNumericSize(itemSize);
            const targetNum = parseNumericSize(targetSize);
            return itemNum > 0 && targetNum > 0 && itemNum === targetNum;
        };
        
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
            todayBySize[size] = todayHistory
                .filter(item => sizeMatches(item.size || item.productSize, size))
                .reduce((sum, item) => sum + (item.quantity || 0), 0);
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
            weekBySize[size] = weekHistory
                .filter(item => sizeMatches(item.size || item.productSize, size))
                .reduce((sum, item) => sum + (item.quantity || 0), 0);
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
            monthBySize[size] = monthHistory
                .filter(item => sizeMatches(item.size || item.productSize, size))
                .reduce((sum, item) => sum + (item.quantity || 0), 0);
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
            stockBySize[size] = history
                .filter(item => sizeMatches(item.size || item.productSize, size))
                .reduce((sum, item) => sum + (item.quantity || 0), 0);
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
    }, [productionHistory, toFormattedDate, products]);

    // Using todayStr calculated at the top of the component

    const attendanceTargetEmployees = employees.filter(e => {
        const dept = (e.department || "").toLowerCase();
        const role = (e.role || "").toLowerCase();
        return !dept.includes("ceo") && !role.includes("ceo") && !dept.includes("management") && !role.includes("management");
    });

    const todayAttendance = attendanceRecords[todayStr] ?? [];
    const todayAttendanceFiltered = todayAttendance.filter(r => {
        return attendanceTargetEmployees.some(e => String(e._id || e.id) === String(r.empId || r.employee?._id || r.employee));
    });

    const todayStats = {
        present: todayAttendanceFiltered.filter(r => r.status === "present").length,
        absent: todayAttendanceFiltered.filter(r => r.status === "absent").length,
        half: todayAttendanceFiltered.filter(r => r.status === "half").length,
        total: attendanceTargetEmployees.length || 0,
    };

    const last7DaysTrend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const ds = toLocalDateKey(d);
        const recs = attendanceRecords[ds] ?? [];
        const filteredRecs = recs.filter(r => {
            return attendanceTargetEmployees.some(e => String(e._id || e.id) === String(r.empId || r.employee?._id || r.employee));
        });
        return {
            date: ds,
            label: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
            present: filteredRecs.filter(r => r.status === "present").length,
            absent: filteredRecs.filter(r => r.status === "absent").length,
            half: filteredRecs.filter(r => r.status === "half").length,
            total: attendanceTargetEmployees.length || 0,
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
            saveProductionTarget,
            deleteProductionTarget,
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
            turnoverRecords,
            setTurnoverRecords,
            addTurnover,
            updateTurnover,
            deleteTurnover,
            addSale,
            updateSale,
            deleteSale,
            addProduct,
            updateProduct,
            deleteProduct,
            resetAllStockData,
            notifications,
            unreadCount: notifications.filter(n => !n.isRead).length,
            markNotificationAsRead,
            markAllNotificationsAsRead,
            fetchNotifications,
            toast,
            setToast
        }}>
            {children}
            {toast && (
                <div className="feedback-toast">
                    <span className="material-symbols-outlined">{toast.icon || "info"}</span>
                    <span>{toast.message}</span>
                </div>
            )}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useAppContext must be used inside <AppProvider>");
    return ctx;
};

export default AppContext;
