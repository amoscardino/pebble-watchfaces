import Poco from "commodetto/Poco";
import parseBMF from "commodetto/parseBMF";
import parseRLE from "commodetto/parseRLE";

let render = new Poco(screen);

const getFont = (name, size) => {
  const font = parseBMF(new Resource(`${name}-${size}.fnt`));
  font.bitmap = parseRLE(new Resource(`${name}-${size}-alpha.bm4`));
  return font;
};

const font = getFont("UbuntuMono-Bold", 86);
const black = render.makeColor(0, 0, 0);
const white = render.makeColor(255, 255, 255);
const gray = render.makeColor(64, 64, 64);

const centerX = render.width / 2;
const centerY = render.height / 2;

const bitsPerGroup = 6;
const groupAngle = 120;
const groupGapAngle = 5;
const segmentAngle = (groupAngle - groupGapAngle) / bitsPerGroup;
const marginAngle = 5;
const segmentSize = 25;
const textOffset = 8;

const colors = [
  render.makeColor(128, 0, 128), // Purple
  render.makeColor(0, 0, 255), // Blue
  render.makeColor(0, 128, 0), // Green
  render.makeColor(255, 255, 0), // Yellow
  render.makeColor(255, 128, 0), // Orange
  render.makeColor(255, 0, 0), // Red
];

const drawGroup = (value, groupStartAngle) => {
  for (let i = 0; i < bitsPerGroup; i++) {
    const bit = bitsPerGroup - 1 - i;
    const startAngle = groupStartAngle + groupGapAngle / 2 + i * segmentAngle + marginAngle / 2;
    const endAngle = startAngle + segmentAngle - marginAngle;

    const color = (value >> bit) & 1 ? colors[i] : gray;

    render.drawCircle(color, centerX, centerY, render.width, startAngle, endAngle);
  }
};

const draw = (evt) => {
  const now = evt?.date ?? new Date();
  const hours = watch.hour12 ? now.getHours() % 12 || 12 : now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const hourStr = hours.toString();
  const minutesStr = minutes.toString().padStart(2, '0');
  const hoursWidth = render.getTextWidth(hourStr, font);
  const minutesWidth = render.getTextWidth(minutesStr, font);

  render.begin();

  render.fillRectangle(black, 0, 0, render.width, render.height);

  drawGroup(hours, groupAngle * 2);
  drawGroup(minutes, 0);
  drawGroup(seconds, groupAngle);

  render.drawCircle(black, centerX, centerY, (render.width / 2) - segmentSize, 0, 360);

  render.drawText(hourStr, font, white, centerX - (minutesWidth / 2) + (minutesWidth - hoursWidth), centerY - font.height + textOffset);
  render.drawText(minutesStr, font, white, centerX - (minutesWidth / 2), centerY - textOffset);

  render.end();
};

watch.addEventListener('secondchange', draw);
