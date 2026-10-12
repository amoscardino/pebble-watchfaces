import Poco from "commodetto/Poco";

let render = new Poco(screen);

const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);

// let colorBackground, colorForeground;
const colorBackground = white;
const colorForeground = black;

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

const drawCenter = () => {
  render.drawCircle(colorForeground, centerX, centerY, centerRadius, 0, 360);
  render.drawCircle(colorBackground, centerX, centerY, centerRadius - centerBorder, 0, 360);
};

const draw = (evt) => {
  const now = evt?.date ?? new Date();

  // colorBackground = now.getHours() >= 6 && now.getHours() < 18 ? white : black;
  // colorForeground = now.getHours() >= 6 && now.getHours() < 18 ? black : white;

  render.begin();

  drawDial();
  drawHourHand(now);
  drawMinuteHand(now);
  drawCenter();

  render.end();
}

watch.addEventListener('minutechange', draw);
