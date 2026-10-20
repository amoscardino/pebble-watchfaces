/// <reference types="./pebble.d.ts" />
import Poco from "commodetto/Poco";

let render = new Poco(screen);

const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const red = render.makeColor(223, 0, 0);

// let colorBackground, colorForeground;
const colorBackground = white;
const colorForeground = black;
const colorAccent = red;

const centerX = render.width / 2;
const centerY = render.height / 2;

const rad = Math.PI / 180;
const radius = render.width / 2;

const notchLength = 3;
const notchLengthLong = 9;
const notchThickness = 3;
const notchThicknessLong = 5;
const minuteHandLength = radius * 0.75;
const hourHandLength = radius * 0.5;
const handThickness = 7;
const centerRadius = handThickness * 2;
const centerBorder = 2;
const dialNumberFontHeight = 14;
const dialNumberFont = new render.Font("Gothic-Regular", dialNumberFontHeight);
const dialNumberOffset = 10;
const dateFontHeight = 18;
const dateFont = new render.Font("Gothic-Bold", dateFontHeight);

const getMonthString = (date: Date) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return monthNames[date.getMonth()];
};

const getHourAngle = (now: Date) => ((now.getHours() % 12) + now.getMinutes() / 60) * (360 / 12) * rad;
const getMinuteAngle = (now: Date) => (now.getMinutes() + now.getSeconds() / 60) * (360 / 60) * rad;

const getDatePosition = (dateWidth: number, dateFontHeight: number, hourAngle: number, minuteAngle: number): { x: number, y: number } => {
  // Position the date on the right side of the dial by default if neither hand is between 2 and 4 o'clock
  // If that doesn't work, position to the left if neither hand is between 8 and 10 o'clock
  // If that doesn't work, position to the bottom if neither hand is between 4 and 8 o'clock
  // Finally, give up and position the date at the top of the dial
  let x, y;

  const isClear = (startDeg: number, endDeg: number): boolean => {
    const inRange = (angle: number): boolean => angle > startDeg * rad && angle < endDeg * rad;
    return !inRange(hourAngle) && !inRange(minuteAngle);
  };

  if (isClear(60, 120)) {
    // Position to the right
    x = centerX + (centerX / 2) - (dateWidth / 2);
    y = centerY - (dateFontHeight / 2);
  } else if (isClear(240, 300)) {
    // Position to the left
    x = centerX - (centerX / 2) - (dateWidth / 2);
    y = centerY - (dateFontHeight / 2);
  } else if (isClear(120, 240)) {
    // Position to the bottom
    x = centerX - (dateWidth / 2);
    y = centerY + (centerY / 2) - (dateFontHeight / 2);
  } else {
    // Position to the top
    x = centerX - (dateWidth / 2);
    y = centerY - (centerY / 2) - (dateFontHeight / 2);
  }

  return { x, y };
};

const drawDial = () => {
  // Background
  render.fillRectangle(colorBackground, 0, 0, render.width, render.height);

  // Notches
  for (let i = 0; i < 12; i++) {
    const angle = (i * (360 / 12)) * rad;
    const length = i % 3 === 0 ? notchLengthLong : notchLength;
    const thickness = i % 3 === 0 ? notchThicknessLong : notchThickness;
    const x1 = centerX + Math.sin(angle) * radius;
    const y1 = centerY - Math.cos(angle) * radius;
    const x2 = centerX + Math.sin(angle) * (radius - length);
    const y2 = centerY - Math.cos(angle) * (radius - length);

    render.drawLine(x1, y1, x2, y2, colorForeground, thickness);
  }

  // Numbers
  for (let i = 1; i <= 12; i++) {
    const angle = (i * (360 / 12)) * rad;
    const numberWidth = render.getTextWidth(`${i}`, dialNumberFont);
    const x = centerX + Math.sin(angle) * (radius - notchLengthLong - dialNumberOffset);
    const y = centerY - Math.cos(angle) * (radius - notchLengthLong - dialNumberOffset);

    render.drawText(`${i}`, dialNumberFont, colorForeground, x - numberWidth / 2, y - dialNumberFontHeight / 2);
  }
};

const drawHourHand = (angle: number) => {
  const x = centerX + Math.sin(angle) * hourHandLength;
  const y = centerY - Math.cos(angle) * hourHandLength;

  render.drawLine(centerX, centerY, x, y, colorForeground, handThickness);
};

const drawMinuteHand = (angle: number) => {
  const x = centerX + Math.sin(angle) * minuteHandLength;
  const y = centerY - Math.cos(angle) * minuteHandLength;

  render.drawLine(centerX, centerY, x, y, colorForeground, handThickness);
};

const drawDate = (now: Date, hourAngle: number, minuteAngle: number) => {
  const dateStr = `${getMonthString(now)} ${now.getDate()}`;
  const dateWidth = render.getTextWidth(dateStr, dateFont);
  const { x, y } = getDatePosition(dateWidth, dateFontHeight, hourAngle, minuteAngle);

  render.fillRectangle(colorAccent, x, y, dateWidth, dateFontHeight);
  render.drawCircle(colorAccent, x, y + dateFontHeight / 2, dateFontHeight / 2, 0, 360);
  render.drawCircle(colorAccent, x + dateWidth, y + dateFontHeight / 2, dateFontHeight / 2, 0, 360);
  render.drawText(dateStr, dateFont, colorBackground, x, y - 1);
};

const drawCenter = (now: Date) => {
  // Center is the AM/PM indicator
  const isPM = now.getHours() >= 12;
  const inner = isPM ? colorForeground : colorBackground;
  const outer = isPM ? colorBackground : colorForeground;

  render.drawCircle(outer, centerX, centerY, centerRadius, 0, 360);
  render.drawCircle(inner, centerX, centerY, centerRadius - centerBorder, 0, 360);
};

const draw = (evt?: TimeChangeEvent) => {
  const now = evt?.date ?? new Date();
  const hourAngle = getHourAngle(now);
  const minuteAngle = getMinuteAngle(now);

  render.begin();

  drawDial();
  drawHourHand(hourAngle);
  drawMinuteHand(minuteAngle);
  drawDate(now, hourAngle, minuteAngle);
  drawCenter(now);

  render.end();
};

watch.addEventListener('minutechange', draw);
