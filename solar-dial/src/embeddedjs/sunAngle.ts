export const rad = Math.PI / 180;

export const getSunAngle = (date: Date) => {
  const elapsedMinutes = date.getHours() * 60 + date.getMinutes();
  const totalMinutes = 24 * 60;
  const sunAngleDegrees = (elapsedMinutes / totalMinutes) * 360 + 90;

  return sunAngleDegrees;
};
