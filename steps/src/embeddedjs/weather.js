import Location from "embedded:sensor/Location";

// Don't show weather older than this; better blank than misleading
const maxWeatherAge = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
export const reconnectLookupInterval = 30 * 60 * 1000; // 30 minutes in milliseconds

const loadCachedWeather = () => {
  try {
    return JSON.parse(localStorage.getItem("weather"));
  } catch {
    return undefined;
  }
};

// Restore the last reading so the face shows weather before a fresh lookup completes
let weather = loadCachedWeather();
let location;
let lastLookup = 0;
let onChange = () => { };

const getCondition = (code, isDay) => {
  if (code === 0) return isDay ? "Sunny" : "Clear";
  if (code <= 2) return "Partly Cloudy";
  if (code === 3) return "Cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow Showers";
  if (code <= 99) return "T-Storm";
  return "Unknown";
};

const fetchWeather = async (latitude, longitude) => {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
      latitude,
      longitude,
      current: "temperature_2m,weather_code,is_day",
      temperature_unit: "fahrenheit"
    });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const { current } = await response.json();

    weather = {
      temp: Math.round(current.temperature_2m),
      condition: getCondition(current.weather_code, current.is_day),
      time: Date.now()
    };
    localStorage.setItem("weather", JSON.stringify(weather));

    onChange();
  } catch (e) {
    console.log(`Weather fetch error: ${e}`);
  }
};

/**
 * Gets the current position, then fetches the current weather there.
 */
export const requestWeather = () => {
  lastLookup = Date.now();

  // Only one Location instance may exist at a time; drop any lookup still in flight
  try {
    location?.close();
  } catch {
    // close() frees the instance before its final write, which can throw if the channel isn't ours
  }

  location = new Location({
    onSample() {
      const { latitude, longitude } = this.sample();

      this.close();
      location = undefined;

      fetchWeather(latitude, longitude);
    },
    onError() {
      this.close();
      location = undefined;
    }
  });

  location.configure({
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 60 * 60 * 1000 // 1 hour in milliseconds; weather doesn't change much over short distances
  });
};

export const requestWeatherIfStale = (interval) => {
  if (Date.now() - lastLookup >= interval) {
    requestWeather();
  }
};

/**
 * @returns Display text like "72° Sunny", or undefined when there's no recent reading
 */
export const getWeatherText = () => {
  if (!weather || Date.now() - weather.time > maxWeatherAge) {
    return undefined;
  }

  return `${weather.temp}° ${weather.condition}`;
};

/**
 * @param {() => void} callback Called whenever new weather arrives
 */
export const onWeatherChange = (callback) => {
  onChange = callback;
};
