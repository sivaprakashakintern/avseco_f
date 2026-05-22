import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext.js";
import { useAuth } from "../../context/AuthContext.js";
import { formatCurrency } from "../../utils/formatUtils.js";
import dayjs from "dayjs";
import "../../dashboard/Dashboard.css";

const SalarySlip = () => {
  const navigate = useNavigate();
  const { employees = [], attendanceRecords = [] } = useAppContext();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM"));

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const item = dayjs().subtract(index, "month");
      return {
        value: item.format("YYYY-MM"),
        label: item.format("MMMM YYYY"),
        year: item.year(),
        month: item.month() + 1
      };
    });
  }, []);

  const selectedOption = monthOptions.find(option => option.value === selectedDate) || monthOptions[0];
  const selectedYear = selectedOption?.year || dayjs().year();
  const selectedMonth = selectedOption?.month || dayjs().month() + 1;
  const selectedMonthName = dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`).format("MMMM YYYY");

  // Issue Date is set to the 1st of the next month
  const issueDate = dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`).add(1, "month").format("MMMM D, YYYY");

  const employeeId = String(user?._id || user?.id || "");

  const attendanceArray = Array.isArray(attendanceRecords)
    ? attendanceRecords
    : Array.isArray(attendanceRecords.year)
      ? attendanceRecords.year
      : [];

  const monthAttendance = attendanceArray.filter(record =>
    String(record.empId || record.employee?._id || record.employee) === employeeId &&
    dayjs(record.date).format("YYYY-MM") === selectedDate
  );

  const totalMonthDays = dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`).daysInMonth();

  // Dynamic working days (non-Sundays) in the month
  const totalWorkingDays = Array.from({ length: totalMonthDays }).reduce((count, _, index) => {
    const day = dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`);
    return count + (day.day() === 0 ? 0 : 1);
  }, 0);

  const present = monthAttendance.filter(r => r.status === "present").length;
  const absent = monthAttendance.filter(r => r.status === "absent").length;
  const half = monthAttendance.filter(r => r.status === "half").length;
  const stoppage = monthAttendance.filter(r => r.status === "stoppage").length;
  const leave = monthAttendance.filter(r => r.status === "leave").length;

  const employeeObj = employees.find(e => String(e._id || e.id) === employeeId);
  const baseMonthlySalary = employeeObj && !isNaN(Number(employeeObj.salary))
    ? Number(employeeObj.salary)
    : (user?.salary && !isNaN(Number(user.salary)) ? Number(user.salary) : 0);

  const perDaySalary = baseMonthlySalary > 0 ? baseMonthlySalary / 26 : 0;

  // 1. Off-time & Casual Leave Logic: 
  // 1 day of off-time (either planned leave or unplanned absent) is treated as a paid casual leave allowed by the company.
  const casualLeaveCount = Math.min(1, leave + absent);
  const unpaidLeaveDays = Math.max(0, leave - 1);
  const unpaidAbsentDays = leave >= 1 ? absent : Math.max(0, absent - 1);
  const halfDayDeductionDays = half * 0.5;
  const totalDeductionDays = unpaidLeaveDays + unpaidAbsentDays + halfDayDeductionDays;
  const totalDeductions = Math.round(totalDeductionDays * perDaySalary);

  // 2. Bonus Logic: If total present days (present + stoppage + half * 0.5) is 26 or more, add a 500 bonus
  const workedDays = present + stoppage + half * 0.5;
  const bonus = workedDays >= 26 ? 500 : 0;

  // 3. Final rounded total paid
  const total = Math.max(0, Math.round(baseMonthlySalary + bonus - totalDeductions));

  // Dynamic values for department and designation
  const departmentName = employeeObj?.department || user?.department || "Plate Manufacturing Unit";
  const designationRole = employeeObj?.role || user?.role || "Employee";

  return (
    <div className="dashboard-container emp-self-dashboard salary-slip-container">
      {/* Custom Premium & Printed Aesthetics matching user image */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@500;600;700&display=swap');

        .salary-slip-container {
          max-width: 750px;
          margin: 0 auto;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #2c3e35;
          padding: 20px;
        }

        .payslip-table-wrapper {
          background: #f7f5f0; /* Vintage ivory/cream background from image */
          border: 1px solid #b2c0b6; /* Sage green border style */
          border-radius: 4px;
          padding: 45px 40px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
          position: relative;
        }

        .payslip-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .payslip-header h1 {
          font-family: 'Oswald', sans-serif;
          font-size: 32px;
          font-weight: 700;
          text-transform: uppercase;
          color: #2c3e35;
          margin: 0;
          letter-spacing: 1.5px;
        }

        .payslip-divider {
          border-top: 1px solid #b2c0b6;
          margin: 20px 0;
        }

        .emp-info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          font-size: 13.5px;
          line-height: 1.7;
        }

        .emp-info-left {
          flex: 1.3;
        }

        .emp-info-right {
          text-align: right;
          flex: 0.9;
        }

        .emp-info-title {
          font-weight: 700;
          font-size: 15px;
          color: #2c3e35;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .emp-info-item {
          color: #4a5c53;
          margin-bottom: 3px;
        }

        .emp-info-item .label {
          font-weight: 700;
          color: #2c3e35;
        }

        .breakdown-title-container {
          text-align: center;
          border-top: 1px solid #b2c0b6;
          border-bottom: 1px solid #b2c0b6;
          padding: 10px 0;
          margin: 30px 0 15px 0;
        }

        .breakdown-title {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          color: #2c3e35;
          letter-spacing: 1px;
        }

        .breakdown-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }

        .breakdown-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #d4dcd6;
          font-size: 14px;
          color: #4a5c53;
        }

        .breakdown-table td.label-cell {
          font-weight: 600;
          color: #2c3e35;
        }

        .breakdown-table td.value-cell {
          text-align: right;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          color: #2c3e35;
        }

        .breakdown-table tr.total-row td {
          border-top: 2px solid #2c3e35;
          border-bottom: 2px solid #2c3e35;
          font-weight: 800;
          color: #2c3e35;
          font-size: 16px;
          padding: 16px 10px;
        }

        .breakdown-table tr.total-row td.value-cell {
          font-size: 18px;
        }

        .simple-sig-row {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
          padding-top: 20px;
        }

        .sig-box {
          text-align: center;
          width: 190px;
        }

        .sig-line {
          border-bottom: 1px solid #b2c0b6;
          height: 35px;
          margin-bottom: 8px;
        }

        .sig-text {
          font-size: 11px;
          font-weight: 700;
          color: #5a6c63;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media print {
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print, .sidebar, .topbar, .mobile-overlay, aside, header {
            display: none !important;
          }
          .dashboard-wrapper {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .right-area {
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .main-content {
            padding: 0 !important;
            margin: 0 !important;
          }
          .salary-slip-container {
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .payslip-table-wrapper {
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            padding: 30px !important;
            border-radius: 0 !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* Control Header Row (Interactive Controls - Hidden in print) */}
      <div className="emp-section-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-export-premium" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', minHeight: '36px' }} onClick={() => navigate('/dashboard')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            <span>Dashboard</span>
          </button>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Payslip</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#006A4E', fontSize: '20px' }}>calendar_month</span>
            <label style={{ fontWeight: 700, color: '#475569', fontSize: '0.9rem', marginBottom: 0 }} htmlFor="salary-month">Month:</label>
          </div>
          <select
            id="salary-month"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ minWidth: '160px', padding: '8px 12px', borderRadius: '10px', border: '2px solid #cbd5e1', background: '#fff', fontSize: '0.92rem', fontWeight: 600, color: '#1e293b', outline: 'none', height: '38px' }}
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button className="btn-export-premium" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', background: '#006A4E', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, minHeight: '38px' }} onClick={() => window.print()}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
            <span>Print / Download</span>
          </button>
        </div>
      </div>

      {/* Main Tabular Wrapper */}
      <div className="payslip-table-wrapper">

        {/* Header Block: Only Company Name is visible */}
        <div className="payslip-header">
          <h1>AVS ECO INDUSTRIES</h1>
        </div>

        <div className="payslip-divider"></div>

        {/* Employee Info Section (Removed ID and Bank details) */}
        <div className="emp-info-section">
          <div className="emp-info-left">
            <div className="emp-info-title">Employee Information</div>
            <div className="emp-info-item"><span className="label">Employee Name:</span> <span style={{ textTransform: 'capitalize' }}>{user?.name || 'N/A'}</span></div>
            <div className="emp-info-item"><span className="label">Position:</span> <span style={{ textTransform: 'capitalize' }}>{designationRole}</span></div>
            <div className="emp-info-item"><span className="label">Department:</span> <span style={{ textTransform: 'capitalize' }}>{departmentName}</span></div>
          </div>
          <div className="emp-info-right">
            <div style={{ height: '24px' }}></div> {/* Spacer to align with Left Column */}
            <div className="emp-info-item"><span className="label">Payroll Period:</span> {selectedMonthName}</div>
            <div className="emp-info-item"><span className="label">Issue Date:</span> {issueDate}</div>
          </div>
        </div>

        {/* Salary Breakdown Title Banner */}
        <div className="breakdown-title-container">
          <div className="breakdown-title">Salary & Attendance Breakdown</div>
        </div>

        {/* Unified Breakdown Table with all requested fields */}
        <table className="breakdown-table">
          <tbody>
            <tr>
              <td className="label-cell">Basic Salary</td>
              <td className="value-cell">{formatCurrency(baseMonthlySalary)}</td>
            </tr>
            <tr>
              <td className="label-cell">Per Day Salary</td>
              <td className="value-cell">₹{perDaySalary.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="label-cell">Total Month Days</td>
              <td className="value-cell">{totalMonthDays} Days</td>
            </tr>
            <tr>
              <td className="label-cell">Total Working Days</td>
              <td className="value-cell">{totalWorkingDays} Days</td>
            </tr>
            <tr>
              <td className="label-cell">Total Present</td>
              <td className="value-cell">{present} Days</td>
            </tr>
            <tr>
              <td className="label-cell">Absent</td>
              <td className="value-cell">{unpaidAbsentDays} Days</td>
            </tr>
            <tr>
              <td className="label-cell">Stoppage (Maintenance)</td>
              <td className="value-cell">{stoppage} Days</td>
            </tr>
            <tr>
              <td className="label-cell">Casual Leave</td>
              <td className="value-cell">{casualLeaveCount} Day(s) <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>(Paid)</span></td>
            </tr>
            {unpaidLeaveDays > 0 && (
              <tr>
                <td className="label-cell">Unpaid Leave</td>
                <td className="value-cell">{unpaidLeaveDays} Day(s) <span style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 600 }}>(Unpaid)</span></td>
              </tr>
            )}
            <tr>
              <td className="label-cell">Attendance Bonus</td>
              <td className="value-cell" style={{ color: bonus > 0 ? '#15803d' : '#2c3e35' }}>
                {bonus > 0 ? `+ ${formatCurrency(bonus)}` : `${formatCurrency(0)}`}
              </td>
            </tr>
            <tr>
              <td className="label-cell">Deductions</td>
              <td className="value-cell" style={{ color: totalDeductions > 0 ? '#b91c1c' : '#2c3e35' }}>
                {totalDeductions > 0 ? `- ${formatCurrency(totalDeductions)}` : `${formatCurrency(0)}`}
              </td>
            </tr>
            <tr className="total-row">
              <td>Total Salary</td>
              <td className="value-cell">{formatCurrency(total)}</td>
            </tr>
          </tbody>
        </table>

        {/* Signature Box */}
        <div className="simple-sig-row">
          <div className="sig-box">
            <div className="sig-line"></div>
            <div className="sig-text">Employee Signature</div>
          </div>
          <div className="sig-box">
            <div className="sig-line"></div>
            <div className="sig-text">Manager Signature</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SalarySlip;
