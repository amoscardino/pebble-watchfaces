/// <reference types="./pebble.d.ts" />
import Poco from "commodetto/Poco";
import parseBMF from "commodetto/parseBMF";
import parseRLE from "commodetto/parseRLE";
import Health from "pebble/health";
import Message from "pebble/message";
import { requestWeather, requestWeatherIfStale, reconnectLookupInterval, getWeatherText, onWeatherChange } from "./weather";

let render = new Poco(screen);

const getFont = (name: string, size: number) => {
  const font = parseBMF(new Resource(`${name}-${size}.fnt`));
  font.bitmap = parseRLE(new Resource(`${name}-${size}-alpha.bm4`));
  return font;
};

const timeFont = getFont("Tomorrow-Regular", 72);
const dateFont = getFont("Tomorrow-Regular", 16);

const white = render.makeColor(255, 255, 255);
const black = render.makeColor(0, 0, 0);
const red = render.makeColor(255, 0, 0);
const yellow = render.makeColor(255, 255, 0);
const green = render.makeColor(0, 255, 0);

const centerX = render.width / 2;
const centerY = render.height / 2;
const dateTimeSpace = 4;
const radius = render.width / 2;
const ringThickness = 8;
const ringBorder = 1;

// Step goal is set from the phone via Clay and cached so it survives restarts
const defaultGoal = 10000;
let goal = Number(localStorage.getItem("goal")) || defaultGoal;

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const getDayString = (date: Date) => dayNames[date.getDay()];

const drawBackground = () => render.fillRectangle(black, 0, 0, render.width, render.height);

const drawStepRing = (now: Date) => {
  const access = Health.metric.accessible({ metric: "step count", start: now, end: now });

  if (!(access & Health.access.available)) {
    return;
  }

  const stepCount = Health.metric.query({ metric: "step count" }) || 0;
  const progress = Math.min(stepCount / goal, 1);
  const ringColor = progress <= 0.33 ? red : progress <= 0.66 ? yellow : green;

  render.drawCircle(ringColor, centerX, centerY, radius, 0, progress * 360);
  render.drawCircle(white, centerX, centerY, radius - ringThickness, 0, 360);
  render.drawCircle(black, centerX, centerY, radius - ringThickness - ringBorder, 0, 360);
};

const drawText = (now: Date) => {
  const hours = watch.hour12 ? now.getHours() % 12 || 12 : now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  const timeWidth = render.getTextWidth(timeStr, timeFont);
  const timeHeight = timeFont.height;
  const dateStr = `${getDayString(now)} ${now.getMonth() + 1}/${now.getDate()}`;
  const dateWidth = render.getTextWidth(dateStr, dateFont);

  // Time in the center
  const timeX = centerX - (timeWidth / 2);
  const timeY = centerY - (timeHeight / 2);
  render.drawText(timeStr, timeFont, white, timeX, timeY);

  // Weather above the time
  const weatherStr = getWeatherText();
  if (weatherStr) {
    const weatherWidth = render.getTextWidth(weatherStr, dateFont);
    const weatherX = centerX - (weatherWidth / 2);
    const weatherY = timeY - dateFont.height - dateTimeSpace;
    render.drawText(weatherStr, dateFont, white, weatherX, weatherY);
  }

  // Date below the time
  const dateX = centerX - (dateWidth / 2);
  const dateY = timeY + timeHeight + dateTimeSpace;
  render.drawText(dateStr, dateFont, white, dateX, dateY);
};

const draw = (evt?: TimeChangeEvent) => {
  const now = evt?.date ?? new Date();

  render.begin();

  drawBackground();
  drawStepRing(now);
  drawText(now);

  render.end();
};

watch.addEventListener('minutechange', draw);

// Refresh the display when new weather arrives
onWeatherChange(() => draw());

// hourchange also fires on registration, which does the initial lookup
watch.addEventListener('hourchange', requestWeather);

watch.addEventListener('connected', () => {
  if (watch.connected.pebblekit) {
    requestWeatherIfStale(reconnectLookupInterval);
  }
});

watch.addEventListener('health', (what) => {
  if (what === "movement" || what === "significant") {
    draw();
  }
});

// Keep a reference so the listener isn't garbage collected
const message = new Message({
  keys: ["GOAL"],
  onReadable() {
    const newGoal = Number(message.read().get("GOAL"));

    if (!(newGoal > 0)) {
      return;
    }

    goal = newGoal;
    localStorage.setItem("goal", String(goal));

    draw();
  }
});
