import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext.js";
import { attendanceApi } from "../../utils/api.js";
import "./AttendanceReport.css";

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const AttendanceReport = () => {
    const { employees: allEmployees, attendanceRecords, fetchAttendanceForDate } = useAppContext();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const monthParam = parseInt(params.get('month'), 10);
        const yearParam = parseInt(params.get('year'), 10);

        if (!Number.isNaN(monthParam) && monthParam >= 1 && monthParam <= 12) {
            setSelectedMonth(monthParam - 1);
        }
        if (!Number.isNaN(yearParam) && yearParam >= 2000 && yearParam <= 2100) {
            setSelectedYear(yearParam);
        }
    }, [location.search]);

    const employees = useMemo(() => {
        const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

        const isRestrictedUser = (emp) => {
        return emp.role === 'admin' || emp.department?.toLowerCase() === 'ceo' || emp.viewOnly;
    };

    return allEmployees.filter(emp => {
            if (isRestrictedUser(emp)) return false;
            if (emp.name && emp.name.toLowerCase().includes("nithish kumar")) return false;

            const hasAttendanceInSelectedMonth = Object.values(attendanceRecords)
                .flat()
                .some(record => record.empId === emp.id && String(record.date || "").startsWith(monthPrefix));

            return emp.active !== false || hasAttendanceInSelectedMonth;
        });
    }, [allEmployees, attendanceRecords, selectedMonth, selectedYear]);

    const goToPreviousMonth = () => {
        setSelectedMonth(prev => (prev === 0 ? 11 : prev - 1));
    };

    const goToNextMonth = () => {
        setSelectedMonth(prev => (prev === 11 ? 0 : prev + 1));
    };

    const daysInCurrentMonthCount = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysInCurrentView = useMemo(() => {
        const days = [];
        for (let i = 1; i <= daysInCurrentMonthCount; i++) {
            const date = new Date(selectedYear, selectedMonth, i);
            days.push({
                date: i,
                isSunday: date.getDay() === 0,
                isoDate: `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`
            });
        }
        return days;
    }, [selectedYear, selectedMonth, daysInCurrentMonthCount]);

    // Force sync of current month data in parallel
    useEffect(() => {
        const syncMonthData = async () => {
             const promises = daysInCurrentView.map(day => fetchAttendanceForDate(day.isoDate));
             await Promise.all(promises);
        };
        syncMonthData();
    }, [daysInCurrentView, fetchAttendanceForDate]);

    const currentMonthData = useMemo(() => {
        const dataMap = {};
        employees.forEach(emp => {
            const empData = {
                daily: [],
                stats: { present: 0, absent: 0, half: 0, stoppage: 0, sundayWork: 0 }
            };

            daysInCurrentView.forEach(day => {
                const dayRecords = attendanceRecords[day.isoDate] || [];
                const record = dayRecords.find(r => r.empId === emp.id);
                
                let displayStatus = '-';

                // PRIORITY: If it's Sunday, ALWAYS show 'Sunday' and ignore any records
                if (day.isSunday) {
                    displayStatus = 'Sunday';
                } else if (record) {
                    // Only process status if it's NOT a Sunday
                    if (record.status === 'present') {
                        displayStatus = 'P';
                        empData.stats.present += 1;
                    } else if (record.status === 'absent') {
                        displayStatus = 'A';
                        empData.stats.absent += 1;
                    } else if (record.status === 'half') {
                        displayStatus = 'HD';
                        empData.stats.present += 0.5;
                        empData.stats.half += 1;
                    } else if (record.status === 'stoppage') {
                        displayStatus = 'WS';
                        empData.stats.stoppage += 1;
                    }
                }
                empData.daily.push(displayStatus);
            });
            dataMap[emp.id] = empData;
        });
        return dataMap;
    }, [employees, daysInCurrentView, attendanceRecords]);

    const handleExportExcel = async () => {
        try {
            const ExcelJS = (await import('exceljs')).default;
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(`${months[selectedMonth]} ${selectedYear}`);

            const totalCols = daysInCurrentView.length + 8; // S.No + Name + days + PRES + ABS + HALF + TOTAL DAYS + TOTAL WRK DAYS + WORK STOPPAGE

            // Helper: column letter from number
            const colLetter = (n) => {
                let s = '';
                while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
                return s;
            };

            const thinBorder = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };

            // ROW 1: "AVSECO - ATTENDANCE REPORT 2026" — center aligned, green bold
            worksheet.mergeCells(`A1:${colLetter(totalCols)}1`);
            const r1 = worksheet.getRow(1);
            r1.getCell(1).value = `AVSECO - ATTENDANCE REPORT ${selectedYear}`;
            r1.getCell(1).font = { name: 'Arial', bold: true, size: 14, color: { argb: 'FF006A4E' } };
            r1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
            r1.height = 24;

            // ROW 2: "AVSECO ECO INDUSTRIES - ATTENDANCE REPORT" — center aligned, green bold
            worksheet.mergeCells(`A2:${colLetter(totalCols)}2`);
            const r2 = worksheet.getRow(2);
            r2.getCell(1).value = 'AVSECO ECO INDUSTRIES - ATTENDANCE REPORT';
            r2.getCell(1).font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FF006A4E' } };
            r2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
            r2.height = 20;

            // ROW 3: "Mar-26" — center aligned, green text, white background
            worksheet.mergeCells(`A3:${colLetter(totalCols)}3`);
            const r3 = worksheet.getRow(3);
            r3.getCell(1).value = `${months[selectedMonth].substring(0, 3)}-${selectedYear.toString().substring(2)}`;
            r3.getCell(1).font = { name: 'Arial', bold: true, size: 11, color: { argb: 'FF006A4E' } };
            r3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
            r3.height = 18;

            // ROW 4: Empty spacer
            worksheet.addRow([]);

            // ROW 5: COLUMN HEADERS
            const headerValues = ['S.No', 'Employee Name', ...daysInCurrentView.map(d => d.date), 'PRESENT', 'ABSENT', 'HALF', 'TOTAL DAYS', 'TOTAL WRK DAYS', 'WORK STOPPAGE'];
            const headerRow = worksheet.addRow(headerValues);
            headerRow.height = 30;

            headerRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
                cell.border = thinBorder;
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

                if (colNum <= 2) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006A4E' } };
                    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
                } else if (colNum <= daysInCurrentView.length + 2) {
                    const dayIdx = colNum - 3;
                    const isSun = daysInCurrentView[dayIdx]?.isSunday;
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCD34D' } };
                    cell.font = { bold: true, size: 9, color: { argb: isSun ? 'FFFF0000' : 'FF000000' }, name: 'Arial' };
                } else {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFBF1' } };
                    cell.font = { bold: true, size: 8, color: { argb: 'FF0F766E' }, name: 'Arial' };
                }
            });

            // ROWS 6+: DATA
            employees.forEach((emp, index) => {
                const data = currentMonthData[emp.id];
                const rowValues = [
                    index + 1,
                    emp.name,
                    ...data.daily.map(s => s === 'Sunday' ? 'SUN' : (s === '-' ? '' : s)),
                    data.stats.present,
                    data.stats.absent,
                    data.stats.half,
                    daysInCurrentMonthCount,
                    26,
                    data.stats.stoppage || 0
                ];
                const row = worksheet.addRow(rowValues);
                row.height = 18;

                row.eachCell({ includeEmpty: true }, (cell, colNum) => {
                    cell.border = thinBorder;
                    cell.font = { size: 9, name: 'Arial' };
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };

                    if (colNum === 2) {
                        cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
                        cell.font = { size: 9, name: 'Arial', bold: true };
                    }

                    if (colNum > 2 && colNum <= daysInCurrentView.length + 2) {
                        const dayIdx = colNum - 3;
                        if (daysInCurrentView[dayIdx]?.isSunday) {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };
                            cell.font = { bold: true, size: 8, color: { argb: 'FFDC2626' }, name: 'Arial' };
                        }
                    }

                    if (colNum > daysInCurrentView.length + 2) {
                        cell.font = { bold: true, size: 9, name: 'Arial' };
                    }
                });
            });

            // COLUMN WIDTHS
            worksheet.getColumn(1).width = 5;
            worksheet.getColumn(2).width = 22;
            for (let i = 3; i <= daysInCurrentView.length + 2; i++) {
                worksheet.getColumn(i).width = 3.5;
            }
            worksheet.getColumn(daysInCurrentView.length + 3).width = 9;
            worksheet.getColumn(daysInCurrentView.length + 4).width = 9;
            worksheet.getColumn(daysInCurrentView.length + 5).width = 6;
            worksheet.getColumn(daysInCurrentView.length + 6).width = 12;
            worksheet.getColumn(daysInCurrentView.length + 7).width = 15;
            worksheet.getColumn(daysInCurrentView.length + 8).width = 15;

            // FREEZE: S.No + Name + header rows
            worksheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 5 }];

            // DOWNLOAD
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `Attendance_${months[selectedMonth]}_${selectedYear}.xlsx`;
            anchor.click();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Export Error:", error);
            alert("Failed to export Excel. Please try again.");
        }
    };
    const handleExportYearlyExcel = async () => {
        try {
            const ExcelJS = (await import('exceljs')).default;
            const workbook = new ExcelJS.Workbook();
            
            // 1. Fetch entire year's data in ONE call
            const yearlyData = await attendanceApi.getByYear(selectedYear);
            
            // 2. Map data by date for easy access
            const yearMap = {};
            yearlyData.forEach(r => {
                if (!yearMap[r.date]) yearMap[r.date] = [];
                const empId = r.employee?._id ? String(r.employee._id) : String(r.employee);
                yearMap[r.date].push({ ...r, empId });
            });

            // Loop through each month
            for (let m = 0; m < 12; m++) {
                const monthName = months[m];
                const daysInMonth = new Date(selectedYear, m + 1, 0).getDate();
                const worksheet = workbook.addWorksheet(monthName);
                
                const days = [];
                for (let i = 1; i <= daysInMonth; i++) {
                    const dateObj = new Date(selectedYear, m, i);
                    const iso = `${selectedYear}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
                    days.push({ date: i, isSunday: dateObj.getDay() === 0, isoDate: iso });
                }
                
                const totalCols = days.length + 8;
                const colLetter = (n) => {
                    let s = '';
                    while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
                    return s;
                };
                const thinBorder = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };

                // Title row
                worksheet.mergeCells(`A1:${colLetter(totalCols)}1`);
                worksheet.getRow(1).getCell(1).value = `AVSECO - ATTENDANCE REPORT ${monthName} ${selectedYear}`;
                worksheet.getRow(1).getCell(1).font = { bold: true, size: 14, color: { argb: 'FF006A4E' } };
                worksheet.getRow(1).getCell(1).alignment = { horizontal: 'center' };

                // Header row
                const headerValues = ['S.No', 'Employee Name', ...days.map(d => d.date), 'PRESENT', 'ABSENT', 'HALF', 'TOTAL DAYS', 'TOTAL WRK DAYS', 'WORK STOPPAGE'];
                const headerRow = worksheet.addRow(headerValues);
                headerRow.eachCell((cell, colNum) => {
                    cell.border = thinBorder;
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    if (colNum <= 2) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006A4E' } };
                        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    } else if (colNum <= days.length + 2) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCD34D' } };
                    } else {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFBF1' } };
                        cell.font = { bold: true, size: 8, color: { argb: 'FF0F766E' }, name: 'Arial' };
                    }
                });

                // Data rows
                employees.forEach((emp, index) => {
                    const empStats = { present: 0, absent: 0, half: 0, stoppage: 0 };
                    const dailyStatus = days.map(day => {
                        if (day.isSunday) return 'SUN';
                        const record = (yearMap[day.isoDate] || []).find(r => r.empId === emp.id);
                        if (!record) return '';
                        if (record.status === 'present') { empStats.present++; return 'P'; }
                        if (record.status === 'absent') { empStats.absent++; return 'A'; }
                        if (record.status === 'half') { empStats.present += 0.5; empStats.half++; return 'HD'; }
                        if (record.status === 'stoppage') { empStats.stoppage++; return 'WS'; }
                        return '';
                    });

                    const row = worksheet.addRow([
                        index + 1,
                        emp.name,
                        ...dailyStatus,
                        empStats.present,
                        empStats.absent,
                        empStats.half,
                        daysInMonth,
                        26,
                        empStats.stoppage
                    ]);
                    row.eachCell((cell, colNum) => {
                        cell.border = thinBorder;
                        cell.font = { size: 9, name: 'Arial' };
                        cell.alignment = { horizontal: colNum === 2 ? 'left' : 'center', vertical: 'middle' };
                        if (colNum === 2) {
                            cell.font = { size: 9, name: 'Arial', bold: true };
                        }
                        if (colNum > days.length + 2) {
                            cell.font = { bold: true, size: 9, name: 'Arial' };
                        }
                    });
                });

                // Auto width
                worksheet.getColumn(1).width = 5;
                worksheet.getColumn(2).width = 20;
                for (let i = 3; i <= days.length + 2; i++) worksheet.getColumn(i).width = 4;
                worksheet.getColumn(days.length + 3).width = 9;
                worksheet.getColumn(days.length + 4).width = 9;
                worksheet.getColumn(days.length + 5).width = 6;
                worksheet.getColumn(days.length + 6).width = 12;
                worksheet.getColumn(days.length + 7).width = 15;
                worksheet.getColumn(days.length + 8).width = 15;
            }

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `Attendance_Yearly_${selectedYear}.xlsx`;
            anchor.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Yearly Export Error:", error);
            alert("Failed to export yearly report.");
        }
    };


    return (
        <div className="attendance-report-page" onClick={() => { setShowYearDropdown(false); setShowMonthDropdown(false); setShowExportDropdown(false); }}>
            <div className="attendance-header premium-header-green">
                <div className="header-left-group">
                    <h1 className="page-title-white">Monthly Attendance</h1>
                </div>

                <div className="ar-banner-right desktop-only-export">
                    <div className="custom-dropdown" onClick={(e) => e.stopPropagation()}>
                        <button className="ar-export-btn" onClick={() => setShowExportDropdown(!showExportDropdown)}>
                            <span className="material-symbols-outlined">download</span>
                            Export Report
                            <span className="material-symbols-outlined" style={{ marginLeft: '4px' }}>
                                {showExportDropdown ? 'arrow_drop_up' : 'arrow_drop_down'}
                            </span>
                        </button>
                        {showExportDropdown && (
                            <div className="dropdown-menu export-dropdown">
                                <div className="dropdown-item" onClick={() => { handleExportExcel(); setShowExportDropdown(false); }}>
                                    <span className="material-symbols-outlined">description</span>
                                    <span>Current Month ({months[selectedMonth]})</span>
                                </div>
                                <div className="dropdown-item" onClick={() => { handleExportYearlyExcel(); setShowExportDropdown(false); }}>
                                    <span className="material-symbols-outlined">calendar_today</span>
                                    <span>Full Year ({selectedYear})</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="report-filters-row">
                <div className="filter-item">
                    <label className="filter-label">YEAR:</label>
                    <div className="custom-dropdown" onClick={(e) => e.stopPropagation()}>
                        <button className="ar-filter-btn" onClick={() => setShowYearDropdown(!showYearDropdown)}>
                            {selectedYear}
                            <span className="material-symbols-outlined dropdown-arrow">expand_more</span>
                        </button>
                        {showYearDropdown && (
                            <div className="dropdown-menu">
                                {[2024, 2025, 2026].map(y => (
                                    <div key={y} className={`dropdown-item ${selectedYear === y ? "active" : ""}`} onClick={() => { setSelectedYear(y); setShowYearDropdown(false); }}>
                                        {y}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="filter-item">
                    <label className="filter-label">MONTH:</label>
                    <div className="ar-month-nav">
                        <button onClick={goToPreviousMonth} className="nav-arrow-btn">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <div className="custom-dropdown" onClick={(e) => e.stopPropagation()}>
                            <button className="month-display-select" onClick={() => setShowMonthDropdown(!showMonthDropdown)}>
                                {months[selectedMonth]}
                                <span className="material-symbols-outlined month-arrow">expand_more</span>
                            </button>
                            {showMonthDropdown && (
                                <div className="dropdown-menu scrollable">
                                    {months.map((m, idx) => (
                                        <div
                                            key={idx}
                                            className={`dropdown-item ${selectedMonth === idx ? "active" : ""}`}
                                            onClick={() => {
                                                setSelectedMonth(idx);
                                                setShowMonthDropdown(false);
                                            }}
                                        >
                                            {m}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button onClick={goToNextMonth} className="nav-arrow-btn">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="status-legend">
                <div className="legend-item"><span className="legend-box present">P</span> Present</div>
                <div className="legend-item"><span className="legend-box absent">A</span> Absent</div>
                <div className="legend-item"><span className="legend-box half">HD</span> Half Day</div>
                <div className="legend-item"><span className="legend-box stoppage">WS</span> Work Stoppage</div>
            </div>

            <div className="attendance-report-main-card">
                <div className="matrix-scroll-wrapper">
                    <table className="attendance-data-matrix">
                        <thead>
                            <tr>
                                <th className="excel-header-green sticky-col-no" rowSpan="1">S.No</th>
                                <th className="excel-header-green sticky-col" rowSpan="1">Employee Name</th>
                                {daysInCurrentView.map(day => (
                                    <th key={day.date} className={`excel-header-yellow ${day.isSunday ? 'sunday-header' : ''}`}>
                                        {day.date}
                                    </th>
                                ))}
                                <th className="excel-header-summary">PRESENT</th>
                                <th className="excel-header-summary">ABSENT</th>
                                <th className="excel-header-summary">HALF</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp, index) => {
                                const data = currentMonthData[emp.id];
                                return (
                                    <tr key={emp.id} style={emp.active === false ? { opacity: 0.7 } : {}}>
                                        <td className="sticky-col-no excel-cell-sno">{index + 1}</td>
                                        <td className="sticky-col excel-cell-name">
                                            <span className="emp-name-excel">{emp.name}</span>
                                            {emp.active === false && (
                                                <span style={{ display: 'block', fontSize: '10px', color: '#dc2626', fontWeight: '700', marginTop: '1px', letterSpacing: '0.3px' }}>Deactivated</span>
                                            )}
                                        </td>
                                        {data.daily.map((status, idx) => {
                                            const isSun = daysInCurrentView[idx]?.isSunday;
                                            let cellClass = "excel-data-cell";
                                            if (isSun) cellClass += " sunday-col";
                                            
                                            let displayStatus = status === '-' ? '' : status;
                                            if (status === 'Sunday') displayStatus = 'SUN';

                                            let statusClass = "";
                                            if (displayStatus === 'P') statusClass = "status-p";
                                            else if (displayStatus === 'A') statusClass = "status-a";
                                            else if (displayStatus === 'HD') statusClass = "status-hd";
                                            else if (displayStatus === 'WS') statusClass = "status-ws";
                                            else if (displayStatus === 'SUN') statusClass = "status-sun";

                                            return (
                                                <td key={idx} className={`${cellClass} ${statusClass}`}>
                                                    {displayStatus}
                                                </td>
                                            );
                                        })}
                                        <td className="excel-stat-cell">{data.stats.present}</td>
                                        <td className="excel-stat-cell">{data.stats.absent}</td>
                                        <td className="excel-stat-cell">{data.stats.half}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendanceReport;
