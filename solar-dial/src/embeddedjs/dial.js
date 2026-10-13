import Poco from "commodetto/Poco";
import { getMonthString, getDayString } from "./dates";
import { rad, getSunAngle } from "./sunAngle";
import { getDaylightArc } from "./sunTimes";

const render = new Poco(screen);

let lastDate = new Date();

const timeFont = new render.Font("Bitham-Black", 30);
const dateFont = new render.Font("Gothic-Regular", 14);

const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const blue = render.makeColor(0, 0, 255);
const yellow = render.makeColor(255, 255, 0);

const centerX = render.width / 2;
const centerY = render.height / 2;
const radius = render.width / 2;

// Just large enough for the daylight arc to cover the visible screen
const backgroundRadius = radius + 1;

const timeCircleRadius = render.getTextWidth("00:00", timeFont) / 2;

const sunRadius = 10;
const notchLength = 5;
const notchThickness = 2;
const sunOrbitRadius = radius - (sunRadius + (notchLength * 2) + 2);

// Notches never move, so compute their endpoints once
const notches = [];
for (let i = 0, numberOfNotches = 24; i < numberOfNotches; i++) {
  const angle = (i * 360 / numberOfNotches) * rad;
  const length = i % 2 === 0 ? notchLength * 2 : notchLength;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  notches.push({
    x1: centerX + (centerX - length) * cos,
    y1: centerY + (centerY - length) * sin,
    x2: centerX + centerX * cos,
    y2: centerY + centerY * sin
  });
}

const drawBackground = () => {
  const { sunriseDegrees, sunsetDegrees } = getDaylightArc();

  render.fillRectangle(black, 0, 0, render.width, render.height);
  render.drawCircle(blue, centerX, centerY, backgroundRadius, sunriseDegrees, sunsetDegrees);
};

const drawNotches = () => {
  for (const { x1, y1, x2, y2 } of notches) {
    render.drawLine(x1, y1, x2, y2, white, notchThickness);
  }
};

const drawSun = (sunCos, sunSin) => {
  const sunX = centerX + sunOrbitRadius * sunCos;
  const sunY = centerY + sunOrbitRadius * sunSin;

  render.drawCircle(yellow, sunX, sunY, sunRadius, 0, 360);
};

const drawTimeAndDate = (now, sunCos, sunSin) => {
  // Opposite the sun: cos/sin of (angle + 180°) is just the negation
  const timeCircleX = centerX - (timeCircleRadius / 2) * sunCos;
  const timeCircleY = centerY - (timeCircleRadius / 2) * sunSin;

  // Time in circle (12hr)
  render.drawCircle(white, timeCircleX, timeCircleY, timeCircleRadius, 0, 360);

  const timeHour = watch.hour12 ? now.getHours() % 12 || 12 : now.getHours();
  const timeMinute = now.getMinutes().toString().padStart(2, "0");
  const timeStr = `${timeHour}:${timeMinute}`;
  const thisTimeWidth = render.getTextWidth(timeStr, timeFont);
  render.drawText(timeStr, timeFont, black, timeCircleX - (thisTimeWidth / 2), timeCircleY - (timeFont.height / 2) - 5);

  // Date below time in circle
  const dateDay = getDayString(now);
  const dateMonth = getMonthString(now);
  const dateStr = `${dateDay} ${dateMonth} ${now.getDate()}`;
  const thisDateWidth = render.getTextWidth(dateStr, dateFont);
  render.drawText(dateStr, dateFont, black, timeCircleX - (thisDateWidth / 2), timeCircleY + (dateFont.height / 2) + 5);
};

/**
 * Redraws the whole dial. Called without an event, it reuses the last time drawn.
 */
export const draw = (evt) => {
  const now = evt?.date || lastDate;
  lastDate = now;

  const sunAngle = getSunAngle(now) * rad;
  const sunCos = Math.cos(sunAngle);
  const sunSin = Math.sin(sunAngle);

  render.begin();

  drawBackground();
  drawNotches();
  drawSun(sunCos, sunSin);
  drawTimeAndDate(now, sunCos, sunSin);

  render.end();
};
