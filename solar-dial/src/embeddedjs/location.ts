import Location from "embedded:sensor/Location";
import { requestSunTimes } from "./sunTimes";

// Throttles extra lookups so a flaky Bluetooth link doesn't hammer location
export const reconnectLookupInterval = 60 * 60 * 1000; // 1 hour in milliseconds
// Periodic recheck to catch travel while connected (e.g. driving)
export const periodicLookupInterval = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

let location: Location | undefined;
let lastLocationRequest = 0;

/**
 * Gets the current position, then asks the phone for sun times there.
 */
export const requestLocation = () => {
  lastLocationRequest = Date.now();

  // Only one Location instance may exist at a time; drop any lookup still in flight
  try {
    location?.close();
  } catch {
    // close() frees the instance before its final write, which can throw if the channel isn't ours
  }

  location = new Location({
    onSample() {
      const { latitude, longitude } = location?.sample() || { latitude: 0, longitude: 0 };

      location?.close();
      location = undefined;

      requestSunTimes(latitude, longitude);
    },
    onError() {
      location?.close();
      location = undefined;
    }
  });

  location.configure({
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 6 * 60 * 60 * 1000 // 6 hours in milliseconds; sun times barely move with small position changes
  });
};

export const requestLocationIfStale = (interval: number) => {
  if (Date.now() - lastLocationRequest >= interval) {
    requestLocation();
  }
};
