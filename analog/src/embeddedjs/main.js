import Poco from "commodetto/Poco";

let render = new Poco(screen);

const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);

let colorBackground, colorForeground;

const centerX = render.width / 2;
const centerY = render.height / 2;

const notchLength = 5;
const notchLengthLong = 10;
const notchThickness = 3;
const radius = render.width / 2;
const minuteHandLength = radius * 0.75;
const hourHandLength = radius * 0.5;
const handThickness = 9;
const handOffset = radius * 0.15;
const centerRadius = (handThickness / 2) * 1.75;
const centerBorder = 2;
const fontHeight = 14;
const font = new render.Font("Gothic-Regular", fontHeight);

const drawDial = () => {
  // Background
  render.fillRectangle(colorBackground, 0, 0, render.width, render.height);

  // Notches
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * Math.PI / 180;
    const length = i % 3 === 0 ? notchLengthLong : notchLength;
    const x1 = centerX + Math.sin(angle) * radius;
    const y1 = centerY - Math.cos(angle) * radius;
    const x2 = centerX + Math.sin(angle) * (radius - length);
    const y2 = centerY - Math.cos(angle) * (radius - length);

    render.drawLine(x1, y1, x2, y2, colorForeground, notchThickness);
  }

  // Numbers
  for (let i = 1; i <= 12; i++) {
    const angle = (i * 30) * Math.PI / 180;
    const numberWidth = render.getTextWidth(`${i}`, font);
    const x = centerX + Math.sin(angle) * (radius - notchLengthLong - 10);
    const y = centerY - Math.cos(angle) * (radius - notchLengthLong - 10);
    render.drawText(`${i}`, font, colorForeground, x - numberWidth / 2, y - fontHeight / 2);
  }
};

const drawHourHand = (now) => {
  const angle = ((now.getHours() % 12) + now.getMinutes() / 60) * 30 * Math.PI / 180;
  const x = centerX + Math.sin(angle) * hourHandLength;
  const y = centerY - Math.cos(angle) * hourHandLength;

  const centerXOffset = centerX + Math.sin(angle) * handOffset;
  const centerYOffset = centerY - Math.cos(angle) * handOffset;

  render.drawLine(centerX, centerY, x, y, colorForeground, notchThickness);
  render.drawLine(centerXOffset, centerYOffset, x, y, colorForeground, handThickness);
};

const drawMinuteHand = (now) => {
  const angle = (now.getMinutes() + now.getSeconds() / 60) * 6 * Math.PI / 180;
  const x = centerX + Math.sin(angle) * minuteHandLength;
  const y = centerY - Math.cos(angle) * minuteHandLength;

  const centerXOffset = centerX + Math.sin(angle) * handOffset;
  const centerYOffset = centerY - Math.cos(angle) * handOffset;

  render.drawLine(centerX, centerY, x, y, colorForeground, notchThickness);
  render.drawLine(centerXOffset, centerYOffset, x, y, colorForeground, handThickness);
};

const drawCenter = () => {
  render.drawCircle(colorForeground, centerX, centerY, centerRadius, 0, 360);
  render.drawCircle(colorBackground, centerX, centerY, centerRadius - centerBorder, 0, 360);
};

const draw = (evt) => {
  const now = evt?.date ?? new Date();

  colorBackground = now.getHours() < 12 ? white : black;
  colorForeground = now.getHours() < 12 ? black : white;

  render.begin();

  drawDial();
  drawHourHand(now);
  drawMinuteHand(now);
  drawCenter();

  render.end();
}

watch.addEventListener('minutechange', draw);
