export const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

export const formatFullDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return `${day}-${month}-${year}`;
};

export const isWithinLast2Days = (dateString) => {
    if (!dateString) return false;
    
    let date;
    // Handle DD-MM-YYYY
    if (typeof dateString === 'string' && dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts[0].length === 2) {
            date = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
            date = new Date(dateString);
        }
    } else {
        date = new Date(dateString);
    }

    if (isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const expenseDate = new Date(date);
    expenseDate.setHours(0, 0, 0, 0); // Start of expense day
    
    const diffTime = today - expenseDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 2;
};
