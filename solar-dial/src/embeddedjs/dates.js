const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * @param {Date} date 
 * @returns Month as a three-letter string (e.g., "Jan")
 */
export const getMonthString = (date) => monthNames[date.getMonth()];

/**
 * @param {Date} date 
 * @returns Day as a three-letter string (e.g., "Mon")
 */
export const getDayString = (date) => dayNames[date.getDay()];
