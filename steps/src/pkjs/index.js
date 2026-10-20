const Clay = require("@rebble/clay");
const clayConfig = require("./config");
const moddableProxy = require("@moddable/pebbleproxy");

new Clay(clayConfig);

// The watch's message module keeps only the latest unread message, so when the proxy sends
// a response's status/headers/body messages back-to-back, some get overwritten before the
// watch reads them. Pausing after each acknowledged send gives the watch time to drain.
const messagePacing = 100; // milliseconds
const sendAppMessage = Pebble.sendAppMessage.bind(Pebble);
Pebble.sendAppMessage = (message, onSuccess, onFailure) => sendAppMessage(
  message,
  (e) => setTimeout(() => onSuccess && onSuccess(e), messagePacing),
  onFailure
);

// The proxy forwards the watch's fetch() and Location requests
Pebble.addEventListener('ready', moddableProxy.readyReceived);
Pebble.addEventListener('appmessage', moddableProxy.appMessageReceived);
