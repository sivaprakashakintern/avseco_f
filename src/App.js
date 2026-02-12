import React, { useState } from "react";
import "./App.css"; // You can place Tailwind imports and custom styles here

const App = () => {
  const [theme] = useState("light"); // State for theme (light/dark)
  // Note: You can toggle theme by changing 'light' to 'dark' in the html className

  // Stats Data
  const stats = [
    { label: "Total Stock", value: "45,200", unit: "Units", trend: "+12%", trendUp: true },
    { label: "Stock Value", value: "₹12,40,000", unit: "", trend: "+5.2%", trendUp: true },
    { label: "Purchased (Mo)", value: "8,500", unit: "Units", trend: "-2.4%", trendUp: false },
    { label: "Sold (Mo)", value: "7,200", unit: "Units", trend: "+15.8%", trendUp: true },
    { label: "Employees", value: "124", unit: "Active", trend: "Stable", trendUp: null },
  ];

  // Transaction Data
  const transactions = [
    { id: "#TRX-8821", product: '12" Round Plate', qty: 2500, status: "Delivered", value: "₹12,500", statusColor: "green" },
    { id: "#TRX-8822", product: '8" Square Plate', qty: 1200, status: "Pending", value: "₹5,400", statusColor: "yellow" },
    { id: "#TRX-8823", product: "Partitioned Plate", qty: 5000, status: "In Transit", value: "₹35,000", statusColor: "primary" },
  ];

  // Stock Alerts
  const stockAlerts = [
    { product: '10" Dinner Plate', alert: "Critically Low: 45 units left", type: "critical", icon: "warning", color: "red" },
    { product: "Soup Bowls", alert: "Low Stock: 210 units left", type: "low", icon: "inventory", color: "yellow" },
    { product: '6" Dessert Plate', alert: "Healthy: 4,500 units left", type: "healthy", icon: "check_circle", color: "primary" },
  ];

  return (
    <html className={theme} lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <title>AVSECO Industries - Manufacturing ERP Dashboard</title>
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <style>{`
          body {
            font-family: 'Manrope', sans-serif;
          }
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
        `}</style>
      </head>
      <body className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen">
        <div className="flex h-screen overflow-hidden">
          {/* SideNavBar Component */}
          <SideNavBar />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* TopNavBar Component */}
            <TopNavBar />

            {/* Dashboard Content */}
            <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-8">
              {/* PageHeading Component */}
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Dashboard Overview
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Real-time factory metrics for Areca Leaf Plate production
                </p>
              </div>

              {/* Stats Component */}
              <Stats stats={stats} />

              {/* SectionHeader Component */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Production Analytics
                </h2>
                <div className="flex gap-2">
                  <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                    Weekly
                  </button>
                  <button className="bg-primary text-background-dark px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                    Monthly
                  </button>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <StockMovement />
                <PurchaseVsSales />
              </div>

              {/* Bottom Section: Recent Activities & Low Stock */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <RecentTransactions transactions={transactions} />
                <StockAlerts alerts={stockAlerts} />
              </div>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
};

// SideNavBar Component
const SideNavBar = () => (
  <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
      <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-background-dark">
        <span className="material-symbols-outlined font-bold">factory</span>
      </div>
      <div>
        <h1 className="text-slate-900 dark:text-white text-base font-bold leading-tight">
          AVSECO
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
          Manufacturing ERP
        </p>
      </div>
    </div>
    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary">
        <span className="material-symbols-outlined">dashboard</span>
        <p className="text-sm font-semibold">Dashboard</p>
      </div>
      {["Stock", "Product List", "Stock Purchased", "Employees", "Attendance", "Reports"].map((item) => (
        <div
          key={item}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">
            {item === "Stock" && "inventory_2"}
            {item === "Product List" && "format_list_bulleted"}
            {item === "Stock Purchased" && "shopping_cart"}
            {item === "Employees" && "badge"}
            {item === "Attendance" && "event_available"}
            {item === "Reports" && "description"}
          </span>
          <p className="text-sm font-medium">{item}</p>
        </div>
      ))}
      <div className="mt-auto pt-8">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
          <span className="material-symbols-outlined">settings</span>
          <p className="text-sm font-medium">Settings</p>
        </div>
      </div>
    </nav>
  </aside>
);

// TopNavBar Component
const TopNavBar = () => (
  <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 flex items-center justify-between z-10">
    <div className="flex items-center gap-6 flex-1">
      <div className="relative w-full max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
          search
        </span>
        <input
          className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 transition-all text-slate-900 dark:text-white"
          placeholder="Search orders, stock, or employees..."
          type="text"
        />
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors relative">
        <span className="material-symbols-outlined text-xl">notifications</span>
        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
      </button>
      <button className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
        <span className="material-symbols-outlined text-xl">help_outline</span>
      </button>
      <div className="h-8 w-px bg-slate-200 dark:border-slate-800 mx-2"></div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
            Rajesh Kumar
          </p>
          <p className="text-xs text-slate-500 font-medium">Plant Manager</p>
        </div>
        <div
          className="size-10 rounded-full bg-cover bg-center border-2 border-primary/20"
          alt="Profile photo of plant manager Rajesh Kumar"
          style={{
            backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuDNTIrSDLkd1nVKZTJd-gk2ZvFYlRNFrjFvpbFbflQC5fMyGGVGBuVrSXDat-YAPERMn0xe8mBtMS9ScrSKp-GZSbhUwRiaRgjtG9_16Ozcosi7Sc2ZQP1dlyeZnY-ql3xtuNbXa7BWh8MBp8cfN7S2XOO0Xz5Vhj6-P3Ok6RN-T5nEnO68vqbsozcQRLCdrh2pJBAPKFSXHugsuD7FeRzwH_vEf1u9esg2pNFGG31dMO9wG_tWXKoXr_pEP7Gv1L_LJtTdcplpLcoS")`,
          }}
        ></div>
      </div>
    </div>
  </header>
);

// Stats Component
const Stats = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
    {stats.map((stat, idx) => (
      <div
        key={idx}
        className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
          {stat.label}
        </p>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {stat.value}{" "}
          {stat.unit && (
            <span className="text-xs font-normal text-slate-400">{stat.unit}</span>
          )}
        </p>
        <div
          className={`mt-3 flex items-center text-sm font-bold ${
            stat.trendUp === null
              ? "text-slate-400"
              : stat.trendUp
              ? "text-primary"
              : "text-red-500"
          }`}
        >
          {stat.trendUp !== null && (
            <span className="material-symbols-outlined text-sm mr-1">
              {stat.trendUp ? "trending_up" : "trending_down"}
            </span>
          )}
          {stat.trendUp === null && (
            <span className="material-symbols-outlined text-sm mr-1">remove</span>
          )}
          {stat.trend}
        </div>
      </div>
    ))}
  </div>
);

// Stock Movement Chart Mock
const StockMovement = () => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex justify-between items-start mb-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Stock Movement
        </h3>
        <p className="text-xs text-slate-500">Daily inventory fluctuation</p>
      </div>
      <span className="material-symbols-outlined text-slate-400 cursor-pointer">
        more_vert
      </span>
    </div>
    <div className="h-64 flex items-end gap-2 relative">
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <span className="material-symbols-outlined text-9xl">show_chart</span>
      </div>
      {[60, 45, 75, 55, 90, 65, 80].map((height, idx) => (
        <div
          key={idx}
          className={`flex-1 ${
            idx === 6 ? "bg-primary" : "bg-primary/20"
          } rounded-t h-[${height}%] hover:bg-primary transition-colors cursor-pointer group relative`}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}: {height * 7}k
          </div>
        </div>
      ))}
    </div>
    <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
      <span>Mon</span>
      <span>Tue</span>
      <span>Wed</span>
      <span>Thu</span>
      <span>Fri</span>
      <span>Sat</span>
      <span>Sun</span>
    </div>
  </div>
);

