/// <reference path="./pebble.d.ts" />
import Poco from "commodetto/Poco";
import parseBMF from "commodetto/parseBMF";
import parseRLE from "commodetto/parseRLE";

let render = new Poco(screen);

const getFont = (name: string, size: number) => {
  const font = parseBMF(new Resource(`${name}-${size}.fnt`));
  font.bitmap = parseRLE(new Resource(`${name}-${size}-alpha.bm4`));
  return font;
};

const timeFont = screen.round ? getFont("IBMPlexMono-Bold", 64) : getFont("IBMPlexMono-Bold", 48);
const dateFontLarge = getFont("IBMPlexMono-Bold", 32);
const dateFontSmall = getFont("IBMPlexMono-Bold", 18);

const white = render.makeColor(255, 255, 255);
const black = render.makeColor(0, 0, 0);
const red = render.makeColor(255, 0, 0);

const margin = 2;
const size = 12;
const multiple = 2;
const lgSize = (size * multiple) + (margin * (multiple - 1));
const timeHeight = screen.round ? timeFont.height : timeFont.height * 1.25;
const textMargin = screen.round ? margin * 5 : margin * 3;
const accentBarX = 0;
const accentBarY = (render.height / 2) - (timeHeight / 2);
const accentBarWidth = render.width;
const accentBarHeight = timeHeight;
const timeX = textMargin;
const timeY = (render.height - timeFont.height) / 2 - 3;

const getMonthString = (date: Date) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return monthNames[date.getMonth()];
};

const getDayString = (date: Date) => {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return dayNames[date.getDay()];
};

const getRandomElement = <T>(elements: [T, number][]): T => {
  const totalWeight = elements.reduce((sum, [, weight]) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const [element, weight] of elements) {
    if (random < weight)
      return element;

    random -= weight;
  }

  // This should never happen, but return the first element as a fallback to keep TSC happy.
  return elements[0][0];
};

const drawSquares = (startX: number, startY: number, left: boolean, up: boolean, backgroundColor: number, foregroundColor: number) => {
  const directionX = left ? -1 : 1;
  const directionY = up ? -1 : 1;

  const inBoundsX = (x: number) => left ? x > 0 : x < render.width;
  const inBoundsY = (y: number) => up ? y > 0 : y < render.height;

  for (let x = startX + ((margin / 2) * directionX); inBoundsX(x); x += directionX * (size + margin)) {
    for (let y = startY + ((margin / 2) * directionY); inBoundsY(y); y += directionY * (size + margin)) {
      const color = getRandomElement([[red, 1], [foregroundColor, 1], [backgroundColor, 2]]);

      const boxX = left ? x - size : x;
      const boxY = up ? y - size : y;

      render.fillRectangle(color, boxX, boxY, size, size);
    }
  }

  for (let x = startX + ((margin / 2) * directionX); inBoundsX(x); x += directionX * (lgSize + margin)) {
    for (let y = startY + ((margin / 2) * directionY); inBoundsY(y); y += directionY * (lgSize + margin)) {
      if (getRandomElement([[true, 3], [false, 1]]))
        continue;

      const color = getRandomElement([[red, 1], [foregroundColor, 2]]);
      const boxX = left ? x - lgSize : x;
      const boxY = up ? y - lgSize : y;

      render.fillRectangle(color, boxX, boxY, lgSize, lgSize);
    }
  }
};

const draw = (evt?: TimeChangeEvent) => {
  const now = evt?.date ?? new Date();

  const isPm = now.getHours() >= 12;
  const backgroundColor = isPm ? black : white;
  const foregroundColor = isPm ? white : black;

  const hours = watch.hour12 ? now.getHours() % 12 || 12 : now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  const dateStr = now.getDate().toString();
  const dateWidth = render.getTextWidth(dateStr, dateFontLarge);
  const monthStr = getMonthString(now);
  const monthWidth = render.getTextWidth(monthStr, dateFontSmall);
  const dayStr = getDayString(now);
  const dayWidth = render.getTextWidth(dayStr, dateFontSmall);
  const dateMonthDayWidth = Math.max(dateWidth, monthWidth, dayWidth);

  const dateX = render.width - dateMonthDayWidth - textMargin + ((dateMonthDayWidth - dateWidth) / 2);
  const dateY = (render.height - dateFontLarge.height) / 2;
  const monthX = render.width - dateMonthDayWidth - textMargin + ((dateMonthDayWidth - monthWidth) / 2);
  const monthY = (render.height - dateFontSmall.height) / 2 - (dateFontLarge.height / 2) - margin;
  const dayX = render.width - dateMonthDayWidth - textMargin + ((dateMonthDayWidth - dayWidth) / 2);
  const dayY = (render.height - dateFontSmall.height) / 2 + (dateFontLarge.height / 2) + margin;

  render.begin();

  render.fillRectangle(backgroundColor, 0, 0, render.width, render.height);
  render.fillRectangle(red, accentBarX, accentBarY, accentBarWidth, accentBarHeight);
  render.drawText(timeStr, timeFont, white, timeX, timeY);
  render.drawText(dateStr, dateFontLarge, white, dateX, dateY);
  render.drawText(monthStr, dateFontSmall, white, monthX, monthY);
  render.drawText(dayStr, dateFontSmall, white, dayX, dayY);
  drawSquares(render.width / 2, (render.height / 2) + (timeHeight / 2), false, false, backgroundColor, foregroundColor);
  drawSquares(render.width / 2, (render.height / 2) - (timeHeight / 2), false, true, backgroundColor, foregroundColor);
  drawSquares(render.width / 2, (render.height / 2) + (timeHeight / 2), true, false, backgroundColor, foregroundColor);
  drawSquares(render.width / 2, (render.height / 2) - (timeHeight / 2), true, true, backgroundColor, foregroundColor);

  render.end();
};

watch.addEventListener('minutechange', draw);
