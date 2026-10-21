import { draw } from "./dial";
import { onSunTimesChange } from "./sunTimes";
import { requestLocation, requestLocationIfStale, reconnectLookupInterval, periodicLookupInterval } from "./location";

// Fully refresh the display after updating sunrise and sunset times
onSunTimesChange(() => draw());

watch.addEventListener('minutechange', draw);
watch.addEventListener('daychange', requestLocation);

watch.addEventListener('hourchange', (evt) => {
  // At midnight hourchange fires just before daychange, which does its own lookup
  if (evt.date.getHours()) {
    requestLocationIfStale(periodicLookupInterval);
  }
});

watch.addEventListener('connected', () => {
  if (watch.connected.pebblekit) {
    requestLocationIfStale(reconnectLookupInterval);
  }
});
