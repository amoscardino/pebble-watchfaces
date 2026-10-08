import Poco from "commodetto/Poco";
import Location from "embedded:sensor/Location";
import Message from "pebble/message";
import { getMonthString, getDayString } from "./dates";

let render = new Poco(screen);

let lastDate = new Date();

const timeFont = new render.Font("Bitham-Black", 30);
const dateFont = new render.Font("Gothic-Regular", 14);

const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const blue = render.makeColor(0, 0, 255);
const yellow = render.makeColor(255, 255, 0);

const rad = Math.PI / 180;

const centerX = render.width / 2;
const centerY = render.height / 2;

const timeCircleRadius = render.getTextWidth("00:00", timeFont) / 2;

const sunRadius = 10;
const notchLength = 5;
const notchThickness = 2;

let location;
let lat, long;

// Restore the last known sunrise/sunset angles so the dial is right before a fresh lookup completes
const loadCachedDegrees = (key, fallback) => {
  const value = parseFloat(localStorage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
};

let sunriseDegrees = loadCachedDegrees("sunriseDegrees", -90);
let sunsetDegrees = loadCachedDegrees("sunsetDegrees", 90);

const getSunAngle = (date) => {
  const elapsedMinutes = date.getHours() * 60 + date.getMinutes();
  const totalMinutes = 24 * 60;
  const sunAngleDegrees = (elapsedMinutes / totalMinutes) * 360 + 90;

  return sunAngleDegrees;
};

const drawBackground = () => {
  render.drawCircle(black, centerX, centerY, render.width, 0, 360);
  render.drawCircle(blue, centerX, centerY, render.width, sunriseDegrees, sunsetDegrees);
};

const drawNotches = () => {
  const numberOfNotches = 24;
  const notchAngleIncrement = 360 / numberOfNotches;

  for (let i = 0; i < numberOfNotches; i++) {
    const angle = (i * notchAngleIncrement) * (rad);
    const length = i % 2 === 0 ? notchLength * 2 : notchLength;
    const x1 = centerX + (centerX - length) * Math.cos(angle);
    const y1 = centerY + (centerY - length) * Math.sin(angle);
    const x2 = centerX + (centerX) * Math.cos(angle);
    const y2 = centerY + (centerY) * Math.sin(angle);

    render.drawLine(x1, y1, x2, y2, white, notchThickness);
  }
};

const drawSun = (sunAngle) => {
  const sunX = centerX + (centerX - (sunRadius + (notchLength * 2) + 2)) * Math.cos(sunAngle * rad);
  const sunY = centerY + (centerY - (sunRadius + (notchLength * 2) + 2)) * Math.sin(sunAngle * rad);

  render.drawCircle(yellow, sunX, sunY, sunRadius, 0, 360);
};

const drawTimeAndDate = (now, sunAngle) => {
  const timeCircleX = centerX + (timeCircleRadius / 2) * Math.cos((sunAngle + 180) * rad);
  const timeCircleY = centerY + (timeCircleRadius / 2) * Math.sin((sunAngle + 180) * rad);

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

const draw = (evt) => {
  const now = evt?.date || lastDate;
  lastDate = now;

  const sunAngle = getSunAngle(now);

  render.begin();

  drawBackground();
  drawNotches();
  drawSun(sunAngle);
  drawTimeAndDate(now, sunAngle);

  render.end();
};

const requestLocation = () => {
  location = new Location({
    onSample() {
      const sample = this.sample();

      console.log("Location: " + sample.latitude + ", " + sample.longitude);
      lat = sample.latitude;
      long = sample.longitude;

      this.close();

      getSunTimes();
    }
  });

  location.configure({
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 60 * 60 * 1000 // 1 hour in milliseconds
  });
};

let pendingSunRequest = false;
// Only write when the channel has been handed to us; write() throws otherwise
let canWrite = false;

const sendSunRequest = (msg) => {
  if (!pendingSunRequest || !canWrite)
    return;

  // Numbers are sent as integers, so lat/long go as strings and time as seconds
  msg.write(new Map([
    ["LAT", String(lat)],
    ["LONG", String(long)],
    ["NOW", Math.floor(lastDate.getTime() / 1000)]
  ]));
  pendingSunRequest = false;
  canWrite = false;
};

const message = new Message({
  keys: ["LAT", "LONG", "NOW", "SUNRISE", "SUNSET"],
  onReadable() {
    const msg = this.read();

    if (!msg.has("SUNRISE"))
      return;

    const sunrise = new Date(msg.get("SUNRISE") * 1000);
    const sunset = new Date(msg.get("SUNSET") * 1000);

    console.log("Sunrise: " + sunrise + ", Sunset: " + sunset);

    sunriseDegrees = getSunAngle(sunrise) + 90;
    sunsetDegrees = getSunAngle(sunset) + 90;

    localStorage.setItem("sunriseDegrees", String(sunriseDegrees));
    localStorage.setItem("sunsetDegrees", String(sunsetDegrees));

    // Fully refresh the display after updating sunrise and sunset times
    draw();
  },
  onWritable() {
    canWrite = true;
    sendSunRequest(this);
  },
  onSuspend() {
    // Another Message instance (e.g. the location proxy) took the channel
    canWrite = false;
  }
});

const getSunTimes = () => {
  pendingSunRequest = true;
  sendSunRequest(message);
};

watch.addEventListener('minutechange', draw);
watch.addEventListener('hourchange', requestLocation);
