import Poco from "commodetto/Poco";
import parseBMF from "commodetto/parseBMF";
import parseRLE from "commodetto/parseRLE";
import { getMonthString, getDayString } from "./dates";

let render = new Poco(screen);

const getFont = (name, size) => {
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

const getRandomElement = (elements) => {
  const totalWeight = elements.reduce((sum, [, weight]) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const [element, weight] of elements) {
    if (random < weight)
      return element;

    random -= weight;
  }
};

const drawSquares = (startX, startY, left, up, backgroundColor, foregroundColor) => {
  const directionX = left ? -1 : 1;
  const directionY = up ? -1 : 1;
  const inBoundsX = (x) => left ? x > 0 : x < render.width;
  const inBoundsY = (y) => up ? y > 0 : y < render.height;

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

const draw = (evt) => {
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

  render.begin();

  // Clear the screen with the background color
  render.fillRectangle(backgroundColor, 0, 0, render.width, render.height);

  // Draw the accent bar behind the time text
  render.fillRectangle(red, 0, (render.height / 2) - (timeHeight / 2), render.width, timeHeight);

  // Draw the time text over the accent bar
  render.drawText(timeStr, timeFont, white, textMargin, ((render.height - timeFont.height) / 2) - 3);

  // Draw the date text
  render.drawText(dateStr, dateFontLarge, white, render.width - dateMonthDayWidth - textMargin + ((dateMonthDayWidth - dateWidth) / 2), (render.height - dateFontLarge.height) / 2);

  // Draw the month above the date text
  render.drawText(monthStr, dateFontSmall, white, render.width - dateMonthDayWidth - textMargin + ((dateMonthDayWidth - monthWidth) / 2), (render.height - dateFontSmall.height) / 2 - (dateFontLarge.height / 2) - margin);

  // Draw the day below the date text
  render.drawText(dayStr, dateFontSmall, white, render.width - dateMonthDayWidth - textMargin + ((dateMonthDayWidth - dayWidth) / 2), (render.height - dateFontSmall.height) / 2 + (dateFontLarge.height / 2) + margin);

  // Draw the squares around the time and date text
  drawSquares(render.width / 2, (render.height / 2) + (timeHeight / 2), false, false, backgroundColor, foregroundColor);
  drawSquares(render.width / 2, (render.height / 2) - (timeHeight / 2), false, true, backgroundColor, foregroundColor);
  drawSquares(render.width / 2, (render.height / 2) + (timeHeight / 2), true, false, backgroundColor, foregroundColor);
  drawSquares(render.width / 2, (render.height / 2) - (timeHeight / 2), true, true, backgroundColor, foregroundColor);

  render.end();
};

watch.addEventListener('minutechange', draw);
