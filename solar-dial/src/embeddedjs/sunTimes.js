import Message from "pebble/message";
import { getSunAngle } from "./sunAngle";

// Skip the phone lookup when the day and position haven't changed (~0.1° is ~11km, well under a minute of sun time)
const positionTolerance = 0.1;

// Restore the last known sunrise/sunset angles so the dial is right before a fresh lookup completes
const loadCachedNumber = (key, fallback) => {
  const value = parseFloat(localStorage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
};

const setCachedDegrees = (key, value) => {
  if (localStorage.getItem(key) !== String(value)) {
    localStorage.setItem(key, String(value));
  }
};

let sunriseDegrees = loadCachedNumber("sunriseDegrees", -90);
let sunsetDegrees = loadCachedNumber("sunsetDegrees", 90);

// The sun's altitude at solar noon in degrees; undefined until the first lookup
let noonAltitude = loadCachedNumber("noonAltitude", undefined);

let lookupDay = localStorage.getItem("lookupDay");
let lookupLat = loadCachedNumber("lookupLat", NaN);
let lookupLong = loadCachedNumber("lookupLong", NaN);

let onChange = () => { };

// The request waiting to be sent (or awaiting a reply); recorded as the last lookup once the reply arrives
let pendingSunRequest;
let sentSunRequest;
// Only write when the channel has been handed to us; write() throws otherwise
let canWrite = false;

const sendSunRequest = (msg) => {
  if (!pendingSunRequest || !canWrite) {
    return;
  }

  const { lat, long, date } = pendingSunRequest;

  // Numbers are sent as integers, so lat/long go as strings and time as seconds
  msg.write(new Map([
    ["LAT", String(lat)],
    ["LONG", String(long)],
    ["NOW", Math.floor(date.getTime() / 1000)]
  ]));
  sentSunRequest = pendingSunRequest;
  pendingSunRequest = undefined;
  canWrite = false;
};

const message = new Message({
  keys: ["LAT", "LONG", "NOW", "SUNRISE", "SUNSET", "NOON_ALTITUDE"],
  onReadable() {
    const msg = this.read();

    if (!msg.has("SUNRISE")) {
      return;
    }

    sunriseDegrees = getSunAngle(new Date(msg.get("SUNRISE") * 1000)) + 90;
    sunsetDegrees = getSunAngle(new Date(msg.get("SUNSET") * 1000)) + 90;

    setCachedDegrees("sunriseDegrees", sunriseDegrees);
    setCachedDegrees("sunsetDegrees", sunsetDegrees);

    if (msg.has("NOON_ALTITUDE")) {
      noonAltitude = msg.get("NOON_ALTITUDE");
      setCachedDegrees("noonAltitude", noonAltitude);
    }

    if (sentSunRequest) {
      ({ lat: lookupLat, long: lookupLong, day: lookupDay } = sentSunRequest);
      sentSunRequest = undefined;

      localStorage.setItem("lookupDay", lookupDay);
      localStorage.setItem("lookupLat", String(lookupLat));
      localStorage.setItem("lookupLong", String(lookupLong));
    }

    onChange();
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

/**
 * @returns Start and end angles of the daylight arc, for drawCircle
 */
export const getDaylightArc = () => ({ sunriseDegrees, sunsetDegrees });

/**
 * @returns The sun's altitude at solar noon in degrees, or undefined before the first lookup
 */
export const getNoonAltitude = () => noonAltitude;

/**
 * @param {() => void} callback Called whenever new sunrise/sunset times arrive from the phone
 */
export const onSunTimesChange = (callback) => {
  onChange = callback;
};

/**
 * Asks the phone for today's sunrise/sunset at this position, unless the last lookup already covers it.
 */
export const requestSunTimes = (lat, long) => {
  const date = new Date();
  const day = date.toDateString();

  // Always look up when there's no noon altitude yet (e.g. cached from before it was sent)
  const withinTolerance = noonAltitude !== undefined
    && day === lookupDay
    && Math.abs(lat - lookupLat) < positionTolerance
    && Math.abs(long - lookupLong) < positionTolerance;

  if (withinTolerance) {
    return;
  }

  pendingSunRequest = { lat, long, date, day };
  sendSunRequest(message);
};
