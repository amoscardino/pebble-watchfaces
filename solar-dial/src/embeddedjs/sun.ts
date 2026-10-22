import Message from "pebble/message";

// Skip the phone lookup when the day and position haven't changed (~0.1° is ~11km, well under a minute of sun time)
const positionTolerance = 0.1;

// Restore the last known sunrise/sunset angles so the dial is right before a fresh lookup completes
const loadCachedNumber = (key: string, fallback: number): number => {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) ? value : fallback;
};

const setCachedDegrees = (key: string, value: number) => {
  if (localStorage.getItem(key) !== String(value)) {
    localStorage.setItem(key, String(value));
  }
};

let sunriseDegrees = loadCachedNumber("sunriseDegrees", -90);
let sunsetDegrees = loadCachedNumber("sunsetDegrees", 90);

// The sun's altitude at solar noon in degrees; undefined until the first lookup
let noonAltitude = loadCachedNumber("noonAltitude", 0);

let lookupDay = localStorage.getItem("lookupDay");
let lookupLat = loadCachedNumber("lookupLat", 0);
let lookupLong = loadCachedNumber("lookupLong", 0);

let onChange = () => { };

// The request waiting to be sent (or awaiting a reply); recorded as the last lookup once the reply arrives
interface SunRequest {
  lat: number;
  long: number;
  date: Date;
  day: string;
}
let pendingSunRequest: SunRequest | undefined;
let sentSunRequest: SunRequest | undefined;
// Only write when the channel has been handed to us; write() throws otherwise
let canWrite = false;

const sendSunRequest = (msg: Message) => {
  if (!pendingSunRequest || !canWrite) {
    return;
  }

  const { lat, long, date } = pendingSunRequest;

  // Numbers are sent as integers, so lat/long go as strings and time as seconds
  msg.write(new Map<string, string | number>([
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
    const msg = message?.read();

    if (!msg.has("SUNRISE")) {
      return;
    }

    sunriseDegrees = getSunAngle(new Date(Number(msg.get("SUNRISE")) * 1000)) + 90;
    sunsetDegrees = getSunAngle(new Date(Number(msg.get("SUNSET")) * 1000)) + 90;

    setCachedDegrees("sunriseDegrees", sunriseDegrees);
    setCachedDegrees("sunsetDegrees", sunsetDegrees);

    if (msg.has("NOON_ALTITUDE")) {
      noonAltitude = Number(msg.get("NOON_ALTITUDE"));
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
    sendSunRequest(message);
  },
  onSuspend() {
    // Another Message instance (e.g. the location proxy) took the channel
    canWrite = false;
  }
});

export const getSunAngle = (date: Date) => {
  const elapsedMinutes = date.getHours() * 60 + date.getMinutes();
  const totalMinutes = 24 * 60;
  const sunAngleDegrees = (elapsedMinutes / totalMinutes) * 360 + 90;

  return sunAngleDegrees;
};

/**
 * @returns Start and end angles of the daylight arc, for drawCircle
 */
export const getDaylightArc = () => ({ sunriseDegrees, sunsetDegrees });

/**
 * @returns The sun's altitude at solar noon in degrees, or undefined before the first lookup
 */
export const getNoonAltitude = () => noonAltitude;

export const onSunTimesChange = (callback: () => void) => {
  onChange = callback;
};

/**
 * Asks the phone for today's sunrise/sunset at this position, unless the last lookup already covers it.
 */
export const requestSunTimes = (lat: number, long: number) => {
  const date = new Date();
  const day = date.toDateString();

  // Always look up when there's no noon altitude yet (e.g. cached from before it was sent)
  const withinTolerance = noonAltitude !== undefined
    && day === lookupDay
    && Math.abs(lat - (lookupLat ?? 0)) < positionTolerance
    && Math.abs(long - (lookupLong ?? 0)) < positionTolerance;

  if (withinTolerance) {
    return;
  }

  pendingSunRequest = { lat, long, date, day };
  sendSunRequest(message);
};
