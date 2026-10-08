import Poco from "commodetto/Poco";

let render = new Poco(screen);

const font = new render.Font("Leco-Bold", 20);
const timeWidth = render.getTextWidth("00:00", font);

const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const purple = render.makeColor(128, 0, 128);
const blue = render.makeColor(0, 0, 255);
const green = render.makeColor(0, 128, 0);
const yellow = render.makeColor(255, 255, 0);
const orange = render.makeColor(255, 128, 0);
const red = render.makeColor(255, 0, 0);

const rings = 6;
const ringGap = 2;
const ringSize = ((render.width / 2) - (timeWidth / 2) - (ringGap * (rings + 1))) / rings;

const startingRadius = render.width / 2;

const centerX = render.width / 2;
const centerY = render.height / 2;

const drawYearRing = (now, radius) => {
  const daysInYear = (now.getFullYear() % 4 === 0 && (now.getFullYear() % 100 !== 0 || now.getFullYear() % 400 === 0)) ? 366 : 365;
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const yearProgress = dayOfYear / daysInYear;

  render.drawCircle(purple, centerX, centerY, radius, 0, yearProgress * 360);
  render.drawCircle(black, centerX, centerY, (radius - ringSize + 1), 0, 360);
};

const drawMonthRing = (now, radius) => {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const monthProgress = dayOfMonth / daysInMonth;

  render.drawCircle(blue, centerX, centerY, radius, 0, monthProgress * 360);
  render.drawCircle(black, centerX, centerY, (radius - ringSize), 0, 360);
};

const drawWeekRing = (now, radius) => {
  const dayOfWeek = now.getDay();
  const weekProgress = dayOfWeek / 7;

  render.drawCircle(green, centerX, centerY, radius, 0, weekProgress * 360);
  render.drawCircle(black, centerX, centerY, (radius - ringSize), 0, 360);
};

const drawDayRing = (now, radius) => {
  const hourOfDay = now.getHours();
  const dayProgress = hourOfDay / 24;

  render.drawCircle(yellow, centerX, centerY, radius, 0, dayProgress * 360);
  render.drawCircle(black, centerX, centerY, (radius - ringSize), 0, 360);
};

const drawHourRing = (now, radius) => {
  const minuteOfHour = now.getMinutes();
  const minuteProgress = minuteOfHour / 60;

  render.drawCircle(orange, centerX, centerY, radius, 0, minuteProgress * 360);
  render.drawCircle(black, centerX, centerY, (radius - ringSize), 0, 360);
};

const drawMinuteRing = (now, radius) => {
  const secondOfMinute = now.getSeconds();
  const secondProgress = secondOfMinute / 60;

  render.drawCircle(red, centerX, centerY, radius, 0, secondProgress * 360);
  render.drawCircle(black, centerX, centerY, (radius - ringSize), 0, 360);
};

const draw = (evt) => {
  const now = evt?.date || new Date();
  const timeHour = watch.hour12 ? now.getHours() % 12 || 12 : now.getHours();
  const timeMinute = now.getMinutes().toString().padStart(2, "0");
  const timeStr = `${timeHour}:${timeMinute}`;
  const thisTimeWidth = render.getTextWidth(timeStr, font);

  render.begin();

  render.fillRectangle(black, 0, 0, render.width, render.height);

  let radius = startingRadius;

  drawYearRing(now, radius);

  radius -= ringSize + ringGap;

  drawMonthRing(now, radius);

  radius -= ringSize + ringGap;

  drawWeekRing(now, radius);

  radius -= ringSize + ringGap;

  drawDayRing(now, radius);

  radius -= ringSize + ringGap;

  drawHourRing(now, radius);

  radius -= ringSize + ringGap;

  drawMinuteRing(now, radius);

  render.drawText(timeStr, font, white, (render.width - thisTimeWidth) / 2, (render.height - font.height) / 2);

  render.end();
}

watch.addEventListener('secondchange', draw);
