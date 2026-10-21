const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const getMonthString = (date: Date) => monthNames[date.getMonth()];
export const getDayString = (date: Date) => dayNames[date.getDay()];
