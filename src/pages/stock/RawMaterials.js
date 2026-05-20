import React, { useState, useMemo, useEffect } from "react";
import { useAppContext } from "../../context/AppContext.js";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import "./Stock.css";

const RawMaterials = () => {
  const { productionHistory } = useAppContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  
  // ── Form State for New Batch ──
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    name: "",
    cost: "",
    capacity: ""
  });

  // ── Raw Material Batches (Leaf purchases) persisted in localStorage ──
  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem("raw_material_purchases");
    if (saved) return JSON.parse(saved);
    // Dynamic starting point matching user's instruction
    return [
      {
        id: 1,
        date: "2026-05-18",
        name: "Premium Leaf Material",
        cost: 30000,
        capacity: 23000
      }
    ];
  });

  // Save to localStorage whenever purchases change
  useEffect(() => {
    localStorage.setItem("raw_material_purchases", JSON.stringify(purchases));
  }, [purchases]);

  // ── DYNAMIC METRICS CALCULATION ──
  // Calculate total consumed capacity (Total plates produced in history)
  const totalProduced = useMemo(() => {
    return (productionHistory || []).reduce(
      (sum, item) => sum + (Number(item.quantity) || Number(item.qty) || 0),
      0
    );
  }, [productionHistory]);

  // Total purchased plates capacity from all batches
  const totalPurchasedCapacity = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (Number(p.capacity) || 0), 0);
  }, [purchases]);

  // Total spent on raw material purchases
  const totalCost = useMemo(() => {
    return purchases.reduce((sum, p) => sum + (Number(p.cost) || 0), 0);
  }, [purchases]);

  // Remaining capacity (Total purchased - total consumed)
  const remainingCapacity = useMemo(() => {
    return Math.max(0, totalPurchasedCapacity - totalProduced);
  }, [totalPurchasedCapacity, totalProduced]);

  // ── ALERT TRIGGER ──
  // Trigger alert if remaining capacity falls below 10,000 plates
  const alertThreshold = 10000;

  const isAlertActive = remainingCapacity < alertThreshold;

  // ── CHART DATA PREPARATION ──
  const barChartData = useMemo(() => {
    const consumedCost = totalPurchasedCapacity > 0 
      ? Math.round((totalProduced / totalPurchasedCapacity) * totalCost) 
      : 0;
    return [
      {
        name: "Stock Consumption & Cost",
        "Total Cost (₹)": consumedCost,
        "Produced Plates": totalProduced
      }
    ];
  }, [totalProduced, totalPurchasedCapacity, totalCost]);

  const pieChartData = [
    { name: "Remaining Capacity", value: remainingCapacity, color: "#10b981" },
    { name: "Consumed Capacity", value: Math.min(totalPurchasedCapacity, totalProduced), color: "#ef4444" }
  ];

  // ── HANDLERS ──
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "cost") {
        const costNum = parseFloat(value);
        if (!isNaN(costNum) && costNum > 0) {
          // Dynamic cost-to-capacity logic: 30000 -> 23000, 40000 -> 33000 (capacity = cost - 7000)
          const calculatedCapacity = costNum >= 7000 ? (costNum - 7000) : Math.round(costNum * 0.7667);
          updated.capacity = calculatedCapacity;
        } else {
          updated.capacity = "";
        }
      }
      return updated;
    });
  };

  const handleAddPurchase = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.cost || !formData.capacity) {
      setFeedbackMessage("⚠️ Please fill in all fields!");
      setTimeout(() => setFeedbackMessage(""), 3000);
      return;
    }

    const newBatch = {
      id: Date.now(),
      date: formData.date,
      name: formData.name.trim(),
      cost: parseFloat(formData.cost),
      capacity: parseInt(formData.capacity)
    };

    setPurchases((prev) => [newBatch, ...prev]);
    setShowAddModal(false);
    setFeedbackMessage("✅ Raw material batch purchased successfully!");
    setTimeout(() => setFeedbackMessage(""), 3000);

    // Reset Form
    setFormData({
      date: new Date().toISOString().split("T")[0],
      name: "",
      cost: "",
      capacity: ""
    });
  };

  const handleDeletePurchase = (id) => {
    if (window.confirm("Are you sure you want to delete this purchase batch?")) {
      setPurchases((prev) => prev.filter((p) => p.id !== id));
      setFeedbackMessage("🗑️ Purchase batch deleted");
      setTimeout(() => setFeedbackMessage(""), 3000);
    }
  };

  return (
    <div className="stock-overview-new raw-materials-dashboard">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="feedback-toast-new success">
          <span className="material-symbols-outlined">info</span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="page-header premium-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Raw Leaf Material Stock</h1>
          <p style={{ color: "#64748b", marginTop: "4px", fontSize: "0.9rem" }}>
            Track palm leaf material purchases, plates capacity, and production consumption.
          </p>
        </div>
        <button className="btn-transfer-premium" onClick={() => setShowAddModal(true)}>
          <span className="material-symbols-outlined">add_shopping_cart</span>
          <span className="btn-text">Purchase Raw Material</span>
        </button>
      </div>

      {/* ===== ALERT BANNER ===== */}
      {isAlertActive && (
        <div className="pulsating-alert-banner" style={{
          background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
          border: "1px solid #fca5a5",
          borderRadius: "12px",
          padding: "16px 24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          boxShadow: "0 4px 15px rgba(239, 68, 68, 0.15)",
          animation: "pulseAlert 2s infinite"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#ef4444" }}>warning</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: "#991b1b", fontWeight: 700, margin: 0, fontSize: "1.1rem" }}>
              CRITICAL RAW MATERIAL ALERT
            </h3>
            <p style={{ color: "#b91c1c", margin: "4px 0 0 0", fontSize: "0.92rem", fontWeight: 500 }}>
              Raw leaf material capacity has fallen below <strong style={{ textDecoration: "underline" }}>{alertThreshold.toLocaleString()} plates</strong>! Current remaining capacity: <strong>{remainingCapacity.toLocaleString()} plates</strong>. Please buy more leaf batches immediately!
            </p>
          </div>
          <button className="btn-transfer-premium" style={{ background: "#ef4444", color: "#fff", borderColor: "#ef4444" }} onClick={() => setShowAddModal(true)}>
            Buy Leaf Now
          </button>
        </div>
      )}

      {/* ===== METRIC STATUS CARDS ===== */}
      <div className="stock-unified-hero-row" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        {/* Total Cost */}
        <div className="hero-stat-item secondary-alert blue-alert">
          <div className="hero-icon-box">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div className="hero-details">
            <span className="hero-label">TOTAL PURCHASE VALUE</span>
            <span className="hero-value">₹{totalCost.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Total Capacity */}
        <div className="hero-stat-item secondary-alert purple-alert" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", borderColor: "#d8b4fe" }}>
          <div className="hero-icon-box" style={{ background: "#f3e8ff", color: "#a855f7" }}>
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <div className="hero-details">
            <span className="hero-label" style={{ color: "#7e22ce" }}>TOTAL BOUGHT CAPACITY</span>
            <span className="hero-value" style={{ color: "#6b21a8" }}>{totalPurchasedCapacity.toLocaleString()} <small>plates</small></span>
          </div>
        </div>

        {/* Consumed Capacity */}
        <div className="hero-stat-item secondary-alert orange-alert" style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", borderColor: "#fed7aa" }}>
          <div className="hero-icon-box" style={{ background: "#ffedd5", color: "#f97316" }}>
            <span className="material-symbols-outlined">precision_manufacturing</span>
          </div>
          <div className="hero-details">
            <span className="hero-label" style={{ color: "#c2410c" }}>TOTAL PLATES PRODUCED</span>
            <span className="hero-value" style={{ color: "#9a3412" }}>{totalProduced.toLocaleString()} <small>plates</small></span>
          </div>
        </div>

        {/* Remaining Stock */}
        <div className={`hero-stat-item secondary-alert ${isAlertActive ? 'red-alert' : 'green-alert'}`}>
          <div className="hero-icon-box">
            <span className="material-symbols-outlined">{isAlertActive ? 'dangerous' : 'check_circle'}</span>
          </div>
          <div className="hero-details">
            <span className="hero-label">REMAINING LEAF CAPACITY</span>
            <span className="hero-value">
              {remainingCapacity.toLocaleString()} <small>plates</small>
            </span>
          </div>
        </div>
      </div>

      {/* ===== VISUALIZATION CHARTS ROW ===== */}
      <div className="charts-row" style={{
        display: "grid",
        gridTemplateColumns: "1.6fr 1fr",
        gap: "24px",
        marginBottom: "32px"
      }}>
        {/* CAPACITY STATUS BAR CHART */}
        <div className="premium-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#3b82f6" }}>bar_chart</span>
            Leaf Material Stock Metrics
          </h3>
          <div style={{ width: "100%", height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                <Legend iconType="circle" />
                <Bar dataKey="Total Cost (₹)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Produced Plates" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DONUT CONSUMPTION CHART */}
        <div className="premium-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ color: "#10b981" }}>donut_large</span>
            Consumption Breakdown
          </h3>
          <div style={{ width: "100%", height: "200px", position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center"
            }}>
              <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1e293b" }}>
                {totalPurchasedCapacity > 0 ? Math.round((remainingCapacity / totalPurchasedCapacity) * 100) : 0}%
              </span>
              <p style={{ fontSize: "0.72rem", color: "#64748b", margin: 0, textTransform: "uppercase", fontWeight: 600 }}>Stock Left</p>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "10px", height: "10px", background: "#10b981", borderRadius: "50%", margin: "0 auto 4px auto" }}></div>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Stock Left</span>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, margin: 0, color: "#1e293b" }}>{remainingCapacity.toLocaleString()}</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "10px", height: "10px", background: "#ef4444", borderRadius: "50%", margin: "0 auto 4px auto" }}></div>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Consumed</span>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, margin: 0, color: "#1e293b" }}>{Math.min(totalPurchasedCapacity, totalProduced).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PURCHASE HISTORY LOG TABLE ===== */}
      <div className="premium-card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ color: "#6366f1" }}>local_shipping</span>
          Raw Leaf Material Purchase Logs
        </h3>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "12px 16px", color: "#475569", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Purchase Date</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Batch Name/Details</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", textAlign: "right" }}>Cost (₹)</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", textAlign: "right" }}>Plates Capacity</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", color: "#334155", fontSize: "0.9rem" }}>
                    {p.date.split("-").reverse().join("-")}
                  </td>
                  <td style={{ padding: "16px", color: "#0f172a", fontSize: "0.9rem", fontWeight: 600 }}>
                    {p.name}
                  </td>
                  <td style={{ padding: "16px", color: "#0f172a", fontSize: "0.9rem", fontWeight: 700, textAlign: "right" }}>
                    ₹{Number(p.cost).toLocaleString("en-IN")}
                  </td>
                  <td style={{ padding: "16px", color: "#10b981", fontSize: "0.9rem", fontWeight: 700, textAlign: "right" }}>
                    {Number(p.capacity).toLocaleString()} plates
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <button
                      onClick={() => handleDeletePurchase(p.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        padding: "6px",
                        borderRadius: "6px"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                    </button>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                    No purchase batches recorded yet. Click "Purchase Raw Material" to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PURCHASE ENTRY MODAL ===== */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ color: "#3b82f6" }}>add_shopping_cart</span>
                Record Leaf Purchase
              </h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddPurchase}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Purchase Date *</label>
                  <input
                    type="date"
                    name="date"
                    className="modal-input"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="modal-form-group">
                  <label>Batch Name/Supplier Details *</label>
                  <input
                    type="text"
                    name="name"
                    className="modal-input"
                    placeholder="e.g. Leaf Supplier A - Premium 12 Inch"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <label>Purchase Price (₹) *</label>
                  <input
                    type="number"
                    name="cost"
                    className="modal-input"
                    placeholder="e.g. 30000"
                    value={formData.cost}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="modal-form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Equivalent Plates Capacity *</span>
                    <span style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 600 }}>⚡ Auto-calculated from Cost</span>
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    className="modal-input"
                    placeholder="e.g. 23000"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="modal-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="modal-confirm">Record Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RawMaterials;
