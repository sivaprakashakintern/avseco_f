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
  const { employees = [], attendanceRecords = [], salesHistory = [] } = useAppContext();
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

  // 3. Sales Commission Logic
  const mySales = salesHistory.filter(sale => {
    const soldByName = String(sale.soldBy || sale.recordedBy || "").trim().toLowerCase();
    const currentName = String(user?.name || "").trim().toLowerCase();
    
    // Extract month-year
    const saleDateClean = String(sale.date || sale.createdAt || "").split(',')[0].trim();
    const dateParts = saleDateClean.split('-');
    let saleMonthYear = "";
    if (dateParts.length === 3) {
      if (dateParts[2].length === 4) {
        saleMonthYear = `${dateParts[2]}-${dateParts[1]}`; // DD-MM-YYYY -> YYYY-MM
      } else if (dateParts[0].length === 4) {
        saleMonthYear = `${dateParts[0]}-${dateParts[1]}`; // YYYY-MM-DD -> YYYY-MM
      }
    }
    if (!saleMonthYear) {
      saleMonthYear = dayjs(sale.date || sale.createdAt).format('YYYY-MM');
    }

    return soldByName === currentName && saleMonthYear === selectedDate;
  });
  
  const totalMySalesValue = mySales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  // Example 2% commission on total sales
  const salesCommission = Math.round(totalMySalesValue * 0.02);

  // 4. Final rounded total paid
  const total = Math.max(0, Math.round(baseMonthlySalary + bonus + salesCommission - totalDeductions));

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
      const fullHeight = element.scrollHeight;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#f7f5f0',
        width: element.offsetWidth,
        height: fullHeight,
        scrollY: -window.scrollY,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('salary-slip-printable');
          if (el) {
            el.style.borderRadius = '0';
            el.style.boxShadow = 'none';
            el.style.padding = '40px';
            el.style.width = '750px';
            el.style.background = '#ffffff';
          }
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

        .btn-salary-slip-action {
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          padding: 8px 16px !important;
          border-radius: 10px !important;
          font-weight: 600 !important;
          font-size: 0.9rem !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          border: none !important;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05) !important;
          text-decoration: none !important;
        }
        
        .btn-salary-slip-action.back-btn {
          background: #ffffff !important;
          border: 2px solid #cbd5e1 !important;
          color: #475569 !important;
        }

        .btn-salary-slip-action.back-btn:hover {
          background: #f8fafc !important;
          border-color: #94a3b8 !important;
          color: #1e293b !important;
        }

        .btn-salary-slip-action.print-btn {
          background: #006A4E !important;
          color: #ffffff !important;
        }

        .btn-salary-slip-action.print-btn:hover {
          background: #004d39 !important;
          box-shadow: 0 6px 14px rgba(0, 106, 78, 0.2) !important;
        }

        /* ── Desktop: single-row header ─── */
        .slip-header-wrap {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .header-left-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-right-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          font-weight: 700;
          color: #475569;
          font-size: 0.9rem;
          margin-bottom: 0;
        }

        .btn-text {
          display: inline-block;
        }

        /* Mobile-only title – hidden on desktop */
        .slip-mobile-title {
          display: none;
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
            border-radius: 20px !important;
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

          /* ── Mobile: title row on top, controls row below ── */
          .slip-mobile-title {
            display: block !important;
            font-size: 1.15rem !important;
            font-weight: 800 !important;
            color: #0f172a !important;
            margin-bottom: 10px !important;
          }

          .slip-header-wrap {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0 !important;
            margin-bottom: 18px !important;
          }

          .header-left-group {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 8px !important;
          }

          /* Hide desktop title on mobile */
          .header-left-group .slip-desktop-title {
            display: none !important;
          }

          .header-left-group .btn-salary-slip-action.back-btn {
            padding: 6px 10px !important;
            font-size: 0.8rem !important;
            gap: 4px !important;
          }

          .header-right-group {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 6px !important;
            justify-content: flex-end !important;
            flex: 1 !important;
          }

          .filter-label {
            display: none !important;
          }

          .filter-group .material-symbols-outlined {
            display: none !important;
          }

          #salary-month {
            width: auto !important;
            min-width: 110px !important;
            padding: 6px 10px !important;
            height: 36px !important;
            font-size: 0.82rem !important;
            border-radius: 8px !important;
          }

          .btn-salary-slip-action.print-btn {
            width: 36px !important;
            height: 36px !important;
            padding: 0 !important;
            justify-content: center !important;
            border-radius: 50% !important;
          }

          .btn-salary-slip-action.print-btn .btn-text {
            display: none !important;
          }

          .btn-salary-slip-action.print-btn span.material-symbols-outlined {
            margin: 0 !important;
            font-size: 20px !important;
          }

          /* Controls row: back btn on left, filter+print on right */
          .slip-controls-row {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            gap: 8px !important;
          }
        }

        /* Desktop: controls row acts normally (part of flex header) */
        .slip-controls-row {
          display: contents;
        }
      `}</style>

      {/* ── Control Header (hidden on print) ── */}
      <div className="slip-header-wrap no-print">
         {/* Title visible only on mobile – sits above the controls row */}
         <button className="btn-salary-slip-action back-btn mobile-back-btn" onClick={() => navigate('/dashboard')}>
           <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
         </button>
         <h3 className="slip-mobile-title">Salary Slip</h3>


        {/* Controls row: on desktop these are siblings inside the flex header;
            on mobile they collapse into a single justified row */}
        <div className="slip-controls-row">
          <div className="header-left-group">
            {/* Desktop title – hidden on mobile */}
            <h3 className="slip-desktop-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Salary Slip</h3>
          </div>
          <div className="header-right-group">
            {isAdmin && employeeOptions.length > 0 && (
              <div className="filter-group">
                <span className="material-symbols-outlined" style={{ color: '#006A4E', fontSize: '20px' }}>badge</span>
                <label className="filter-label" htmlFor="salary-employee">Employee:</label>
                <select
                  id="salary-employee"
                  value={selectedEmployeeId || employeeOptions[0]?.id || ""}
                  onChange={e => setSelectedEmployeeId(e.target.value)}
                  style={{ minWidth: '180px', padding: '8px 12px', borderRadius: '10px', border: '2px solid #cbd5e1', background: '#fff', fontSize: '0.92rem', fontWeight: 600, color: '#1e293b', outline: 'none', height: '38px' }}
                >
                  {employeeOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.name}{option.department ? ` - ${option.department}` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="filter-group">
              <span className="material-symbols-outlined" style={{ color: '#006A4E', fontSize: '20px' }}>calendar_month</span>
              <label className="filter-label" htmlFor="salary-month">Month:</label>
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
            </div>
            <button
              className="btn-salary-slip-action print-btn"
              onClick={downloadAsPDF}
              disabled={downloadLoading}
              title="Download Salary Slip as PDF"
            >
              {downloadLoading
                ? <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                : <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
              }
              <span className="btn-text">{downloadLoading ? 'Generating...' : 'Download PDF'}</span>
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
            {salesCommission > 0 && (
              <tr>
                <td className="label-cell">Sales Commission (2%)</td>
                <td className="value-cell" style={{ color: '#15803d' }}>
                  + {formatCurrency(salesCommission)}
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