// Purchase vs Sales Chart Mock
const PurchaseVsSales = () => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex justify-between items-start mb-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Purchase vs Sales
        </h3>
        <p className="text-xs text-slate-500">Monthly volume comparison</p>
      </div>
      <div className="flex gap-4 text-[10px] font-bold uppercase">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-primary rounded-sm"></span> <span>Purchase</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-sm"></span>{" "}
          <span>Sales</span>
        </div>
      </div>
    </div>
    <div className="h-64 flex flex-col justify-between">
      <div className="flex items-end gap-1 h-full">
        {[80, 70, 90, 60].map((purchaseHeight, idx) => (
          <div key={idx} className="flex-1 flex items-end gap-1 h-full">
            <div
              className="w-1/2 bg-primary rounded-t-sm"
              style={{ height: `${purchaseHeight}%` }}
            ></div>
            <div
              className="w-1/2 bg-slate-200 dark:bg-slate-700 rounded-t-sm"
              style={{ height: `${[65, 75, 50, 85][idx]}%` }}
            ></div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
      </div>
    </div>
  </div>
);

// Recent Transactions Table
const RecentTransactions = ({ transactions }) => (
  <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">
        Recent Transactions
      </h3>
      <button className="text-primary text-xs font-bold hover:underline">
        View All
      </button>
    </div>
    <table className="w-full text-left">
      <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500">
        <tr>
          <th className="px-6 py-3">Order ID</th>
          <th className="px-6 py-3">Product</th>
          <th className="px-6 py-3">Quantity</th>
          <th className="px-6 py-3">Status</th>
          <th className="px-6 py-3">Value</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {transactions.map((tx, idx) => (
          <tr key={idx} className="text-sm">
            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
              {tx.id}
            </td>
            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
              {tx.product}
            </td>
            <td className="px-6 py-4">{tx.qty.toLocaleString()}</td>
            <td className="px-6 py-4">
              <span
                className={`px-2 py-1 rounded ${
                  tx.statusColor === "green"
                    ? "bg-green-100 text-green-700"
                    : tx.statusColor === "yellow"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-primary/20 text-primary-dark"
                } text-[10px] font-bold uppercase`}
              >
                {tx.status}
              </span>
            </td>
            <td className="px-6 py-4 font-bold">{tx.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Stock Alerts
const StockAlerts = ({ alerts }) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
    <div className="p-5 border-b border-slate-200 dark:border-slate-800">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">
        Stock Alerts
      </h3>
    </div>
    <div className="p-5 space-y-4 flex-1">
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className={`flex items-center gap-4 p-3 rounded-lg border ${
            alert.color === "red"
              ? "border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10"
              : alert.color === "yellow"
              ? "border-yellow-100 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-900/10"
              : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
          }`}
        >
          <div
            className={`size-10 rounded flex items-center justify-center text-white shrink-0 ${
              alert.color === "red"
                ? "bg-red-500"
                : alert.color === "yellow"
                ? "bg-yellow-500"
                : "bg-primary"
            }`}
          >
            <span className="material-symbols-outlined">
              {alert.color === "primary" ? "check_circle" : alert.icon}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {alert.product}
            </p>
            <p
              className={`text-xs ${
                alert.color === "red"
                  ? "text-red-600"
                  : alert.color === "yellow"
                  ? "text-yellow-600"
                  : "text-slate-500"
              }`}
            >
              {alert.alert}
            </p>
          </div>
          {alert.color !== "primary" && (
            <button
              className={`text-xs font-bold underline ${
                alert.color === "red" ? "text-red-600" : "text-yellow-600"
              }`}
            >
              {alert.color === "red" ? "Restock" : "Order"}
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default App;