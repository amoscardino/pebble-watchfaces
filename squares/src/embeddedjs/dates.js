
/**
 * 
 * @param {Date} date 
 * @returns Month as a three-letter string (e.g., "Jan")
 */
export const getMonthString = (date) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return monthNames[date.getMonth()];
};

/**
 * @param {Date} date 
 * @returns Day as a three-letter string (e.g., "Mon")
 */
export const getDayString = (date) => {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return dayNames[date.getDay()];
};
