import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext.js";
import { useAuth } from "../../context/AuthContext.js";
import { formatCurrency } from "../../utils/formatUtils.js";
import dayjs from "dayjs";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "../../dashboard/Dashboard.css";

const SalarySlip = () => {
  const navigate = useNavigate();
  const { employees = [], attendanceRecords = [] } = useAppContext();
  const { user, isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM"));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

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

  const employeeOptions = useMemo(() => {
    return employees
      .map(employee => ({
        id: String(employee._id || employee.id || ""),
        name: employee.name || "Employee",
        department: employee.department || "",
      }))
      .filter(employee => employee.id);
  }, [employees]);

  useEffect(() => {
    if (!isAdmin) {
      setSelectedEmployeeId(employeeId);
      return;
    }

    if (selectedEmployeeId) return;

    if (employeeOptions.some(employee => employee.id === employeeId)) {
      setSelectedEmployeeId(employeeId);
    } else if (employeeOptions[0]?.id) {
      setSelectedEmployeeId(employeeOptions[0].id);
    }
  }, [isAdmin, employeeId, employeeOptions, selectedEmployeeId]);

  const activeEmployeeId = isAdmin ? (selectedEmployeeId || employeeId) : employeeId;

  const attendanceArray = Array.isArray(attendanceRecords)
    ? attendanceRecords
    : Array.isArray(attendanceRecords.year)
      ? attendanceRecords.year
      : [];

  const monthAttendance = attendanceArray.filter(record =>
    String(record.empId || record.employee?._id || record.employee) === activeEmployeeId &&
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

  const employeeObj = employees.find(e => String(e._id || e.id) === activeEmployeeId);
  const baseMonthlySalary = employeeObj && !isNaN(Number(employeeObj.salary))
    ? Number(employeeObj.salary)
    : (user?.salary && !isNaN(Number(user.salary)) ? Number(user.salary) : 0);

  const perDaySalary = baseMonthlySalary > 0 ? baseMonthlySalary / 26 : 0;

  // 1. Sunday Overwork Logic
  const sundayWorkedDays = monthAttendance.filter(r => dayjs(r.date).day() === 0 && r.status === "present").length;
  const sundayHalfDays = monthAttendance.filter(r => dayjs(r.date).day() === 0 && r.status === "half").length;
  const totalSundayOverworkDays = sundayWorkedDays + (sundayHalfDays * 0.5);
  const sundayOverworkPay = Math.round(totalSundayOverworkDays * perDaySalary);

  // 2. Off-time & Casual Leave Logic: 
  // 1 day of off-time (either planned leave or unplanned absent) is treated as a paid casual leave allowed by the company.
  const casualLeaveCount = Math.min(1, leave + absent);
  const unpaidLeaveDays = Math.max(0, leave - 1);
  const unpaidAbsentDays = leave >= 1 ? absent : Math.max(0, absent - 1);
  const halfDayDeductionDays = half * 0.5;
  const totalDeductionDays = unpaidLeaveDays + unpaidAbsentDays + halfDayDeductionDays;
  const totalDeductions = Math.round(totalDeductionDays * perDaySalary);

  // 3. Bonus Logic: If total present days (present + stoppage + half * 0.5) is 26 or more, add a 500 bonus
  const workedDays = present + stoppage + half * 0.5;
  const bonus = workedDays >= 26 ? 500 : 0;

  // 4. Final rounded total paid
  const total = Math.max(0, Math.round(baseMonthlySalary + bonus + sundayOverworkPay - totalDeductions));

  // Dynamic values for department and designation
  const departmentName = employeeObj?.department || user?.department || "Plate Manufacturing Unit";
  const designationRole = employeeObj?.role || user?.role || "Employee";
  const employeeDisplayName = employeeObj?.name || user?.name || "Employee";

  const [downloadLoading, setDownloadLoading] = useState(false);

  const downloadAsPDF = async () => {
    const element = document.getElementById('salary-slip-printable');
    if (!element) return;
    setDownloadLoading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#f7f5f0',
        windowWidth: 750,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.style.setProperty('width', '750px', 'important');
          clonedDoc.body.style.setProperty('width', '750px', 'important');
          clonedDoc.body.style.setProperty('overflow', 'visible', 'important');
          // Inject custom print-specific override styling into cloned document
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            #salary-slip-printable {
              width: 750px !important;
              max-width: 750px !important;
              padding: 45px 40px !important;
              border-radius: 4px !important;
              background: #f7f5f0 !important;
              border: 1px solid #b2c0b6 !important;
              box-shadow: none !important;
            }
            .emp-info-section {
              display: flex !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              gap: 0 !important;
            }
            .emp-info-left {
              flex: 1.3 !important;
              width: auto !important;
            }
            .emp-info-right {
              flex: 0.9 !important;
              text-align: right !important;
              width: auto !important;
            }
            .simple-sig-row {
              display: flex !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              gap: 0 !important;
            }
            .sig-box {
              width: 190px !important;
            }
            .breakdown-table td {
              padding: 12px 10px !important;
              font-size: 14px !important;
            }
            .breakdown-table tr.total-row td {
              font-size: 16px !important;
            }
            .breakdown-table tr.total-row td.value-cell {
              font-size: 18px !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height / canvas.width) * pdfWidth;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });
      doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'SLOW');
      const fileName = `Salary_Slip_${user?.name || 'Employee'}_${selectedMonthName.replace(' ', '_')}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="salary-slip-container">
      {/* Custom Premium & Printed Aesthetics */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@500;600;700&display=swap');

        .salary-slip-container {
          max-width: 750px;
          margin: 0 auto;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #2c3e35;
          padding: 20px;
        }

        /* ── Header Title & Back Button ── */
        .slip-title-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .slip-title-container .back-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          outline: none;
        }

        .slip-title-container .back-btn:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #1e293b;
          transform: translateX(-2px);
        }

        .slip-title-container .slip-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.5px;
        }

        /* ── Controls Filter Card ── */
        .slip-filter-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1.5px solid #cbd5e1;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
          box-shadow: 0 4px 12px rgba(15,23,42,0.04);
        }

        .slip-filter-inputs {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .slip-filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .slip-filter-group .material-symbols-outlined {
          color: #006A4E;
          font-size: 20px;
          display: flex;
          align-items: center;
        }

        .slip-filter-label {
          font-weight: 700;
          color: #475569;
          font-size: 0.9rem;
          margin: 0;
          white-space: nowrap;
        }

        .slip-filter-select {
          min-width: 170px;
          padding: 8px 12px;
          border-radius: 10px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
          outline: none;
          height: 38px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .slip-filter-select:hover {
          border-color: #94a3b8;
        }

        .slip-filter-select:focus {
          border-color: #006A4E;
          box-shadow: 0 0 0 3px rgba(0,106,78,0.1);
        }

        .slip-filter-actions {
          display: flex;
          align-items: center;
        }

        .btn-download-pdf {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 10px;
          background: #006A4E;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          box-shadow: 0 4px 10px rgba(0, 106, 78, 0.15);
          height: 38px;
          white-space: nowrap;
          outline: none;
        }

        .btn-download-pdf:hover {
          background: #004d39;
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(0, 106, 78, 0.25);
        }

        .btn-download-pdf:active {
          transform: translateY(0);
        }

        .btn-download-pdf:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .payslip-table-wrapper {
          background: #f7f5f0;
          border: 1px solid #b2c0b6;
          border-radius: 4px;
          padding: 45px 40px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
          position: relative;
        }

        .payslip-header {
          text-align: center;
          margin-bottom: 10px;
        }

        .payslip-header h1 {
          font-family: 'Oswald', sans-serif;
          font-size: 32px;
          font-weight: 700;
          text-transform: uppercase;
          color: #2c3e35;
          margin: 0 0 10px 0;
          letter-spacing: 1.5px;
        }

        /* Company address block inside slip */
        .payslip-company-addr {
          font-size: 12.5px;
          color: #4a5c53;
          line-height: 1.6;
          margin-bottom: 2px;
          text-align: center;
        }

        .payslip-addr-divider {
          border: none;
          border-top: 1.5px solid #b2c0b6;
          margin: 10px auto;
          width: 80%;
        }

        .payslip-company-contact {
          font-size: 12.5px;
          color: #2c3e35;
          font-weight: 600;
          text-align: center;
          margin-bottom: 0;
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
          width: 60%;
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

        @media screen and (max-width: 768px) {
          .salary-slip-container {
            padding: 14px !important;
          }

          .payslip-table-wrapper {
            padding: 22px !important;
            border-radius: 12px !important;
          }

          .payslip-header h1 {
            font-size: 22px !important;
          }

          .payslip-company-addr {
            font-size: 11.5px !important;
          }

          .emp-info-section {
            flex-direction: column !important;
            gap: 18px !important;
          }

          .emp-info-right {
            text-align: left !important;
          }

          .emp-info-left,
          .emp-info-right {
            width: 100% !important;
          }

          .breakdown-table td {
            padding: 10px 8px !important;
            font-size: 13px !important;
          }

          .breakdown-table tr.total-row td {
            font-size: 15px !important;
          }

          .simple-sig-row {
            flex-direction: column !important;
            gap: 18px !important;
          }

          /* Mobile styling for the filter card */
          .slip-filter-card {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 16px !important;
            gap: 16px !important;
          }

          .slip-filter-inputs {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }

          .slip-filter-group {
            width: 100% !important;
            justify-content: space-between !important;
          }

          .slip-filter-select {
            flex: 1 !important;
            min-width: 0 !important;
            max-width: 70% !important;
          }

          .slip-filter-actions {
            width: 100% !important;
          }

          .btn-download-pdf {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>

      {/* ── Control Header (hidden on print) ── */}
      <div className="slip-header-container no-print">
        {/* Title row with back button */}
        <div className="slip-title-container">
          <h3 className="slip-title">Salary Slip</h3>
          <button className="back-btn" onClick={() => navigate(-1)} title="Close Salary Slip">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Filter and Download Card */}
        <div className="slip-filter-card">
          <div className="slip-filter-inputs">
            {isAdmin && employeeOptions.length > 0 && (
              <div className="slip-filter-group">
                <span className="material-symbols-outlined">badge</span>
                <label className="slip-filter-label" htmlFor="salary-employee">Employee:</label>
                <select
                  id="salary-employee"
                  value={selectedEmployeeId || employeeOptions[0]?.id || ""}
                  onChange={e => setSelectedEmployeeId(e.target.value)}
                  className="slip-filter-select"
                >
                  {employeeOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.name}{option.department ? ` - ${option.department}` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="slip-filter-group">
              <span className="material-symbols-outlined">calendar_month</span>
              <label className="slip-filter-label" htmlFor="salary-month">Month:</label>
              <select
                id="salary-month"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="slip-filter-select"
              >
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="slip-filter-actions">
            <button
              className="btn-download-pdf"
              onClick={downloadAsPDF}
              disabled={downloadLoading}
              title="Download Salary Slip as PDF"
            >
              {downloadLoading
                ? <span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                : <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
              }
              <span>{downloadLoading ? 'Generating...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabular Wrapper */}
      <div className="payslip-table-wrapper" id="salary-slip-printable">

        {/* Header Block: Company name + address + divider + contact */}
        <div className="payslip-header">
          <h1>AVS ECO INDUSTRIES</h1>
          <p className="payslip-company-addr">
            3/2, Mettu Street, Veeraragavapuram (Village &amp; Post),
          </p>
          <p className="payslip-company-addr">
            Thiruvalangadu, Thiruvallur (Dist), Tiruttani (TK)
          </p>
          <p className="payslip-company-addr">Pincode - 631210</p>
          <hr className="payslip-addr-divider" />
          <p className="payslip-company-contact">
            Contact No: 80988 02581, 9444730165, 63836 32726
          </p>
        </div>

        <div className="payslip-divider"></div>

        {/* Employee Info Section */}
        <div className="emp-info-section">
          <div className="emp-info-left">
            <div className="emp-info-title">Employee Information</div>
            <div className="emp-info-item"><span className="label">Employee Name:</span> <span style={{ textTransform: 'capitalize' }}>{employeeDisplayName}</span></div>
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
          <div className="breakdown-title">Salary &amp; Attendance Breakdown</div>
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
            {totalSundayOverworkDays > 0 && (
              <tr>
                <td className="label-cell">Sunday Overwork (OD)</td>
                <td className="value-cell" style={{ color: '#15803d' }}>
                  {totalSundayOverworkDays} Day(s) <span style={{ fontSize: '11px', fontWeight: 600 }}>(+ {formatCurrency(sundayOverworkPay)})</span>
                </td>
              </tr>
            )}

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
