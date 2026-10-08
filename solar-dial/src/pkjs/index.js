const moddableProxy = require("@moddable/pebbleproxy");
const suncalc = require("suncalc");

Pebble.addEventListener('ready', moddableProxy.readyReceived);
Pebble.addEventListener('appmessage', (event) => {
  if (moddableProxy.appMessageReceived(event))
    return;

  const lat = parseFloat(event.payload.LAT);
  const long = parseFloat(event.payload.LONG);
  const now = new Date(event.payload.NOW * 1000);

  const times = suncalc.getTimes(now, lat, long);

  // Use the proxy's queue so this doesn't collide with its own location/http traffic
  moddableProxy.sendAppMessage({
    SUNRISE: Math.floor(times.sunrise.getTime() / 1000),
    SUNSET: Math.floor(times.sunset.getTime() / 1000)
  });
});
