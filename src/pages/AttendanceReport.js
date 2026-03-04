import React, { useState, useMemo, useCallback } from "react";
import { useAppContext } from '../context/AppContext.js';
import "./AttendanceReport.css";

const AttendanceReport = () => {
    const { employees } = useAppContext();

    // State for dates
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
    const [exportRange, setExportRange] = useState("month"); // 'month' or 'year'

    // Helper to get days in a specific month
    const getDaysInMonth = (year, month) => {
        const days = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: days }, (_, i) => {
            const d = new Date(year, month, i + 1);
            return {
                date: i + 1,
                dayName: d.toLocaleDateString("en-US", { weekday: 'short' }),
                isSunday: d.getDay() === 0,
                fullDate: d
            };
        });
    };

    // Current View Data
    const daysInCurrentView = useMemo(() => getDaysInMonth(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

    // Data Generation Logic (reusable)
    const generateMonthData = useCallback((year, month) => {
        const days = getDaysInMonth(year, month);
        const data = {};

        employees.forEach(emp => {
            const empData = [];
            let totalPresent = 0;
            let totalAbsent = 0;
            let totalHalf = 0;

            days.forEach(day => {
                if (day.isSunday) {
                    empData.push("Sunday");
                } else {
                    const rand = Math.random();
                    let status = "P";

                    if (rand > 0.96) status = "WS";
                    else if (rand > 0.9) status = "A";
                    else if (rand > 0.85) status = "HD";

                    if (status === "P") totalPresent += 1;
                    if (status === "HD") totalHalf += 1;
                    if (status === "A" || status === "WS") totalAbsent += 1;

                    empData.push(status);
                }
            });

            data[emp.id] = {
                daily: empData,
                stats: { present: totalPresent, absent: totalAbsent, half: totalHalf }
            };
        });
        return data;
    }, [employees]);

    const currentMonthData = useMemo(() => generateMonthData(selectedYear, selectedMonth), [selectedYear, selectedMonth, generateMonthData]);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Generate years (e.g., last 5 years)
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    const [showRangeDropdown, setShowRangeDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);

    // Close dropdowns on click outside
    React.useEffect(() => {
        const handleClickOutside = () => {
            setShowRangeDropdown(false);
            setShowYearDropdown(false);
            setShowMonthDropdown(false);
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // --- EXCEL EXPORT LOGIC ---
    const generateTableHTML = (year, month, data, days) => {
        const monthName = months[month];
        const totalColumns = 31; // Fixed columns for days to ensure final stats align in Excel

        return `
            <tr>
                <td colspan="${totalColumns + 6}" style="height: 50px; font-size: 24px; font-weight: bold; text-align: center; vertical-align: middle; border: none; color: #006A4E;">
                    AVSECO ECO INDUSTRIES - ATTENDANCE REPORT
                </td>
            </tr>
            <tr>
                <td colspan="${totalColumns + 6}" style="height: 50px; font-size: 24px; font-weight: bold; text-align: center; vertical-align: middle; border: none; color: #006A4E;">
                    ${monthName.toUpperCase()} ${year}
                </td>
            </tr>
            <tr>
                <th style="background-color: #006A4E; color: white; border: 1px solid #000; font-weight: bold; width: 50px;">S.No</th>
                <th style="background-color: #006A4E; color: white; border: 1px solid #000; font-weight: bold; width: 100px;">Employee ID</th>
                <th style="background-color: #006A4E; color: white; border: 1px solid #000; font-weight: bold; width: 200px;">Employee Name</th>
                ${Array.from({ length: totalColumns }).map((_, i) => {
            const day = days[i];
            const isSun = day?.isSunday;
            return `
                        <th style="background-color: #FFD700; border: 1px solid #000; color: ${isSun ? 'red' : 'black'}; font-weight: bold; width: 40px; text-align: center;">
                            ${day ? day.date : ''}
                        </th>
                    `;
        }).join('')}
                <th style="background-color: #dcfce7; border: 1px solid #000; font-weight: bold; width: 60px; text-align: center; color: #166534;">PRESENT</th>
                <th style="background-color: #fee2e2; border: 1px solid #000; font-weight: bold; width: 60px; text-align: center; color: #991b1b;">ABSENT</th>
                <th style="background-color: #ffedd5; border: 1px solid #000; font-weight: bold; width: 60px; text-align: center; color: #9a3412;">HALF</th>
            </tr>
            ${employees.map((emp, index) => {
            const empData = data[emp.id];
            return `
                    <tr>
                        <td style="border: 1px solid #000; padding: 5px; text-align: center;">${index + 1}</td>
                        <td style="border: 1px solid #000; padding: 5px;">${emp.empId || '-'}</td>
                        <td style="border: 1px solid #000; padding: 5px; font-weight: 600;">${emp.name}</td>
                        ${Array.from({ length: totalColumns }).map((_, i) => {
                const status = empData.daily[i];
                const isSun = days[i]?.isSunday;

                let bg = "#ffffff";
                let color = "#000000";
                let text = status || "";

                if (isSun) {
                    bg = "#fee2e2"; color = "red"; text = "SUN";
                } else if (status === "P") {
                    bg = "#dcfce7"; color = "#166534";
                } else if (status === "A") {
                    bg = "#fee2e2"; color = "#991b1b";
                } else if (status === "HD") {
                    bg = "#ffedd5"; color = "#9a3412";
                } else if (status === "WS") {
                    bg = "#fef9c3"; color = "#854d0e"; text = "WS";
                }

                return `<td style="border: 1px solid #000; background-color: ${bg}; color: ${color}; text-align: center; font-size: 10px;">${text}</td>`;
            }).join('')}
                        <td style="border: 1px solid #000; background-color: #f0fdf4; font-weight: bold; text-align: center;">${empData.stats.present}</td>
                        <td style="border: 1px solid #000; background-color: #fef2f2; font-weight: bold; text-align: center;">${empData.stats.absent}</td>
                        <td style="border: 1px solid #000; background-color: #fff7ed; font-weight: bold; text-align: center;">${empData.stats.half}</td>
                    </tr>
                `;
        }).join('')}
            <tr><td colspan="${totalColumns + 6}" style="border: none; height: 30px;"></td></tr> 
        `;
    };

    const handleExport = () => {
        let tableContent = "";
        let filename = "";
        let exportTitle = `AVSECO - ATTENDANCE REPORT ${selectedYear}`;

        if (exportRange === "month") {
            tableContent = generateTableHTML(selectedYear, selectedMonth, currentMonthData, daysInCurrentView);
            filename = `Attendance_Report_${months[selectedMonth].toUpperCase()}_${selectedYear}`;
        } else {
            for (let m = 0; m < 12; m++) {
                const mDays = getDaysInMonth(selectedYear, m);
                const mData = generateMonthData(selectedYear, m);
                tableContent += generateTableHTML(selectedYear, m, mData, mDays);
            }
            filename = `Attendance_Report_ANNUAL_${selectedYear}`;
        }

        const fullHTML = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>Attendance Report</x:Name>
                                <x:WorksheetOptions>
                                    <x:DisplayGridlines/>
                                </x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <![endif]-->
            </head>
            <body>
                <table>
                    <thead>
                        <tr>
                            <th colspan="36" style="height: 60px; font-size: 28px; font-weight: bold; text-align: center; vertical-align: middle; border: none; background-color: #ffffff; color: #006A4E;">
                                ${exportTitle}
                            </th>
                        </tr>
                    </thead>
                    <tbody>${tableContent}</tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([fullHTML], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="attendance-report-page">
            <div className="ar-banner-header">
                <div className="ar-banner-left">
                    <h1 className="ar-banner-title">Attendance Reports</h1>
                    <p className="ar-banner-subtitle">Analyze and export comprehensive workforce logs</p>
                </div>
                <div className="ar-banner-actions">
                    <div className="custom-dropdown range-selector" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="ar-banner-btn"
                            onClick={() => setShowRangeDropdown(!showRangeDropdown)}
                        >
                            {exportRange === "month" ? "Current Month" : `Full Year ${selectedYear}`}
                            <span className="material-symbols-outlined">expand_more</span>
                        </button>
                        {showRangeDropdown && (
                            <div className="dropdown-menu">
                                <div
                                    className={`dropdown-item ${exportRange === "month" ? "active" : ""}`}
                                    onClick={() => { setExportRange("month"); setShowRangeDropdown(false); }}
                                >
                                    Current Month
                                </div>
                                <div
                                    className={`dropdown-item ${exportRange === "year" ? "active" : ""}`}
                                    onClick={() => { setExportRange("year"); setShowRangeDropdown(false); }}
                                >
                                    Full Year {selectedYear}
                                </div>
                            </div>
                        )}
                    </div>
                    <button className="ar-banner-btn ar-banner-btn-solid" onClick={handleExport}>
                        <span className="material-symbols-outlined">download</span>
                        Export Data
                    </button>
                </div>
            </div>

            {/* Filters Card */}
            <div className="filters-card">
                <div className="filter-item">
                    <label className="filter-label">Year:</label>
                    <div className="custom-dropdown" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="report-select"
                            onClick={() => setShowYearDropdown(!showYearDropdown)}
                        >
                            {selectedYear}
                            <span className="material-symbols-outlined select-arrow">expand_more</span>
                        </button>
                        {showYearDropdown && (
                            <div className="dropdown-menu">
                                {years.map(y => (
                                    <div
                                        key={y}
                                        className={`dropdown-item ${selectedYear === y ? "active" : ""}`}
                                        onClick={() => { setSelectedYear(y); setShowYearDropdown(false); }}
                                    >
                                        {y}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="filter-item">
                    <label className="filter-label">Month:</label>
                    <div className="month-nav-group">
                        <button onClick={() => setSelectedMonth(prev => prev === 0 ? 11 : prev - 1)} className="nav-arrow-btn">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>

                        <div className="custom-dropdown" onClick={(e) => e.stopPropagation()}>
                            <button
                                className="month-display-select"
                                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                            >
                                {months[selectedMonth]}
                                <span className="material-symbols-outlined month-arrow">expand_more</span>
                            </button>
                            {showMonthDropdown && (
                                <div className="dropdown-menu scrollable">
                                    {months.map((m, idx) => (
                                        <div
                                            key={idx}
                                            className={`dropdown-item ${selectedMonth === idx ? "active" : ""}`}
                                            onClick={() => { setSelectedMonth(idx); setShowMonthDropdown(false); }}
                                        >
                                            {m}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button onClick={() => setSelectedMonth(prev => prev === 11 ? 0 : prev + 1)} className="nav-arrow-btn">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Legend */}
            <div className="status-legend">
                <div className="legend-item"><span className="legend-box present">P</span> Present</div>
                <div className="legend-item"><span className="legend-box absent">A</span> Absent</div>
                <div className="legend-item"><span className="legend-box half">HD</span> Half Day</div>
                <div className="legend-item"><span className="legend-box stoppage">WS</span> Work Stoppage</div>
            </div>

            {/* Matrix Table Card */}
            <div className="report-table-card">
                <div className="table-scroll-container">
                    <table className="matrix-table">
                        <thead>
                            <tr>
                                <th className="sticky-col-no" style={{ left: 0 }}>#</th>
                                <th className="sticky-col">Employee</th>
                                {daysInCurrentView.map(day => (
                                    <th key={day.date} style={{ color: day.isSunday ? '#ef4444' : 'inherit' }}>
                                        <div>{day.date}</div>
                                    </th>
                                ))}
                                <th>Pres</th>
                                <th>Abs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp, index) => {
                                const data = currentMonthData[emp.id];
                                return (
                                    <tr key={emp.id}>
                                        <td className="sticky-col-no" style={{ left: 0 }}>
                                            {index + 1}
                                        </td>
                                        <td className="sticky-col" style={{ left: '40px' }}>
                                            <div className="emp-cell-info">
                                                <span className="emp-name">{emp.name}</span>
                                            </div>
                                        </td>

                                        {data.daily.map((status, idx) => {
                                            const isSun = daysInCurrentView[idx]?.isSunday;
                                            let statusClass = "status-cell";
                                            if (isSun) statusClass += " sunday";
                                            else if (status === 'P') statusClass += " present";
                                            else if (status === 'A') statusClass += " absent";
                                            else if (status === 'HD') statusClass += " half";
                                            else if (status === 'WS') statusClass += " stoppage";

                                            return (
                                                <td key={idx} className={statusClass}>
                                                    <div className="status-indicator">
                                                        {status === 'Sunday' ? 'S' : status}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="stat-cell-val pres">{data.stats.present}</td>
                                        <td className="stat-cell-val abs">{data.stats.absent}</td>
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
