/**
 * Utilities for formatting currency and numbers with dynamic shortening
 */

/**
 * Formats a number as Indian Currency (INR) with optional shortening
 * @param {number|string} amount - The amount to format
 * @param {boolean} shorten - Whether to use K, L, Cr abbreviations
 * @returns {string} Formatted string
 */
export const formatCurrency = (amount, shorten = false) => {
    const num = parseFloat(amount) || 0;
    
    if (shorten) {
        if (num >= 10000000) { // 1 Crore+
            return `₹${(num / 10000000).toFixed(2)} Cr`;
        }
        if (num >= 100000) { // 1 Lakh+
            return `₹${(num / 100000).toFixed(2)} L`;
        }
        if (num >= 1000) { // 1 Thousand+
            return `₹${(num / 1000).toFixed(1)} K`;
        }
    }
    
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(num).replace('.00', '');
};

/**
 * Calculate equivalent raw material capacity (plates) from purchase cost.
 * Uses the same rule as RawMaterials: 30000 -> 23000, 40000 -> 33000.
 * @param {number|string} cost
 * @returns {number}
 */
export const calculateRawMaterialCapacity = (cost) => {
    const costNum = Number(cost) || 0;
    if (costNum <= 0) return 0;
    return costNum >= 7000 ? Math.round(costNum - 7000) : Math.round(costNum * 0.7667);
};

/**
 * Returns a dynamic font size class or style based on length
 * @param {string|number} value - The value to check
 * @returns {object} Inline style object
 */
export const getDynamicFontSize = (value) => {
    const len = String(value).length;
    if (len > 15) return { fontSize: '14px' };
    if (len > 12) return { fontSize: '18px' };
    if (len > 10) return { fontSize: '22px' };
    if (len > 8) return { fontSize: '26px' };
    return {}; // Default size from CSS
};
