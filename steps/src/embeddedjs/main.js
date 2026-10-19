import Poco from "commodetto/Poco";
import parseBMF from "commodetto/parseBMF";
import parseRLE from "commodetto/parseRLE";
import Health from "pebble/health";

let render = new Poco(screen);

const getFont = (name, size) => {
  const font = parseBMF(new Resource(`${name}-${size}.fnt`));
  font.bitmap = parseRLE(new Resource(`${name}-${size}-alpha.bm4`));
  return font;
};

const timeFont = getFont("Tomorrow-Regular", 64);
const dateFont = getFont("Tomorrow-Regular", 18);

const white = render.makeColor(255, 255, 255);
const black = render.makeColor(0, 0, 0);
const red = render.makeColor(255, 0, 0);
const yellow = render.makeColor(255, 255, 0);
const green = render.makeColor(0, 255, 0);

const centerX = render.width / 2;
const centerY = render.height / 2;
const radius = render.width / 2;
const ringThickness = 10;

// TODO: Use Clay to let user set this
const goal = 10000;

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const getMonthString = (date) => monthNames[date.getMonth()];
const getDayString = (date) => dayNames[date.getDay()];

const drawStepRing = (now) => {
  const access = Health.metric.accessible({
    metric: "step count",
    start: now,
    end: now
  });

  if (!access)
    return;

  const stepCount = Health.metric.get("step count") || 0;

  if (!stepCount)
    return;

  const progress = Math.min(stepCount / goal, 1);
  const ringColor = progress <= 0.33 ? red : progress <= 0.66 ? yellow : green;

  render.drawCircle(ringColor, centerX, centerY, radius, 0, progress * 360);
  render.drawCircle(black, centerX, centerY, radius - ringThickness, 0, 360);
};

const draw = (evt) => {
  const now = evt?.date ?? new Date();

  const hours = watch.hour12 ? now.getHours() % 12 || 12 : now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  const timeWidth = render.getTextWidth(timeStr, timeFont);
  const timeHeight = timeFont.height;
  const dateStr = `${getDayString(now)} ${getMonthString(now)} ${now.getDate()}`;
  const dateWidth = render.getTextWidth(dateStr, dateFont);

  render.begin();

  // Clear the screen with the background color
  render.fillRectangle(black, 0, 0, render.width, render.height);

  drawStepRing(now);

  // Time in the center
  const timeX = (render.width - timeWidth) / 2;
  const timeY = (render.height - timeHeight) / 2;
  render.drawText(timeStr, timeFont, white, timeX, timeY);

  // Date below the time
  const dateX = (render.width - dateWidth) / 2;
  const dateY = timeY + timeHeight + 4; // 4 pixels below the time
  render.drawText(dateStr, dateFont, white, dateX, dateY);

  render.end();
};

watch.addEventListener('minutechange', draw);
