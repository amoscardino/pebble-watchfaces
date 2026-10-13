export const rad = Math.PI / 180;

/**
 * @param {Date} date
 * @returns Position of the sun on the 24-hour dial in degrees (midnight at the bottom)
 */
export const getSunAngle = (date) => {
  const elapsedMinutes = date.getHours() * 60 + date.getMinutes();
  const totalMinutes = 24 * 60;
  const sunAngleDegrees = (elapsedMinutes / totalMinutes) * 360 + 90;

  return sunAngleDegrees;
};
