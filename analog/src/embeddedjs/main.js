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

const getMonthString = (date) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return monthNames[date.getMonth()];
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

const drawHourHand = (now) => {
  const angle = ((now.getHours() % 12) + now.getMinutes() / 60) * (360 / 12) * rad;
  const x = centerX + Math.sin(angle) * hourHandLength;
  const y = centerY - Math.cos(angle) * hourHandLength;

  render.drawLine(centerX, centerY, x, y, colorForeground, handThickness);
};

const drawMinuteHand = (now) => {
  const angle = (now.getMinutes() + now.getSeconds() / 60) * (360 / 60) * rad;
  const x = centerX + Math.sin(angle) * minuteHandLength;
  const y = centerY - Math.cos(angle) * minuteHandLength;

  render.drawLine(centerX, centerY, x, y, colorForeground, handThickness);
};

const drawDate = (now) => {
  const dateStr = `${getMonthString(now)} ${now.getDate()}`;
  const dateWidth = render.getTextWidth(dateStr, dateFont);
  const x = centerX + (centerX / 2) - (dateWidth / 2);
  const y = centerY - (dateFontHeight / 2);

  render.fillRectangle(colorAccent, x, y, dateWidth, dateFontHeight);
  render.drawCircle(colorAccent, x, y + dateFontHeight / 2, dateFontHeight / 2, 0, 360);
  render.drawCircle(colorAccent, x + dateWidth, y + dateFontHeight / 2, dateFontHeight / 2, 0, 360);
  render.drawText(dateStr, dateFont, colorBackground, x, y - 1);
};

const drawCenter = (now) => {
  // Center is the AM/PM indicator
  const inner = now.getHours() > 12 ? colorForeground : colorBackground;
  const outer = now.getHours() > 12 ? colorBackground : colorForeground;

  render.drawCircle(outer, centerX, centerY, centerRadius, 0, 360);
  render.drawCircle(inner, centerX, centerY, centerRadius - centerBorder, 0, 360);
};

const draw = (evt) => {
  const now = evt?.date ?? new Date();

  render.begin();

  drawDial();
  drawHourHand(now);
  drawMinuteHand(now);
  drawDate(now);
  drawCenter(now);

  render.end();
}

watch.addEventListener('minutechange', draw);
