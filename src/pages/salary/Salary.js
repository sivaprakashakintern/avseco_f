import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useAppContext } from "../../context/AppContext.js";
import { useAuth } from "../../context/AuthContext.js";
import { formatCurrency } from "../../utils/formatUtils.js";
import "./Salary.css";

const Salary = () => {
  const navigate = useNavigate();
  const { employees = [], expenses = [] } = useAppContext();
  const { user, isAdmin } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const currentMonthKey = dayjs().format("YYYY-MM");
  const isVisibleSalaryEmployee = (employee) => {
    const department = String(employee.department || "").trim().toLowerCase();
    const role = String(employee.role || "").trim().toLowerCase();
    const name = String(employee.name || "").trim().toLowerCase();

    if (department === "ceo" || department === "management") return false;
    if (role === "ceo" || role === "management") return false;
    if (name.includes("ceo") || name.includes("management")) return false;

    return true;
  };

  const employeeOptions = useMemo(() => {
    return employees
      .map(employee => ({
        id: String(employee._id || employee.id || ""),
        name: employee.name || "Employee",
        department: employee.department || "",
        salary: Number(employee.salary || 0),
        role: employee.role || "",
      }))
      .filter(employee => employee.id && isVisibleSalaryEmployee(employee));
  }, [employees]);

  useEffect(() => {
    if (!isAdmin) {
      const currentEmployeeId = String(user?._id || user?.id || "");
      if (employeeOptions.some(employee => employee.id === currentEmployeeId)) {
        setSelectedEmployeeId(currentEmployeeId);
      } else if (employeeOptions[0]?.id) {
        setSelectedEmployeeId(employeeOptions[0].id);
      }
      return;
    }

    if (selectedEmployeeId) return;
    if (employeeOptions.some(employee => employee.id === String(user?._id || user?.id || ""))) {
      setSelectedEmployeeId(String(user?._id || user?.id || ""));
    } else if (employeeOptions[0]?.id) {
      setSelectedEmployeeId(employeeOptions[0].id);
    }
  }, [isAdmin, employeeOptions, selectedEmployeeId, user]);

  const activeEmployeeId = isAdmin ? (selectedEmployeeId || String(user?._id || user?.id || "")) : String(user?._id || user?.id || "");
  const activeEmployee = employeeOptions.find(employee => employee.id === activeEmployeeId) || {
    name: user?.name || "Employee",
    department: user?.department || "",
    salary: Number(user?.salary || 0),
  };

  const parseExpenseDate = (dateValue) => {
    if (!dateValue) return new Date(0);
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === "string" && dateValue.includes("-")) {
      const parts = dateValue.split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    }
    return new Date(dateValue);
  };

  const monthSalaryEntries = useMemo(() => {
    return (expenses || []).filter(expense => {
      if (expense.category !== "Salary") return false;
      const expenseDate = parseExpenseDate(expense.date);
      const monthKey = dayjs(expenseDate).format("YYYY-MM");
      const matchedEmployee = String(expense.employeeId || expense.empId || expense.employee?._id || expense.employee || "") === activeEmployeeId;
      return monthKey === currentMonthKey && matchedEmployee;
    });
  }, [activeEmployeeId, currentMonthKey, expenses]);

  const adminEmployeeCards = useMemo(() => {
    return employeeOptions.map(employee => {
      const employeeMonthEntries = (expenses || []).filter(expense => {
        if (expense.category !== "Salary") return false;
        const expenseDate = parseExpenseDate(expense.date);
        const monthKey = dayjs(expenseDate).format("YYYY-MM");
        const matchedEmployee = String(expense.employeeId || expense.empId || expense.employee?._id || expense.employee || "") === employee.id;
        return monthKey === currentMonthKey && matchedEmployee;
      });

      const employeeMonthTotal = employeeMonthEntries.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

      return {
        ...employee,
        monthTotal: employeeMonthTotal,
        monthEntries: employeeMonthEntries.length,
      };
    });
  }, [currentMonthKey, employeeOptions, expenses]);

  return (
    <div className="erp-page">
      <div className="erp-header">
        <div className="header-left">
          <h1 className="erp-title">Salary Report</h1>
        </div>
      </div>

      {isAdmin && employeeOptions.length > 0 && (
        <div className="salary-panel">
          <div className="erp-card-header">
            <h3 className="erp-card-title">Select Employee</h3>
          </div>
          <div className="salary-control-row">
            <select
              value={selectedEmployeeId || employeeOptions[0]?.id || ""}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="salary-select"
            >
              {employeeOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}{option.department ? ` - ${option.department}` : ""}</option>
              ))}
            </select>
            <button className="salary-btn" onClick={() => navigate("/salary-slip")}>View Detailed Slip</button>
          </div>
        </div>
      )}

      {isAdmin && adminEmployeeCards.length > 0 && (
        <div className="salary-panel">
          <div className="erp-card-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h3 className="erp-card-title">All Employees</h3>
              <span style={{ color: "#64748b", fontWeight: 600 }}>{adminEmployeeCards.length} employee{adminEmployeeCards.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="salary-card-grid">
            {adminEmployeeCards.map(employee => {
              const isSelected = employee.id === activeEmployeeId;
              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => setSelectedEmployeeId(employee.id)}
                  className={`salary-employee-card ${isSelected ? "selected" : ""}`}
                >
                  <div className="salary-employee-head">
                    <div>
                      <div className="salary-employee-name">{employee.name}</div>
                      <div className="salary-employee-dept">{employee.department || "Department not set"}</div>
                    </div>
                    <span className="material-symbols-outlined" style={{ color: isSelected ? "#006A4E" : "#94a3b8" }}>badge</span>
                  </div>

                  <div className="salary-employee-stats">
                    <div className="salary-stat-item"><span>Monthly Salary</span><strong>{formatCurrency(employee.salary || 0, true)}</strong></div>
                    <div className="salary-stat-item"><span>Current Month Paid</span><strong>{formatCurrency(employee.monthTotal || 0, true)}</strong></div>
                    <div className="salary-stat-item"><span>Entries</span><strong>{employee.monthEntries || 0}</strong></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="salary-panel">
        <div className="erp-card-header">
          <h3 className="erp-card-title">Salary Entries</h3>
        </div>
        <div className="salary-card-grid">
          {monthSalaryEntries.length > 0 ? monthSalaryEntries.map(entry => {
            const entryEmployeeId = String(entry.employeeId || entry.empId || entry.employee?._id || entry.employee || "");
            const entryEmployee = employeeOptions.find(emp => emp.id === entryEmployeeId) || activeEmployee;

            return (
              <div
                key={entry.id || `${entry.date}-${entry.amount}`}
                className="salary-entry-card"
              >
                <div className="salary-employee-head">
                  <div>
                    <div className="salary-employee-name">{entryEmployee.name}</div>
                    <div className="salary-employee-dept">{entryEmployee.department || "Department not set"}</div>
                  </div>
                  <span className="material-symbols-outlined" style={{ color: "#006A4E" }}>payments</span>
                </div>

                <div className="salary-employee-stats">
                  <div className="salary-stat-item"><span>Date</span><strong>{dayjs(parseExpenseDate(entry.date)).format("DD MMM YYYY")}</strong></div>
                  <div className="salary-stat-item"><span>Payment Mode</span><strong>{entry.paymentMode || "-"}</strong></div>
                  <div className="salary-stat-item"><span>Amount</span><strong>{formatCurrency(Number(entry.amount || 0), true)}</strong></div>
                </div>
              </div>
            );
          }) : (
            <div className="salary-empty-state">
              No salary entries found for this month.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Salary;