import Poco from "commodetto/Poco";

let render = new Poco(screen);

const font = new render.Font("Leco-Bold", 20);
const timeWidth = render.getTextWidth("00:00", font);

const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const blue = render.makeColor(0, 0, 255);
const green = render.makeColor(0, 255, 0);
const red = render.makeColor(255, 0, 0);

const rings = 3;
const ringGap = 2;
const ringSize = ((render.width / 2) - (timeWidth / 2) - (ringGap * (rings + 1))) / rings;

const startingRadius = render.width / 2;

const centerX = render.width / 2;
const centerY = render.height / 2;


const drawHourRing = (now, radius) => {
  const hourOfDay = now.getHours();
  const dayProgress = hourOfDay / 24;

  render.drawCircle(red, centerX, centerY, radius, 0, dayProgress * 360);
  render.drawCircle(black, centerX, centerY, (radius - ringSize), 0, 360);
};

const drawMinuteRing = (now, radius) => {
  const minuteOfHour = now.getMinutes();
  const minuteProgress = minuteOfHour / 60;

  render.drawCircle(green, centerX, centerY, radius, 0, minuteProgress * 360);
  render.drawCircle(black, centerX, centerY, (radius - ringSize), 0, 360);
};

const drawSecondRing = (now, radius) => {
  const secondOfMinute = now.getSeconds();
  const secondProgress = secondOfMinute / 60;

  render.drawCircle(blue, centerX, centerY, radius, 0, secondProgress * 360);
  render.drawCircle(black, centerX, centerY, (radius - ringSize), 0, 360);
};

const draw = (evt) => {
  const now = evt?.date || new Date();
  const timeHour = watch.hour12 ? now.getHours() % 12 || 12 : now.getHours();
  const timeMinute = now.getMinutes().toString().padStart(2, "0");
  const timeStr = `${timeHour}:${timeMinute}`;
  const thisTimeWidth = render.getTextWidth(timeStr, font);

  render.begin();

  render.fillRectangle(black, 0, 0, render.width, render.height);

  let radius = startingRadius;

  drawHourRing(now, radius);

  radius -= ringSize + ringGap;

  drawMinuteRing(now, radius);

  radius -= ringSize + ringGap;

  drawSecondRing(now, radius);

  render.drawText(timeStr, font, white, (render.width - thisTimeWidth) / 2, (render.height - font.height) / 2);

  render.end();
}

watch.addEventListener('secondchange', draw);
